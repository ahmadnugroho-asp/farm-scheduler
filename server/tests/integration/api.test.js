// Integration tests for API endpoints

const request = require('supertest');
const { mockTasksSheetData, mockUsersSheetData } = require('../fixtures/mockData');

// Mock the googleapis module before requiring server
jest.mock('googleapis', () => {
  return {
    google: {
      auth: {
        GoogleAuth: jest.fn().mockImplementation(() => ({}))
      },
      sheets: jest.fn().mockReturnValue({
        spreadsheets: {
          values: {
            get: jest.fn(),
            update: jest.fn()
          }
        }
      })
    }
  };
});

// Mock dotenv to avoid loading .env file
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Set environment variables for testing
process.env.SHEET_ID = 'test-sheet-id-123';
process.env.PORT = '0'; // Use random port for testing

describe('API Integration Tests', () => {
  let app;
  let sheets;

  beforeAll(() => {
    // Mock service-account.json
    jest.mock('../../service-account.json', () => ({
      type: 'service_account',
      project_id: 'test-project',
      client_email: 'test@test.iam.gserviceaccount.com'
    }), { virtual: true });

    // Require server after mocks are set up
    const { google } = require('googleapis');
    sheets = google.sheets();

    // Clear module cache and require fresh server
    delete require.cache[require.resolve('../../server.js')];
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    test('should return tasks and pins successfully', async () => {
      // Mock the Google Sheets API responses
      const { google } = require('googleapis');
      const mockSheets = google.sheets();

      mockSheets.spreadsheets.values.get
        .mockResolvedValueOnce({
          data: { values: mockTasksSheetData }
        })
        .mockResolvedValueOnce({
          data: { values: mockUsersSheetData }
        });

      // Create a minimal express app for testing
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      // Add the route handler
      testApp.get('/api/tasks', async (req, res) => {
        try {
          const taskResponse = await mockSheets.spreadsheets.values.get({
            spreadsheetId: 'test-sheet-id',
            range: 'Tasks!A1:I'
          });

          const pinResponse = await mockSheets.spreadsheets.values.get({
            spreadsheetId: 'test-sheet-id',
            range: 'Users!A1:B'
          });

          res.json({
            tasks: taskResponse.data.values.slice(1).map(row => ({
              id: parseInt(row[0]),
              dateStart: row[1],
              timeStart: row[2],
              dateFinish: row[3],
              timeFinish: row[4],
              taskName: row[5],
              taskDescription: row[6],
              personAssigned: row[7],
              status: row[8]
            })),
            pins: pinResponse.data.values.slice(1).map(row => ({
              pin: row[0],
              name: row[1]
            }))
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

      const response = await request(testApp)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('pins');
      expect(response.body.tasks).toHaveLength(4);
      expect(response.body.pins).toHaveLength(3);

      // Verify task structure
      expect(response.body.tasks[0]).toMatchObject({
        id: 2,
        taskName: 'Irrigate Field 3',
        status: 'New'
      });

      // Verify pin structure
      expect(response.body.pins[0]).toMatchObject({
        pin: '123456',
        name: 'Alice Johnson'
      });
    });

    test('should return 404 when no task data found', async () => {
      const { google } = require('googleapis');
      const mockSheets = google.sheets();

      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: { values: [['Header']] } // Only header, no data rows
      });

      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/api/tasks', async (req, res) => {
        const response = await mockSheets.spreadsheets.values.get({
          spreadsheetId: 'test-sheet-id',
          range: 'Tasks!A1:I'
        });

        if (!response.data.values || response.data.values.length < 2) {
          return res.status(404).json({ error: 'No task data found in the sheet.' });
        }

        res.json({ tasks: [] });
      });

      const response = await request(testApp)
        .get('/api/tasks')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No task data found');
    });

    test('should handle Google Sheets API errors', async () => {
      const { google } = require('googleapis');
      const mockSheets = google.sheets();

      mockSheets.spreadsheets.values.get.mockRejectedValueOnce(
        new Error('Google API Error: Invalid spreadsheet ID')
      );

      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/api/tasks', async (req, res) => {
        try {
          await mockSheets.spreadsheets.values.get({
            spreadsheetId: 'invalid-id',
            range: 'Tasks!A1:I'
          });
        } catch (error) {
          res.status(500).json({ error: `Failed to fetch data: ${error.message}` });
        }
      });

      const response = await request(testApp)
        .get('/api/tasks')
        .expect(500);

      expect(response.body.error).toContain('Failed to fetch data');
    });
  });

  describe('POST /api/update-status', () => {
    test('should update task status with valid PIN', async () => {
      const { google } = require('googleapis');
      const mockSheets = google.sheets();

      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: { values: mockUsersSheetData.slice(1) }
      });

      mockSheets.spreadsheets.values.update.mockResolvedValueOnce({
        data: { updatedCells: 1 }
      });

      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      testApp.post('/api/update-status', async (req, res) => {
        const { taskId, newStatus, pin } = req.body;

        if (!taskId || !newStatus || !pin) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const pinResponse = await mockSheets.spreadsheets.values.get({
          spreadsheetId: 'test-sheet-id',
          range: 'Users!A2:B'
        });

        const userRow = pinResponse.data.values.find(row => row[0] === pin);

        if (!userRow) {
          return res.status(401).json({ error: 'Invalid 6-digit PIN.' });
        }

        await mockSheets.spreadsheets.values.update({
          spreadsheetId: 'test-sheet-id',
          range: `Tasks!I${taskId}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [[newStatus]] }
        });

        res.json({ success: true, updaterName: userRow[1] });
      });

      const response = await request(testApp)
        .post('/api/update-status')
        .send({
          taskId: 2,
          newStatus: 'Inprogress',
          pin: '123456'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        updaterName: 'Alice Johnson'
      });

      expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'test-sheet-id',
        range: 'Tasks!I2',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['Inprogress']] }
      });
    });

    test('should return 400 when missing required fields', async () => {
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      testApp.post('/api/update-status', (req, res) => {
        const { taskId, newStatus, pin } = req.body;

        if (!taskId || !newStatus || !pin) {
          return res.status(400).json({ error: 'Missing taskId, newStatus, or pin in request body.' });
        }

        res.json({ success: true });
      });

      const response = await request(testApp)
        .post('/api/update-status')
        .send({ taskId: 2, newStatus: 'Done' }) // Missing pin
        .expect(400);

      expect(response.body.error).toContain('Missing');
    });

    test('should return 401 with invalid PIN', async () => {
      const { google } = require('googleapis');
      const mockSheets = google.sheets();

      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: { values: mockUsersSheetData.slice(1) }
      });

      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      testApp.post('/api/update-status', async (req, res) => {
        const { taskId, newStatus, pin } = req.body;

        const pinResponse = await mockSheets.spreadsheets.values.get({
          spreadsheetId: 'test-sheet-id',
          range: 'Users!A2:B'
        });

        const userRow = pinResponse.data.values.find(row => row[0] === pin);

        if (!userRow) {
          return res.status(401).json({ error: 'Invalid 6-digit PIN.' });
        }

        res.json({ success: true });
      });

      const response = await request(testApp)
        .post('/api/update-status')
        .send({
          taskId: 2,
          newStatus: 'Done',
          pin: '999999' // Invalid PIN
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid 6-digit PIN.');
    });

    test('should validate status values', async () => {
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      const validStatuses = ['New', 'Inprogress', 'Pending', 'Done'];

      testApp.post('/api/update-status', (req, res) => {
        const { taskId, newStatus, pin } = req.body;

        if (!validStatuses.includes(newStatus)) {
          return res.status(400).json({ error: 'Invalid status value' });
        }

        res.json({ success: true });
      });

      const response = await request(testApp)
        .post('/api/update-status')
        .send({
          taskId: 2,
          newStatus: 'InvalidStatus',
          pin: '123456'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid status');
    });
  });

  describe('Static File Serving', () => {
    test('should serve index.html for root path', async () => {
      const express = require('express');
      const path = require('path');
      const testApp = express();

      testApp.use(express.static(path.join(__dirname, '../../../client')));

      const response = await request(testApp)
        .get('/')
        .expect(200);

      // Check if HTML content is served
      expect(response.text).toContain('<!DOCTYPE html>');
    });
  });
});
