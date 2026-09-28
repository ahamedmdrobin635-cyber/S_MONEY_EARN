# S MONEY EARN - Telegram Mini App v1

This first working version:

1. Loads Telegram WebApp SDK.
2. Sends `Telegram.WebApp.initData` to `/api/me`.
3. Verifies Telegram's HMAC signature on the server.
4. Upserts the Telegram user into Supabase `public.users`.
5. Returns the saved balance/earning fields to the Mini App.

## Vercel environment variables

Set these as Vercel Environment Variables (server-side only):

- `TELEGRAM_BOT_TOKEN` = your BotFather token
- `SUPABASE_URL` = your Supabase Project URL
- `SUPABASE_SECRET_KEY` = your Supabase secret/service-role key

Never put these values in `index.html`, `app.js`, or GitHub.

## Deployment

Upload this project to the existing GitHub repository connected to Vercel, or deploy it as a new Vercel project.

After deployment, keep the same Telegram Mini App URL in BotFather.
