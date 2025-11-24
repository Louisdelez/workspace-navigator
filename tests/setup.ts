/**
 * Vitest setup file
 * Runs before all tests
 */

import '@testing-library/jest-dom';

// Mock Electron modules for unit tests
const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn()
};

// @ts-expect-error - Mocking Electron API
global.window.electronAPI = {
  workspace: {
    getAll: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  folder: {
    create: vi.fn(),
    getTree: vi.fn(),
    move: vi.fn(),
    delete: vi.fn()
  },
  item: {
    createWeb: vi.fn(),
    createNote: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    delete: vi.fn(),
    getInFolder: vi.fn()
  },
  session: {
    save: vi.fn(),
    restore: vi.fn()
  }
};
