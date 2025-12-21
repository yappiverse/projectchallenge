This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Incident Email Sender (Resend)

To enable automatic incident summary emails, set the following environment variables in `projecta/.env.local` or your deployment environment:

- `RESEND_API_KEY` - your Resend API key (do NOT commit this to git).
- `RESEND_FROM` - optional from address (defaults to `no-reply@your-host`).
- `INCIDENT_SUMMARY_TO` - recipient email address to receive incident summaries.

Example `.env.local`:

```env
RESEND_API_KEY=re_axbdUdRE_439mwH5QYZvJzYQwoTeCDT6Q
INCIDENT_SUMMARY_TO=you@example.com
RESEND_FROM=no-reply@example.com
```

The webhook handler will send the same text shown in the terminal (incident summary) as the email body.

### Telegram notifications

To also forward incident summaries to Telegram, set these env vars in `projecta/.env.local`:

- `TELEGRAM_BOT_TOKEN` - your bot token (do NOT commit this to git).
- `TELEGRAM_CHAT_ID` - the chat id (user id or group id) that should receive messages.

Example addition:

```env
TELEGRAM_BOT_TOKEN=8345375903:AAEK0jV-3nyjN-fug7SzQdsTUWXJ9skHrIo
TELEGRAM_CHAT_ID=123456789
```

When configured, the webhook background task will post the incident summary to the Telegram chat using Markdown formatting.
