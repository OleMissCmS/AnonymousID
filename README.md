This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

This app maps a student ID to a stable anonymous survey ID using:
- HMAC-SHA256 lookup keys (raw student IDs are never stored)
- AES-256-GCM encrypted anonymous IDs
- Upstash Redis as the key-value store (Vercel-friendly)

## Vercel setup

In the Vercel project settings for this repo:

- **Framework Preset**: Next.js (the repo includes `vercel.json` to reinforce this)
- **Root Directory**: leave empty (repository root)
- **Build Command**: default (`next build` / `npm run build`)
- **Output Directory**: leave **empty** — do not set `public` or `.next` manually for Next.js
- **Install Command**: default

Set these environment variables (Production):

- `HMAC_SECRET`, `ENC_KEY`
- `AID_KV_REST_API_URL`, `AID_KV_REST_API_TOKEN`

If the site shows a plain-text `NOT_FOUND` from Vercel (not your app UI), the deployment usually is not being built as Next.js or the output/root directory is misconfigured. See [Vercel NOT_FOUND](https://vercel.com/docs/errors/NOT_FOUND).

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

### Local test plan
1. Start the dev server (`npm run dev`) and open the homepage.
2. Enter a student ID, click `Get anonymous ID`. Copy the returned anonymous ID.
3. Enter the same student ID again (same spelling/spacing), click `Get anonymous ID` again. Confirm the anonymous ID is identical.
4. Enter a different student ID, click `Get anonymous ID`. Confirm the anonymous ID is different.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
