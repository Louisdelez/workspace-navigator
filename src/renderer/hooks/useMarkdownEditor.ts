/**
 * useMarkdownEditor Hook (T008, T018)
 * Editor state management for the advanced markdown editor
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NoteItem } from '../../types/entities';

// ============================================================================
// Types (T008)
// ============================================================================

export interface Selection {
  start: number;
  end: number;
  text: string;
}

export interface EditorState {
  content: string;
  originalContent: string;
  selection: Selection | null;
  cursorPosition: number;
  isDirty: boolean;
  lastSaved: string | null;
  previewEnabled: boolean;
  editorScrollTop: number;
  previewScrollTop: number;
}

export interface UseMarkdownEditorReturn {
  content: string;
  setContent: (content: string) => void;
  selection: Selection | null;
  setSelection: (selection: Selection | null) => void;
  isDirty: boolean;
  lastSaved: string | null;
  previewEnabled: boolean;
  setPreviewEnabled: (enabled: boolean) => void;
  editorScrollTop: number;
  setEditorScrollTop: (top: number) => void;
  insertAtCursor: (text: string) => void;
}

// ============================================================================
// Hook Implementation (T018)
// ============================================================================

export function useMarkdownEditor(item: NoteItem): UseMarkdownEditorReturn {
  // Core state
  const [content, setContentState] = useState(item.content || '');
  const [originalContent, setOriginalContent] = useState(item.content || '');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(item.metadata?.previewEnabled ?? true);
  const [editorScrollTop, setEditorScrollTop] = useState(item.metadata?.editorScrollPosition ?? 0);

  // Track if we've initialized with the current item
  const currentItemIdRef = useRef<string>(item.id);

  // Computed state
  const isDirty = content !== originalContent;

  // Sync content when item changes (e.g., switching tabs)
  useEffect(() => {
    if (item.id !== currentItemIdRef.current) {
      setContentState(item.content || '');
      setOriginalContent(item.content || '');
      setPreviewEnabled(item.metadata?.previewEnabled ?? true);
      setEditorScrollTop(item.metadata?.editorScrollPosition ?? 0);
      setLastSaved(null);
      currentItemIdRef.current = item.id;
    }
  }, [item.id, item.content, item.metadata?.previewEnabled, item.metadata?.editorScrollPosition]);

  // Autosave integration - schedule save on content change
  useEffect(() => {
    if (content === originalContent) {
      return;
    }

    // Schedule autosave via AutosaveManager
    if (window.electronAPI?.autosave?.schedule) {
      window.electronAPI.autosave.schedule(item.id, content);
    }

    // Update save indicator after debounce completes
    const timer = setTimeout(() => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setLastSaved(`Saved at ${timestamp}`);
      setOriginalContent(content); // Mark as saved
    }, 550); // Slightly longer than debounce to show after save completes

    return () => clearTimeout(timer);
  }, [content, originalContent, item.id]);

  // Set content wrapper that preserves behavior
  const setContent = useCallback((newContent: string) => {
    setContentState(newContent);
  }, []);

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    if (selection) {
      const before = content.slice(0, selection.start);
      const after = content.slice(selection.end);
      setContent(before + text + after);
    } else {
      // Append at end if no selection
      setContent(content + text);
    }
  }, [content, selection, setContent]);

  return {
    content,
    setContent,
    selection,
    setSelection,
    isDirty,
    lastSaved,
    previewEnabled,
    setPreviewEnabled,
    editorScrollTop,
    setEditorScrollTop,
    insertAtCursor
  };
}
