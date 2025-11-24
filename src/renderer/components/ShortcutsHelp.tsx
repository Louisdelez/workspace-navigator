/**
 * ShortcutsHelp Component - T051
 * Displays all available keyboard shortcuts
 */

import React from 'react';

interface ShortcutsHelpProps {
  onClose: () => void;
}

export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: `${cmdKey}+W`, description: 'Close active tab' },
        { keys: `${cmdKey}+R`, description: 'Reload active tab' },
        { keys: 'Alt+←', description: 'Go back' },
        { keys: 'Alt+→', description: 'Go forward' },
      ]
    },
    {
      category: 'Search & Organization',
      items: [
        { keys: `${cmdKey}+F`, description: 'Focus search' },
        { keys: 'Click tag', description: 'Filter items by tag' },
      ]
    },
    {
      category: 'Items & Folders',
      items: [
        { keys: 'Drag & Drop', description: 'Move items/folders' },
        { keys: 'Right-click', description: 'Context menu' },
      ]
    },
    {
      category: 'Theme',
      items: [
        { keys: 'Click 🌙/☀️', description: 'Toggle light/dark theme' },
      ]
    }
  ];

  return (
    <div className="shortcuts-help-overlay" onClick={onClose}>
      <div className="shortcuts-help-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-help-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="button" onClick={onClose}>✕</button>
        </div>

        <div className="shortcuts-help-content">
          {shortcuts.map((group) => (
            <div key={group.category} className="shortcut-group">
              <h3>{group.category}</h3>
              <div className="shortcut-list">
                {group.items.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                    <span className="shortcut-description">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-help-footer">
          <p>Press Escape or click outside to close</p>
        </div>
      </div>
    </div>
  );
}
