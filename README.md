# Farm Task Scheduler

[![CI](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/ci.yml/badge.svg)](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/ci.yml)
[![Code Quality](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/code-quality.yml/badge.svg)](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/code-quality.yml)
[![Deploy](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/deploy.yml/badge.svg)](https://github.com/ahmadnugroho-asp/farm-scheduler/actions/workflows/deploy.yml)

A web application for managing farm tasks with PIN-based authentication, powered by Google Sheets as the backend database.

## Features

- **Real-time Task Management**: View and update farm tasks with automatic 30-second refresh
- **PIN-based Authentication**: Secure 6-digit PIN system for status updates
- **Google Sheets Integration**: Uses Google Sheets as a backend database
- **Status Tracking**: Track tasks through four states: New, In Progress, Pending, Done
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Offline Fallback**: Automatic fallback to mock data when server is unavailable

## Architecture

- **Backend**: Node.js with Express
- **Frontend**: Vanilla React (via CDN, no build process required)
- **Database**: Google Sheets API (v4)
- **Authentication**: Google Service Account with OAuth2

## Prerequisites

- Node.js (v14 or higher)
- Google Cloud Account
- Google Service Account credentials
- A Google Sheets spreadsheet

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ahmadnugroho-asp/farm-scheduler.git
cd farm-scheduler
```

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Google Sheets Setup

#### Create a Google Sheets Document

Create a new Google Sheets document with two sheets:

**Tasks Sheet** (with columns A-I):
- Column A: Row Index (2, 3, 4, ...)
- Column B: Date Start
- Column C: Time Start
- Column D: Date Finish
- Column E: Time Finish
- Column F: Task Name
- Column G: Task Description
- Column H: Person Assigned
- Column I: Status

**Users Sheet** (with columns A-B):
- Column A: PIN (6-digit code)
- Column B: Name

#### Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and click "Create"
   - Grant it the "Editor" role
   - Click "Done"
5. Create a JSON key:
   - Click on the service account you just created
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" and click "Create"
   - Save this file as `service-account.json` in the `server/` directory

#### Share Your Spreadsheet

1. Open your Google Sheets document
2. Click the "Share" button
3. Add the service account email (found in `service-account.json` under `client_email`)
4. Give it "Editor" permissions

### 4. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
cat > .env << EOF
SHEET_ID="YOUR_GOOGLE_SHEET_ID_HERE"
PORT=3001
EOF
```

To find your Google Sheet ID:
- Open your Google Sheets document
- Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
- Copy the `SHEET_ID` part

### 5. Run the Application

```bash
cd server
node server.js
```

The application will be available at `http://localhost:3001`

## Usage

1. Open your browser and navigate to `http://localhost:3001`
2. View all active and completed tasks
3. Click "Update Status" on any task
4. Select the new status and enter your 6-digit PIN
5. The task status will be updated in real-time

## Project Structure

```
farm-scheduler/
├── client/
│   └── index.html          # Frontend application (React via CDN)
├── server/
│   ├── server.js           # Express backend
│   ├── package.json        # Dependencies
│   ├── .env               # Environment variables (not in repo)
│   └── service-account.json # Google credentials (not in repo)
├── CLAUDE.md              # AI coding assistant documentation
├── .gitignore
└── README.md
```

## Configuration

### Server Configuration

Edit `server/server.js` to customize:

- `STATUS_COLUMN_LETTER`: The column letter for task status (default: 'I')
- `PORT`: Server port via environment variable (default: 3001)

### Frontend Configuration

The frontend automatically polls for updates every 30 seconds. To change this, edit the `refreshInterval` in `client/index.html` (line 311).

## API Endpoints

### GET /api/tasks

Retrieves all tasks and user PINs from Google Sheets.

**Response:**
```json
{
  "tasks": [
    {
      "id": 2,
      "dateStart": "2025-10-10",
      "timeStart": "07:00",
      "dateFinish": "2025-10-10",
      "timeFinish": "10:00",
      "taskName": "Task Name",
      "taskDescription": "Description",
      "personAssigned": "John Doe",
      "status": "New"
    }
  ],
  "pins": [
    {
      "pin": "123456",
      "name": "John Doe"
    }
  ]
}
```

### POST /api/update-status

Updates a task status with PIN authentication.

**Request Body:**
```json
{
  "taskId": 2,
  "newStatus": "Inprogress",
  "pin": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "updaterName": "John Doe"
}
```

## Security Considerations

- Never commit `.env` or `service-account.json` files to version control
- Keep your Google Service Account credentials secure
- Use strong, unique 6-digit PINs
- Consider implementing HTTPS in production
- Limit service account permissions to only what's necessary

## Troubleshooting

### "SHEET_ID is missing in .env file"
Make sure you've created a `.env` file in the `server/` directory with your Google Sheet ID.

### "Failed to read PIN data from the Users sheet"
Ensure your Users sheet has the correct structure (Column A: PIN, Column B: Name).

### "Invalid 6-digit PIN"
Check that the PIN exists in your Users sheet and matches exactly.

### Mock data is showing
This means the server isn't running or the Google Sheets API isn't configured correctly. Check the browser console for detailed error messages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Acknowledgments

Built with Claude Code - AI-powered coding assistant
