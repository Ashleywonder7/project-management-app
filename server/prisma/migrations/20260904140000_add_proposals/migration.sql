CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED');

CREATE TABLE "proposals" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "deadline" TIMESTAMP(3) NOT NULL,
  "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
  "comments" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "proposal_assignments" (
  "proposalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "proposal_assignments_pkey" PRIMARY KEY ("proposalId", "userId")
);

CREATE UNIQUE INDEX "proposals_code_key" ON "proposals"("code");
CREATE INDEX "proposal_assignments_userId_idx" ON "proposal_assignments"("userId");

ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proposal_assignments" ADD CONSTRAINT "proposal_assignments_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "proposal_assignments" ADD CONSTRAINT "proposal_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
