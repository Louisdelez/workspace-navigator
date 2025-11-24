/**
 * Session Manager
 * Handles session persistence with crash recovery and error handling
 *
 * Features:
 * - Automatic session saving with debouncing
 * - Session restoration with validation
 * - Corrupted session recovery
 * - Missing workspace/tab cleanup
 */

import type { WorkspaceEngine } from '../core/workspace/workspace-engine';
import type { SessionState } from '../types/entities';

const SAVE_DEBOUNCE_MS = 500;

export interface SessionSaveOptions {
  activeWorkspaceId: string | null;
  openTabs: string[];
  activeTabIndex: number;
  aiProvider: 'chatgpt' | 'claude' | 'gemini' | 'none';
}

export class SessionManager {
  private engine: WorkspaceEngine;
  private saveTimer: NodeJS.Timeout | null = null;
  private lastSavedState: SessionSaveOptions | null = null;

  constructor(engine: WorkspaceEngine) {
    this.engine = engine;
  }

  /**
   * Save current session state
   * Debounced to avoid excessive disk writes
   */
  saveSession(options: SessionSaveOptions): void {
    // Cancel pending save
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    // Debounce saves
    this.saveTimer = setTimeout(() => {
      this.performSave(options);
    }, SAVE_DEBOUNCE_MS);
  }

  /**
   * Immediately save session state without debouncing
   * Use for critical operations like app shutdown
   */
  saveSessionImmediate(options: SessionSaveOptions): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.performSave(options);
  }

  /**
   * Perform the actual save operation
   */
  private performSave(options: SessionSaveOptions): void {
    try {
      // Skip save if nothing changed
      if (this.lastSavedState && this.isStateEqual(options, this.lastSavedState)) {
        return;
      }

      this.engine.saveSession(
        options.activeWorkspaceId,
        options.openTabs,
        options.activeTabIndex,
        options.aiProvider
      );

      this.lastSavedState = { ...options };
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
      // Don't throw - session save failures should not crash the app
    }
  }

  /**
   * Restore session state with validation and cleanup
   */
  restoreSession(): SessionState {
    try {
      const session = this.engine.restoreSession();

      // Validate and clean up the session
      return this.validateAndCleanSession(session);
    } catch (error) {
      console.error('Failed to restore session, returning default:', error);
      return this.getDefaultSession();
    }
  }

  /**
   * Validate session state and clean up invalid references
   */
  private validateAndCleanSession(session: SessionState): SessionState {
    const cleanedSession = { ...session };

    // Validate active workspace exists
    if (cleanedSession.activeWorkspaceId) {
      const workspace = this.engine.getWorkspace(cleanedSession.activeWorkspaceId);
      if (!workspace) {
        console.warn(`Active workspace ${cleanedSession.activeWorkspaceId} not found, clearing`);
        cleanedSession.activeWorkspaceId = null;
      }
    }

    // Validate open tabs exist
    const validTabs: string[] = [];
    for (const tabId of cleanedSession.openTabs) {
      const item = this.engine.getItem(tabId);
      if (item) {
        validTabs.push(tabId);
      } else {
        console.warn(`Tab item ${tabId} not found, removing from session`);
      }
    }

    cleanedSession.openTabs = validTabs;

    // Validate active tab index
    if (cleanedSession.activeTabIndex >= validTabs.length) {
      cleanedSession.activeTabIndex = Math.max(0, validTabs.length - 1);
    }

    if (cleanedSession.activeTabIndex < 0) {
      cleanedSession.activeTabIndex = 0;
    }

    // Validate AI provider
    const validProviders: Array<'chatgpt' | 'claude' | 'gemini' | 'none'> = [
      'chatgpt',
      'claude',
      'gemini',
      'none'
    ];
    if (!validProviders.includes(cleanedSession.aiProvider)) {
      console.warn(`Invalid AI provider ${cleanedSession.aiProvider}, resetting to none`);
      cleanedSession.aiProvider = 'none';
    }

    // If session was modified during cleanup, save the cleaned version
    if (!this.isSessionEqual(session, cleanedSession)) {
      console.log('Session was cleaned up, saving corrected version');
      this.engine.saveSession(
        cleanedSession.activeWorkspaceId,
        cleanedSession.openTabs,
        cleanedSession.activeTabIndex,
        cleanedSession.aiProvider
      );
    }

    return cleanedSession;
  }

  /**
   * Get default session state
   */
  private getDefaultSession(): SessionState {
    return {
      id: 1,
      activeWorkspaceId: null,
      openTabs: [],
      activeTabIndex: 0,
      aiProvider: 'none',
      windowState: {
        width: 1400,
        height: 900,
        x: -1,
        y: -1,
        isMaximized: false
      },
      updatedAt: Date.now()
    };
  }

  /**
   * Compare two save options for equality
   */
  private isStateEqual(a: SessionSaveOptions, b: SessionSaveOptions): boolean {
    return (
      a.activeWorkspaceId === b.activeWorkspaceId &&
      a.activeTabIndex === b.activeTabIndex &&
      a.aiProvider === b.aiProvider &&
      a.openTabs.length === b.openTabs.length &&
      a.openTabs.every((tab, index) => tab === b.openTabs[index])
    );
  }

  /**
   * Compare two session states for equality
   */
  private isSessionEqual(a: SessionState, b: SessionState): boolean {
    return (
      a.activeWorkspaceId === b.activeWorkspaceId &&
      a.activeTabIndex === b.activeTabIndex &&
      a.aiProvider === b.aiProvider &&
      a.openTabs.length === b.openTabs.length &&
      a.openTabs.every((tab, index) => tab === b.openTabs[index])
    );
  }

  /**
   * Clear all session state
   * Useful for logout or reset functionality
   */
  clearSession(): void {
    try {
      const defaultSession = this.getDefaultSession();
      this.engine.saveSession(
        defaultSession.activeWorkspaceId,
        defaultSession.openTabs,
        defaultSession.activeTabIndex,
        defaultSession.aiProvider
      );
      this.lastSavedState = null;
      console.log('Session cleared');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }
}
