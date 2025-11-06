// Script to show Users data from Google Sheets
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

async function showUsers() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A1:B10'
        });

        const rows = response.data.values;

        console.log('👥 Users Sheet Data:\n');

        rows.forEach((row, index) => {
            if (index === 0) {
                console.log('HEADERS:');
                console.log(`  Column A: "${row[0]}"`);
                console.log(`  Column B: "${row[1]}"`);
            } else {
                console.log(`\nUser ${index}:`);
                console.log(`  PIN: "${row[0]}"`);
                console.log(`  Name: "${row[1]}"`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

showUsers();
