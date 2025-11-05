// Script to check current column structure in Google Sheets
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

async function checkColumns() {
    try {
        // Get the header row from Tasks sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Tasks!A1:I1'
        });

        const headers = response.data.values[0];

        console.log('📊 Current column headers in Tasks sheet:\n');
        headers.forEach((header, index) => {
            const columnLetter = String.fromCharCode(65 + index); // A=65
            console.log(`   Column ${columnLetter}: "${header}"`);
        });

        console.log('\n📝 Expected column headers:\n');
        const expectedHeaders = [
            'Row Index',
            'Date Start',
            'Time Start',
            'Date Finish',
            'Time Finish',
            'Task Name',
            'Description',
            'Person Assigned',
            'Status'
        ];

        expectedHeaders.forEach((header, index) => {
            const columnLetter = String.fromCharCode(65 + index);
            console.log(`   Column ${columnLetter}: "${header}"`);
        });

        console.log('\n🔍 Comparison:');
        let allMatch = true;
        expectedHeaders.forEach((expected, index) => {
            const actual = headers[index] || '(missing)';
            const match = actual === expected;
            if (!match) allMatch = false;
            console.log(`   ${match ? '✅' : '❌'} Column ${String.fromCharCode(65 + index)}: Expected "${expected}", Got "${actual}"`);
        });

        if (allMatch) {
            console.log('\n✅ All columns match expected structure!');
        } else {
            console.log('\n⚠️  Column headers need to be updated.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkColumns();
