/**
 * Tab Bar Component
 * Horizontal scrollable container for all open tabs
 */

import React, { useState, useEffect } from 'react';
import { Tab, TabData } from './Tab';

interface TabBarProps {
  onNewTab?: () => void;
}

export function TabBar({ onNewTab }: TabBarProps) {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    // Load initial tabs
    loadTabs();

    // Subscribe to tab events
    window.electronAPI.tab.onEvent((event: any) => {
      switch (event.type) {
        case 'opened':
        case 'closed':
        case 'switched':
        case 'updated':
          // Update tabs list
          if (event.tabs) {
            setTabs(event.tabs);
          }
          if (event.activeTabId !== undefined) {
            setActiveTabId(event.activeTabId);
          }
          break;

        case 'limit-warning':
          // Show warning notification
          console.warn('Tab limit reached! You have 20 or more tabs open.');
          break;
      }
    });
  }, []);

  async function loadTabs() {
    try {
      const allTabs = await window.electronAPI.tab.getAll();
      const activeTab = await window.electronAPI.tab.getActive();

      setTabs(allTabs);
      setActiveTabId(activeTab ? activeTab.id : null);
    } catch (error) {
      console.error('Failed to load tabs:', error);
    }
  }

  async function handleSelectTab(tabId: string) {
    try {
      await window.electronAPI.tab.switch(tabId);
    } catch (error) {
      console.error('Failed to switch tab:', error);
    }
  }

  async function handleCloseTab(tabId: string) {
    try {
      await window.electronAPI.tab.close(tabId);
    } catch (error) {
      console.error('Failed to close tab:', error);
    }
  }

  function handleNewTab() {
    if (onNewTab) {
      onNewTab();
    }
  }

  return (
    <div className="tab-bar">
      <div className="tab-bar-scroll-container">
        <div className="tab-bar-tabs">
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={handleSelectTab}
              onClose={handleCloseTab}
            />
          ))}
        </div>
      </div>

      {onNewTab && (
        <button
          className="tab-bar-new-button"
          onClick={handleNewTab}
          title="New tab"
          aria-label="New tab"
        >
          +
        </button>
      )}
    </div>
  );
}
