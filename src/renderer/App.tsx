/**
 * Main App Component - Workspace Navigator
 * Three-column layout: Workspace Panel | Tabs Area | AI Panel
 */

import React, { useState, useEffect } from 'react';
import { WorkspacePanel } from './components/WorkspacePanel';
import { TabsContainer } from './components/TabsContainer';
import { AIPanel } from './components/AIPanel';
import type { Workspace, Item } from '../types/entities';
import './styles/index.css';

export function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [openTabs, setOpenTabs] = useState<Item[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [aiProvider, setAIProvider] = useState<'chatgpt' | 'claude' | 'gemini' | 'none'>('none');

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Save session whenever state changes
  useEffect(() => {
    saveSession();
  }, [activeWorkspace, openTabs, activeTabIndex, aiProvider]);

  async function loadSession() {
    try {
      const session = await window.electronAPI.session.restore();

      // Restore active workspace
      if (session.activeWorkspaceId) {
        const workspace = await window.electronAPI.workspace.get(session.activeWorkspaceId);
        if (workspace) {
          setActiveWorkspace(workspace);
        }
      }

      // Restore open tabs
      const tabs: Item[] = [];
      for (const itemId of session.openTabs) {
        const item = await window.electronAPI.item.get(itemId);
        if (item) {
          tabs.push(item);
        }
      }
      setOpenTabs(tabs);
      setActiveTabIndex(session.activeTabIndex);
      setAIProvider(session.aiProvider);
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  async function saveSession() {
    try {
      await window.electronAPI.session.save(
        activeWorkspace?.id || null,
        openTabs.map(tab => tab.id),
        activeTabIndex,
        aiProvider
      );
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  function handleWorkspaceChange(workspace: Workspace | null) {
    setActiveWorkspace(workspace);
    // Clear tabs when switching workspaces
    setOpenTabs([]);
    setActiveTabIndex(0);
  }

  function handleOpenItem(item: Item) {
    // Check if item is already open
    const existingIndex = openTabs.findIndex(tab => tab.id === item.id);
    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
      return;
    }

    // Add new tab
    setOpenTabs([...openTabs, item]);
    setActiveTabIndex(openTabs.length);
  }

  function handleCloseTab(index: number) {
    const newTabs = openTabs.filter((_, i) => i !== index);
    setOpenTabs(newTabs);

    // Adjust active tab index
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(Math.max(0, newTabs.length - 1));
    }
  }

  function handleUpdateItem(itemId: string, updates: Partial<Item>) {
    // Update in open tabs
    setOpenTabs(tabs =>
      tabs.map(tab =>
        tab.id === itemId ? { ...tab, ...updates } : tab
      )
    );

    // Update in database
    window.electronAPI.item.update(itemId, updates);
  }

  return (
    <div className="app">
      <WorkspacePanel
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onOpenItem={handleOpenItem}
      />

      <TabsContainer
        tabs={openTabs}
        activeIndex={activeTabIndex}
        onTabChange={setActiveTabIndex}
        onCloseTab={handleCloseTab}
        onUpdateItem={handleUpdateItem}
      />

      <AIPanel
        provider={aiProvider}
        onProviderChange={setAIProvider}
      />
    </div>
  );
}
