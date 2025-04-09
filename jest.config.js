module.exports = {
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'scripts'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue'],
  transform: {
    '^.+\\.(js)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-transform-modules-commonjs'],
        sourceType: 'unambiguous'
      }
    ]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/scripts/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/**/*.test.js',
    '!scripts/setup/**/*.js'
  ],
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/']
};
