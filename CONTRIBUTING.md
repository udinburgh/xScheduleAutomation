# 🤝 Contributing to x-tweet-scheduler

Terima kasih sudah tertarik untuk berkontribusi! Panduan ini menjelaskan cara terbaik untuk ikut berkembangkan project ini.

---

## 📋 Daftar Isi

- [Code of Conduct](#code-of-conduct)
- [Cara Melaporkan Bug](#cara-melaporkan-bug)
- [Cara Mengusulkan Fitur](#cara-mengusulkan-fitur)
- [Setup Lokal](#setup-lokal)
- [Alur Kontribusi](#alur-kontribusi)
- [Konvensi Branch](#konvensi-branch)
- [Konvensi Commit](#konvensi-commit)
- [Proses Pull Request](#proses-pull-request)
- [Jenis Kontribusi yang Diterima](#jenis-kontribusi-yang-diterima)

---

## Code of Conduct

Project ini mengikuti [Code of Conduct](CODE_OF_CONDUCT.md). Dengan berkontribusi, kamu setuju untuk mematuhinya.

---

## Cara Melaporkan Bug

Sebelum membuka issue baru, **cek dulu** apakah bug yang sama sudah pernah dilaporkan di [Issues](https://github.com/udinburgh/xScheduleAutomation/issues).

Kalau belum ada, buka issue baru dengan menyertakan:

- **Deskripsi singkat** — apa yang terjadi vs apa yang diharapkan
- **Langkah untuk mereproduksi** — step by step
- **Pesan error** — copy-paste dari terminal
- **Screenshot** — kalau ada (terutama untuk UI/browser issues)
- **Environment** — OS, versi Node.js, versi npm

> ⚠️ **Jangan sertakan `auth_token`, `ct0`, atau data sensitif lainnya di issue.**

---

## Cara Mengusulkan Fitur

1. Buka [Issue baru](https://github.com/udinburgh/xScheduleAutomation/issues/new) dengan label `enhancement`
2. Jelaskan **masalah apa** yang ingin diselesaikan
3. Jelaskan **solusi yang kamu bayangkan**
4. Tunggu diskusi dan persetujuan dari maintainer sebelum mulai coding

> Ini penting agar kamu tidak buang waktu mengerjakan sesuatu yang tidak bisa di-merge.

---

## Setup Lokal

### Prerequisites

- Node.js 18+
- npm
- Git

### Langkah-langkah

```bash
# 1. Fork repo ini di GitHub, lalu clone fork kamu
git clone https://github.com/<username-kamu>/xScheduleAutomation.git
cd xScheduleAutomation

# 2. Install dependencies
npm install
npx playwright install chromium

# 3. Salin file config
cp .env.example .env.local

# 4. Edit .env.local — isi SHEET_API_URL dengan URL Apps Script kamu
#    (lihat README.md untuk panduan lengkap)

# 5. Jalankan dengan browser visible (lebih mudah untuk debug)
npm run dev
```

### Tes dengan Mock API

Kalau belum punya Google Sheet, gunakan mock API bawaan:

```bash
# Terminal 1 — jalankan mock server
npm run mock-api

# Terminal 2 — jalankan scheduler (baca dari mock)
SHEET_API_URL=http://localhost:3000/tweets npm run dev
```

---

## Alur Kontribusi

```
1. Fork repo ini
       ↓
2. Buat branch baru dari `dev`
       ↓
3. Buat perubahan
       ↓
4. Test perubahan kamu
       ↓
5. Commit dengan pesan yang jelas
       ↓
6. Push ke fork kamu
       ↓
7. Buka Pull Request ke branch `dev`
       ↓
8. Tunggu review
```

---

## Konvensi Branch

Format: `<type>/<deskripsi-singkat>`

| Type | Kapan dipakai |
|---|---|
| `feat/` | Fitur baru |
| `fix/` | Perbaikan bug |
| `docs/` | Perubahan dokumentasi saja |
| `refactor/` | Refactor kode tanpa mengubah behavior |
| `chore/` | Maintenance (update deps, config, dll) |

Contoh:
```
feat/support-thread-tweets
fix/emote-not-showing
docs/update-multi-account-guide
refactor/extract-typing-helper
```

---

## Konvensi Commit

Format: `<type>: <deskripsi singkat>`

```
feat: add support for thread tweets
fix: emote not showing in tweet composer
docs: update multi-account setup guide
refactor: extract humanType into helper function
chore: update playwright to v1.45
```

- Gunakan **bahasa Inggris**
- Gunakan **present tense** ("add" bukan "added")
- Maksimal **72 karakter** untuk baris pertama
- Tambahkan detail di baris berikutnya kalau perlu

---

## Proses Pull Request

1. **Target branch**: selalu ke `dev`, bukan `main`
2. **Judul PR**: ikuti format yang sama dengan commit
3. **Deskripsi PR** harus mencakup:
   - Apa yang berubah
   - Kenapa perubahan ini diperlukan
   - Cara test / verifikasi
   - Link ke issue yang relevan (misal: `Closes #12`)
4. **Screenshot** wajib kalau ada perubahan pada behavior browser/Playwright
5. Pastikan tidak ada **data sensitif** (token, cookie) yang ikut ter-commit

### Checklist sebelum buka PR

- [ ] Kode berjalan tanpa error di lokal
- [ ] Sudah test secara manual (minimal dengan `npm run mock-api`)
- [ ] Tidak ada file `.env.local` atau `accounts.json` yang ter-commit
- [ ] Deskripsi PR sudah diisi dengan jelas

---

## Jenis Kontribusi yang Diterima

Tidak harus koding! Ini beberapa cara lain untuk berkontribusi:

- 🐛 **Laporkan bug** yang kamu temukan
- 📖 **Perbaiki dokumentasi** yang kurang jelas
- 💡 **Usulkan fitur** baru via issue
- 🌍 **Terjemahkan** README ke bahasa lain
- ✅ **Review PR** dari kontributor lain
- 🧪 **Test** di OS / environment yang berbeda dan laporkan hasilnya

---

## Ada Pertanyaan?

Buka [Discussion](https://github.com/udinburgh/xScheduleAutomation/discussions) atau mention di issue yang relevan.
