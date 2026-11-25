import crypto from 'node:crypto';
import pg from 'pg';
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

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

export default async function handler(req, res) {
  const url = (req.url || '').split('?')[0];

  try {
    if (url === '/api/health' && req.method === 'GET') {
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

      return res.status(200).json({
        status: '200 OK',
        postgresConnected,
        storageConnected,
        stripeConfigured: Boolean(STRIPE_SECRET_KEY),
        webhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
        proPriceConfigured: Boolean(STRIPE_PRO_PRICE_ID),
      });
    }

    if (url === '/api/contact' && req.method === 'POST') {
      if (!pool) return res.status(500).json({ error: 'DATABASE_URL is not configured' });
      await ensureSchema();
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRawBody(req)) || '{}');
      const { name, contact, message } = body;
      if (!name || !contact) return res.status(400).json({ error: 'name and contact are required' });
      const result = await pool.query(
        'INSERT INTO contact_requests (name, contact, message) VALUES ($1, $2, $3) RETURNING id, name, contact, created_at',
        [String(name).trim(), String(contact).trim(), String(message || '').trim()]
      );
      return res.status(201).json({ saved: true, row: result.rows[0] });
    }

    if (url === '/api/contact' && req.method === 'GET') {
      if (!pool) return res.status(500).json({ error: 'DATABASE_URL is not configured' });
      await ensureSchema();
      const result = await pool.query(
        'SELECT id, name, contact, message, created_at FROM contact_requests ORDER BY id DESC LIMIT 20'
      );
      return res.status(200).json({ items: result.rows });
    }

    if (url === '/api/storage/upload' && req.method === 'POST') {
      if (!s3Client) return res.status(500).json({ error: 'Neon Object Storage env vars are not configured' });
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRawBody(req)) || '{}');
      const { filename, content, contentType } = body;
      if (!filename || typeof content !== 'string') {
        return res.status(400).json({ error: 'filename and content are required' });
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
      return res.status(201).json({ uploaded: true, bucket: STORAGE_BUCKET, key });
    }

    if (url === '/api/storage/list' && req.method === 'GET') {
      if (!s3Client) return res.status(500).json({ error: 'Neon Object Storage env vars are not configured' });
      const result = await s3Client.send(new ListObjectsV2Command({ Bucket: STORAGE_BUCKET, MaxKeys: 25 }));
      const objects = (result.Contents || []).map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
      return res.status(200).json({ bucket: STORAGE_BUCKET, objects });
    }

    if (url === '/api/stripe/events' && req.method === 'GET') {
      if (!pool) return res.status(200).json({ events: [] });
      await ensureSchema();
      const result = await pool.query('SELECT id, type, received_at FROM stripe_events ORDER BY received_at DESC LIMIT 50');
      return res.status(200).json({ events: result.rows });
    }

    if (url === '/api/stripe/webhook' && req.method === 'POST') {
      const rawBody = await readRawBody(req);
      const sig = req.headers['stripe-signature'];
      if (STRIPE_WEBHOOK_SECRET && !verifyStripeSignature(rawBody, String(sig || ''), STRIPE_WEBHOOK_SECRET)) {
        return res.status(400).json({ error: 'Invalid Stripe-Signature' });
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
      return res.status(200).json({ received: true, type: eventType });
    }

    if (url === '/api/create-checkout-session' && req.method === 'POST') {
      if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'STRIPE_SECRET_KEY is not configured' });
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse((await readRawBody(req)) || '{}');
      const origin = body.origin || `https://${req.headers.host}`;
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
      if (!stripeRes.ok) return res.status(stripeRes.status).json({ error: data?.error?.message || 'Stripe API error' });
      return res.status(200).json({ id: data.id, url: data.url });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
}
