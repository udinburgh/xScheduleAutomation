/**
 * MINIMAL Apps Script - Debug Version
 * ====================================
 * Versi sederhana tanpa Drive folder lookup.
 * Pakai ini DULU untuk test connection,
 * baru upgrade ke versi full setelah work.
 */

function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2) {
      return jsonResponse([]);
    }

    // Read whatever columns exist (A2 to last column, last row)
    const numCols = Math.min(lastCol, 5); // Up to 5 columns (A-E)
    const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

    const tweets = data
      .filter(row => row[0] && row[1] && row[2])
      .map(row => ({
        content: String(row[0]),
        date: formatDate(row[1]),
        time: formatTime(row[2]),
        image_url: row[3] ? String(row[3]).trim() : '',
        account: (row[4] ? String(row[4]).trim() : '')
      }));

    return jsonResponse(tweets);

  } catch (e) {
    // Return error as JSON instead of crashing
    return jsonResponse({
      error: e.toString(),
      stack: e.stack
    });
  }
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

// Debug helper - run this in Apps Script editor
function testFetch() {
  const result = doGet();
  Logger.log(result.getContent());
}
