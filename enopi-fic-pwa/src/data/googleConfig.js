// GOOGLE SHEETS CONFIG — reads from Vite env vars (.env), never hardcoded.
//
// Set these in a local .env file (see .env.example) to switch the app from the
// offline registry.json seed to a LIVE Google Sheet. Leave them blank and the
// app runs fully offline exactly as before — no auth, no network.
//
//   VITE_GOOGLE_CLIENT_ID   OAuth 2.0 Web client ID (…apps.googleusercontent.com)
//   VITE_SPREADSHEET_ID     the id in the sheet URL /d/<THIS>/edit
//   VITE_SHEET_NAME         tab name (defaults to the POC tab)

export const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  spreadsheetId: import.meta.env.VITE_SPREADSHEET_ID || '',
  sheetName: import.meta.env.VITE_SHEET_NAME || 'FIC Registry (POC data)',
  // Read + write to the sheet the user grants access to.
  scope: 'https://www.googleapis.com/auth/spreadsheets',
}

// True only when both required ids are present — the single switch the rest of
// the data layer checks to decide live-vs-offline.
export const SHEETS_ENABLED = Boolean(
  GOOGLE_CONFIG.clientId && GOOGLE_CONFIG.spreadsheetId
)
