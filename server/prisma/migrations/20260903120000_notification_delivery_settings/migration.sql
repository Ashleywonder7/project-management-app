-- Separate email and SMS notification policies and keep explicit staff recipients.
-- This migration is idempotent where possible because the prior notification
-- models existed in the Prisma schema but were not represented in migrations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'DEADLINE_ALERT', 'PASSWORD_RESET');
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "code" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "verification_tokens_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "notification_configs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "channel" "NotificationChannel" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "leadNoticeDays" INTEGER[] NOT NULL DEFAULT ARRAY[1, 3, 7],
  "notifyEngagements" BOOLEAN NOT NULL DEFAULT true,
  "notifyProposals" BOOLEAN NOT NULL DEFAULT true,
  "notifyMeetings" BOOLEAN NOT NULL DEFAULT true,
  "recipientRoles" TEXT[] NOT NULL DEFAULT ARRAY['ASSIGNED_STAFF', 'PROJECT_MANAGER'],
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_configs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notification_configs" ADD COLUMN IF NOT EXISTS "channel" "NotificationChannel";
ALTER TABLE "notification_configs" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
UPDATE "notification_configs" SET "channel" = 'EMAIL' WHERE "channel" IS NULL;
ALTER TABLE "notification_configs" ALTER COLUMN "channel" SET NOT NULL;
ALTER TABLE "notification_configs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "notification_configs" DROP COLUMN IF EXISTS "notifyChannels";

CREATE UNIQUE INDEX IF NOT EXISTS "notification_configs_channel_key" ON "notification_configs"("channel");

INSERT INTO "notification_configs" (
  "id", "channel", "enabled", "leadNoticeDays", "notifyEngagements", "notifyProposals", "notifyMeetings", "recipientRoles", "updatedAt"
)
SELECT
  gen_random_uuid()::text, 'SMS', "enabled", "leadNoticeDays", "notifyEngagements", "notifyProposals", "notifyMeetings", "recipientRoles", CURRENT_TIMESTAMP
FROM "notification_configs"
WHERE "channel" = 'EMAIL'
  AND NOT EXISTS (SELECT 1 FROM "notification_configs" WHERE "channel" = 'SMS');

CREATE TABLE IF NOT EXISTS "notification_config_recipients" (
  "notificationConfigId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "notification_config_recipients_pkey" PRIMARY KEY ("notificationConfigId", "userId"),
  CONSTRAINT "notification_config_recipients_notificationConfigId_fkey" FOREIGN KEY ("notificationConfigId") REFERENCES "notification_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notification_config_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "notification_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "verification_tokens_userId_type_expiresAt_idx" ON "verification_tokens"("userId", "type", "expiresAt");
CREATE INDEX IF NOT EXISTS "notification_config_recipients_userId_idx" ON "notification_config_recipients"("userId");
CREATE INDEX IF NOT EXISTS "notification_logs_userId_sentAt_idx" ON "notification_logs"("userId", "sentAt");
CREATE INDEX IF NOT EXISTS "notification_logs_channel_status_sentAt_idx" ON "notification_logs"("channel", "status", "sentAt");
