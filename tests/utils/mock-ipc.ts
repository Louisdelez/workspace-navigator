/**
 * Mock IPC utilities for testing
 */

import { vi } from 'vitest';

/**
 * Create a mock IPC handler that can be used in tests
 */
export function createMockIpcHandler<T = any>(returnValue: T) {
  return vi.fn().mockResolvedValue(returnValue);
}

/**
 * Create a mock IPC handler that rejects with an error
 */
export function createMockIpcError(error: Error) {
  return vi.fn().mockRejectedValue(error);
}

/**
 * Reset all mocked Electron API functions
 */
export function resetElectronAPIMocks() {
  if (global.window?.electronAPI) {
    Object.values(global.window.electronAPI).forEach((api: any) => {
      Object.values(api).forEach((fn: any) => {
        if (typeof fn.mockClear === 'function') {
          fn.mockClear();
        }
      });
    });
  }
}
