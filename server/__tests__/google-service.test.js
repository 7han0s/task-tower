/**
 * google-service.test.js
 * Tests for Google Sheets API integration
 */

const { googleService } = require('../src/google-service');

describe('Google Service', () => {
    let mockSheets;
    let mockAuth;

    beforeEach(() => {
        // Get mock instances from googleapis
        mockSheets = require('googleapis').sheets();
        mockAuth = require('googleapis').auth.GoogleAuth;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should initialize Google Sheets API', async () => {
            const result = await googleService.initialize();

            expect(mockAuth).toHaveBeenCalled();
            expect(result).toHaveProperty('sheets');
            expect(result).toHaveProperty('client');
        });

        it('should reuse existing client', async () => {
            // First initialization
            await googleService.initialize();
            
            // Second initialization should reuse client
            const result = await googleService.initialize();

            expect(mockAuth).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('sheets');
            expect(result).toHaveProperty('client');
        });

        it('should throw error on initialization failure', async () => {
            const error = new Error('API Error');
            mockAuth.mockImplementation(() => {
                throw error;
            });

            await expect(googleService.initialize()).rejects.toThrow('Error initializing Google Sheets API');
        });
    });

    describe('getSheetData', () => {
        it('should fetch data from specified range', async () => {
            const mockData = [['Test', 'Data']];
            mockSheets.spreadsheets.values.get.mockResolvedValue({ data: { values: mockData } });

            const result = await googleService.getSheetData('test-spreadsheet', 'Test!A1:B1');

            expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
                auth: expect.any(Object),
                spreadsheetId: 'test-spreadsheet',
                range: 'Test!A1:B1'
            });
            expect(result).toEqual(mockData);
        });

        it('should throw error on API failure', async () => {
            const error = new Error('API Error');
            mockSheets.spreadsheets.values.get.mockRejectedValue(error);

            await expect(
                googleService.getSheetData('test-spreadsheet', 'Test!A1:B1')
            ).rejects.toThrow('Error getting sheet data');
        });
    });

    describe('updateSheetData', () => {
        it('should update data in specified range', async () => {
            const mockData = [['New', 'Data']];
            mockSheets.spreadsheets.values.update.mockResolvedValue({ data: {} });

            await googleService.updateSheetData('test-spreadsheet', 'Test!A1:B1', mockData);

            expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledWith({
                auth: expect.any(Object),
                spreadsheetId: 'test-spreadsheet',
                range: 'Test!A1:B1',
                valueInputOption: 'RAW',
                resource: { values: mockData }
            });
        });

        it('should throw error on API failure', async () => {
            const error = new Error('API Error');
            mockSheets.spreadsheets.values.update.mockRejectedValue(error);

            await expect(
                googleService.updateSheetData('test-spreadsheet', 'Test!A1:B1', [['Test']])
            ).rejects.toThrow('Error updating sheet data');
        });
    });

    describe('clearSheetData', () => {
        it('should clear data from specified range', async () => {
            mockSheets.spreadsheets.values.clear.mockResolvedValue({ data: {} });

            await googleService.clearSheetData('test-spreadsheet', 'Test!A1:B1');

            expect(mockSheets.spreadsheets.values.clear).toHaveBeenCalledWith({
                auth: expect.any(Object),
                spreadsheetId: 'test-spreadsheet',
                range: 'Test!A1:B1'
            });
        });

        it('should throw error on API failure', async () => {
            const error = new Error('API Error');
            mockSheets.spreadsheets.values.clear.mockRejectedValue(error);

            await expect(
                googleService.clearSheetData('test-spreadsheet', 'Test!A1:B1')
            ).rejects.toThrow('Error clearing sheet data');
        });
    });
});
