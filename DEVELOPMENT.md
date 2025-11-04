# Development Guide

This guide covers setting up the Farm Scheduler for local development and testing.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Using Mock Data](#using-mock-data)
- [Testing](#testing)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

## Quick Start

Get up and running in under 2 minutes:

```bash
# Clone and navigate
git clone https://github.com/ahmadnugroho-asp/farm-scheduler.git
cd farm-scheduler/server

# Run automated setup
./setup-dev.sh

# Choose "Yes" when prompted for mock service account

# Start the server
node server.js
```

Open http://localhost:3001 in your browser.

## Development Setup

### Prerequisites

- **Node.js 18.x or higher**
  ```bash
  node --version  # Should show v18.x or higher
  ```

- **npm** (comes with Node.js)
  ```bash
  npm --version
  ```

### Automated Setup Script

The `setup-dev.sh` script automates the entire setup process:

```bash
cd server
./setup-dev.sh
```

**What it does:**
1. ✅ Checks Node.js version
2. ✅ Installs npm dependencies
3. ✅ Creates `.env` file from template
4. ✅ Optionally creates mock service account
5. ✅ Runs tests to verify setup

### Manual Setup

If you prefer manual setup or the script doesn't work:

#### 1. Install Dependencies

```bash
cd server
npm install
```

#### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env`:
```env
SHEET_ID="your-sheet-id-or-mock-value"
PORT=3001
NODE_ENV=development
```

#### 3. Create Service Account File

**For Development/Testing:**
```bash
cp service-account.json.example service-account.json
```

**For Production:**
Download your real service account JSON from Google Cloud Console and save as `service-account.json`.

## Using Mock Data

### Mock Service Account

The mock service account (`service-account.json.example`) contains fake credentials that won't work with Google Sheets API, but allow the application to start without errors.

**Location:** `server/service-account.json.example`

**Structure:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id-here",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  ...
}
```

### Mock Data Behavior

When using mock credentials:

1. **Server starts successfully** ✅
2. **API calls to Google Sheets fail** ❌
3. **Frontend falls back to mock data** ✅
4. **You can test the UI and interactions** ✅

### Frontend Mock Data

The client automatically uses mock data when the API fails. Mock data is defined in `client/index.html`:

```javascript
const MOCK_DATA = {
  tasks: [
    { id: 2, dateStart: '2025-10-10', ... },
    ...
  ],
  pins: [
    { pin: '123456', name: 'Alice Johnson' },
    ...
  ]
};
```

**Test PINs for Mock Data:**
- `123456` - Alice Johnson
- `987654` - Bob Smith
- `654321` - Charlie Brown

## Testing

### Running Tests

```bash
cd server

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### Test Mock Data

Tests use dedicated mock data located in `server/tests/fixtures/`:

- `mockData.js` - Mock Google Sheets data
- `mock-service-account.json` - Mock credentials for tests

Tests automatically use these mocks, no setup required!

### Viewing Test Coverage

```bash
npm test

# Open coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Development Workflow

### Starting Development

1. **Start the server:**
   ```bash
   cd server
   node server.js
   ```

2. **Access the application:**
   - Frontend: http://localhost:3001
   - API: http://localhost:3001/api/tasks

3. **Make changes:**
   - Edit `server/server.js` for backend changes
   - Edit `client/index.html` for frontend changes
   - Restart server to see backend changes
   - Refresh browser to see frontend changes

### Hot Reloading (Optional)

Install nodemon for automatic server restart:

```bash
npm install -g nodemon

# Start with nodemon
nodemon server.js
```

### Development with Real Google Sheets

1. **Create Google Service Account** (see README.md)

2. **Replace mock files with real ones:**
   ```bash
   # Backup mocks first
   mv service-account.json service-account.json.mock

   # Add your real service account
   # (download from Google Cloud Console)
   mv ~/Downloads/your-service-account-*.json service-account.json
   ```

3. **Update `.env` with real Sheet ID:**
   ```env
   SHEET_ID="1abc123def456..."  # Your actual Google Sheet ID
   ```

4. **Share Google Sheet with service account email**

5. **Restart server**

### Switching Between Mock and Real Data

**To Mock:**
```bash
cp service-account.json.example service-account.json
# Set fake SHEET_ID in .env
```

**To Real:**
```bash
# Use your real service-account.json
# Set real SHEET_ID in .env
```

## Project Structure

```
farm-scheduler/
├── client/
│   └── index.html              # Frontend (React via CDN)
├── server/
│   ├── server.js               # Backend server
│   ├── package.json            # Dependencies
│   ├── .env                    # Environment config (not in git)
│   ├── .env.example            # Environment template
│   ├── service-account.json    # Google credentials (not in git)
│   ├── service-account.json.example  # Mock credentials
│   ├── setup-dev.sh            # Setup script
│   ├── jest.config.js          # Test configuration
│   └── tests/                  # Test files
│       ├── unit/               # Unit tests
│       ├── integration/        # Integration tests
│       └── fixtures/           # Mock data for tests
├── .github/
│   └── workflows/              # CI/CD pipelines
├── README.md                   # User documentation
├── DEVELOPMENT.md              # This file
└── CLAUDE.md                   # AI assistant guide
```

## Troubleshooting

### Server Won't Start

**Problem:** `Error: SHEET_ID is missing in .env file`

**Solution:**
```bash
# Check if .env exists
ls -la .env

# If not, create it
cp .env.example .env
```

---

**Problem:** `Cannot find module './service-account.json'`

**Solution:**
```bash
# Use mock for development
cp service-account.json.example service-account.json
```

### Tests Failing

**Problem:** `npm test` fails with module errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npx jest --clearCache
npm test
```

### Mock Data Not Showing

**Problem:** Frontend shows loading spinner forever

**Solution:**
1. Check browser console for errors (F12)
2. Verify server is running on port 3001
3. Try accessing API directly: http://localhost:3001/api/tasks

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 node server.js
```

### Google Sheets API Errors

**Problem:** `Google API Error: Invalid spreadsheet ID`

**Solution:**
1. Verify SHEET_ID in `.env` is correct
2. Ensure Sheet is shared with service account email
3. Check service account has "Editor" permissions
4. Verify Google Sheets API is enabled in Google Cloud Console

## Development Tips

### 1. Use Mock Data for Frontend Work

When working on frontend features, use mock data to avoid API rate limits and speed up development.

### 2. Write Tests First (TDD)

Before implementing a feature:
```bash
# Create test file
touch server/tests/unit/myFeature.test.js

# Write failing test
npm run test:watch

# Implement feature until test passes
```

### 3. Check Code Before Pushing

```bash
# Run all tests
npm test

# Check syntax
node --check server.js

# Run security audit
npm audit
```

### 4. Use Environment Variables

Never hardcode configuration:
```javascript
// ❌ Bad
const sheetId = '1abc123...';

// ✅ Good
const sheetId = process.env.SHEET_ID;
```

### 5. Keep Dependencies Updated

```bash
# Check for updates
npm outdated

# Update patch versions safely
npm update

# Check security vulnerabilities
npm audit
npm audit fix
```

## Additional Resources

- [Main README](README.md) - Setup and usage
- [Test Documentation](server/tests/README.md) - Testing guide
- [CI/CD Guide](.github/CICD_GUIDE.md) - GitHub Actions workflows
- [CLAUDE.md](CLAUDE.md) - AI coding assistant guide

## Getting Help

- **Issues**: https://github.com/ahmadnugroho-asp/farm-scheduler/issues
- **Discussions**: https://github.com/ahmadnugroho-asp/farm-scheduler/discussions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

See workflow status: https://github.com/ahmadnugroho-asp/farm-scheduler/actions
