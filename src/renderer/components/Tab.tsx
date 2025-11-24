/**
 * Tab Component
 * Individual tab display with favicon, title, loading state, and close button
 */

import React from 'react';

export interface TabData {
  id: string;
  itemId: string;
  type: 'web' | 'note';
  url?: string;
  title: string;
  favicon?: string | null;
  isLoading: boolean;
}

interface TabProps {
  tab: TabData;
  isActive: boolean;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export function Tab({ tab, isActive, onSelect, onClose }: TabProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(tab.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const getIcon = () => {
    if (tab.isLoading) {
      return <div className="tab-loading-spinner">⟳</div>;
    }

    if (tab.favicon) {
      return <img src={tab.favicon} className="tab-favicon" alt="" />;
    }

    // Default icons based on type
    return <span className="tab-icon">{tab.type === 'note' ? '📝' : '🌐'}</span>;
  };

  return (
    <div
      className={`tab ${isActive ? 'tab-active' : ''}`}
      onClick={handleClick}
      title={tab.title}
    >
      <div className="tab-icon-container">
        {getIcon()}
      </div>
      <div className="tab-title">{tab.title}</div>
      <button
        className="tab-close-button"
        onClick={handleClose}
        title="Close tab"
        aria-label="Close tab"
      >
        ×
      </button>
    </div>
  );
}
