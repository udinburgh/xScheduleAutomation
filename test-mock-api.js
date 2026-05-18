/**
 * Mock API Server for Testing
 * ============================
 * Simulates a Google Sheets API endpoint locally.
 *
 * USAGE:
 *   npm test
 *
 * Then in another terminal:
 *   npm start
 */

// Load .env.local
require('./load-env');

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Sample tweets for testing - includes image and multi-account examples
const MOCK_TWEETS = [
  {
    content: 'Tweet from main account! 🚀',
    date: '2026-05-20',
    time: '09:30',
    image_url: '',
    account: 'main',
  },
  {
    content: 'Hello from alt1 with an image 📸',
    date: '2026-05-20',
    time: '14:45',
    image_url: 'https://picsum.photos/800/600',
    account: 'alt1',
  },
  {
    content: 'Tweet from main account #2',
    date: '2026-05-21',
    time: '11:00',
    image_url: '',
    account: 'main',
  },
  {
    content: 'Multi-image from alt2 🎨',
    date: '2026-05-21',
    time: '15:00',
    image_url: 'https://picsum.photos/800/600?random=1,https://picsum.photos/800/600?random=2',
    account: 'alt2',
  },
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/api/tweets' && req.method === 'GET') {
    const limit = parsedUrl.query.limit ? parseInt(parsedUrl.query.limit) : MOCK_TWEETS.length;
    res.writeHead(200);
    res.end(JSON.stringify(MOCK_TWEETS.slice(0, limit)));
    console.log(`[Mock API] GET /api/tweets → ${Math.min(limit, MOCK_TWEETS.length)} tweets`);
  } else if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Mock Sheets API running on http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET /api/tweets         → returns all mock tweets`);
  console.log(`   GET /api/tweets?limit=1 → returns limited tweets`);
  console.log(`   GET /health             → health check\n`);
  console.log(`Use this in another terminal:`);
  console.log(`   SHEET_API_URL=http://localhost:${PORT}/api/tweets node schedule-tweets.js\n`);
});
