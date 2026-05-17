const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Segway Discovery API regions
const SEGWAY_REGIONS = {
  eu: 'https://eu-api.segwaydiscovery.com',
  apac: 'https://apac-api.segwaydiscovery.com',
  us: 'https://us-api.segwaydiscovery.com',
};

// Token cache
let tokenCache = {};

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: 'SNSC IoT Backend running' }));

// ── Segway: Get token ─────────────────────────────────────────
app.post('/segway/token', async (req, res) => {
  const { client_id, client_secret, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`
    });
    const data = await r.json();
    if (data.access_token) {
      tokenCache[client_id] = { token: data.access_token, base, expires: Date.now() + (data.expires_in * 1000) };
    }
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Unlock ────────────────────────────────────────────
app.post('/segway/unlock', async (req, res) => {
  const { access_token, iotCode, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/control/unlock`, {
      method: 'POST',
      headers: { 'Authorization': `bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ iotCode })
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Lock ──────────────────────────────────────────────
app.post('/segway/lock', async (req, res) => {
  const { access_token, iotCode, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/control/lock`, {
      method: 'POST',
      headers: { 'Authorization': `bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ iotCode })
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Status ────────────────────────────────────────────
app.get('/segway/status', async (req, res) => {
  const { access_token, iotCode, region = 'eu' } = req.query;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/query/current/status?iotCode=${iotCode}`, {
      headers: { 'Authorization': `bearer ${access_token}` }
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Location ──────────────────────────────────────────
app.get('/segway/location', async (req, res) => {
  const { access_token, iotCode, region = 'eu' } = req.query;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/query/current/location?iotCode=${iotCode}&realTimeLocation=true`, {
      headers: { 'Authorization': `bearer ${access_token}` }
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Power on/off ──────────────────────────────────────
app.post('/segway/power', async (req, res) => {
  const { access_token, iotCode, on, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/control/power-on-off`, {
      method: 'POST',
      headers: { 'Authorization': `bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ iotCode, controlType: on ? 1 : 0 })
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Headlight ─────────────────────────────────────────
app.post('/segway/light', async (req, res) => {
  const { access_token, iotCode, on, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/control/headlight`, {
      method: 'POST',
      headers: { 'Authorization': `bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ iotCode, controlType: on ? 1 : 0 })
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Sound (beep) ──────────────────────────────────────
app.post('/segway/sound', async (req, res) => {
  const { access_token, iotCode, contentType = 0, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/control/sound`, {
      method: 'POST',
      headers: { 'Authorization': `bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ iotCode, contentType })
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Segway: Speed mode ────────────────────────────────────────
app.post('/segway/speedmode', async (req, res) => {
  const { access_token, iotCode, speedMode, region = 'eu' } = req.body;
  const base = SEGWAY_REGIONS[region] || SEGWAY_REGIONS.eu;
  try {
    const r = await fetch(`${base}/api/v2/vehicle/setting/speed-mode`, {
      method: 'POST',
      headers: { 'Authorization': `bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ iotCode, speedMode })
    });
    const data = await r.json();
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Generic proxy ─────────────────────────────────────────────
app.post('/proxy', async (req, res) => {
  const { url, body, headers: h } = req.body;
  try {
    const bodyStr = typeof body === 'string' ? body :
      Object.entries(body||{}).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(h||{}) },
      body: bodyStr
    });
    const text = await r.text();
    let data; try { data=JSON.parse(text); } catch { data={raw:text}; }
    res.json({ ok: r.ok, status: r.status, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
