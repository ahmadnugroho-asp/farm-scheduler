// Debug script to see exact mapping
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

async function debugMapping() {
    try {
        const taskRange = 'Tasks!A1:I3';
        const taskResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: taskRange });

        const rows = taskResponse.data.values;
        const headers = rows[0];

        console.log('Headers (row 1):');
        headers.forEach((h, i) => console.log(`  Index ${i}: "${h}"`));

        console.log('\nFirst data row (row 2):');
        rows[1].forEach((cell, i) => console.log(`  Index ${i} (${headers[i]}): "${cell}"`));

        console.log('\n--- After processing with rowsToObjects logic ---');
        console.log('Headers slice (skipping index 0):');
        const processedHeaders = headers.slice(1);
        processedHeaders.forEach((h, i) => console.log(`  Original index ${i + 1}, New index ${i}: "${h}"`));

        console.log('\nData slice (skipping index 0):');
        const processedData = rows[1].slice(1);
        processedData.forEach((cell, i) => console.log(`  New index ${i} (${processedHeaders[i]}): "${cell}"`));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugMapping();
