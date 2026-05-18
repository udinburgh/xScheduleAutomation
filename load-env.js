/**
 * Load .env.local or .env automatically
 * Used by main scripts to load environment variables
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envLocal = path.join(__dirname, '.env.local');
  const envDefault = path.join(__dirname, '.env');
  const envPath = fs.existsSync(envLocal) ? envLocal : envDefault;

  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️  No .env file found. Using defaults.`);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv();
