# 👥 Multi-Account Setup (4 Akun X)

Control 4 X accounts dari 1 spreadsheet, 1 script run.

---

## 🎯 Cara Kerja

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

## 📋 Setup (10 menit)

### Step 1: Buat `accounts.json`

```bash
cp examples/accounts.example.json accounts.json
```

### Step 2: Extract Cookies dari Setiap Akun

Untuk **setiap akun** (lakukan 4x):

1. **Logout** dari X di browser
2. **Login** dengan akun #1
3. Tekan **F12** → Application → Cookies → x.com
4. Copy `auth_token` dan `ct0`
5. **Logout** → login dengan akun #2, ulangi

💡 **Pro tip:** Pakai Chrome profile berbeda per akun, supaya tidak perlu logout-login.

### Step 3: Isi `accounts.json`

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

**Aturan:**
- **Key** (`"main"`, `"alt1"`, dst) = identifier untuk dipakai di spreadsheet
- **label** = nama display untuk logs
- Boleh lebih/kurang dari 4 akun

### Step 4: Update Spreadsheet

Tambah **kolom E = account** di Google Sheets:

| A (content) | B (date) | C (time) | D (image) | **E (account)** |
|-------------|----------|----------|-----------|-----------------|
| Tweet 1 main | 2026-05-20 | 09:00 | | **main** |
| Tweet 1 marketing | 2026-05-20 | 09:30 | photo.jpg | **alt1** |
| Tweet 2 main | 2026-05-20 | 10:00 | | **main** |
| Tweet 1 personal | 2026-05-20 | 10:30 | | **alt2** |

**Aturan kolom E:**
- Isi nama account (sesuai key di `accounts.json`)
- Kalau kosong → otomatis pakai akun pertama
- Tidak case-sensitive (`Main`, `MAIN`, `main` sama aja)

### Step 5: Update Apps Script

Apps Script kamu yang lama hanya baca A:D. Update:

1. Buka Apps Script editor
2. Replace dengan code dari `apps-script/with-images.gs` (sudah include account)
3. Save → Deploy → Manage deployments → New version → Deploy

### Step 6: Run!

```bash
npm start
```

---

## 📊 Output Saat Run

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
Setiap akun pakai context terpisah. Cookies tidak bocor antar akun.

### 2. **Sequential, Bukan Paralel**
Tidak run 4 browser sekaligus (red flag bot pattern).

### 3. **Random Account Order**
Tiap run, urutan akun di-shuffle. Jadi tidak selalu main duluan.

### 4. **Long Cool-down Antar Akun**
**60-180 detik** antar akun. Cukup lama agar terlihat natural.

### 5. **Pre-flight Health Check**
Sebelum scheduling, script cek cookies valid. Hemat waktu kalau ada akun yang expired.

### 6. **Per-tweet Cool-down**
3-6 detik antar tweet dalam akun yang sama.

---

## ⏱️ Estimasi Waktu

| Tweets | Per Akun | Total (4 akun) |
|--------|----------|----------------|
| 1-3 | ~1-2 min | ~10-15 min |
| 5 | ~3 min | ~15-20 min |
| 10 | ~5 min | ~25-30 min |

**Catatan:** Sebagian besar waktu adalah cool-down antar akun (60-180s × 3 transisi).

---

## 🆘 Troubleshooting

### ❌ "Auth check failed for 'main'"
Cookies expired (biasanya tiap 7 hari). Re-extract & update `accounts.json`.

### ❌ "Tweet specifies unknown account 'altX'"
Account key di spreadsheet tidak match `accounts.json`. Cek spelling.

### ❌ Beberapa akun ke-schedule, sebagian gagal
Lihat per-akun stats di akhir. Cek screenshot `failure-{account}-{i}-*.png`.

### ❌ "No valid accounts in accounts.json"
- Cek format JSON valid (pakai jsonlint.com)
- Pastikan `auth_token` dan `ct0` tidak placeholder

---

## 💡 Tips

### Backup `accounts.json`
Jangan commit ke git! Sudah di `.gitignore`. Simpan backup encrypted.

### Re-extract Cookies Berkala
Setiap ~7 hari cookies expired. Set reminder.

### Test Per-Akun Dulu
Sebelum scheduling banyak, test 1-2 tweet per akun untuk verify cookies fresh.

### Mixed Account Tweets
Bisa schedule cross-post: tweet sama di multiple akun? Duplicate row dengan account beda.

| content | date | time | account |
|---------|------|------|---------|
| Big announcement! | 2026-05-20 | 09:00 | main |
| Big announcement! | 2026-05-20 | 09:15 | alt1 |
| Big announcement! | 2026-05-20 | 09:30 | alt2 |

⚠️ **Hati-hati cross-posting** - X bisa detect duplicate content. Variasikan wording sedikit.

### Akun Khusus untuk Mode Headless
Akun yang sering di-automate bisa run headless (`HEADLESS=true`).
Akun utama jalankan non-headless untuk visual verification.

---

## 📁 File Penting

```
accounts.json              ← Your credentials (gitignored)
examples/accounts.example.json      ← Template
apps-script/with-images.gs ← Updated to include account column
schedule-tweets.js         ← Multi-account orchestrator
MULTI_ACCOUNT_GUIDE.md     ← This file
```

---

## 🎯 Quick Reference

```bash
# 1. Setup accounts (one time)
cp examples/accounts.example.json accounts.json
# Edit accounts.json with 4 sets of cookies

# 2. Update spreadsheet
# Add column E "account" with values: main, alt1, alt2, alt3

# 3. Update & redeploy Apps Script
# (use code from apps-script/with-images.gs)

# 4. Run
npm start
```

Happy multi-account tweeting! 🐦🐦🐦🐦
