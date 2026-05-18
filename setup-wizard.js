#!/usr/bin/env node

/**
 * Interactive Setup Wizard
 * ========================
 * Guides users through configuration step-by-step
 *
 * USAGE:
 *   npm run setup-wizard
 *   atau
 *   node setup-wizard.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

async function main() {
  console.clear();
  log('cyan', '\n╔════════════════════════════════════════╗');
  log('cyan', '║  X Tweet Scheduler - Setup Wizard      ║');
  log('cyan', '╚════════════════════════════════════════╝\n');

  // Step 1: Check dependencies
  log('blue', '📦 Step 1: Check Dependencies');
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('red', '❌ package.json not found!');
    process.exit(1);
  }

  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    log('yellow', '⚠️  node_modules not found.');
    const installNow = await question(
      `${colors.yellow}Run npm install now? (y/n):${colors.reset} `,
    );
    if (installNow.toLowerCase() === 'y') {
      console.log('Installing...');
      require('child_process').execSync('npm install', { stdio: 'inherit' });
      log('green', '✓ Dependencies installed!\n');
    } else {
      log('yellow', 'Skipped. You can run "npm install" manually later.\n');
    }
  } else {
    log('green', '✓ Dependencies already installed\n');
  }

  // Step 2: X Credentials
  log('blue', '🔐 Step 2: X (Twitter) Credentials\n');

  log('yellow', 'You need auth_token and ct0 cookies from X.');
  log('yellow', 'Here\'s how to get them:\n');

  console.log(
    `  1. Open ${colors.cyan}https://x.com${colors.reset} in your browser`,
  );
  console.log(`  2. Login with your account`);
  console.log(`  3. Press ${colors.bold}F12${colors.reset} (Open DevTools)`);
  console.log(`  4. Click ${colors.bold}Application${colors.reset} tab`);
  console.log(`  5. Go to ${colors.bold}Cookies${colors.reset} → ${colors.bold}x.com${colors.reset}`);
  console.log(`  6. Find ${colors.cyan}auth_token${colors.reset} and ${colors.cyan}ct0${colors.reset}`);
  console.log(`  7. Copy their ${colors.bold}values${colors.reset} (not names)\n`);

  await question('Press Enter when you have both cookies ready...');

  const authToken = await question(
    `${colors.cyan}Paste auth_token:${colors.reset} `,
  );
  const ct0 = await question(`${colors.cyan}Paste ct0:${colors.reset} `,);

  if (!authToken || !ct0) {
    log('red', '❌ Both values are required!');
    process.exit(1);
  }

  log('green', '✓ Credentials saved\n');

  // Step 3: Tweet API URL
  log('blue', '📋 Step 3: Configure Tweet Source\n');

  console.log('Where will your tweets come from?');
  console.log(`  ${colors.bold}1${colors.reset} - Mock API (for testing - included)`);
  console.log(
    `  ${colors.bold}2${colors.reset} - Google Sheets (via Apps Script)`,
  );
  console.log(`  ${colors.bold}3${colors.reset} - Custom REST endpoint\n`);

  const choice = await question('Choose (1-3): ');

  let sheetUrl = '';
  if (choice === '1') {
    sheetUrl = 'http://localhost:3000/api/tweets';
    log('green', `✓ Using mock API: ${sheetUrl}\n`);
    log(
      'yellow',
      'Remember: Start it with "npm test" before running npm start\n',
    );
  } else if (choice === '2') {
    log('yellow', '\nGoogle Sheets Setup:');
    console.log(
      '  1. Create Apps Script in your Google Sheet (Tools → <> Script editor)',
    );
    console.log('  2. Replace code with this:');
    console.log(
      `${colors.cyan}\n    function doGet() {
      const sheet = SpreadsheetApp.getActiveSheet();
      const data = sheet.getRange("A2:C").getValues();

      const tweets = data.map(row => ({
        content: row[0],
        date: Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        time: Utilities.formatDate(new Date(row[2]), Session.getScriptTimeZone(), "HH:mm")
      }));

      return ContentService.createTextOutput(JSON.stringify(tweets))
        .setMimeType(ContentService.MimeType.JSON);
    }${colors.reset}\n`,
    );
    console.log(
      `  3. Deploy → New deployment → Type: Web app → Execute as: You → Access: Anyone`,
    );
    console.log('  4. Copy deployment URL\n');

    sheetUrl = await question(`${colors.cyan}Paste your Apps Script URL:${colors.reset} `);

    if (!sheetUrl) {
      log('yellow', 'Skipped. You can update this later in .env.local\n');
      sheetUrl = 'https://your-apps-script-url-here';
    } else {
      log('green', `✓ URL saved\n`);
    }
  } else if (choice === '3') {
    sheetUrl = await question(
      `${colors.cyan}Enter your REST endpoint URL:${colors.reset} `,
    );
    if (!sheetUrl) {
      sheetUrl = 'https://your-api-endpoint.com/tweets';
    }
    log('green', `✓ URL: ${sheetUrl}\n`);
  } else {
    log('yellow', 'Using mock API by default\n');
    sheetUrl = 'http://localhost:3000/api/tweets';
  }

  // Step 4: Save configuration
  log('blue', '💾 Step 4: Save Configuration\n');

  const envPath = path.join(__dirname, '.env.local');
  const envContent = `# X Authentication
X_AUTH_TOKEN=${authToken}
X_CT0=${ct0}

# Tweet Source
SHEET_API_URL=${sheetUrl}

# Browser Settings
HEADLESS=false
`;

  fs.writeFileSync(envPath, envContent);
  log('green', `✓ Saved to .env.local\n`);

  // Step 5: Test the setup
  log('blue', '🧪 Step 5: Ready to Run!\n');

  console.log(`${colors.bold}Next steps:${colors.reset}\n`);

  if (sheetUrl.includes('localhost')) {
    console.log(`  ${colors.bold}Terminal 1:${colors.reset} Start mock API`);
    console.log(`    $ npm test\n`);
    console.log(`  ${colors.bold}Terminal 2:${colors.reset} Run scheduler`);
    console.log(`    $ npm start\n`);
  } else {
    console.log(`  ${colors.bold}Run scheduler:${colors.reset}`);
    console.log(`    $ npm start\n`);
  }

  const testNow = await question(
    `${colors.yellow}Run scheduler now? (y/n):${colors.reset} `,
  );

  rl.close();

  if (testNow.toLowerCase() === 'y') {
    console.log('\n');
    require('child_process').execSync('npm start', { stdio: 'inherit' });
  } else {
    log('green', '✨ Setup complete! Run "npm start" whenever ready.\n');
  }
}

main().catch((err) => {
  log('red', `\n❌ Error: ${err.message}\n`);
  rl.close();
  process.exit(1);
});
