'use strict';

const express = require('express');
const fetch = require('node-fetch'); // v2 for CommonJS
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || undefined;
const SINGLE_LOCK_TTL_MS = Number(process.env.SINGLE_LOCK_TTL_MS || 60 * 60 * 1000); // 1h default
const ALLOWED_HOSTNAME = process.env.ALLOWED_HOSTNAME || 'kanishkmahawar.tech';

// Trust proxy for correct IP when behind CDN/proxy
app.set('trust proxy', true);

// Fail fast on missing secret
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY. Set it in your environment.');
  process.exit(1);
}

// Security hardening
app.disable('x-powered-by');
app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN, optionsSuccessStatus: 200 } : {}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Static files (serve /public)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// Helmet security headers with CSP compatible with current site resources
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.tailwindcss.com', 'https://pagead2.googlesyndication.com', 'https://cse.google.com', 'https://www.google.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://www.google.com', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
      frameSrc: ["'self'", 'https://www.google.com'],
      objectSrc: ["'none'"]
    }
  }
}));

// Rate limit for API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// ----- Single device per network policy -----
const ipLocks = new Map(); // ip -> { deviceId, lastSeen, expiresAt }
const now = () => Date.now();

setInterval(() => {
  const t = now();
  for (const [ip, entry] of ipLocks.entries()) {
    if (entry.expiresAt <= t) ipLocks.delete(ip);
  }
}, Math.min(SINGLE_LOCK_TTL_MS, 10 * 60 * 1000));

function getClientIp(req) {
  const xfwd = req.headers['x-forwarded-for'];
  if (typeof xfwd === 'string' && xfwd.length > 0) {
    return xfwd.split(',')[0].trim();
  }
  return req.ip;
}

app.use((req, res, next) => {
  let deviceId = req.cookies?.device_id;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    res.cookie('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
      sameSite: 'strict',
      maxAge: SINGLE_LOCK_TTL_MS
    });
  }
  req.deviceId = deviceId;
  next();
});

function singleDevicePerNetworkMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const deviceId = req.deviceId;
  const entry = ipLocks.get(ip);
  const t = now();

  if (!entry || entry.expiresAt <= t) {
    ipLocks.set(ip, { deviceId, lastSeen: t, expiresAt: t + SINGLE_LOCK_TTL_MS });
    return next();
  }

  if (entry.deviceId === deviceId) {
    entry.lastSeen = t;
    entry.expiresAt = t + SINGLE_LOCK_TTL_MS;
    return next();
  }

  // Different device on same external IP -> redirect home
  return res.redirect(302, '/');
}

// Apply policy: allow static & API, enforce for pages
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  const isStatic = ext && ['.css', '.js', '.png', '.jpg', '.svg', '.ico', '.mp4'].includes(ext);
  const isApi = req.path.startsWith('/gemini-proxy');

  if (isApi) return singleDevicePerNetworkMiddleware(req, res, next);
  if (isStatic) return next();

  // Redirect subdomains or deep links back to main page
  if (req.hostname && req.hostname !== ALLOWED_HOSTNAME) {
    return res.redirect(302, `https://${ALLOWED_HOSTNAME}/`);
  }
  if (req.path !== '/') {
    return res.redirect(302, '/');
  }

  return singleDevicePerNetworkMiddleware(req, res, next);
});

// Root page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// AI proxy
app.post('/gemini-proxy', apiLimiter, async (req, res) => {
  try {
    const { query } = req.body;
    if (typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Query must be a non-empty string' });
    }
    if (query.length > 2000) {
      return res.status(400).json({ error: 'Query must be under 2000 characters' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: query }] }] };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(502).json({ error: 'Upstream AI error', detail: text.slice(0, 500) });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
