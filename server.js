const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// ── Known SNSC 3-1 / Ninebot IoT endpoints ──────────────────────────────────
// All known APIs that SNSC 3-1 scooters (incl Ryde-spec) may respond to
const APIS = {
  ryde_near:    'https://qw-test.ryde.vip/appRyde/getNearScooters',
  ryde_unlock:  'https://qw-test.ryde.vip/appRyde/unlockScooter',
  ryde_lock:    'https://qw-test.ryde.vip/appRyde/lockScooter',
  ryde_info:    'https://qw-test.ryde.vip/appRyde/getScooterInfo',
  ryde_status:  'https://qw-test.ryde.vip/appRyde/getScooterStatus',
};

// ── Proxy: GET /proxy?url=... ────────────────────────────────────────────────
app.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url param' });
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'RydeApp/2.0 (Android)',
        'Accept': 'application/json',
      }
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    res.json({ status: r.status, ok: r.ok, data: json });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Proxy: POST /proxy ───────────────────────────────────────────────────────
app.post('/proxy', async (req, res) => {
  const { url, body, headers: extraHeaders } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const bodyStr = typeof body === 'string' ? body :
      Object.entries(body || {}).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RydeApp/2.0 (Android)',
        'Accept': 'application/json',
        ...(extraHeaders || {})
      },
      body: bodyStr
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    res.json({ status: r.status, ok: r.ok, data: json });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Ryde: Get scooters near Göteborg ────────────────────────────────────────
app.get('/ryde/scooters', async (req, res) => {
  const lat = req.query.lat || 57.7089;
  const lon = req.query.lon || 11.9746;
  try {
    const r = await fetch(APIS.ryde_near, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RydeApp/2.0 (Android)',
      },
      body: `iotLa=${lat}&iotLo=${lon}&nearRadius=10&cityId=32`
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    res.json({ status: r.status, data: json });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Ryde: Unlock scooter ─────────────────────────────────────────────────────
app.post('/ryde/unlock', async (req, res) => {
  const { iotImei, userId } = req.body;
  try {
    const r = await fetch(APIS.ryde_unlock, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RydeApp/2.0 (Android)',
      },
      body: `iotImei=${iotImei}&userId=${userId || 1}`
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    res.json({ status: r.status, data: json });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Ryde: Lock scooter ───────────────────────────────────────────────────────
app.post('/ryde/lock', async (req, res) => {
  const { iotImei, userId } = req.body;
  try {
    const r = await fetch(APIS.ryde_lock, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RydeApp/2.0 (Android)',
      },
      body: `iotImei=${iotImei}&userId=${userId || 1}`
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    res.json({ status: r.status, data: json });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: 'SNSC IoT Proxy running' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
