#!/bin/bash

# 🐦 X Tweet Scheduler - Easy Start
# ==================================

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  X Tweet Scheduler - Quick Start       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install: https://nodejs.org"
  exit 1
fi

echo "✓ Node.js $(node --version)"
echo ""

# Install if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --silent
  echo ""
fi

# Check .env.local
if [ ! -f ".env.local" ]; then
  echo "⚙️  First time setup needed!"
  echo ""
  echo "Choose an option:"
  echo "  1️⃣  Interactive Setup Wizard (recommended)"
  echo "  2️⃣  Web Dashboard (visual interface)"
  echo "  3️⃣  Manual setup (edit .env.local yourself)"
  echo ""
  read -p "Enter choice (1-3): " choice

  case $choice in
    1)
      echo ""
      node setup-wizard.js
      exit 0
      ;;
    2)
      echo ""
      echo "🌐 Opening dashboard..."
      echo "   Visit: http://localhost:4000"
      echo ""
      node dashboard.js &
      sleep 2
      if command -v open &> /dev/null; then
        open "http://localhost:4000"
      fi
      exit 0
      ;;
    3)
      echo ""
      echo "📝 Copy .env.example to .env.local and edit it:"
      cp .env.example .env.local
      echo "   nano .env.local"
      echo ""
      echo "Then run this script again."
      exit 0
      ;;
    *)
      echo "Running Interactive Setup..."
      node setup-wizard.js
      ;;
  esac
fi

# Show menu
echo "What do you want to do?"
echo ""
echo "  1️⃣  Run Scheduler (production)"
echo "  2️⃣  Watch Scheduler (see browser)"
echo "  3️⃣  Start Mock API (for testing)"
echo "  4️⃣  Open Dashboard (visual UI)"
echo "  5️⃣  Run Setup Wizard (reconfigure)"
echo "  6️⃣  Exit"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
  1)
    echo ""
    echo "▶️  Starting scheduler..."
    echo ""
    HEADLESS=true npm start
    ;;
  2)
    echo ""
    echo "🌐 Starting scheduler (watch browser)..."
    echo ""
    npm run dev
    ;;
  3)
    echo ""
    echo "🧪 Starting mock API on http://localhost:3000"
    echo "   In another terminal, run: SHEET_API_URL=http://localhost:3000/api/tweets npm run dev"
    echo ""
    npm test
    ;;
  4)
    echo ""
    echo "🌐 Opening dashboard at http://localhost:4000"
    echo ""
    node dashboard.js &
    sleep 1
    if command -v open &> /dev/null; then
      open "http://localhost:4000"
    fi
    wait
    ;;
  5)
    echo ""
    node setup-wizard.js
    ;;
  *)
    echo "Exiting."
    exit 0
    ;;
esac
