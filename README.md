# 🐦 X (Twitter) Tweet Scheduler

Schedule tweets to X (Twitter) directly from a **Google Sheet** — no API access needed. Supports **multiple accounts**, **image attachments**, and **human-like behavior** to avoid bot detection.

---

## ✨ Features

- 📋 **Google Sheets as your tweet queue** — write tweets in a spreadsheet, schedule them with one command
- 👥 **Multi-account support** — manage 1, 4, or more X accounts from a single sheet
- 🖼️ **Image attachments** — paste image URLs directly in the sheet (max 4 per tweet)
- 🤖 **Human-like behavior** — random delays, mid-typing pauses, randomized account order
- 🔐 **Cookie-based auth** — no X API key needed, works via Playwright UI automation
- 🛡️ **Isolated browser contexts** — each account uses a separate context (no cookie leak)
- ⏰ **Pre-flight health check** — verifies cookies are valid before scheduling

---

## 📁 Project Structure

```
.
├── README.md                       # You are here
├── package.json
├── .env.example                    # Config template (copy to .env.local)
├── .gitignore
├── LICENSE
│
├── schedule-tweets.js              # Main scheduler (entry point)
├── setup-wizard.js                 # Interactive setup CLI
├── dashboard.js                    # Optional web dashboard
├── test-mock-api.js                # Local mock API for testing
├── load-env.js                     # Loads .env.local at runtime
│
├── apps-script/                    # Google Apps Script (paste into Sheets)
│   ├── minimal.gs                  # Basic version (URLs only)
│   └── with-images.gs              # Full version (Drive folder lookup)
│
├── docs/
│   ├── MULTI_ACCOUNT.md            # Multi-account setup
│   └── IMAGES.md                   # Image attachment guide
│
├── examples/
│   ├── accounts.example.json       # accounts.json template
│   └── api-response.example.json   # Expected API response shape
│
└── scripts/
    ├── setup.sh                    # One-line install
    └── start.sh                    # Interactive menu launcher
```

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone <your-repo-url> x-tweet-scheduler
cd x-tweet-scheduler
npm install
npx playwright install chromium
```

### 2. Setup Google Sheet + Apps Script

**Create the Sheet:**

1. Create a new [Google Sheet](https://sheets.new)
2. Set column headers in row 1:

| A (content) | B (date) | C (time) | D (image_url) | E (account) |
|-------------|----------|----------|---------------|-------------|
| Hello world | 2026-05-20 | 09:30 | | main |
| With image | 2026-05-20 | 14:45 | `https://picsum.photos/800/600` | alt1 |

3. **Format columns B & C as Plain Text** *(important — prevents timezone issues)*:
   - Select column B → **Format → Number → Plain text**
   - Repeat for column C
   - Type values like `2026-05-20` and `09:30` (not as date/time auto-format)

**Setup Apps Script:**

1. In your sheet: **Extensions → Apps Script**
2. Delete the default code
3. Open [`apps-script/minimal.gs`](apps-script/minimal.gs) in this repo, copy all content, paste into the editor
4. Click **💾 Save**
5. Click **Run** (next to `testFetch`) — grant the permissions popup
6. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** ⚠️ (NOT "Anyone with Google account")
7. Click **Deploy** → Copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`)

### 3. Configure Credentials

```bash
cp .env.example .env.local
```

Edit `.env.local` and paste the Web app URL:

```bash
SHEET_API_URL=https://script.google.com/macros/s/.../exec
HEADLESS=false
```

### 4. Add Your X Credentials

You have two modes — pick one:

#### Option A: Single Account (simplest)

In `.env.local`, add:

```bash
X_AUTH_TOKEN=<your auth_token cookie>
X_CT0=<your ct0 cookie>
```

**How to get these:**
1. Login to [x.com](https://x.com)
2. Press **F12** → **Application** → **Cookies** → **x.com**
3. Find rows `auth_token` and `ct0` → copy their Values

#### Option B: Multi-Account (recommended for power users)

```bash
cp examples/accounts.example.json accounts.json
```

Edit `accounts.json`:

```json
{
  "main": {
    "auth_token": "abc123...",
    "ct0": "xyz789...",
    "label": "Main Account"
  },
  "alt1": {
    "auth_token": "...",
    "ct0": "...",
    "label": "Marketing Account"
  }
}
```

For each account: login to X → extract `auth_token` + `ct0` → paste into `accounts.json`.

> **Tip:** Use a separate Chrome profile per account so you don't have to logout/login repeatedly.

> 📖 **Full multi-account guide:** [docs/MULTI_ACCOUNT.md](docs/MULTI_ACCOUNT.md)

### 5. Run!

```bash
npm start
```

You'll see a browser window open, login automatically via cookies, then schedule each tweet one by one. ✨

---

## 📊 Spreadsheet Format

| Column | Field | Required? | Example |
|--------|-------|-----------|---------|
| **A** | content | ✅ | `Hello world! 🚀` |
| **B** | date | ✅ | `2026-05-20` (YYYY-MM-DD) |
| **C** | time | ✅ | `09:30` (24-hour HH:mm) |
| **D** | image_url | ⛔ | `https://...` (or comma-separated, max 4) |
| **E** | account | ⛔ | `main`, `alt1`, etc. (key from `accounts.json`) |

> ⚠️ **Format columns B & C as Plain Text** in Google Sheets to avoid timezone shifts. See [Troubleshooting](#troubleshooting).

---

## 🖼️ Adding Images

Three ways — pick the easiest:

### Method 1: Public Image URL (simplest)

Paste any public image URL in column D:

```
https://picsum.photos/800/600
https://i.imgur.com/abc123.jpg
```

For multiple images, comma-separate (max 4):

```
https://example.com/1.jpg,https://example.com/2.jpg
```

### Method 2: Google Drive Folder (filename lookup)

1. Upload images to a Drive folder
2. Right-click folder → **Share** → **Anyone with the link** → **Viewer**
3. Use [`apps-script/with-images.gs`](apps-script/with-images.gs) instead of `minimal.gs`
4. Set `DRIVE_FOLDER_ID` at the top of the script (just the ID, not full URL!)
5. In column D, just write the filename: `photo1.jpg`

> 📖 **Full image guide:** [docs/IMAGES.md](docs/IMAGES.md)

---

## ⚙️ Commands

| Command | What it does |
|---------|--------------|
| `npm start` | Run scheduler (headless mode, fast) |
| `npm run dev` | Run with visible browser (watch + intervene) |
| `npm run setup` | Interactive setup wizard |
| `npm run dashboard` | Open web UI at http://localhost:4000 |
| `npm run mock-api` | Start local mock API for testing |

---

## 🛡️ Anti-Detection Features

The scheduler implements several techniques to avoid being flagged as a bot:

| Feature | Description |
|---------|-------------|
| **Isolated contexts** | Each account uses a separate Playwright context — no cookie leak |
| **Sequential execution** | Accounts processed one at a time, never in parallel |
| **Randomized order** | Account order is shuffled per run (no pattern) |
| **Long cool-downs** | 15–30s between accounts, 3–6s between tweets |
| **Human-like typing** | Random per-character delays (40–110ms), pauses on punctuation |
| **"Thinking" pauses** | Occasional 1–2.5s pauses before clicks (5% probability) |
| **Pre-flight check** | Verifies cookies are valid before scheduling begins |

Tune delays in [`schedule-tweets.js`](schedule-tweets.js) (search for `delays:` config).

---

## 🆘 Troubleshooting

### ❌ "Sheet payload must be an array"

Apps Script returned an error instead of tweet data. The error message now includes details. Common causes:

- **Deployment access set wrong**: Must be **"Anyone"**, not "Anyone with Google account"
- **Drive permission missing**: If using `with-images.gs`, ensure Drive scope is granted (run `testFetch` manually first)

### ❌ Time in spreadsheet doesn't match scheduled time

Google Sheets stores typed times as Date objects with weird historical timezone offsets (Local Mean Time before 1932).

**Fix:** Format columns B & C as **Plain Text**:
1. Select column → **Format → Number → Plain text**
2. Delete cells → re-type values

### ❌ "Auth check failed"

Cookies expired (typically every ~7 days). Re-extract `auth_token` and `ct0` from your browser.

### ❌ Click intercepted / timeout 30s

Twitter's transient overlay div blocked the click. Fixed via `force: true` in scheduler. If you still see it, increase `delays.afterClick` in config.

### ❌ AM/PM mismatch

Already fixed via 3-layer fallback (label match → value match → index-based). Watch console output for `✗` warnings.

### ❌ Failure screenshots

If a tweet fails, the scheduler saves `failure-{account}-{index}-{timestamp}.png`. Check it to see what the browser was showing when it failed.

---

## 📦 Tech Stack

- **[Playwright](https://playwright.dev/)** — Browser automation
- **[node-fetch](https://github.com/node-fetch/node-fetch)** — HTTP client
- **Google Apps Script** — Sheets-to-API bridge
- **Node.js 18+**

---

## ⚠️ Disclaimer

- This tool uses cookie injection + UI automation, **not** the official X API.
- Use at your own risk. Excessive use may trigger X's anti-bot detection.
- **Do not commit `accounts.json` or `.env.local`** — both are gitignored by default.
- Cookies are sensitive; treat them like passwords.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 📚 Documentation

- [docs/MULTI_ACCOUNT.md](docs/MULTI_ACCOUNT.md) — Setting up 4+ accounts
- [docs/IMAGES.md](docs/IMAGES.md) — Image attachment workflows
- [apps-script/minimal.gs](apps-script/minimal.gs) — Basic Apps Script
- [apps-script/with-images.gs](apps-script/with-images.gs) — Full Apps Script with Drive support
