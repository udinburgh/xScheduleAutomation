# 📸 Image Support via Google Drive Folder

Easy setup: upload images to one folder, write the filename in your spreadsheet.

---

## 🎯 How It Works

```
┌─────────────────────┐         ┌──────────────────────┐
│  Google Drive       │         │  Google Sheets       │
│  📁 Tweet Images    │ ←────── │  Column D: photo.jpg │
│    🖼️  photo.jpg    │         └──────────────────────┘
│    🖼️  banner.png   │
└─────────────────────┘
```

Your spreadsheet only needs the **filename**. Apps Script automatically finds it in the Drive folder and generates the download URL.

---

## 📋 Setup (5 Minutes)

### Step 1: Create a Drive Folder (1 minute)

1. Go to https://drive.google.com
2. Click **New** → **Folder**
3. Name it: **"Tweet Images"** (or any name you prefer)

### Step 2: Set Sharing Permission (30 seconds)

⚠️ **IMPORTANT** — without this, images cannot be downloaded:

1. Right-click the **"Tweet Images"** folder
2. Click **Share**
3. Click **"Change to anyone with the link"**
4. Set role: **Viewer**
5. Click **Done**

### Step 3: Get the Folder ID (30 seconds)

1. **Open** the "Tweet Images" folder
2. Look at the URL in your browser:
   ```
   https://drive.google.com/drive/folders/1abc123xyz...
                                          ↑
                                     THIS IS THE FOLDER ID
   ```
3. **Copy** the ID portion

### Step 4: Upload Images (1-2 minutes)

Upload all your tweet images to this folder:
- 📸 photo1.jpg
- 📸 banner.png
- 📸 funny-meme.gif
- etc.

**Sharing permission automatically applies to all files** (because it was set at the folder level).

### Step 5: Update the Apps Script (2 minutes)

1. **Open your Google Sheet**
2. **Extensions** → **Apps Script**
3. **Delete** all existing code
4. **Copy-paste** the contents of `apps-script/with-images.gs`
5. Find this line near the top:
   ```javascript
   const DRIVE_FOLDER_ID = 'PASTE_FOLDER_ID_HERE';
   ```
6. **Paste your folder ID** from Step 3:
   ```javascript
   const DRIVE_FOLDER_ID = '1abc123xyz...';
   ```
7. **Save** (Ctrl+S / Cmd+S)

### Step 6: Redeploy (1 minute)

1. Click **Deploy** → **Manage deployments**
2. Click the ✏️ **pencil icon** (edit existing deployment)
3. Version: **New version**
4. Click **Deploy**
5. Click **Authorize access** if prompted (allow permissions)

**Your URL stays the same**, so no changes needed in `.env.local`! ✅

---

## 📊 How to Use in Your Spreadsheet

### Column Format

| A (content) | B (date) | C (time) | D (image_url) |
|-------------|----------|----------|---------------|
| Good morning! ☀️ | 2026-05-20 | 09:00 | *(empty)* |
| Check this photo 📸 | 2026-05-20 | 14:00 | **photo1.jpg** |
| Multi pic post! | 2026-05-21 | 11:00 | **photo1.jpg,banner.png** |

### Column D Rules:

| Input | Result |
|-------|--------|
| *(empty)* | Tweet without image |
| `photo.jpg` | 1 image |
| `photo1.jpg,photo2.jpg` | 2 images (comma-separated) |
| `a.jpg,b.jpg,c.jpg,d.jpg` | 4 images (X's maximum) |
| `https://example.com/img.jpg` | Direct URL (also supported) |

---

## ✅ Testing Your Setup

### Test in Apps Script:

1. In the Apps Script editor, select **`listDriveFiles`** from the function dropdown
2. Click **Run** (▶️)
3. **Allow permissions** if prompted
4. Check the **Execution log** (bottom panel)
5. You should see all files in the folder listed:
   ```
   Folder: Tweet Images
     - photo1.jpg (1aBcDeFgH...)
     - banner.png (2iJkLmNoP...)
   ```

### Test tweet fetch:

1. Select **`testFetch`** from the dropdown
2. Click **Run**
3. Check the log — you should see JSON with resolved `image_url` values:
   ```json
   [{
     "content": "Check this photo 📸",
     "date": "2026-05-20",
     "time": "14:00",
     "image_url": "https://drive.google.com/uc?export=download&id=1aBc..."
   }]
   ```

---

## 🚀 Running the Scheduler

Once everything is set up:

```bash
npm start
```

Output:

```
[1/3] Good morning! ☀️
→ Scheduling for May 20, 2026 9:00 AM
  ✓ scheduled

[2/3] Check this photo 📸
→ Scheduling for May 20, 2026 2:00 PM
  ⬇️  Downloading 1 image(s)...
  📎 Uploading 1 image(s)...
  ✓ Images uploaded
  ✓ scheduled

[3/3] Multi pic post!
→ Scheduling for May 21, 2026 11:00 AM
  ⬇️  Downloading 2 image(s)...
  📎 Uploading 2 image(s)...
  ✓ Images uploaded
  ✓ scheduled
```

---

## 🆘 Troubleshooting

### ❌ "File not found in Drive"

**Cause:** Filename in spreadsheet doesn't match the filename in Drive

**Fix:**
- Check the exact filename (case-sensitive!)
- `photo1.jpg` ≠ `Photo1.jpg` ≠ `photo1.JPG`
- Run `listDriveFiles` in Apps Script to see the exact names

---

### ❌ Image download error 403

**Cause:** Folder is not shared publicly

**Fix:**
1. Right-click folder → Share
2. **Anyone with the link** → Viewer
3. Done

---

### ❌ "Authorization required" in Apps Script

**Cause:** Script needs Drive access permission (first time only)

**Fix:**
1. Run a function manually (`testFetch` or `listDriveFiles`)
2. Allow all permissions
3. Once authorized, the scheduler will work

---

### ❌ Image upload to X fails

**Check in Drive:**
- Is the file size > 5MB? (X's image limit)
- Is the format supported? (JPG/PNG/GIF/WebP only)

---

## 💡 Tips

### Organizing Many Images

Create sub-folders by date or topic:

```
📁 Tweet Images
  📁 May 2026
    🖼️ campaign-1.jpg
    🖼️ campaign-2.jpg
  📁 June 2026
    🖼️ summer-sale.jpg
```

**Note:** Apps Script searches the root folder by default. For sub-folders, edit the `findFileInFolder` function to do a recursive search.

### Backing Up Your Spreadsheet

Before major edits, use **File → Make a copy** to back it up.

### Bulk Upload

Drag and drop multiple files at once into the Drive folder. Filenames are preserved.

---

## 📁 Project File Reference

```
apps-script/with-images.gs   ← Copy this into Apps Script
docs/IMAGES.md               ← This guide
schedule-tweets.js           ← Auto-download & upload (no changes needed)
```

---

## 🎯 Quick Reference

```
1. Drive Folder   → Set "Anyone with link"
2. Copy ID        → Paste into DRIVE_FOLDER_ID
3. Upload images  → Write filenames in column D
4. Save & Deploy  → New version
5. npm start      → Run scheduler
```

Done! 🐦📸
