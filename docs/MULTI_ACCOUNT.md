# 👥 Multi-Account Setup (4 X Accounts)

Control 4 X accounts from 1 spreadsheet, 1 script run.

---

## 🎯 How It Works

```
ONE spreadsheet (account column E)
       ↓
Script groups tweets by account
       ↓
For each account (randomized order):
  1. Open isolated browser context
  2. Inject account-specific cookies
  3. Health check (verify login)
  4. Schedule all tweets sequentially
  5. Close context, cool-down 60-180s
       ↓
Final summary report
```

**Anti-detection features:**
- ✅ Each account = isolated browser context (no cookie leak)
- ✅ Sequential execution (not parallel — safer)
- ✅ Random account order (no pattern)
- ✅ Long cool-down (60-180s) between accounts
- ✅ Pre-flight health check per account

---

## 📋 Setup (10 minutes)

### Step 1: Create `accounts.json`

```bash
cp examples/accounts.example.json accounts.json
```

### Step 2: Extract Cookies from Each Account

For **each account** (repeat 4 times):

1. **Log out** of X in your browser
2. **Log in** with account #1
3. Press **F12** → Application → Cookies → x.com
4. Copy `auth_token` and `ct0`
5. **Log out** → log in with account #2, repeat

💡 **Pro tip:** Use a separate Chrome profile per account so you don't have to log in and out repeatedly.

### Step 3: Fill in `accounts.json`

```json
{
  "main": {
    "auth_token": "abc123...",
    "ct0": "xyz789...",
    "label": "Main Brand Account"
  },
  "alt1": {
    "auth_token": "...",
    "ct0": "...",
    "label": "Marketing"
  },
  "alt2": {
    "auth_token": "...",
    "ct0": "...",
    "label": "Personal"
  },
  "alt3": {
    "auth_token": "...",
    "ct0": "...",
    "label": "Support"
  }
}
```

**Rules:**
- **Key** (`"main"`, `"alt1"`, etc.) = identifier used in the spreadsheet
- **label** = display name shown in logs
- You can have more or fewer than 4 accounts

### Step 4: Update the Spreadsheet

Add **column E = account** in Google Sheets:

| A (content) | B (date) | C (time) | D (image) | **E (account)** |
|-------------|----------|----------|-----------|-----------------|
| Tweet 1 main | 2026-05-20 | 09:00 | | **main** |
| Tweet 1 marketing | 2026-05-20 | 09:30 | photo.jpg | **alt1** |
| Tweet 2 main | 2026-05-20 | 10:00 | | **main** |
| Tweet 1 personal | 2026-05-20 | 10:30 | | **alt2** |

**Column E rules:**
- Write the account name (must match the key in `accounts.json`)
- If empty → defaults to the first account
- Not case-sensitive (`Main`, `MAIN`, `main` are all the same)

### Step 5: Update the Apps Script

Your old Apps Script only reads columns A:D. Update it:

1. Open the Apps Script editor
2. Replace the code with the contents of `apps-script/with-images.gs` (already includes the account column)
3. Save → Deploy → Manage deployments → New version → Deploy

### Step 6: Run!

```bash
npm start
```

---

## 📊 Output When Running

```
🔐 Multi-account mode: 4 account(s) loaded
   - main: Main Brand Account
   - alt1: Marketing
   - alt2: Personal
   - alt3: Support

📊 Fetched 12 tweet(s) from sheet

📋 Distribution:
   - Main Brand Account: 5 tweet(s)
   - Marketing: 3 tweet(s)
   - Personal: 2 tweet(s)
   - Support: 2 tweet(s)

════════════════════════════════════════════════════════════
👤 [1/4] Account: Personal (2 tweet(s))
════════════════════════════════════════════════════════════
  🔍 Verifying cookies for 'Personal'...
  ✓ Logged in successfully

  [1/2] Tweet 1 personal...
  → Scheduling for May 20, 2026 10:30 AM
    ✓ scheduled
    💤 Cooling down 4s...
  [2/2] Tweet 2 personal...
    ✓ scheduled

💤 Switching accounts: cooling down for 2m 15s...

════════════════════════════════════════════════════════════
👤 [2/4] Account: Marketing (3 tweet(s))
════════════════════════════════════════════════════════════
  ...

════════════════════════════════════════════════════════════
✨ DONE in 18m 42s
════════════════════════════════════════════════════════════
  ✓ Main Brand Account: 5 scheduled, 0 failed
  ✓ Marketing: 3 scheduled, 0 failed
  ✓ Personal: 2 scheduled, 0 failed
  ✓ Support: 2 scheduled, 0 failed

  Total: 12 scheduled, 0 failed
```

---

## 🛡️ Anti-Detection Features

### 1. **Isolated Browser Contexts**
Each account uses a separate context. Cookies do not leak between accounts.

### 2. **Sequential, Not Parallel**
Does not run 4 browsers simultaneously (a red flag bot pattern).

### 3. **Random Account Order**
Each run shuffles the account order, so it's never the same sequence.

### 4. **Long Cool-down Between Accounts**
**60-180 seconds** between accounts — long enough to appear natural.

### 5. **Pre-flight Health Check**
Before scheduling, the script verifies that cookies are valid. Saves time if any account has expired cookies.

### 6. **Per-tweet Cool-down**
3-6 seconds between tweets within the same account.

---

## ⏱️ Estimated Time

| Tweets | Per Account | Total (4 accounts) |
|--------|-------------|---------------------|
| 1-3 | ~1-2 min | ~10-15 min |
| 5 | ~3 min | ~15-20 min |
| 10 | ~5 min | ~25-30 min |

**Note:** Most of the time is the cool-down between accounts (60-180s × 3 transitions).

---

## 🆘 Troubleshooting

### ❌ "Auth check failed for 'main'"
Cookies expired (typically every 7 days). Re-extract cookies and update `accounts.json`.

### ❌ "Tweet specifies unknown account 'altX'"
The account key in the spreadsheet doesn't match `accounts.json`. Check the spelling.

### ❌ Some accounts scheduled, some failed
Check the per-account stats at the end. Look for `failure-{account}-{i}-*.png` screenshots.

### ❌ "No valid accounts in accounts.json"
- Check that the JSON is valid (use jsonlint.com)
- Make sure `auth_token` and `ct0` are not still placeholder values

---

## 💡 Tips

### Back Up `accounts.json`
Never commit this to git — it's already in `.gitignore`. Keep an encrypted backup.

### Re-extract Cookies Regularly
Cookies expire approximately every 7 days. Set a reminder.

### Test One Account First
Before scheduling many tweets, test 1-2 tweets per account to verify cookies are fresh.

### Cross-posting the Same Tweet
Want to post the same tweet across multiple accounts? Duplicate the row with different account values:

| content | date | time | account |
|---------|------|------|---------|
| Big announcement! | 2026-05-20 | 09:00 | main |
| Big announcement! | 2026-05-20 | 09:15 | alt1 |
| Big announcement! | 2026-05-20 | 09:30 | alt2 |

⚠️ **Be careful with cross-posting** — X may detect duplicate content. Vary the wording slightly.

### Dedicated Account for Headless Mode
Accounts that are frequently automated can run headless (`HEADLESS=true`).
Run your main account in non-headless mode for visual verification.

---

## 📁 Key Files

```
accounts.json                        ← Your credentials (gitignored)
examples/accounts.example.json       ← Template
apps-script/with-images.gs           ← Updated to include account column
schedule-tweets.js                   ← Multi-account orchestrator
docs/MULTI_ACCOUNT.md                ← This file
```

---

## 🎯 Quick Reference

```bash
# 1. Setup accounts (one time)
cp examples/accounts.example.json accounts.json
# Edit accounts.json with cookies for each account

# 2. Update spreadsheet
# Add column E "account" with values: main, alt1, alt2, alt3

# 3. Update & redeploy Apps Script
# (use code from apps-script/with-images.gs)

# 4. Run
npm start
```

Happy multi-account tweeting! 🐦🐦🐦🐦
