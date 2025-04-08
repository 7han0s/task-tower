// Jest setup file
import '@testing-library/jest-dom';

// Mock Supabase client
global.supabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis()
};

// Mock WebSocket
global.WebSocket = class {
  constructor() {}
  send() {}
  close() {}
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock requestAnimationFrame
window.requestAnimationFrame = callback => setTimeout(callback, 0);

// Mock IntersectionObserver
window.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
