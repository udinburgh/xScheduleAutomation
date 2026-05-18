/**
 * Apps Script untuk Tweet Scheduler - Drive Folder Image Support
 * ===============================================================
 * Workflow:
 *   1. Upload semua gambar ke 1 folder di Google Drive
 *   2. Di spreadsheet, tulis nama file aja (contoh: "photo1.jpg")
 *   3. Apps Script auto-resolve ke direct download URL
 *
 * Setup:
 *   1. Buat folder di Drive (contoh: "Tweet Images")
 *   2. Copy folder ID dari URL
 *      Contoh: https://drive.google.com/drive/folders/1abc123xyz
 *                                                    ↑ ini ID-nya
 *   3. Set DRIVE_FOLDER_ID di bawah
 *   4. Set share access untuk folder:
 *      Right-click folder → Share → "Anyone with the link" → Viewer
 *   5. Save script → Deploy → New deployment → Web app
 *   6. Execute as: Me, Access: Anyone
 *   7. Copy URL → paste ke SHEET_API_URL di .env.local
 */

// ⚙️ KONFIGURASI - WAJIB DIISI
// ============================================================
const DRIVE_FOLDER_ID = 'PASTE_FOLDER_ID_HERE';
// ============================================================

// Kolom mapping (A=0, B=1, ...)
const COL_CONTENT = 0;  // A
const COL_DATE = 1;     // B
const COL_TIME = 2;     // C
const COL_IMAGE = 3;    // D
const COL_ACCOUNT = 4;  // E - account key (e.g. "main", "alt1")

function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2) {
      return jsonResponse([]);
    }

    // Read as many columns as exist (up to 5: A-E)
    const numCols = Math.min(lastCol, 5);
    const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

    const tweets = data
      .filter(row => row[COL_CONTENT] && row[COL_DATE] && row[COL_TIME])
      .map(row => ({
        content: String(row[COL_CONTENT]),
        date: formatDate(row[COL_DATE]),
        time: formatTime(row[COL_TIME]),
        image_url: numCols > COL_IMAGE ? resolveImages(row[COL_IMAGE]) : '',
        account: numCols > COL_ACCOUNT && row[COL_ACCOUNT]
          ? String(row[COL_ACCOUNT]).trim()
          : ''
      }));

    return jsonResponse(tweets);
  } catch (e) {
    // Return error as JSON so the Node side can see what went wrong
    Logger.log('doGet error: ' + e.toString());
    Logger.log(e.stack);
    return jsonResponse({
      error: e.toString(),
      stack: e.stack,
      hint: 'Check Apps Script Executions log for details'
    });
  }
}

/**
 * Resolve filename(s) to Drive direct download URLs.
 * Supports:
 *   - "photo.jpg"                          → 1 image
 *   - "photo1.jpg,photo2.jpg,photo3.jpg"   → multiple (max 4)
 *   - "" or empty                          → no image
 *   - Already-a-URL                        → pass through
 *
 * Returns '' gracefully on any error — never crashes the whole fetch.
 */
function resolveImages(cellValue) {
  if (!cellValue) return '';

  const text = String(cellValue).trim();
  if (!text) return '';

  // If it's already a URL, return as-is
  if (text.match(/^https?:\/\//i)) {
    return text;
  }

  // Need a valid folder ID to do filename lookup
  if (!DRIVE_FOLDER_ID || DRIVE_FOLDER_ID === 'PASTE_FOLDER_ID_HERE') {
    Logger.log(`Cannot resolve "${text}": DRIVE_FOLDER_ID not configured`);
    return '';
  }

  // Try to access the Drive folder (wrapped in try/catch)
  let folder;
  try {
    folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch (e) {
    Logger.log(`Cannot access Drive folder '${DRIVE_FOLDER_ID}': ${e.message}`);
    Logger.log('  → Check folder ID is correct and you have access');
    Logger.log('  → Also make sure DriveApp is authorized (run listDriveFiles manually)');
    return '';
  }

  // Split by comma for multiple filenames
  const filenames = text.split(',').map(f => f.trim()).filter(Boolean);
  const urls = [];

  for (const filename of filenames) {
    try {
      const files = folder.getFilesByName(filename);
      if (files.hasNext()) {
        const file = files.next();
        // Ensure file is publicly accessible
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (e) {
          // Sharing already set or permission denied — continue anyway
        }
        urls.push(`https://drive.google.com/uc?export=download&id=${file.getId()}`);
      } else {
        Logger.log(`File not found in Drive folder: ${filename}`);
      }
    } catch (e) {
      Logger.log(`Error looking up '${filename}': ${e.message}`);
    }
  }

  return urls.join(',');
}

function formatDate(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function formatTime(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(value);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this in Apps Script editor to debug
 * Click "Run" with this function selected to see output in Logs
 */
function testFetch() {
  const result = doGet();
  Logger.log(result.getContent());
}

/**
 * List all files in your Drive folder (for debugging)
 */
function listDriveFiles() {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const files = folder.getFiles();
  Logger.log(`Folder: ${folder.getName()}`);
  while (files.hasNext()) {
    const file = files.next();
    Logger.log(`  - ${file.getName()} (${file.getId()})`);
  }
}
