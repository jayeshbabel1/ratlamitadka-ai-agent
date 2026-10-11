export interface Env {
  DB: D1Database;
  APP_TIMEZONE?: string;
  PAYMENT_PENDING_MINUTES?: string;
  DISPATCH_DELAY_HOURS?: string;
  DEMO_MODE?: string;
  WOOCOMMERCE_CONSUMER_KEY?: string;
  WOOCOMMERCE_CONSUMER_SECRET?: string;
  WOOCOMMERCE_WEBHOOK_SECRET?: string;
  OPENAI_API_KEY?: string;
}
type WorkerEvent = { scheduledTime: number; cron: string };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
const nowIso = () => new Date().toISOString();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({ ok: true, app: 'ratlamitadka-ai-agent', time: nowIso(), demoMode: env.DEMO_MODE === 'true' });
    }
    if (url.pathname === '/api/dashboard/summary' && request.method === 'GET') {
      return json({ ok: true, mode: env.DEMO_MODE === 'true' ? 'demo' : 'live', timezone: env.APP_TIMEZONE || 'Asia/Kolkata', message: 'Connect and sync WooCommerce to populate production metrics.' });
    }
    if (url.pathname === '/api/orders/attention' && request.method === 'GET') {
      return json({ ok: true, items: [], mode: 'not-connected', message: 'No live order data is available until WooCommerce sync is implemented and configured.' });
    }
    if (url.pathname === '/api/webhooks/woocommerce' && request.method === 'POST') {
      return handleWooWebhook(request, env);
    }
    if (url.pathname.startsWith('/api/approvals') && request.method !== 'GET') {
      return json({ error: 'Approval execution is not enabled in this starter.' }, 501);
    }
    return json({ error: 'Not found' }, 404);
  },
  async scheduled(_event: WorkerEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledChecks(env));
  }
};

function corsHeaders() {
  return { 'access-control-allow-origin': 'same-origin', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-wc-webhook-signature' };
}

async function handleWooWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.WOOCOMMERCE_WEBHOOK_SECRET) return json({ error: 'Webhook secret is not configured' }, 503);
  const raw = await request.text();
  const signature = request.headers.get('X-WC-Webhook-Signature') || '';
  const valid = await verifyWooSignature(raw, signature, env.WOOCOMMERCE_WEBHOOK_SECRET);
  if (!valid) return json({ error: 'Invalid webhook signature' }, 401);

  const topic = request.headers.get('X-WC-Webhook-Topic') || 'unknown';
  const deliveryId = request.headers.get('X-WC-Webhook-Delivery-ID') || crypto.randomUUID();
  const resourceId = request.headers.get('X-WC-Webhook-Resource') || null;
  const eventKey = `${deliveryId}:${topic}`;
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO webhook_events
       (id,event_key,topic,resource_id,received_at_utc,signature_valid,processing_status)
       VALUES(?,?,?,?,?,1,'received')`
    ).bind(crypto.randomUUID(), eventKey, topic, resourceId, nowIso()).run();
  } catch {
    return json({ error: 'Webhook event could not be persisted' }, 503);
  }
  // A successful receipt means the signed event is durably recorded. Order fetch/upsert
  // and alert recalculation are the next implementation stage; reconciliation is required.
  return json({ ok: true, accepted: true, eventKey }, 202);
}

async function verifyWooSignature(rawBody: string, supplied: string, secret: string): Promise<boolean> {
  if (!supplied) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  // Compare constant-time for equal-length signatures.
  if (expected.length !== supplied.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

async function runScheduledChecks(env: Env): Promise<void> {
  // Cron runs at 12:30 UTC = 18:00 IST. No report is fabricated if the store isn't synced.
  // Production step: compute Asia/Kolkata half-open date windows, reconcile WooCommerce,
  // recalculate deterministic alerts, persist report snapshot, and notify on failures.
  if (!env.DB) throw new Error('D1 database binding is missing');
  await env.DB.prepare("SELECT 1").first();
}
