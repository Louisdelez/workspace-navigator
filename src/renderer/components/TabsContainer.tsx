/**
 * Tabs Container Component
 * Center area showing tab bar, navigation controls, and note editor overlay
 * Web content is rendered via BrowserView (managed by main process)
 */

import React, { useState, useEffect } from 'react';
import { TabBar } from './TabBar';
import { NavigationBar } from './NavigationBar';
import { MarkdownEditor } from './MarkdownEditor';
import type { Item, NoteItem } from '../../types/entities';
import { isNoteItem } from '../utils/type-guards';

interface TabsContainerProps {
  onUpdateItem: (itemId: string, updates: Partial<Item>) => void;
}

export function TabsContainer({ onUpdateItem }: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState<any | null>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  useEffect(() => {
    // Load initial active tab
    loadActiveTab();

    // Subscribe to tab events
    window.electronAPI.tab.onEvent((event: any) => {
      if (event.type === 'switched' || event.type === 'opened' || event.type === 'updated') {
        if (event.activeTabId) {
          loadActiveTab();
        }
      } else if (event.type === 'closed') {
        if (event.activeTabId) {
          loadActiveTab();
        } else {
          setActiveTab(null);
          setActiveItem(null);
        }
      }
    });
  }, []);

  async function loadActiveTab() {
    try {
      const tab = await window.electronAPI.tab.getActive();
      setActiveTab(tab);

      if (tab) {
        // Load full item data
        const item = await window.electronAPI.item.get(tab.itemId);
        setActiveItem(item);
      } else {
        setActiveItem(null);
      }
    } catch (error) {
      console.error('Failed to load active tab:', error);
    }
  }

  function handleNewTab() {
    // Show URL input dialog or create new note
    const url = prompt('Enter URL for new tab:');
    if (url && url.trim()) {
      // This will be handled by creating a new web item in the workspace
      // and then opening it as a tab
      console.log('New tab URL:', url);
    }
  }

  return (
    <div className="tabs-container">
      <TabBar onNewTab={handleNewTab} />

      <NavigationBar />

      <div className="tab-content-area">
        {/* Note editor overlay (only shown for note items) */}
        {activeItem && isNoteItem(activeItem) ? (
          <div className="note-editor-overlay">
            <MarkdownEditor
              item={activeItem}
              onUpdate={(content) => onUpdateItem(activeItem.id, { content })}
            />
          </div>
        ) : null}

        {/* Web content is rendered by BrowserView (managed by main process) */}
        {/* BrowserView is positioned in the content area by BrowserViewManager */}

        {!activeTab && (
          <div className="empty-state">
            <p>No tabs open. Select an item from the workspace to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
