// Unit tests for rowsToObjects helper function

const { mockTasksSheetData, mockUsersSheetData } = require('../fixtures/mockData');

// Helper function to convert sheet rows to objects
// This is extracted from server.js for testing
const rowsToObjects = (rows, header) => {
  if (!rows || rows.length === 0) return [];
  return rows.map(row => {
    let obj = {};
    const rowIndex = row[0];

    header.forEach((key, index) => {
      // Map header index to row index (row[0] is rowIndex, so header[0] maps to row[1])
      obj[key] = row[index + 1] || '';
    });

    obj.id = parseInt(rowIndex, 10);
    return obj;
  });
};

describe('rowsToObjects', () => {
  describe('Task Data Conversion', () => {
    test('should convert task rows to objects correctly', () => {
      const header = mockTasksSheetData[0].slice(1);
      const rows = mockTasksSheetData.slice(1);

      const result = rowsToObjects(rows, header);

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        id: 2,
        'Date Start': '2025-10-10',
        'Time Start': '07:00',
        'Task Name': 'Irrigate Field 3',
        'Status': 'New'
      });
    });

    test('should handle empty rows array', () => {
      const header = ['Task Name', 'Status'];
      const rows = [];

      const result = rowsToObjects(rows, header);

      expect(result).toEqual([]);
    });

    test('should handle null or undefined rows', () => {
      const header = ['Task Name', 'Status'];

      expect(rowsToObjects(null, header)).toEqual([]);
      expect(rowsToObjects(undefined, header)).toEqual([]);
    });

    test('should parse row index as integer ID', () => {
      const header = ['Task Name'];
      const rows = [['42', 'Test Task']];

      const result = rowsToObjects(rows, header);

      expect(result[0].id).toBe(42);
      expect(typeof result[0].id).toBe('number');
    });

    test('should handle missing values with empty strings', () => {
      const header = ['Field1', 'Field2', 'Field3'];
      const rows = [['1', 'Value1']]; // Missing Field2 and Field3

      const result = rowsToObjects(rows, header);

      expect(result[0]).toEqual({
        id: 1,
        Field1: 'Value1',
        Field2: '',
        Field3: ''
      });
    });

    test('should skip first column (Row Index) in object mapping', () => {
      const header = ['Name', 'Age'];
      const rows = [['10', 'John', '30']];

      const result = rowsToObjects(rows, header);

      expect(result[0]).toEqual({
        id: 10,
        Name: 'John',
        Age: '30'
      });
      expect(result[0]['Row Index']).toBeUndefined();
    });
  });

  describe('User Data Conversion', () => {
    test('should convert user rows to objects correctly', () => {
      const header = mockUsersSheetData[0].slice(1);
      const rows = mockUsersSheetData.slice(1);

      const result = rowsToObjects(rows, header);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: 123456,
        'Name': 'Alice Johnson'
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle rows with extra columns', () => {
      const header = ['Col1', 'Col2'];
      const rows = [['1', 'A', 'B', 'C', 'D']]; // Extra columns

      const result = rowsToObjects(rows, header);

      expect(result[0]).toEqual({
        id: 1,
        Col1: 'A',
        Col2: 'B'
      });
    });

    test('should handle non-numeric row index', () => {
      const header = ['Name'];
      const rows = [['abc', 'Test']];

      const result = rowsToObjects(rows, header);

      expect(result[0].id).toBeNaN();
    });

    test('should handle special characters in values', () => {
      const header = ['Task', 'Description'];
      const rows = [['1', 'Task@#$%', 'Desc with "quotes" and \'apostrophes\'']];

      const result = rowsToObjects(rows, header);

      expect(result[0].Task).toBe('Task@#$%');
      expect(result[0].Description).toBe('Desc with "quotes" and \'apostrophes\'');
    });

    test('should handle whitespace in values', () => {
      const header = ['Field'];
      const rows = [['1', '  value with spaces  ']];

      const result = rowsToObjects(rows, header);

      expect(result[0].Field).toBe('  value with spaces  ');
    });
  });
});
