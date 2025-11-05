// Script to show raw data from Google Sheets
require('dotenv').config();
const { google } = require('googleapis');
const serviceAccount = require('./service-account.json');

const SPREADSHEET_ID = process.env.SHEET_ID;

const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

async function showData() {
    try {
        // Get first 3 rows from Tasks sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Tasks!A1:I3'
        });

        const rows = response.data.values;

        console.log('📊 Raw data from Google Sheets Tasks sheet (first 3 rows):\n');

        rows.forEach((row, rowIndex) => {
            if (rowIndex === 0) {
                console.log('HEADERS:');
            } else {
                console.log(`\nROW ${rowIndex + 1}:`);
            }

            const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
            row.forEach((cell, colIndex) => {
                console.log(`  Column ${columns[colIndex]}: "${cell}"`);
            });
        });

        console.log('\n\n📝 Expected column order:');
        console.log('  Column A: Row Index (number like 1, 2, 3...)');
        console.log('  Column B: Date Start (e.g., "2025-11-10")');
        console.log('  Column C: Time Start (e.g., "08:00:00 AM")');
        console.log('  Column D: Date Finish (e.g., "2025-11-10")');
        console.log('  Column E: Time Finish (e.g., "05:00:00 PM")');
        console.log('  Column F: Task Name (e.g., "Harvest Apples")');
        console.log('  Column G: Task Description (e.g., "Pick 50 bushels...")');
        console.log('  Column H: Person Assigned (e.g., "AHMAD")');
        console.log('  Column I: Status (e.g., "New", "Inprogress", "Pending", "Done")');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

showData();
