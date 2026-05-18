# 📸 Image Support via Google Drive Folder

Setup gampang: upload images ke 1 folder, tulis nama file di spreadsheet.

---

## 🎯 Cara Kerja

```
┌─────────────────────┐         ┌──────────────────────┐
│  Google Drive       │         │  Google Sheets       │
│  📁 Tweet Images    │ ←────── │  Column D: photo.jpg │
│    🖼️  photo.jpg    │         └──────────────────────┘
│    🖼️  banner.png   │
└─────────────────────┘
```

Spreadsheet cukup berisi **nama file**. Apps Script otomatis cari di Drive folder dan generate URL.

---

## 📋 Setup (5 Menit)

### Step 1: Buat Folder Drive (1 menit)

1. Buka https://drive.google.com
2. Klik **New** → **Folder**
3. Beri nama: **"Tweet Images"** (atau nama lain)

### Step 2: Set Sharing Permission (30 detik)

⚠️ **PENTING** - tanpa ini, gambar tidak bisa di-download:

1. Right-click folder **"Tweet Images"**
2. Klik **Share**
3. Klik **"Change to anyone with the link"**
4. Set role: **Viewer**
5. Klik **Done**

### Step 3: Get Folder ID (30 detik)

1. **Buka folder** "Tweet Images"
2. Lihat URL di browser:
   ```
   https://drive.google.com/drive/folders/1abc123xyz...
                                          ↑
                                     INI FOLDER ID
   ```
3. **Copy** bagian ID-nya

### Step 4: Upload Gambar (1-2 menit)

Upload semua gambar tweet kamu ke folder ini:
- 📸 photo1.jpg
- 📸 banner.png  
- 📸 funny-meme.gif
- dll.

**Sharing-nya otomatis ikut folder** (karena permission di-set ke folder level).

### Step 5: Update Apps Script (2 menit)

1. **Buka Google Sheet** kamu
2. **Extensions** → **Apps Script**
3. **Hapus** semua code lama
4. **Copy-paste** isi file `apps-script/with-images.gs`
5. Cari baris ini di atas:
   ```javascript
   const DRIVE_FOLDER_ID = 'PASTE_FOLDER_ID_HERE';
   ```
6. **Paste folder ID** dari Step 3:
   ```javascript
   const DRIVE_FOLDER_ID = '1abc123xyz...';
   ```
7. **Save** (Ctrl+S / Cmd+S)

### Step 6: Redeploy (1 menit)

1. Klik **Deploy** → **Manage deployments**
2. Klik ✏️ **pencil icon** (edit existing deployment)
3. Version: **New version**
4. Klik **Deploy**
5. Klik **Authorize access** jika muncul (allow permissions)

**URL kamu tetap sama**, jadi `.env.local` tidak perlu diubah! ✅

---

## 📊 Cara Pakai di Spreadsheet

### Format Kolom

| A (content) | B (date) | C (time) | D (image_url) |
|-------------|----------|----------|---------------|
| Selamat pagi! ☀️ | 2026-05-20 | 09:00 | *(kosong)* |
| Cek foto ini 📸 | 2026-05-20 | 14:00 | **photo1.jpg** |
| Multi pic post! | 2026-05-21 | 11:00 | **photo1.jpg,banner.png** |

### Aturan Kolom D:

| Input | Hasil |
|-------|-------|
| *(kosong)* | Tweet tanpa gambar |
| `photo.jpg` | 1 gambar |
| `photo1.jpg,photo2.jpg` | 2 gambar (pisah koma) |
| `a.jpg,b.jpg,c.jpg,d.jpg` | 4 gambar (max menurut X) |
| `https://example.com/img.jpg` | URL langsung (juga bisa) |

---

## ✅ Test Setup

### Test di Apps Script:

1. Di Apps Script editor, pilih function **`listDriveFiles`** dari dropdown atas
2. Klik **Run** (▶️)
3. **Allow permissions** jika diminta
4. Lihat **Execution log** (bawah)
5. Harusnya muncul list semua file di folder:
   ```
   Folder: Tweet Images
     - photo1.jpg (1aBcDeFgH...)
     - banner.png (2iJkLmNoP...)
   ```

### Test fetch tweets:

1. Pilih function **`testFetch`** dari dropdown
2. Klik **Run**
3. Lihat log — harusnya muncul JSON dengan `image_url` sudah ke-resolve:
   ```json
   [{
     "content": "Cek foto ini 📸",
     "date": "2026-05-20",
     "time": "14:00",
     "image_url": "https://drive.google.com/uc?export=download&id=1aBc..."
   }]
   ```

---

## 🚀 Run Scheduler

Setelah semua setup beres:

```bash
npm start
```

Output:

```
[1/3] Selamat pagi! ☀️
→ Scheduling for May 20, 2026 9:00 AM
  ✓ scheduled

[2/3] Cek foto ini 📸
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

**Penyebab:** Nama file di spreadsheet tidak sesuai dengan nama file di Drive

**Fix:**
- Cek nama file persis (case-sensitive!)
- `photo1.jpg` ≠ `Photo1.jpg` ≠ `photo1.JPG`
- Jalankan `listDriveFiles` di Apps Script untuk lihat nama exact

---

### ❌ Image download error 403

**Penyebab:** Folder belum di-share publicly

**Fix:**
1. Right-click folder → Share
2. **Anyone with the link** → Viewer
3. Done

---

### ❌ "Authorization required" di Apps Script

**Penyebab:** Script butuh permission akses Drive (pertama kali)

**Fix:**
1. Run function manual (testFetch atau listDriveFiles)
2. Allow semua permissions
3. Setelah authorized, scheduler bisa jalan

---

### ❌ Image upload ke X gagal

**Cek di Drive:**
- Apakah file size > 5MB? (X limit untuk image)
- Apakah format support? (JPG/PNG/GIF/WebP only)

---

## 💡 Tips

### Organize Banyak Image

Buat sub-folder berdasarkan tanggal/topik:

```
📁 Tweet Images
  📁 May 2026
    🖼️ campaign-1.jpg
    🖼️ campaign-2.jpg
  📁 June 2026
    🖼️ summer-sale.jpg
```

**Tapi:** Apps Script cari di root folder dulu. Untuk sub-folder, edit `findFileInFolder` function untuk recursive search.

### Backup Spreadsheet

Sebelum edit besar, **File → Make a copy** untuk backup.

### Bulk Upload

Drag-drop banyak file sekaligus ke folder Drive. Filename tetap.

---

## 📁 File Structure di Project

```
apps-script/with-images.gs   ← Copy isinya ke Apps Script
IMAGE_GUIDE.md               ← Panduan ini
schedule-tweets.js           ← Auto-download & upload (no changes needed)
```

---

## 🎯 Quick Reference

```
1. Folder Drive  → Set "Anyone with link"
2. Copy ID       → Paste ke DRIVE_FOLDER_ID
3. Upload images → Tulis nama file di kolom D
4. Save & Deploy → New version
5. npm start     → Run scheduler
```

Done! 🐦📸
