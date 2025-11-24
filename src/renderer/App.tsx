/**
 * Main App Component - Workspace Navigator
 * Three-column layout: Workspace Panel | Tabs Area | AI Panel
 * T053: Optimized with lazy loading for faster startup
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { WorkspacePanel } from './components/WorkspacePanel';
import { TabsContainer } from './components/TabsContainer';
import type { Workspace, Item } from '../types/entities';
import { useKeyboardShortcuts, type ShortcutHandler } from './hooks/useKeyboardShortcuts';
import './styles/index.css';

// T053: Lazy load heavy components that aren't needed immediately
const AIPanel = lazy(() => import('./components/AIPanel').then(m => ({ default: m.AIPanel })));
const ShortcutsHelp = lazy(() => import('./components/ShortcutsHelp').then(m => ({ default: m.ShortcutsHelp })));

export function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [aiProvider, setAIProvider] = useState<'chatgpt' | 'claude' | 'gemini' | 'custom' | 'none'>('none');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Save session when AI provider changes (tabs are managed by TabManager)
  useEffect(() => {
    if (activeWorkspace) {
      saveSession();
    }
  }, [aiProvider]);

  async function loadSession() {
    try {
      const session = await window.electronAPI.session.restore();

      // Restore active workspace
      if (session.activeWorkspaceId) {
        const workspace = await window.electronAPI.workspace.get(session.activeWorkspaceId);
        if (workspace) {
          setActiveWorkspace(workspace);
          // Set workspace context for tab manager
          await window.electronAPI.tab.setWorkspace(workspace.id);
        }
      }

      // Restore open tabs (handled by TabManager now)
      // The TabManager will restore tabs from session

      setAIProvider(session.aiProvider);
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  async function saveSession() {
    try {
      // Get current tabs from TabManager
      const tabs = await window.electronAPI.tab.getAll();
      const activeTab = await window.electronAPI.tab.getActive();
      const activeTabIndex = activeTab ? tabs.findIndex(t => t.id === activeTab.id) : 0;

      await window.electronAPI.session.save(
        activeWorkspace?.id || null,
        tabs.map(tab => tab.itemId),
        activeTabIndex,
        aiProvider
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  async function handleWorkspaceChange(workspace: Workspace | null) {
    // T049: Close all tabs when switching workspaces for isolation
    try {
      const tabs = await window.electronAPI.tab.getAll();
      for (const tab of tabs) {
        await window.electronAPI.tab.close(tab.id);
      }
    } catch (error) {
      console.error('Failed to close tabs:', error);
    }

    setActiveWorkspace(workspace);

    // Set workspace context for tab manager
    await window.electronAPI.tab.setWorkspace(workspace?.id || null);

    // Save session with new workspace
    await saveSession();
  }

  async function handleOpenItem(item: Item) {
    try {
      // Use TabManager to open the item
      await window.electronAPI.tab.open(item.id);
    } catch (error) {
      console.error('Failed to open item:', error);
      alert('Failed to open item');
    }
  }

  async function handleUpdateItem(itemId: string, updates: Partial<Item>) {
    try {
      // Update in database
      await window.electronAPI.item.update(itemId, updates);
      // TabManager will receive the update through its event handlers
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  }

  // T051: Keyboard Shortcuts
  const shortcuts: ShortcutHandler[] = [
    // Close active tab (Cmd/Ctrl+W)
    {
      key: 'w',
      ctrlOrCmd: true,
      handler: async () => {
        try {
          const activeTab = await window.electronAPI.tab.getActive();
          if (activeTab) {
            await window.electronAPI.tab.close(activeTab.id);
          }
        } catch (error) {
          console.error('Failed to close tab:', error);
        }
      },
      description: 'Close active tab',
      category: 'tabs'
    },
    // Reload active tab (Cmd/Ctrl+R)
    {
      key: 'r',
      ctrlOrCmd: true,
      handler: async () => {
        try {
          await window.electronAPI.tab.reload();
        } catch (error) {
          console.error('Failed to reload tab:', error);
        }
      },
      description: 'Reload active tab',
      category: 'navigation'
    },
    // Go back (Alt+Left)
    {
      key: 'ArrowLeft',
      alt: true,
      handler: async () => {
        try {
          await window.electronAPI.tab.goBack();
        } catch (error) {
          console.error('Failed to go back:', error);
        }
      },
      description: 'Go back',
      category: 'navigation'
    },
    // Go forward (Alt+Right)
    {
      key: 'ArrowRight',
      alt: true,
      handler: async () => {
        try {
          await window.electronAPI.tab.goForward();
        } catch (error) {
          console.error('Failed to go forward:', error);
        }
      },
      description: 'Go forward',
      category: 'navigation'
    },
    // Show shortcuts help (F1)
    {
      key: 'F1',
      handler: () => setShowShortcutsHelp(true),
      description: 'Show keyboard shortcuts',
      category: 'general'
    },
    // Close shortcuts help (Escape)
    {
      key: 'Escape',
      handler: () => setShowShortcutsHelp(false),
      description: 'Close dialogs',
      category: 'general'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="app">
      <WorkspacePanel
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onOpenItem={handleOpenItem}
      />

      <TabsContainer
        onUpdateItem={handleUpdateItem}
      />

      {/* T053: Suspense boundaries for lazy-loaded components */}
      <Suspense fallback={<div className="loading-panel">Loading AI Panel...</div>}>
        <AIPanel
          provider={aiProvider}
          onProviderChange={setAIProvider}
        />
      </Suspense>

      {showShortcutsHelp && (
        <Suspense fallback={<div className="loading-dialog">Loading...</div>}>
          <ShortcutsHelp onClose={() => setShowShortcutsHelp(false)} />
        </Suspense>
      )}
    </div>
  );
}
