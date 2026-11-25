import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let val = trimmed.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnv();

const PORT = Number(process.env.PORT || 8787);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';
const DATABASE_URL = process.env.DATABASE_URL || '';
const STORAGE_BUCKET = 'uploads';

const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      max: 5,
    })
  : null;

const s3Client =
  process.env.AWS_ENDPOINT_URL_S3 &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
    ? new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: process.env.AWS_ENDPOINT_URL_S3,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      })
    : null;

let schemaReady = false;
async function ensureSchema() {
  if (!pool || schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      message TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stripe_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      received_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  schemaReady = true;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((pair) => {
      const [k, v] = pair.split('=');
      return [k?.trim(), v?.trim()];
    })
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(v1, 'utf8');
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/health' && req.method === 'GET') {
      let postgresConnected = false;
      let storageConnected = false;

      if (pool) {
        try {
          await pool.query('SELECT 1');
          postgresConnected = true;
        } catch {
          postgresConnected = false;
        }
      }

      if (s3Client) {
        try {
          await s3Client.send(new ListObjectsV2Command({ Bucket: STORAGE_BUCKET, MaxKeys: 1 }));
          storageConnected = true;
        } catch {
          storageConnected = false;
        }
      }

      sendJson(res, 200, {
        status: '200 OK',
        postgresConnected,
        storageConnected,
        stripeConfigured: Boolean(STRIPE_SECRET_KEY),
        webhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
        proPriceConfigured: Boolean(STRIPE_PRO_PRICE_ID),
      });
      return;
    }

    // Neon Postgres: Contact Requests
    if (req.url === '/api/contact' && req.method === 'POST') {
      if (!pool) {
        sendJson(res, 500, { error: 'DATABASE_URL is not configured' });
        return;
      }
      await ensureSchema();
      const rawBody = await readRawBody(req);
      const { name, contact, message } = JSON.parse(rawBody || '{}');
      if (!name || !contact) {
        sendJson(res, 400, { error: 'name and contact are required' });
        return;
      }
      const result = await pool.query(
        'INSERT INTO contact_requests (name, contact, message) VALUES ($1, $2, $3) RETURNING id, name, contact, created_at',
        [String(name).trim(), String(contact).trim(), String(message || '').trim()]
      );
      sendJson(res, 201, { saved: true, row: result.rows[0] });
      return;
    }

    if (req.url === '/api/contact' && req.method === 'GET') {
      if (!pool) {
        sendJson(res, 500, { error: 'DATABASE_URL is not configured' });
        return;
      }
      await ensureSchema();
      const result = await pool.query(
        'SELECT id, name, contact, message, created_at FROM contact_requests ORDER BY id DESC LIMIT 20'
      );
      sendJson(res, 200, { items: result.rows });
      return;
    }

    // Neon Object Storage: Upload & List
    if (req.url === '/api/storage/upload' && req.method === 'POST') {
      if (!s3Client) {
        sendJson(res, 500, { error: 'Neon Object Storage env vars are not configured' });
        return;
      }
      const rawBody = await readRawBody(req);
      const { filename, content, contentType } = JSON.parse(rawBody || '{}');
      if (!filename || typeof content !== 'string') {
        sendJson(res, 400, { error: 'filename and content are required' });
        return;
      }
      const key = `notes/${Date.now()}-${String(filename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: STORAGE_BUCKET,
          Key: key,
          Body: content,
          ContentType: contentType || 'text/plain; charset=utf-8',
        })
      );
      sendJson(res, 201, { uploaded: true, bucket: STORAGE_BUCKET, key });
      return;
    }

    if (req.url === '/api/storage/list' && req.method === 'GET') {
      if (!s3Client) {
        sendJson(res, 500, { error: 'Neon Object Storage env vars are not configured' });
        return;
      }
      const result = await s3Client.send(
        new ListObjectsV2Command({ Bucket: STORAGE_BUCKET, MaxKeys: 25 })
      );
      const objects = (result.Contents || []).map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
      sendJson(res, 200, { bucket: STORAGE_BUCKET, objects });
      return;
    }

    // Stripe Events
    if (req.url === '/api/stripe/events' && req.method === 'GET') {
      if (!pool) {
        sendJson(res, 200, { events: [] });
        return;
      }
      await ensureSchema();
      const result = await pool.query(
        'SELECT id, type, received_at FROM stripe_events ORDER BY received_at DESC LIMIT 50'
      );
      sendJson(res, 200, { events: result.rows });
      return;
    }

    if (req.url === '/api/stripe/webhook' && req.method === 'POST') {
      const rawBody = await readRawBody(req);
      const sig = req.headers['stripe-signature'];
      if (
        STRIPE_WEBHOOK_SECRET &&
        !verifyStripeSignature(rawBody, String(sig || ''), STRIPE_WEBHOOK_SECRET)
      ) {
        sendJson(res, 400, { error: 'Invalid Stripe-Signature' });
        return;
      }

      const event = JSON.parse(rawBody || '{}');
      const eventId = event.id || `evt_${Date.now()}`;
      const eventType = event.type || 'unknown';

      if (pool) {
        await ensureSchema();
        await pool.query(
          'INSERT INTO stripe_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
          [eventId, eventType]
        );
      }

      sendJson(res, 200, { received: true, type: eventType });
      return;
    }

    // Stripe Checkout
    if (req.url === '/api/create-checkout-session' && req.method === 'POST') {
      if (!STRIPE_SECRET_KEY) {
        sendJson(res, 500, { error: 'STRIPE_SECRET_KEY is not configured in .env' });
        return;
      }

      const rawBody = await readRawBody(req);
      const parsed = rawBody ? JSON.parse(rawBody) : {};
      const origin = parsed.origin || 'http://localhost:5173';

      const params = STRIPE_PRO_PRICE_ID
        ? new URLSearchParams({
            mode: 'subscription',
            success_url: `${origin}/?checkout=success#tutor`,
            cancel_url: `${origin}/?checkout=cancel#pricing`,
            'line_items[0][price]': STRIPE_PRO_PRICE_ID,
            'line_items[0][quantity]': '1',
          })
        : new URLSearchParams({
            mode: 'payment',
            success_url: `${origin}/?checkout=success#tutor`,
            cancel_url: `${origin}/?checkout=cancel#pricing`,
            'line_items[0][price_data][currency]': 'usd',
            'line_items[0][price_data][product_data][name]': 'core.tutor Pro (30 мин/урок, 4 этапа)',
            'line_items[0][price_data][unit_amount]': '500',
            'line_items[0][quantity]': '1',
          });

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await stripeRes.json();
      if (!stripeRes.ok) {
        sendJson(res, stripeRes.status, { error: data?.error?.message || 'Stripe API error' });
        return;
      }

      sendJson(res, 200, { id: data.id, url: data.url });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
