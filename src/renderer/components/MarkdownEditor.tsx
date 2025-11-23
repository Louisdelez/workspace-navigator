/**
 * Markdown Editor Component
 * Simple editor with autosave (FR-015: 500ms debounce)
 */

import React, { useState, useEffect, useRef } from 'react';
import type { NoteItem } from '../../types/entities';

interface MarkdownEditorProps {
  item: NoteItem;
  onUpdate: (content: string) => void;
}

export function MarkdownEditor({ item, onUpdate }: MarkdownEditorProps) {
  const [content, setContent] = useState(item.content);
  const [lastSaved, setLastSaved] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setContent(item.content);
  }, [item.id]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set 500ms debounce for autosave
    timeoutRef.current = setTimeout(() => {
      if (content !== item.content) {
        onUpdate(content);
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setLastSaved(`Saved at ${timestamp}`);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content]);

  return (
    <div className="markdown-editor">
      <div className="markdown-editor-toolbar">
        {lastSaved && <span>{lastSaved}</span>}
      </div>
      <div className="markdown-editor-content">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your note in Markdown..."
        />
      </div>
    </div>
  );
}
