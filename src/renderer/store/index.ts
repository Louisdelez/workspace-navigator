/**
 * Application State Management
 * Central store for application state
 *
 * TODO (T034-T036): Implement state management with Zustand or similar
 */

/**
 * Application state interface
 * TODO (T034): Define complete state shape
 */
export interface AppState {
  // Workspace state
  activeWorkspaceId: string | null;
  workspaces: any[];

  // Tab state
  openTabs: string[];
  activeTabIndex: number;

  // AI provider state
  aiProvider: 'claude' | 'chatgpt' | 'gemini';

  // UI state
  leftPanelWidth: number;
  rightPanelWidth: number;
}

/**
 * State actions
 * TODO (T035): Implement state actions
 */
export interface AppActions {
  // Workspace actions
  setActiveWorkspace(id: string): void;
  loadWorkspaces(): Promise<void>;

  // Tab actions
  openTab(itemId: string): void;
  closeTab(index: number): void;
  setActiveTab(index: number): void;

  // Settings actions
  setAIProvider(provider: 'claude' | 'chatgpt' | 'gemini'): void;
}

/**
 * Create the application store
 * TODO (T036): Implement with Zustand
 */
export function createStore(): any {
  throw new Error('Store not implemented - will be implemented in T034-T036');
}
