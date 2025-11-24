/**
 * Keyboard Shortcuts Hook - T051
 * Manages application-wide keyboard shortcuts
 */

import { useEffect } from 'react';

export interface ShortcutHandler {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
  category: 'general' | 'tabs' | 'navigation' | 'editing';
}

export function useKeyboardShortcuts(handlers: ShortcutHandler[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      for (const shortcut of handlers) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlOrCmd === undefined || shortcut.ctrlOrCmd === cmdOrCtrl;
        const shiftMatches = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatches = shortcut.alt === undefined || shortcut.alt === event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.handler();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, enabled]);
}
