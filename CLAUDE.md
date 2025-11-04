# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farm Task Scheduler is a web application for managing farm tasks with PIN-based authentication. The application uses Google Sheets as its backend database, with a Node.js Express server providing API endpoints and a vanilla React (via CDN) frontend.

## Architecture

### Monorepo Structure
- `client/` - Frontend application (single HTML file with inline React)
- `server/` - Node.js Express backend with Google Sheets integration

### Technology Stack
- **Backend**: Node.js with Express
- **Frontend**: Vanilla React loaded via CDN (no build process)
- **Database**: Google Sheets API (v4)
- **Authentication**: Google Service Account with OAuth2
- **Styling**: Tailwind CSS (via CDN)

### Data Flow Architecture
1. Server reads from Google Sheets using service account credentials
2. Two sheets are used:
   - `Tasks` sheet: Columns A-I (A=Row Index, B-I=task data, I=Status column)
   - `Users` sheet: Columns A-B (A=PIN, B=Name)
3. Frontend polls `/api/tasks` every 30 seconds for updates
4. Status updates go through `/api/update-status` with PIN validation
5. Row Index (Column A) in Tasks sheet serves as the task ID for updates

### Google Sheets Integration
- Service account credentials must be in `server/service-account.json`
- The spreadsheet must be shared with the service account email
- `STATUS_COLUMN_LETTER` constant (default: 'I') defines which column holds status
- Tasks sheet structure: Row Index | Date Start | Time Start | Date Finish | Time Finish | Task Name | Description | Person Assigned | Status
- Users sheet structure: PIN | Name

### Authentication Flow
- PIN-based system (6-digit numeric codes)
- Server validates PIN against Users sheet before allowing status updates
- No session management - each update requires PIN re-entry
- PINs are sent in POST body to `/api/update-status`

## Development Commands

### Starting the Application
```bash
# Start the server (from server directory)
cd server
node server.js
```

The server runs on port 3001 by default (configurable via PORT env var) and serves the client files statically.

### Setup Requirements
1. Create `server/.env` file with:
   ```
   SHEET_ID="your_google_sheet_id_here"
   ```
2. Place Google service account JSON in `server/service-account.json`
3. Install dependencies:
   ```bash
   cd server
   npm install
   ```

## API Endpoints

### GET /api/tasks
Returns all tasks and user PINs from Google Sheets.
- Response: `{ tasks: Task[], pins: { pin: string, name: string }[] }`
- Falls back to mock data in frontend if unavailable

### POST /api/update-status
Updates task status with PIN authentication.
- Body: `{ taskId: number, newStatus: string, pin: string }`
- Status options: 'New', 'Inprogress', 'Pending', 'Done'
- Response: `{ success: boolean, updaterName: string }`
- Returns 401 if PIN is invalid

## Key Implementation Details

### Task Status Values
Statuses must match exactly: 'New', 'Inprogress', 'Pending', 'Done'

### Row Index System
- Column A in Tasks sheet contains the row number (2, 3, 4...)
- This value is used as task.id in the application
- When updating status, the system uses this row number to target the correct cell: `Tasks!I{rowNumber}`

### Frontend Fallback Behavior
The client has built-in mock data and will automatically fall back if:
- The Node.js server is not running
- The API request fails
- Google Sheets API is not configured

### No Build Process
The frontend is a single HTML file with inline React code. No bundling or build step is required. Simply serve the file statically.

## Environment Variables

### Server (.env file in server/)
- `SHEET_ID` - Google Sheets document ID (required)
- `PORT` - Server port (optional, defaults to 3001)

### Configuration Constants (in server.js)
- `SPREADSHEET_ID` - Loaded from SHEET_ID env var
- `STATUS_COLUMN_LETTER` - Column letter for status field (default: 'I')

## Important Notes

- The application expects Google Sheets to be the source of truth
- Service account must have edit permissions on the spreadsheet
- Column A in Tasks sheet must contain row numbers for the update mechanism to work
- The frontend refreshes data every 30 seconds automatically
- No authentication state is persisted - PIN required for each status change
