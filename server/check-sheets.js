// Diagnostic script to check Google Sheets connection
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

async function checkSheets() {
    console.log('🔍 Checking Google Sheets connection...\n');
    console.log(`Sheet ID: ${SPREADSHEET_ID}`);
    console.log(`Service Account Email: ${serviceAccount.client_email}\n`);

    try {
        // Try to get spreadsheet metadata
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });

        console.log('✅ Successfully connected to spreadsheet!');
        console.log(`   Title: ${metadata.data.properties.title}\n`);

        console.log('📋 Available sheets/tabs:');
        metadata.data.sheets.forEach(sheet => {
            console.log(`   - ${sheet.properties.title}`);
        });

        console.log('\n📝 Required sheets for this app:');
        console.log('   - Tasks (with columns: Row Index, Date Start, Time Start, Date Finish, Time Finish, Task Name, Description, Person Assigned, Status)');
        console.log('   - Users (with columns: PIN, Name)');

        // Check if required sheets exist
        const sheetNames = metadata.data.sheets.map(s => s.properties.title);
        const hasTasksSheet = sheetNames.includes('Tasks');
        const hasUsersSheet = sheetNames.includes('Users');

        console.log('\n✓ Verification:');
        console.log(`   ${hasTasksSheet ? '✅' : '❌'} Tasks sheet exists`);
        console.log(`   ${hasUsersSheet ? '✅' : '❌'} Users sheet exists`);

        if (!hasTasksSheet || !hasUsersSheet) {
            console.log('\n⚠️  Missing required sheets! Please create them in your Google Sheet.');
        }

    } catch (error) {
        console.error('❌ Error connecting to Google Sheets:');
        console.error(`   ${error.message}\n`);

        if (error.code === 403) {
            console.log('💡 Troubleshooting steps:');
            console.log('   1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID);
            console.log('   2. Click "Share" button');
            console.log('   3. Add this email as an Editor:');
            console.log(`      ${serviceAccount.client_email}`);
        } else if (error.code === 404) {
            console.log('💡 The spreadsheet was not found. Please check:');
            console.log('   1. The SHEET_ID in your .env file is correct');
            console.log('   2. The spreadsheet exists and is accessible');
        }
    }
}

checkSheets();
