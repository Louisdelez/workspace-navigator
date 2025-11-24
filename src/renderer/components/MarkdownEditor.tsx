/**
 * Markdown Editor Component (T036)
 * Simplified editor with split view and autosave
 * Implements FR-015: 500ms debounce autosave with "Saved at HH:MM:SS" indicator
 */

import React, { useState, useEffect, useRef } from 'react';
import type { NoteItem } from '../../types/entities';

interface MarkdownEditorProps {
  item: NoteItem;
  onUpdate: (content: string) => void;
}

export function MarkdownEditor({ item, onUpdate }: MarkdownEditorProps) {
  const [content, setContent] = useState(item.content || '');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [showPreview, setShowPreview] = useState(true);

  // Sync content when item changes
  useEffect(() => {
    setContent(item.content || '');
  }, [item.id]);

  // Autosave with 500ms debounce using AutosaveManager (T037)
  useEffect(() => {
    // Skip if content hasn't changed
    if (content === item.content) {
      return;
    }

    // Schedule autosave via AutosaveManager
    window.electronAPI.autosave.schedule(item.id, content);

    // Update local save indicator
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Set last saved timestamp after debounce completes
    const timer = setTimeout(() => {
      setLastSaved(`Saved at ${timestamp}`);
    }, 550); // Slightly longer than debounce to show after save completes

    return () => clearTimeout(timer);
  }, [content, item.content, item.id]);

  // Toolbar action handlers
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('.markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  return (
    <div className="markdown-editor">
      {/* Toolbar */}
      <div className="markdown-editor-toolbar">
        <div className="toolbar-left">
          <button
            onClick={() => insertMarkdown('**', '**')}
            title="Bold (Ctrl+B)"
            className="toolbar-button"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            title="Italic (Ctrl+I)"
            className="toolbar-button"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => insertMarkdown('~~', '~~')}
            title="Strikethrough"
            className="toolbar-button"
          >
            <s>S</s>
          </button>
          <span className="toolbar-separator">|</span>
          <button
            onClick={() => insertMarkdown('# ', '')}
            title="Heading 1"
            className="toolbar-button"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown('## ', '')}
            title="Heading 2"
            className="toolbar-button"
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdown('### ', '')}
            title="Heading 3"
            className="toolbar-button"
          >
            H3
          </button>
          <span className="toolbar-separator">|</span>
          <button
            onClick={() => insertMarkdown('- ', '')}
            title="Bullet List"
            className="toolbar-button"
          >
            • List
          </button>
          <button
            onClick={() => insertMarkdown('[](url)', '')}
            title="Insert Link"
            className="toolbar-button"
          >
            Link
          </button>
          <button
            onClick={() => insertMarkdown('![](url)', '')}
            title="Insert Image"
            className="toolbar-button"
          >
            Image
          </button>
          <button
            onClick={() => insertMarkdown('```\n', '\n```')}
            title="Code Block"
            className="toolbar-button"
          >
            Code
          </button>
          <span className="toolbar-separator">|</span>
          <button
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle Preview"
            className="toolbar-button"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        <div className="toolbar-right">
          {lastSaved && <span className="save-indicator">{lastSaved}</span>}
        </div>
      </div>

      {/* Editor Content */}
      <div className={`markdown-editor-content ${showPreview ? 'split-view' : 'editor-only'}`}>
        {/* Editor Pane */}
        <div className="editor-pane">
          <textarea
            className="markdown-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your note in Markdown..."
            spellCheck={false}
          />
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="preview-pane">
            <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple Markdown to HTML renderer
 */
function renderMarkdown(markdown: string): string {
  if (!markdown) return '<p class="empty-note">Start typing to see preview...</p>';

  let html = markdown;

  // Code blocks (must be before inline code)
  html = html.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Lists (simple implementation)
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('<ul>')) return match;
    return '<ol>' + match + '</ol>';
  });

  // Line breaks to paragraphs
  html = html.split('\n\n').map(para => {
    // Skip if already wrapped in HTML tag
    if (para.trim().startsWith('<')) return para;
    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
