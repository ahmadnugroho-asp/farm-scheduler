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

// Setup Google Sheets Auth using JWT (newer approach)
const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });


// Helper to convert sheet header names to frontend-compatible camelCase property names
const normalizeHeaderName = (header) => {
    const headerMap = {
        'Date Start': 'dateStart',
        'Time Start': 'timeStart',
        'Date Finish': 'dateFinish',
        'Time Finish': 'timeFinish',
        'Task Name': 'taskName',
        'Task Description': 'taskDescription',
        'Description': 'taskDescription',
        'Person Assigned': 'personAssigned',
        'Status': 'status',
        'PIN': 'pin',
        'NAME': 'name',
        'Name': 'name'
    };

    return headerMap[header] || header;
};

// Helper to translate Indonesian status values to English
const translateStatus = (status) => {
    const statusMap = {
        'Baru': 'New',
        'Sedang Dikerjakan': 'Inprogress',
        'Tertunda': 'Pending',
        'Ditunda': 'Pending',  // Alternative Indonesian word for Pending
        'Selesai': 'Done',
        // Also handle English values (pass-through)
        'New': 'New',
        'Inprogress': 'Inprogress',
        'Pending': 'Pending',
        'Done': 'Done'
    };

    return statusMap[status] || status;
};

// Helper to translate English status values back to Indonesian for Google Sheets
const translateStatusToIndonesian = (status) => {
    const statusMap = {
        'New': 'Baru',
        'Inprogress': 'Sedang Dikerjakan',
        'Pending': 'Tertunda',
        'Done': 'Selesai'
    };

    return statusMap[status] || status;
};

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
                // Normalize the header name to camelCase for frontend compatibility
                const normalizedKey = normalizeHeaderName(key);
                let value = row[index] || '';

                // Translate status values from Indonesian to English
                if (normalizedKey === 'status' && value) {
                    value = translateStatus(value);
                }

                obj[normalizedKey] = value;
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
        
        // Pass the full header row (including "Row Index") to rowsToObjects
        // rowsToObjects will handle skipping the Row Index column
        const taskHeader = taskResponse.data.values[0];
        const taskRows = taskResponse.data.values.slice(1);
        const tasks = rowsToObjects(taskRows, taskHeader);
        
        // Fetch PIN Data
        const pinRange = 'Users!A1:B';
        const pinResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: pinRange });

        // For Users sheet, PIN is column A (like Row Index) and NAME is column B
        // We need to handle this differently since PIN should be included in the output
        const pinData = pinResponse.data.values.slice(1).map(row => ({
            pin: row[0] || '',
            name: row[1] || ''
        }));

        res.json({ tasks, pins: pinData });
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
        // taskId is the Row_Index value from column A (1, 2, 3...)
        // Actual sheet row = taskId + 1 (because row 1 is the header)
        const actualSheetRow = parseInt(taskId, 10) + 1;
        const updateRange = `Tasks!${STATUS_COLUMN_LETTER}${actualSheetRow}`;

        // Translate status back to Indonesian for Google Sheets
        const indonesianStatus = translateStatusToIndonesian(newStatus);

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[indonesianStatus]]
            }
        });

        res.json({ success: true, updaterName });

    } catch (error) {
        console.error('Error updating task status:', error.message);
        res.status(500).json({ error: `Failed to update Google Sheet: ${error.message}` });
    }
});


// --- API Route 3: Create New Task ---
app.post('/api/create-task', async (req, res) => {
    const { dateStart, timeStart, dateFinish, timeFinish, taskName, taskDescription, personAssigned, pin } = req.body;

    if (!dateStart || !timeStart || !dateFinish || !timeFinish || !taskName || !taskDescription || !personAssigned || !pin) {
        return res.status(400).json({ error: 'Missing required fields in request body.' });
    }

    try {
        // 1. PIN Validation (Server-side)
        const pinRange = 'Users!A2:B';
        const pinResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: pinRange });

        if (!pinResponse.data.values) {
            return res.status(500).json({ error: 'Failed to read PIN data from the Users sheet.' });
        }

        const userRow = pinResponse.data.values.find(row => row[0] === pin);

        if (!userRow) {
            return res.status(401).json({ error: 'Invalid 6-digit PIN.' });
        }

        const creatorName = userRow[1];

        // 2. Get the next row index
        const taskRange = 'Tasks!A:A';
        const taskResponse = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: taskRange });

        // Find the next available row (count existing rows + 1)
        const existingRows = taskResponse.data.values || [];
        const nextRowNumber = existingRows.length + 1;
        const nextRowIndex = existingRows.length; // Row index in the data (excluding header)

        // 3. Prepare the new task data
        // Format: Row_Index | Date Start | Time Start | Date Finish | Time Finish | Task Name | Task Description | Person Assigned | Status
        const newTaskRow = [
            nextRowIndex.toString(),
            dateStart,
            timeStart,
            dateFinish,
            timeFinish,
            taskName,
            taskDescription,
            personAssigned,
            'Baru' // Default status in Indonesian
        ];

        // 4. Append the new task to the sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `Tasks!A${nextRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [newTaskRow]
            }
        });

        res.json({ success: true, creatorName, taskId: nextRowIndex });

    } catch (error) {
        console.error('Error creating task:', error.message);
        res.status(500).json({ error: `Failed to create task in Google Sheet: ${error.message}` });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n✅ Server running and listening on http://localhost:${PORT}`));
