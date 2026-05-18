#!/usr/bin/env node

/**
 * Web Dashboard for X Tweet Scheduler
 * ===================================
 * Simple web UI for managing tweets and configuration
 *
 * USAGE:
 *   node dashboard.js
 *   Then open http://localhost:4000 in your browser
 */

require('./load-env');

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { fetchScheduledTweets, transformDateTime } = require('./schedule-tweets.js');

const PORT = process.env.DASHBOARD_PORT || 4000;

// HTML Dashboard
const getHtml = (tweets = [], error = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>X Tweet Scheduler Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    header h1 { font-size: 28px; margin-bottom: 5px; }
    header p { opacity: 0.9; }

    .content { padding: 30px; }

    .status-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; text-transform: uppercase; }

    .error {
      background: #fee;
      border-left: 4px solid #f44;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      color: #c00;
    }

    .tweet-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .tweet-card {
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      transition: all 0.2s;
    }
    .tweet-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #667eea;
    }
    .tweet-content {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 10px;
      color: #333;
    }
    .tweet-meta {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #999;
    }
    .tweet-date, .tweet-time {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      font-size: 14px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102,126,234,0.3); }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
    }
    .btn-secondary:hover { background: #eee; }

    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    .config-form {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      font-size: 14px;
      color: #333;
    }
    .form-group input, .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .form-group textarea { min-height: 80px; resize: vertical; }

    footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #ddd;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }
    .empty-state svg {
      width: 60px;
      height: 60px;
      margin-bottom: 15px;
      opacity: 0.5;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-pending { background: #ffd700; color: #333; }
    .badge-ready { background: #90ee90; color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🐦 X Tweet Scheduler</h1>
      <p>Manage and schedule your tweets automatically</p>
    </header>

    <div class="content">
      ${error ? `<div class="error"><strong>Error:</strong> ${error}</div>` : ''}

      <div class="status-bar">
        <div class="stat-card">
          <div class="stat-value">${tweets.length}</div>
          <div class="stat-label">Scheduled Tweets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${process.env.SHEET_API_URL ? '✓' : '✗'}</div>
          <div class="stat-label">API Configured</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${process.env.X_AUTH_TOKEN ? '✓' : '✗'}</div>
          <div class="stat-label">X Credentials</div>
        </div>
      </div>

      <div class="section-title">📋 Scheduled Tweets</div>
      ${
        tweets.length === 0
          ? `<div class="empty-state">
              <p>No tweets scheduled yet.</p>
              <p>Configure your API and add tweets to get started!</p>
            </div>`
          : `<div class="tweet-list">
              ${tweets
                .map(
                  (tweet, i) => `
                <div class="tweet-card">
                  <div class="tweet-content">${escapeHtml(tweet.content)}</div>
                  <div class="tweet-meta">
                    <span class="tweet-date">📅 ${tweet.date}</span>
                    <span class="tweet-time">🕐 ${tweet.time}</span>
                    <span class="badge badge-ready">Ready</span>
                  </div>
                </div>
              `,
                )
                .join('')}
            </div>`
      }

      <div class="button-group">
        <button class="btn-primary" onclick="location.reload()">🔄 Refresh</button>
        <button class="btn-secondary" onclick="startScheduler()">▶️ Start Scheduling</button>
      </div>

      <div class="section-title" style="margin-top: 40px;">⚙️ Configuration</div>
      <div class="config-form">
        <div class="form-group">
          <label>SHEET_API_URL</label>
          <input type="text" readonly value="${process.env.SHEET_API_URL || '(not set)'}">
        </div>
        <div class="form-group">
          <label>X_AUTH_TOKEN</label>
          <input type="password" readonly value="${process.env.X_AUTH_TOKEN ? '••••••••••' : '(not set)'}">
        </div>
        <div class="form-group">
          <label>HEADLESS Mode</label>
          <input type="text" readonly value="${process.env.HEADLESS === 'true' ? 'Yes (no browser window)' : 'No (watch browser)'}">
        </div>
        <p style="margin-top: 15px; font-size: 12px; color: #999;">
          To change these, edit <code>.env.local</code> then refresh this page.
        </p>
      </div>

      <div class="button-group">
        <button class="btn-secondary" onclick="openSetupWizard()">⚙️ Setup Wizard</button>
        <button class="btn-secondary" onclick="editEnv()">📝 Edit .env.local</button>
      </div>
    </div>

    <footer>
      <p>💡 Tip: Run this dashboard while scheduling tweets to monitor progress in real-time</p>
    </footer>
  </div>

  <script>
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function startScheduler() {
      alert('✨ Starting scheduler...\n\nCheck your terminal for progress.');
      fetch('/start-scheduler', { method: 'POST' });
    }

    function openSetupWizard() {
      alert('📝 Run this in terminal:\n\n  npm run setup-wizard');
    }

    function editEnv() {
      alert('📝 Edit .env.local with your favorite editor:\n\n  nano .env.local');
    }
  </script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (pathname === '/' && req.method === 'GET') {
    let tweets = [];
    let error = '';

    try {
      tweets = await fetchScheduledTweets(process.env.SHEET_API_URL);
    } catch (err) {
      error = `Cannot fetch tweets: ${err.message}. Check SHEET_API_URL in .env.local`;
    }

    res.writeHead(200);
    res.end(getHtml(tweets, error));
  } else if (pathname === '/start-scheduler' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'Scheduler started in background' }));

    // Start scheduler in background (don't wait for response)
    setTimeout(() => {
      try {
        require('child_process').spawn('npm', ['start'], {
          stdio: 'inherit',
          cwd: __dirname,
        });
      } catch (err) {
        console.error('Failed to start scheduler:', err);
      }
    }, 500);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(
    `\n🌐 Dashboard running at ${colors.cyan}http://localhost:${PORT}${colors.reset}\n`,
  );
  console.log('📱 Open this URL in your browser to manage tweets\n');
});

const colors = {
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};
