/**
 * X (Twitter) Tweet Scheduler via Cookie Injection
 * ------------------------------------------------
 * Bypasses the official API by driving the web UI with Playwright.
 * Supports MULTIPLE accounts via accounts.json.
 *
 * ENV VARS REQUIRED:
 *   SHEET_API_URL  - REST endpoint returning tweets with optional 'account' field
 *   HEADLESS       - "true" / "false" (default false so you can watch + intervene)
 *
 * MULTI-ACCOUNT:
 *   Create accounts.json (see accounts.example.json) with cookies for each account.
 *   Each tweet row in your sheet can have an 'account' field (column E) matching
 *   a key in accounts.json. If empty, defaults to the first account.
 *
 * SINGLE-ACCOUNT (legacy):
 *   If accounts.json doesn't exist, falls back to X_AUTH_TOKEN + X_CT0 env vars.
 *
 * USAGE:
 *   npm install
 *   npm start
 */

// Load .env.local automatically
require("./load-env");

const fs = require("fs");
const path = require("path");
const os = require("os");
const { chromium } = require("playwright");
const fetch = require("node-fetch");

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------
const CONFIG = {
  headless: process.env.HEADLESS === "true",
  slowMo: 50, // global pacing knob - balanced for speed + anti-bot
  sheetApiUrl: process.env.SHEET_API_URL || "https://example.com/api/tweets",
  authToken: process.env.X_AUTH_TOKEN,
  ct0: process.env.X_CT0,
  viewport: { width: 1366, height: 900 },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

  // Human-like delay configuration - tuned for ~30s per tweet (10 tweets / 5 min)
  delays: {
    betweenActions: [30, 70], // default pause between any actions
    betweenFields: [20, 50], // pause between filling form fields
    beforeTyping: [15, 35], // pause before starting to type
    perCharacter: [2, 6], // delay per character typed
    afterPageLoad: [80, 150], // pause after page navigation
    afterClick: [30, 70], // pause after clicking a button
    betweenTweets: [150, 300], // cool-down between tweets (same account)
    betweenAccounts: [8000, 15000], // cool-down between accounts (15-30s)
    thinking: [50, 120], // occasional "thinking" pause
  },

  // Probability of occasional human-like behaviors (0-1)
  probabilities: {
    thinking: 0.03, // 5% chance of pause before a click
    midTyping: 0.01, // 2% chance of pause mid-typing
  },
};

// ----------------------------------------------------------------------------
// Human-like timing helpers
// ----------------------------------------------------------------------------
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// humanPause: default uses betweenActions delay range
const humanPause = (min, max) => {
  if (min === undefined) {
    const [a, b] = CONFIG.delays.betweenActions;
    return sleep(rand(a, b));
  }
  return sleep(rand(min, max));
};

// Occasional "thinking" pause — like real humans pausing to think before clicking
const maybeThink = async () => {
  if (Math.random() < CONFIG.probabilities.thinking) {
    const [a, b] = CONFIG.delays.thinking;
    await sleep(rand(a, b));
  }
};

async function humanType(locator, text) {
  await locator.click();
  const [bMin, bMax] = CONFIG.delays.beforeTyping;
  await sleep(rand(bMin, bMax));

  const page = locator.page();
  const isMac = process.platform === "darwin";

  // Use clipboard paste to avoid breaking multi-byte characters (e.g. emoji)
  await page.evaluate((content) => {
    navigator.clipboard.writeText(content);
  }, text);

  await page.keyboard.press(isMac ? "Meta+V" : "Control+V");
}

// ----------------------------------------------------------------------------
// 1. Data Fetcher
// ----------------------------------------------------------------------------
async function fetchScheduledTweets(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok)
    throw new Error(`Sheet fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    // Apps Script returned an error object instead of tweet array
    const detail =
      data && data.error
        ? `\n  Apps Script error: ${data.error}${data.stack ? "\n  Stack: " + data.stack : ""}${data.hint ? "\n  Hint: " + data.hint : ""}`
        : `\n  Raw response: ${JSON.stringify(data).slice(0, 500)}`;
    throw new Error(`Sheet payload must be an array.${detail}`);
  }

  // Normalize keys — accept loose casing from Sheets-as-API services.
  // image_url is optional; supports single URL or comma-separated list (max 4 per X rules).
  // account is optional; identifies which X account to post from (defaults to '').
  return data.map((row, i) => {
    const content = row.content || row.Content || row.tweet || row.Tweet;
    const date = row.date || row.Date;
    const time = row.time || row.Time;
    const imageField =
      row.image_url ||
      row.imageUrl ||
      row.image ||
      row.Image ||
      row.media ||
      row.Media ||
      row.media_url ||
      "";
    const account = row.account || row.Account || row.acc || row.Acc || "";

    if (!content || !date || !time) {
      throw new Error(
        `Row ${i} missing required fields: ${JSON.stringify(row)}`,
      );
    }

    // Parse image URLs: can be a single URL or comma-separated list.
    const imageUrls = imageField
      ? String(imageField)
          .split(",")
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, 4) // X allows max 4 images
      : [];

    return {
      content: String(content),
      date: String(date),
      time: String(time),
      imageUrls,
      account: String(account).trim().toLowerCase(),
    };
  });
}

// ----------------------------------------------------------------------------
// Account Loader
//    Reads accounts.json (multi-account) or falls back to env vars (single).
// ----------------------------------------------------------------------------
function loadAccounts() {
  const accountsPath = path.join(__dirname, "accounts.json");

  // Multi-account mode: accounts.json exists
  if (fs.existsSync(accountsPath)) {
    const raw = fs.readFileSync(accountsPath, "utf-8");
    let accounts;
    try {
      accounts = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Invalid JSON in accounts.json: ${e.message}`);
    }

    // Validate each account has required fields
    const validated = {};
    for (const [key, acc] of Object.entries(accounts)) {
      if (!acc.auth_token || !acc.ct0) {
        console.warn(
          `⚠️  Account '${key}' missing auth_token or ct0 — skipping`,
        );
        continue;
      }
      if (acc.auth_token.startsWith("paste_") || acc.ct0.startsWith("paste_")) {
        console.warn(`⚠️  Account '${key}' has placeholder values — skipping`);
        continue;
      }
      validated[key.toLowerCase()] = {
        auth_token: acc.auth_token,
        ct0: acc.ct0,
        label: acc.label || key,
      };
    }

    if (Object.keys(validated).length === 0) {
      throw new Error("No valid accounts in accounts.json");
    }

    return { mode: "multi", accounts: validated };
  }

  // Single-account fallback: env vars
  if (CONFIG.authToken && CONFIG.ct0) {
    return {
      mode: "single",
      accounts: {
        default: {
          auth_token: CONFIG.authToken,
          ct0: CONFIG.ct0,
          label: "Default Account",
        },
      },
    };
  }

  throw new Error(
    "No accounts configured. Either:\n" +
      "  1. Create accounts.json (copy accounts.example.json), or\n" +
      "  2. Set X_AUTH_TOKEN and X_CT0 in .env.local",
  );
}

/**
 * Group tweets by their account field.
 * If a tweet has no account, assigns it to the first available account.
 * Returns: { accountKey: [tweets...] }
 */
function groupTweetsByAccount(tweets, accounts) {
  const accountKeys = Object.keys(accounts);
  const defaultKey = accountKeys[0]; // First account is the default
  const grouped = {};

  for (const tweet of tweets) {
    let key = tweet.account || defaultKey;

    // If specified account doesn't exist, warn and use default
    if (!accounts[key]) {
      console.warn(
        `⚠️  Tweet specifies unknown account '${tweet.account}', using '${defaultKey}': ${tweet.content.slice(0, 40)}...`,
      );
      key = defaultKey;
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tweet);
  }

  return grouped;
}

/**
 * Shuffle an array (Fisher-Yates). Used to randomize account order
 * so we don't always post from the same account first (anti-pattern).
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ----------------------------------------------------------------------------
// Image Downloader
//    Downloads images from URLs to a temp directory for upload.
//    Supports HTTP(S) URLs and Google Drive sharing links.
// ----------------------------------------------------------------------------
function normalizeGoogleDriveUrl(url) {
  // Convert Google Drive share links to direct download URLs.
  // "https://drive.google.com/file/d/FILE_ID/view" → direct download
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  // Already a direct link or non-Drive URL — return as-is.
  return url;
}

async function downloadImage(url, index) {
  const normalizedUrl = normalizeGoogleDriveUrl(url);
  const res = await fetch(normalizedUrl, {
    redirect: "follow",
    headers: { "User-Agent": CONFIG.userAgent },
  });

  if (!res.ok) {
    throw new Error(
      `Failed to download image: ${res.status} ${res.statusText} (${url})`,
    );
  }

  // Detect extension from Content-Type or URL.
  const contentType = res.headers.get("content-type") || "";
  let ext = "jpg";
  if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("gif")) ext = "gif";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("mp4")) ext = "mp4";
  else {
    const urlExt = path
      .extname(new URL(normalizedUrl).pathname)
      .slice(1)
      .toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "mp4"].includes(urlExt))
      ext = urlExt;
  }

  const buffer = await res.buffer();
  const tempPath = path.join(
    os.tmpdir(),
    `x-tweet-media-${Date.now()}-${index}.${ext}`,
  );
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function downloadAllImages(urls) {
  if (!urls || urls.length === 0) return [];
  return Promise.all(urls.map((url, i) => downloadImage(url, i)));
}

function cleanupTempFiles(paths) {
  for (const p of paths) {
    try {
      fs.unlinkSync(p);
    } catch (_) {
      // ignore cleanup errors
    }
  }
}

// ----------------------------------------------------------------------------
// 2. Time Transformer
//    X's schedule UI uses: Month name, Day, Year, Hour (1-12), Minute, AM/PM.
// ----------------------------------------------------------------------------
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function transformDateTime(dateStr, timeStr) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" (24h)
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh24, mm] = timeStr.split(":").map(Number);

  if ([y, m, d, hh24, mm].some(Number.isNaN)) {
    throw new Error(`Invalid date/time: ${dateStr} ${timeStr}`);
  }

  const meridiem = hh24 >= 12 ? "PM" : "AM";
  let hh12 = hh24 % 12;
  if (hh12 === 0) hh12 = 12;

  return {
    year: String(y),
    monthName: MONTHS[m - 1],
    monthNumber: String(m), // X's <select> value is the 1-based month number
    day: String(d),
    hour12: String(hh12),
    minute: String(mm).padStart(2, "0"),
    meridiem, // "AM" | "PM"
  };
}

// ----------------------------------------------------------------------------
// 3. Playwright Worker
// ----------------------------------------------------------------------------
async function buildContext(browser, account) {
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    userAgent: CONFIG.userAgent,
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
  });

  // Cookie injection for THIS specific account.
  await context.addCookies([
    {
      name: "auth_token",
      value: account.auth_token,
      domain: ".x.com",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
    {
      name: "ct0",
      value: account.ct0,
      domain: ".x.com",
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
    },
  ]);

  return context;
}

/**
 * Pre-flight health check: verify the account's cookies are valid.
 * Opens x.com/home and checks for the composer button.
 * Returns the handle of the logged-in user if valid, throws if not.
 */
async function healthCheck(page, accountLabel) {
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded" });
  try {
    await page
      .getByTestId("SideNav_NewTweet_Button")
      .waitFor({ state: "visible", timeout: 12000 });
    return true;
  } catch (err) {
    throw new Error(
      `Auth check failed for '${accountLabel}'. Cookies may be expired or invalid.`,
    );
  }
}

/**
 * Open the modal composer and return scoped locators.
 *
 * X.com has TWO tweet composers on the home page:
 *  1. Inline composer in the primary column ("What is happening?!")
 *  2. Modal composer opened via the "Post" button in the sidebar
 *
 * Only the modal composer has the schedule option, so we explicitly target
 * the modal dialog via `[role="dialog"]` to avoid strict-mode violations
 * from the duplicate `tweetTextarea_0` testid.
 */
async function openComposer(page) {
  await page.goto("https://x.com/home", { waitUntil: "domcontentloaded" });

  // Wait after page load - simulating a human reading the feed
  const [plMin, plMax] = CONFIG.delays.afterPageLoad;
  await sleep(rand(plMin, plMax));

  // Sanity: confirm we're logged in (composer link only renders for auth'd users).
  const composerLink = page.getByTestId("SideNav_NewTweet_Button");
  await composerLink.waitFor({ state: "visible", timeout: 15000 });
  await humanPause();
  await maybeThink();
  await composerLink.click();

  // Pause after click - waiting for modal to open
  const [acMin, acMax] = CONFIG.delays.afterClick;
  await sleep(rand(acMin, acMax));

  // Wait for the modal dialog to appear — this is our scope for everything below.
  const dialog = page.locator('[role="dialog"]').last();
  await dialog.waitFor({ state: "visible", timeout: 10000 });

  // Get the textarea inside the dialog (scoped, so no strict-mode violation).
  const textarea = dialog.getByTestId("tweetTextarea_0");
  await textarea.waitFor({ state: "visible", timeout: 10000 });

  return { dialog, textarea };
}

/**
 * X schedule form field map.
 *
 * Empirically determined matching strategy per field:
 *  - Month/Day/Year/Hour use numeric option values
 *  - Minute uses zero-padded labels ("00", "05", ..., "55")
 *  - AM/PM uses "AM"/"PM" labels (values are usually "0"/"1")
 *
 * Defining strategy upfront avoids the value-then-fallback double-attempt.
 */
const SCHEDULE_FIELDS = [
  {
    testid: "ScheduleForm_Month",
    by: "value",
    key: "monthNumber",
    name: "Month",
  },
  { testid: "ScheduleForm_Day", by: "value", key: "day", name: "Day" },
  { testid: "ScheduleForm_Year", by: "value", key: "year", name: "Year" },
  { testid: "ScheduleForm_Hour", by: "value", key: "hour12", name: "Hour" },
  { testid: "ScheduleForm_Minute", by: "label", key: "minute", name: "Minute" },
  { testid: "ScheduleForm_AMPM", by: "label", key: "meridiem", name: "AM/PM" },
];

async function setSchedule(dialog, parts) {
  const page = dialog.page();

  // Open the schedule popover from within the dialog scope.
  const scheduleBtn = dialog.getByTestId("scheduleOption");
  await scheduleBtn.waitFor({ state: "visible", timeout: 10000 });
  await humanPause();
  await maybeThink();
  // force: true bypasses pointer-event interception by transient overlay divs
  // (Twitter's modal transition layer sometimes intercepts clicks mid-animation)
  await scheduleBtn.click({ force: true });

  // Wait after click - schedule form needs to render
  const [acMin, acMax] = CONFIG.delays.afterClick;
  await sleep(rand(acMin, acMax));

  // Wait for the schedule form's first <select> to render inside the dialog.
  const firstSelect = dialog.locator("select").first();
  await firstSelect.waitFor({ state: "visible", timeout: 10000 });

  // Resolve all 6 select locators in parallel before interacting.
  // Falls back to positional <select> if a testid isn't found.
  const allSelects = dialog.locator("select");
  const locators = await Promise.all(
    SCHEDULE_FIELDS.map(async (f, i) => {
      const byTestId = dialog.getByTestId(f.testid);
      return (await byTestId.count()) > 0
        ? byTestId.first()
        : allSelects.nth(i);
    }),
  );

  // Apply each field sequentially with human-like pauses.
  for (let i = 0; i < SCHEDULE_FIELDS.length; i++) {
    const f = SCHEDULE_FIELDS[i];
    const value = parts[f.key];
    const [fMin, fMax] = CONFIG.delays.betweenFields;
    await sleep(rand(fMin, fMax));
    await maybeThink(); // Occasional "checking my notes" pause

    // AM/PM needs special handling — labels can vary across locales/UI versions.
    // Strategy: enumerate options, find case-insensitive match, select by value.
    if (f.key === "meridiem") {
      const optionValue = await locators[i].evaluate((sel, target) => {
        for (const opt of sel.options) {
          const t = (opt.textContent || opt.label || "").trim().toUpperCase();
          if (t === target.toUpperCase()) return opt.value;
        }
        // Fallback: AM is first (index 0), PM is second (index 1)
        return target.toUpperCase() === "PM"
          ? sel.options[1]?.value
          : sel.options[0]?.value;
      }, value);
      await locators[i].selectOption(optionValue);

      // Verify the selection actually took effect
      const selectedLabel = await locators[i].evaluate(
        (sel) => sel.options[sel.selectedIndex]?.textContent?.trim() || "",
      );
      if (selectedLabel.toUpperCase() !== value.toUpperCase()) {
        console.log(
          `  ⚠️  AM/PM mismatch — wanted ${value}, got "${selectedLabel}". Retrying by index...`,
        );
        // Final fallback: index-based (AM=0, PM=1)
        const idx = value.toUpperCase() === "PM" ? 1 : 0;
        await locators[i].selectOption({ index: idx });
      }
    } else {
      await locators[i].selectOption({ [f.by]: value });
    }

    // Verify what actually got selected (catches silent failures)
    const actual = await locators[i].evaluate((sel) => ({
      value: sel.value,
      label: sel.options[sel.selectedIndex]?.textContent?.trim() || "",
    }));
    const matches = f.by === "value"
      ? actual.value === value
      : actual.label.toUpperCase() === value.toUpperCase();
    const status = matches ? "✓" : "✗";
    const detail = matches
      ? value
      : `wanted "${value}" but got value="${actual.value}" label="${actual.label}"`;
    console.log(`  ${status} ${f.name.padEnd(7)} → ${detail}`);
  }

  // Quick review pause before confirming
  await humanPause(300, 700);

  // Confirm the schedule. Strict ^confirm$ match avoids "Confirm changes" etc.
  const confirm = page.getByRole("button", { name: /^confirm$/i }).first();
  await confirm.waitFor({ state: "visible", timeout: 5000 });
  await confirm.click();
}

/**
 * Attach images to the composer.
 *
 * X's composer has a hidden <input type="file"> labeled with testid
 * "fileInput". We use setInputFiles() to bypass the OS file picker.
 */
async function attachMedia(dialog, filePaths) {
  if (!filePaths || filePaths.length === 0) return;

  console.log(`  📎 Uploading ${filePaths.length} image(s)...`);

  // The file input is hidden inside the dialog.
  const fileInput = dialog.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePaths);

  // Wait for upload to complete — look for the media preview to appear.
  // X renders attachment previews with testid containing "attachments".
  try {
    await dialog
      .locator('[data-testid="attachments"], [aria-label*="Remove"]')
      .first()
      .waitFor({ state: "visible", timeout: 30000 });
    console.log(`  ✓ Images uploaded`);
  } catch (err) {
    console.log(
      `  ⚠️  Could not detect upload completion, continuing anyway...`,
    );
  }

  // Give X a moment to finalize the upload server-side.
  await humanPause(600, 1000);
}

async function scheduleOneTweet(page, tweet) {
  const parts = transformDateTime(tweet.date, tweet.time);
  console.log(
    `→ Scheduling for ${parts.monthName} ${parts.day}, ${parts.year} ` +
      `${parts.hour12}:${parts.minute} ${parts.meridiem}`,
  );

  // Download images first (before opening composer) so they're ready to attach.
  let imagePaths = [];
  if (tweet.imageUrls && tweet.imageUrls.length > 0) {
    console.log(`  ⬇️  Downloading ${tweet.imageUrls.length} image(s)...`);
    imagePaths = await downloadAllImages(tweet.imageUrls);
  }

  try {
    const { dialog, textarea } = await openComposer(page);

    // Brief pause as if reading the composer before typing
    await humanPause(250, 600);

    // Type the body with per-character jitter and natural pauses
    await humanType(textarea, tweet.content);

    // Pause after typing - "reviewing my tweet"
    await humanPause(300, 700);

    // Upload images if any
    if (imagePaths.length > 0) {
      await attachMedia(dialog, imagePaths);
    }

    await setSchedule(dialog, parts);
    await humanPause(150, 350);

    // After confirm, the composer's primary CTA changes from "Post" to "Schedule".
    const scheduleSubmit = dialog.getByTestId("tweetButton");
    await scheduleSubmit.waitFor({ state: "visible", timeout: 10000 });

    // Final review pause before submission
    await humanPause(250, 600);
    await scheduleSubmit.click();

    // Wait for the dialog to dismiss as the success signal.
    await dialog.waitFor({ state: "hidden", timeout: 15000 });
    console.log("  ✓ scheduled");
  } finally {
    // Clean up temp image files
    cleanupTempFiles(imagePaths);
  }
}

// ----------------------------------------------------------------------------
// Orchestrator
// ----------------------------------------------------------------------------

/**
 * Run all tweets for a single account in one isolated browser context.
 * Returns stats: { scheduled, failed }.
 */
async function runAccount(browser, accountKey, account, tweets) {
  const context = await buildContext(browser, account);
  const page = await context.newPage();

  const stats = { scheduled: 0, failed: 0, failures: [] };

  try {
    // Pre-flight health check
    console.log(`  🔍 Verifying cookies for '${account.label}'...`);
    await healthCheck(page, account.label);
    console.log(`  ✓ Logged in successfully`);

    for (const [i, tweet] of tweets.entries()) {
      console.log(
        `\n  [${i + 1}/${tweets.length}] ${tweet.content.slice(0, 60)}…`,
      );
      try {
        await scheduleOneTweet(page, tweet);
        stats.scheduled++;
      } catch (err) {
        stats.failed++;
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const screenshotPath = `failure-${accountKey}-${i}-${stamp}.png`;
        await page
          .screenshot({ path: screenshotPath, fullPage: true })
          .catch(() => {});
        console.error(
          `    ✗ failed: ${err.message}  (screenshot: ${screenshotPath})`,
        );
        stats.failures.push({
          index: i,
          content: tweet.content,
          error: err.message,
        });
        // Reload to a clean state before attempting the next row.
        await page.goto("https://x.com/home").catch(() => {});
      }

      // Cool-down between tweets within the same account
      if (i < tweets.length - 1) {
        const [cMin, cMax] = CONFIG.delays.betweenTweets;
        const cooldown = rand(cMin, cMax);
        console.log(`    💤 Cooling down ${Math.round(cooldown / 1000)}s...`);
        await sleep(cooldown);
      }
    }
  } finally {
    await context.close();
  }

  return stats;
}

async function main() {
  // Load and validate accounts (multi or single mode)
  const { mode, accounts } = loadAccounts();
  const accountKeys = Object.keys(accounts);
  console.log(
    `🔐 ${mode === "multi" ? "Multi" : "Single"}-account mode: ${accountKeys.length} account(s) loaded`,
  );
  for (const key of accountKeys) {
    console.log(`   - ${key}: ${accounts[key].label}`);
  }

  // Fetch all tweets from the sheet
  const allTweets = await fetchScheduledTweets(CONFIG.sheetApiUrl);
  console.log(`\n📊 Fetched ${allTweets.length} tweet(s) from sheet`);

  // Group tweets by their target account
  const grouped = groupTweetsByAccount(allTweets, accounts);
  console.log("\n📋 Distribution:");
  for (const key of accountKeys) {
    const count = (grouped[key] || []).length;
    if (count > 0)
      console.log(`   - ${accounts[key].label}: ${count} tweet(s)`);
  }

  // Randomize account processing order (avoid always starting with main)
  const orderedKeys = shuffle(
    accountKeys.filter((k) => grouped[k]?.length > 0),
  );

  if (orderedKeys.length === 0) {
    console.log("\n⚠️  No tweets to schedule.");
    return;
  }

  // Launch ONE browser, reuse across accounts (each with isolated context)
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
  });

  const allStats = {};
  const startedAt = Date.now();

  try {
    for (let i = 0; i < orderedKeys.length; i++) {
      const key = orderedKeys[i];
      const account = accounts[key];
      const tweets = grouped[key];

      console.log(`\n${"═".repeat(60)}`);
      console.log(
        `👤 [${i + 1}/${orderedKeys.length}] Account: ${account.label} (${tweets.length} tweet(s))`,
      );
      console.log("═".repeat(60));

      allStats[key] = await runAccount(browser, key, account, tweets);

      // Long cool-down between accounts (critical for anti-detection)
      if (i < orderedKeys.length - 1) {
        const [aMin, aMax] = CONFIG.delays.betweenAccounts;
        const cooldown = rand(aMin, aMax);
        const mins = Math.floor(cooldown / 60000);
        const secs = Math.round((cooldown % 60000) / 1000);
        console.log(
          `\n💤 Switching accounts: cooling down for ${mins}m ${secs}s...`,
        );
        await sleep(cooldown);
      }
    }
  } finally {
    await browser.close();
  }

  // Final summary
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n${"═".repeat(60)}`);
  console.log(`✨ DONE in ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
  console.log("═".repeat(60));
  let totalScheduled = 0;
  let totalFailed = 0;
  for (const key of orderedKeys) {
    const s = allStats[key];
    const icon = s.failed === 0 ? "✓" : "⚠️";
    console.log(
      `  ${icon} ${accounts[key].label}: ${s.scheduled} scheduled, ${s.failed} failed`,
    );
    totalScheduled += s.scheduled;
    totalFailed += s.failed;
  }
  console.log(`\n  Total: ${totalScheduled} scheduled, ${totalFailed} failed`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}

module.exports = {
  fetchScheduledTweets,
  transformDateTime,
  scheduleOneTweet,
  loadAccounts,
  groupTweetsByAccount,
};
