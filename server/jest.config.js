module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./__tests__/setupTests.js'],
  verbose: true,
  testTimeout: 5000,
  moduleDirectories: ['node_modules', 'src'],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  clearMocks: true,
  restoreMocks: true,
  modulePaths: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/']
};
