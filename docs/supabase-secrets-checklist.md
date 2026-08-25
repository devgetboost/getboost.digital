# Secrets a configurar no projeto `gdbxutbwgolftqmxnkbi`

No Dashboard → Project Settings → Edge Functions → Secrets (ou `npx supabase secrets set KEY=...`):

## Plataforma (já injetados)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Integrações (copiar do projeto Lovable antigo se existirem)
- LOVABLE_API_KEY
- BREVO_API_KEY
- TELEGRAM_BOT_TOKEN
- CRM_WEBHOOK_URL
- CAMPAIGN_WEBHOOK_SECRET
- META_APP_ID / META_APP_SECRET / META_VERIFY_TOKEN
- LINKEDIN_API_KEY / TIKTOK_API_KEY / X_API_KEY (ou TWITTER_*)
- GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY
- EMAIL_CREDENTIAL_ENCRYPTION_KEY
- SITE_URL=https://getboost.digital
- AGENTIC_ALERT_RECIPIENTS
- ADMIN_TASKS_BACKUP_USER_ID

## Auth URLs
Dashboard → Authentication → URL Configuration:
- Site URL: http://localhost:3080 (dev) / https://getboost.digital (prod)
- Redirect URLs: http://localhost:3080/** e https://getboost.digital/**

## Nota
`whatsapp-proxy` não existe no repo (só no cloud Lovable antigo) — não foi deployada.
