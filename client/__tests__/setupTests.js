// Mock window.fetch for testing
window.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock process.env for React
process.env = {
  ...process.env,
  REACT_APP_API_URL: 'http://localhost:3001',
  REACT_APP_GOOGLE_SPREADSHEET_ID: 'test-spreadsheet-id'
};
