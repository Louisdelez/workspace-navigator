/**
 * Tabs Container Component
 * Center area showing open tabs and their content
 */

import React from 'react';
import { MarkdownEditor } from './MarkdownEditor';
import { WebView } from './WebView';
import type { Item, NoteItem, WebItem } from '../../types/entities';
import { isNoteItem, isWebItem } from '../utils/type-guards';

interface TabsContainerProps {
  tabs: Item[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  onCloseTab: (index: number) => void;
  onUpdateItem: (itemId: string, updates: Partial<Item>) => void;
}

export function TabsContainer({
  tabs,
  activeIndex,
  onTabChange,
  onCloseTab,
  onUpdateItem
}: TabsContainerProps) {
  const activeTab = tabs[activeIndex];

  return (
    <div className="tabs-container">
      <div className="tabs-bar">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tab ${index === activeIndex ? 'active' : ''}`}
            onClick={() => onTabChange(index)}
          >
            <span className="tab-title">{tab.title}</span>
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(index);
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>

      <div className="tab-content">
        {activeTab ? (
          isNoteItem(activeTab) ? (
            <MarkdownEditor
              item={activeTab}
              onUpdate={(content) => onUpdateItem(activeTab.id, { content })}
            />
          ) : isWebItem(activeTab) ? (
            <WebView item={activeTab} />
          ) : null
        ) : (
          <div className="empty-state">
            <p>No tabs open. Select an item from the workspace to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
