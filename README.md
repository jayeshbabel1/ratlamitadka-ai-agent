# RatlamiTadka AI Business Agent

A separate Cloudflare-first starter for RatlamiTadka.com. It does not modify WordPress or BafnaIMS.

## What's included
- Private-dashboard UI starter with sales KPIs, order attention queue, daily report, and approval-first workflow.
- Cloudflare Worker API scaffold.
- Cloudflare D1 schema and initial migrations.
- WooCommerce webhook HMAC verification and idempotent event storage.
- UTC Cron Trigger scheduled for 12:30 UTC (18:00 Asia/Kolkata).
- Demo data mode so the dashboard can be previewed before store credentials are configured.

## Architecture
- `apps/dashboard`: Vite + React + TypeScript dashboard.
- `apps/worker`: Cloudflare Worker API, D1 schema, WooCommerce webhook receiver, scheduled entry point.
- `wrangler.toml`: Worker/D1/Cron configuration template.

## Local preview
Requirements: Node.js 20+ and npm.

```bash
cd apps/dashboard
npm install
npm run dev
```

Dashboard demo mode is enabled by default. The starter intentionally does not include real store credentials.

## Deploy Worker
1. Create a separate Git repository for this project (suggested name: `ratlamitadka-ai-agent`).
2. Install Wrangler: `npm install -g wrangler`, then `wrangler login`.
3. Create a D1 database: `wrangler d1 create ratlamitadka-agent-db`.
4. Put the returned database ID in `wrangler.toml`.
5. Apply schema: `wrangler d1 execute ratlamitadka-agent-db --file=./apps/worker/schema.sql`.
6. Set secrets (never commit them):
   ```bash
   wrangler secret put WOOCOMMERCE_CONSUMER_KEY
   wrangler secret put WOOCOMMERCE_CONSUMER_SECRET
   wrangler secret put WOOCOMMERCE_WEBHOOK_SECRET
   wrangler secret put OPENAI_API_KEY
   ```
7. Configure Cloudflare Access for the dashboard/API host before connecting real store data.
8. Deploy Worker: `wrangler deploy`.

## Connect WooCommerce safely
- Create a dedicated WooCommerce REST API key with **Read** permission for the initial release.
- Configure WooCommerce webhooks for order created/updated and refunds if available, targeting:
  `https://YOUR-WORKER-HOST/api/webhooks/woocommerce`
- Set the same webhook signing secret in `WOOCOMMERCE_WEBHOOK_SECRET`.
- Verify that the webhook delivery is signed and that `X-WC-Webhook-Signature` is present.
- Add a scheduled reconciliation job before relying on alerts in production; webhooks can be missed.
- Dispatch-delay alerts are only reliable when the shipping/dispatch integration supplies a verified dispatch event. Without that, label them as potential delays.

## Important implementation notes
- The current UI uses clearly labeled demo data until a live API is configured.
- This starter does not execute refunds, change order statuses, message customers, or deploy site changes.
- Approval endpoints are placeholders for the next implementation stage; no mutation should be enabled without authorization, fresh state validation, and audit logging.
- Configure Cloudflare Access (or equivalent strong authentication/MFA) and restrict allowed identities before exposing this app.
- Treat order/customer content as untrusted data. Keep customer PII to a minimum.
- D1 is SQLite-based; reassess database choice if the workload grows substantially.
