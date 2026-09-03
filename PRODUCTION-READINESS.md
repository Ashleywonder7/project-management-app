# Production readiness

The application currently presents projects, proposals, events, staff, and notification settings from in-browser sample data. The server database schema is now ready to store separated delivery policies, but the UI must be connected to authenticated server endpoints before production launch. Do not treat a browser session or copied setup link as authentication.

## Required external setup

1. Create a Supabase production project and save both a pooled application URL (`DATABASE_URL`) and a direct migration URL (`DIRECT_URL`). The direct URL is required for Prisma migrations; do not run migrations through the Supabase transaction pooler.
2. Apply the committed Prisma migration in the deployment pipeline with `npx prisma migrate deploy`. Run it first in a staging project and take a backup before production.
3. Choose an email provider that supports SMTP or an email API, such as Resend, Postmark, Amazon SES, or SendGrid. Verify a sending domain, then configure SPF, DKIM, and DMARC. Use a dedicated authentication sender such as `no-reply@auth.yourdomain.com`.
4. Choose an SMS provider, such as Twilio, Africa's Talking, or Hubtel. Create the account, register or buy the required sender ID/number, and complete the provider's country and A2P compliance requirements for every destination country.
5. Create production secrets: a high-entropy `JWT_SECRET`, email provider credentials, SMS provider credentials, `DATABASE_URL`, `DIRECT_URL`, and the public web application URL. Store them only in the host's encrypted environment-variable store; never commit `.env.local`.
6. Configure the production application URL, allowed CORS origin, TLS certificate, and verification redirect URLs. Test registration, resend-verification, password reset, changed-email, and phone-verification flows using real non-team addresses and numbers.
7. Add a job runner (for example, a managed cron service or queue worker) to evaluate deadline and meeting reminders, send the enabled per-channel policy, and record each attempt in `notification_logs`. Alert on delivery failures.

## Security checks before launch

- Force email verification before allowing a new account to access protected data; require phone verification before enabling SMS for that user.
- Hash passwords with bcrypt or Argon2; never use the current placeholder/default password hash. Store verification tokens only as hashes and expire them quickly.
- Restrict staff and notification-setting changes to administrators on server routes, not only in the UI.
- Use a restricted database login for the application and the direct migration login only in deployment. Rotate credentials and enable backups and monitoring.
- If using Supabase Auth instead of the custom auth tables, enable Confirm Email and configure custom SMTP. Supabase's built-in test email service is not suitable for production and may only send to organization members.

## Current database configuration

`server/prisma.config.ts` supplies the connection URL for Prisma 7. Set `DIRECT_URL` to Supabase's direct database connection for migration generation and deployment; use `DATABASE_URL` for the running application connection pool.
