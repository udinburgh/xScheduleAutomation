#!/bin/bash

# X Tweet Scheduler Setup Script
# ==============================

set -e

echo "🚀 X Tweet Scheduler - Setup"
echo "============================\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js first."
  echo "   → https://nodejs.org/"
  exit 1
fi

echo "✓ Node.js $(node --version)"

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo "\n📦 Installing dependencies..."
  npm install
else
  echo "\n✓ Dependencies already installed"
fi

# Create .env.local from .env.example if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo "\n⚙️  Creating .env.local from template..."
  cp .env.example .env.local
  echo "✓ Created .env.local"
  echo ""
  echo "📝 Next steps:"
  echo "   1. Open .env.local"
  echo "   2. Replace X_AUTH_TOKEN with your real token"
  echo "   3. Replace X_CT0 with your real ct0"
  echo "   4. Update SHEET_API_URL with your endpoint"
  echo ""
else
  echo "\n✓ .env.local already exists"
fi

# Quick test
echo "\n🧪 Quick test:"
if [ -f ".env.local" ]; then
  echo "✓ .env.local found"
  source .env.local 2>/dev/null || true

  if [ -z "$X_AUTH_TOKEN" ] || [ "$X_AUTH_TOKEN" = "demo_token_replace_me" ]; then
    echo "⚠️  X_AUTH_TOKEN not set or still has demo value"
    echo "   → Update .env.local with your real credentials"
  else
    echo "✓ X_AUTH_TOKEN configured"
  fi

  if [ -z "$X_CT0" ] || [ "$X_CT0" = "demo_ct0_replace_me" ]; then
    echo "⚠️  X_CT0 not set or still has demo value"
  else
    echo "✓ X_CT0 configured"
  fi
else
  echo "❌ .env.local not found"
fi

echo "\n✨ Setup complete!"
echo ""
echo "Next commands:"
echo "   npm start           → Run scheduler (uses .env.local)"
echo "   npm run dev         → Run in non-headless mode (watch browser)"
echo "   npm test            → Start mock API server for testing"
echo ""
echo "For detailed instructions, see README.md"
echo ""
