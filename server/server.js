// server/server.js

require('dotenv').config();
const express = require('express');
const path = require('path');
const { google } = require('googleapis');

// --------------------------------------------------------
// --- CRITICAL CONFIGURATION ---
// --------------------------------------------------------
const SPREADSHEET_ID = process.env.SHEET_ID;

// Ensure the service account file exists in the server directory
const serviceAccount = require('./service-account.json'); 
// The name of the column in the 'Tasks' sheet that holds the Status (e.g., Column I)
const STATUS_COLUMN_LETTER = 'I'; 
// --------------------------------------------------------


const app = express();
// Use the built-in express static middleware to serve the React files
// We assume the React file will be built into the '../client' directory for local testing
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(express.json()); 

// Setup Google Sheets Auth
const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });


// Helper to convert sheet rows (array of arrays) to array of objects
// This function assumes the first column (index 0) is the Row Index/ID.
const rowsToObjects = (rows, header) => {
    if (!rows || rows.length === 0) return [];
    return rows.map(row => {
        let obj = {};
        // The first element is the Row Index (used for updating)
        const rowIndex = row[0]; 

        header.forEach((key, index) => {
            // Skip the Row Index column when mapping headers to properties
            if (index > 0) {
                // We map header at index 1 to row at index 1, and so on.
                obj[key] = row[index] || ''; 
            }
        });
        
        // Add the sheet's row index as the internal ID
        obj.id = parseInt(rowIndex, 10); 
        return obj;
    });
};


// --- API Route 1: Get All Tasks and PINs ---
app.get('/api/tasks', async (req, res) => {
    if (!SPREADSHEET_ID) {
        return res.status(500).json({ error: 'SHEET_ID is missing in .env file.' });
    }
    
    try {
        // Fetch Task Data: Column A is Row Index, then B to I are data columns
        const taskRange = 'Tasks!A1:I'; 
        const taskResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: taskRange });
        
        if (!taskResponse.data.values || taskResponse.data.values.length < 2) {
             return res.status(404).json({ error: 'No task data found in the sheet.' });
        }
        
        // Headers start from the second element (skip the "Row Index" header)
        const taskHeader = taskResponse.data.values[0].slice(1);
        const taskRows = taskResponse.data.values.slice(1);
        const tasks = rowsToObjects(taskRows, taskHeader);
        
        // Fetch PIN Data
        const pinRange = 'Users!A1:B';
        const pinResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: pinRange });
        const pinHeader = pinResponse.data.values[0];
        const pinRows = pinResponse.data.values.slice(1);
        const pins = rowsToObjects(pinRows, pinHeader);

        res.json({ tasks, pins });
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        // Log the full error detail for debugging
        if (error.code === 400 || error.code === 403) {
             console.error("Check Google API permissions and sheet sharing settings.");
        }
        res.status(500).json({ error: `Failed to fetch data from Google Sheets: ${error.message}` });
    }
});


// --- API Route 2: Update Task Status ---
app.post('/api/update-status', async (req, res) => {
    const { taskId, newStatus, pin } = req.body;

    if (!taskId || !newStatus || !pin) {
        return res.status(400).json({ error: 'Missing taskId, newStatus, or pin in request body.' });
    }

    try {
        // 1. PIN Validation (Server-side)
        const pinRange = 'Users!A2:B'; // Assuming PIN data starts at row 2
        const pinResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: pinRange });
        
        if (!pinResponse.data.values) {
            return res.status(500).json({ error: 'Failed to read PIN data from the Users sheet.' });
        }
        
        // Find the user row where column A (index 0) matches the provided PIN
        const userRow = pinResponse.data.values.find(row => row[0] === pin);
        
        if (!userRow) {
            return res.status(401).json({ error: 'Invalid 6-digit PIN.' });
        }

        const updaterName = userRow[1]; // Name is in the second column (index 1)

        // 2. Update Status in Google Sheet
        // taskId corresponds to the sheet row number.
        const updateRange = `Tasks!${STATUS_COLUMN_LETTER}${taskId}`; 

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newStatus]]
            }
        });

        res.json({ success: true, updaterName });

    } catch (error) {
        console.error('Error updating task status:', error.message);
        res.status(500).json({ error: `Failed to update Google Sheet: ${error.message}` });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n✅ Server running and listening on http://localhost:${PORT}`));

// Handles requests for any route not explicitly defined (will serve index.html)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});
