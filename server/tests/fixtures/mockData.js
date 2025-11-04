// Mock data for testing

const mockTasksSheetData = [
  ['Row Index', 'Date Start', 'Time Start', 'Date Finish', 'Time Finish', 'Task Name', 'Task Description', 'Person Assigned', 'Status'],
  ['2', '2025-10-10', '07:00', '2025-10-10', '10:00', 'Irrigate Field 3', 'Check pump flow and water distribution', 'Alice Johnson', 'New'],
  ['3', '2025-10-10', '10:00', '2025-10-10', '14:00', 'Harvest Apples', 'Pick 50 bushels from the West orchard', 'Bob Smith', 'Inprogress'],
  ['4', '2025-10-10', '14:00', '2025-10-10', '16:00', 'Tractor Maintenance', 'Oil change and tire pressure check', 'Charlie Brown', 'Pending'],
  ['5', '2025-10-09', '08:00', '2025-10-09', '11:00', 'Inspect Fences', 'Walk the perimeter of Field 1', 'Alice Johnson', 'Done'],
];

const mockUsersSheetData = [
  ['PIN', 'Name'],
  ['123456', 'Alice Johnson'],
  ['987654', 'Bob Smith'],
  ['654321', 'Charlie Brown'],
];

const mockParsedTasks = [
  {
    id: 2,
    'Date Start': '2025-10-10',
    'Time Start': '07:00',
    'Date Finish': '2025-10-10',
    'Time Finish': '10:00',
    'Task Name': 'Irrigate Field 3',
    'Task Description': 'Check pump flow and water distribution',
    'Person Assigned': 'Alice Johnson',
    'Status': 'New'
  },
  {
    id: 3,
    'Date Start': '2025-10-10',
    'Time Start': '10:00',
    'Date Finish': '2025-10-10',
    'Time Finish': '14:00',
    'Task Name': 'Harvest Apples',
    'Task Description': 'Pick 50 bushels from the West orchard',
    'Person Assigned': 'Bob Smith',
    'Status': 'Inprogress'
  },
  {
    id: 4,
    'Date Start': '2025-10-10',
    'Time Start': '14:00',
    'Date Finish': '2025-10-10',
    'Time Finish': '16:00',
    'Task Name': 'Tractor Maintenance',
    'Task Description': 'Oil change and tire pressure check',
    'Person Assigned': 'Charlie Brown',
    'Status': 'Pending'
  },
  {
    id: 5,
    'Date Start': '2025-10-09',
    'Time Start': '08:00',
    'Date Finish': '2025-10-09',
    'Time Finish': '11:00',
    'Task Name': 'Inspect Fences',
    'Task Description': 'Walk the perimeter of Field 1',
    'Person Assigned': 'Alice Johnson',
    'Status': 'Done'
  }
];

const mockParsedPins = [
  { id: 123456, 'PIN': '123456', 'Name': 'Alice Johnson' },
  { id: 987654, 'PIN': '987654', 'Name': 'Bob Smith' },
  { id: 654321, 'PIN': '654321', 'Name': 'Charlie Brown' },
];

module.exports = {
  mockTasksSheetData,
  mockUsersSheetData,
  mockParsedTasks,
  mockParsedPins,
};
