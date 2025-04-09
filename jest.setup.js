// Mock window object for Node.js
global.window = {
    location: {
        href: '',
        search: ''
    },
    localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn()
    }
};

// Mock console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
};

global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    ...originalConsole
};

// Mock Google API
global.google = {
    auth: {
        OAuth2: class OAuth2 {
            constructor() {}
            setCredentials() {}
            generateAuthUrl() {
                return 'mock-auth-url';
            }
        }
    },
    sheets: {
        v4: {
            sheets: {
                spreadsheets: {
                    values: {
                        get: jest.fn(() => Promise.resolve({
                            data: {
                                values: [['Test', 'Data']]
                            }
                        })),
                        update: jest.fn(() => Promise.resolve({
                            data: {
                                updates: {
                                    updatedCells: 1
                                }
                            }
                        })),
                        clear: jest.fn(() => Promise.resolve({
                            data: {
                                clearedRange: 'A1:B2'
                            }
                        }))
                    }
                }
            }
        }
    }
};

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    timing: {
        navigationStart: 0
    }
};
