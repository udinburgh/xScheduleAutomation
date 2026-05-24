# 🤝 Contributing to x-tweet-scheduler

Thank you for your interest in contributing! This guide explains how to best contribute to this project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Bugs](#reporting-bugs)
- [Proposing Features](#proposing-features)
- [Local Setup](#local-setup)
- [Contribution Workflow](#contribution-workflow)
- [Branch Naming](#branch-naming)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Types of Contributions](#types-of-contributions)

---

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By contributing, you agree to abide by its terms.

---

## Reporting Bugs

Before opening a new issue, **check first** whether the same bug has already been reported in [Issues](https://github.com/udinburgh/xScheduleAutomation/issues).

If not, open a new issue and include:

- **Short description** — what happened vs. what was expected
- **Steps to reproduce** — step by step
- **Error message** — copy-paste from terminal
- **Screenshot** — if available (especially for UI/browser issues)
- **Environment** — OS, Node.js version, npm version

> ⚠️ **Do not include `auth_token`, `ct0`, or any other sensitive data in issues.**

---

## Proposing Features

1. Open a [new Issue](https://github.com/udinburgh/xScheduleAutomation/issues/new) with the `enhancement` label
2. Describe **what problem** you want to solve
3. Describe **your proposed solution**
4. Wait for discussion and approval from the maintainer before writing any code

> This is important so you don't waste time building something that won't be merged.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- Git

### Steps

```bash
# 1. Fork this repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/xScheduleAutomation.git
cd xScheduleAutomation

# 2. Install dependencies
npm install
npx playwright install chromium

# 3. Copy the config file
cp .env.example .env.local

# 4. Edit .env.local — set SHEET_API_URL to your Apps Script URL
#    (see README.md for full setup guide)

# 5. Run with visible browser (easier for debugging)
npm run dev
```

### Testing with Mock API

If you don't have a Google Sheet yet, use the built-in mock API:

```bash
# Terminal 1 — start the mock server
npm run mock-api

# Terminal 2 — run the scheduler (reads from mock)
SHEET_API_URL=http://localhost:3000/tweets npm run dev
```

---

## Contribution Workflow

```
1. Fork this repo
       ↓
2. Create a new branch from `dev`
       ↓
3. Make your changes
       ↓
4. Test your changes
       ↓
5. Commit with a clear message
       ↓
6. Push to your fork
       ↓
7. Open a Pull Request targeting `dev`
       ↓
8. Wait for review
```

---

## Branch Naming

Format: `<type>/<short-description>`

| Type | When to use |
|---|---|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation changes only |
| `refactor/` | Code refactor without behavior change |
| `chore/` | Maintenance (dependency updates, config, etc.) |

Examples:
```
feat/support-thread-tweets
fix/emote-not-showing
docs/update-multi-account-guide
refactor/extract-typing-helper
```

---

## Commit Conventions

Format: `<type>: <short description>`

```
feat: add support for thread tweets
fix: emote not showing in tweet composer
docs: update multi-account setup guide
refactor: extract humanType into helper function
chore: update playwright to v1.45
```

- Use **present tense** ("add" not "added")
- Keep the first line under **72 characters**
- Add details in subsequent lines if needed

---

## Pull Request Process

1. **Target branch**: always target `dev`, not `main`
2. **PR title**: follow the same format as commit messages
3. **PR description** should include:
   - What changed
   - Why the change is needed
   - How to test / verify
   - Link to related issue (e.g. `Closes #12`)
4. **Screenshots** are required for any changes to browser/Playwright behavior
5. Make sure no **sensitive data** (tokens, cookies) is included in the commit

### Checklist before opening a PR

- [ ] Code runs without errors locally
- [ ] Manually tested (at minimum with `npm run mock-api`)
- [ ] No `.env.local` or `accounts.json` files committed
- [ ] PR description is filled out clearly

---

## Types of Contributions

You don't have to write code! Here are other ways to contribute:

- 🐛 **Report bugs** you find
- 📖 **Improve documentation** that's unclear
- 💡 **Suggest new features** via issues
- 🌍 **Translate** the README to other languages
- ✅ **Review PRs** from other contributors
- 🧪 **Test** on different OS / environments and report results

---

## Questions?

Open a [Discussion](https://github.com/udinburgh/xScheduleAutomation/discussions) or comment on the relevant issue.
