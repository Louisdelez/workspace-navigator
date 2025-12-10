/**
 * Advanced Markdown Editor Component (T019)
 * Full-screen WYSIWYG editor using CodeMirror 6
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { NoteItem } from '../../../types/entities';
import { useMarkdownEditor } from '../../hooks/useMarkdownEditor';
import { applyTransformation, type TransformationType, type Selection } from '../../utils/markdown-transformers';
import { ImageDropZone } from './ImageDropZone';
import { ImageDialog } from './ImageDialog';
import { LinkDialog } from './LinkDialog';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import './styles.css';

// ============================================================================
// Types
// ============================================================================

interface MarkdownEditorProps {
  item: NoteItem;
  workspaceId: string;
  onUpdate: (content: string) => void;
  onTitleChange?: (title: string) => void;
}

// ============================================================================
// Extract First H1 for Title
// ============================================================================

function extractFirstH1(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

// ============================================================================
// Main Component
// ============================================================================

export const MarkdownEditor = memo(function MarkdownEditor({
  item,
  workspaceId,
  onUpdate,
  onTitleChange
}: MarkdownEditorProps) {
  const {
    content,
    setContent,
    setSelection,
    isDirty,
    lastSaved
  } = useMarkdownEditor(item);

  const editorRef = useRef<HTMLDivElement>(null);
  const [currentSelection, setCurrentSelection] = useState<Selection>({ start: 0, end: 0 });

  // Dialog states (T036, T046)
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  // Word and character count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Extract and emit title changes
  useEffect(() => {
    if (onTitleChange) {
      const h1Title = extractFirstH1(content);
      if (h1Title && h1Title !== item.title) {
        onTitleChange(h1Title);
      }
    }
  }, [content, item.title, onTitleChange]);

  // Update parent when content changes
  useEffect(() => {
    if (isDirty) {
      onUpdate(content);
    }
  }, [content, isDirty, onUpdate]);

  // Get current selection from CodeMirror editor
  const getCurrentSelection = useCallback((): Selection => {
    return currentSelection;
  }, [currentSelection]);

  // Handle selection changes from CodeMirror
  const handleSelectionChange = useCallback((sel: { start: number; end: number; text: string }) => {
    setCurrentSelection({ start: sel.start, end: sel.end });
    setSelection(sel);
  }, [setSelection]);

  // Apply a transformation
  const handleTransformation = useCallback((type: TransformationType, options?: { url?: string }) => {
    const sel = getCurrentSelection();
    const result = applyTransformation(content, sel, type, options);

    setContent(result.content);
    setCurrentSelection(result.newSelection);
  }, [content, getCurrentSelection, setContent]);

  // Handle text change from CodeMirror
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, [setContent]);

  // Handle image insertion from dialog or drop zone (T036)
  const handleImageInserted = useCallback((markdownLink: string) => {
    const sel = getCurrentSelection();
    const before = content.substring(0, sel.start);
    const after = content.substring(sel.end);
    const newContent = before + markdownLink + after;
    setContent(newContent);
    setCurrentSelection({ start: sel.start + markdownLink.length, end: sel.start + markdownLink.length });
  }, [content, getCurrentSelection, setContent]);

  // Handle link insertion from dialog (T046)
  const handleLinkInserted = useCallback((markdownLink: string) => {
    const sel = getCurrentSelection();
    const before = content.substring(0, sel.start);
    const after = content.substring(sel.end);
    const newContent = before + markdownLink + after;
    setContent(newContent);
    setCurrentSelection({ start: sel.start + markdownLink.length, end: sel.start + markdownLink.length });
  }, [content, getCurrentSelection, setContent]);

  // Get selected text for link dialog
  const getSelectedText = useCallback((): string => {
    const { start, end } = currentSelection;
    return content.substring(start, end);
  }, [content, currentSelection]);

  return (
    <div className="markdown-editor">
      {/* Toolbar */}
      <div className="markdown-editor-toolbar" role="toolbar" aria-label="Formatting toolbar">
        <div className="toolbar-left">
          {/* Text formatting */}
          <div className="toolbar-group" role="group" aria-label="Text formatting">
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('bold')}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('italic')}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <em>I</em>
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('underline')}
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
              <u>U</u>
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('strikethrough')}
              title="Strikethrough"
              aria-label="Strikethrough"
            >
              <s>S</s>
            </button>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          {/* Headings */}
          <div className="toolbar-group" role="group" aria-label="Headings">
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('h1')}
              title="Heading 1 (Ctrl+1)"
              aria-label="Heading level 1"
            >
              H1
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('h2')}
              title="Heading 2 (Ctrl+2)"
              aria-label="Heading level 2"
            >
              H2
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('h3')}
              title="Heading 3 (Ctrl+3)"
              aria-label="Heading level 3"
            >
              H3
            </button>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          {/* Lists */}
          <div className="toolbar-group" role="group" aria-label="Lists">
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('bulletList')}
              title="Bullet List"
              aria-label="Bullet list"
            >
              •
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('numberedList')}
              title="Numbered List"
              aria-label="Numbered list"
            >
              1.
            </button>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          {/* Blocks */}
          <div className="toolbar-group" role="group" aria-label="Block elements">
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('quote')}
              title="Quote"
              aria-label="Blockquote"
            >
              "
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('codeInline')}
              title="Inline Code"
              aria-label="Inline code"
            >
              {'</>'}
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('codeBlock')}
              title="Code Block"
              aria-label="Code block"
            >
              {'{ }'}
            </button>
          </div>

          <span className="toolbar-separator" aria-hidden="true" />

          {/* Insertions */}
          <div className="toolbar-group" role="group" aria-label="Insert elements">
            <button
              className="toolbar-button"
              onClick={() => setLinkDialogOpen(true)}
              title="Insert Link (Ctrl+K)"
              aria-label="Insert link"
            >
              Link
            </button>
            <button
              className="toolbar-button"
              onClick={() => setImageDialogOpen(true)}
              title="Insert Image"
              aria-label="Insert image"
            >
              Img
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('math')}
              title="Inline Math ($...$)"
              aria-label="Inline math formula"
            >
              fx
            </button>
            <button
              className="toolbar-button"
              onClick={() => handleTransformation('mathBlock')}
              title="Block Math ($$...$$)"
              aria-label="Block math formula"
            >
              F(x)
            </button>
          </div>

        </div>

        <div className="toolbar-right">
          {lastSaved && <span className="save-indicator">{lastSaved}</span>}
        </div>
      </div>

      {/* Editor Content with Drop Zone - Full screen WYSIWYG mode */}
      <ImageDropZone
        workspaceId={workspaceId}
        onImageInserted={handleImageInserted}
      >
        <div className="markdown-editor-content editor-only">
          {/* Editor Pane with CodeMirror - Takes full space */}
          <div className="editor-pane">
            <div className="editor-pane-inner codemirror-container" ref={editorRef}>
              <CodeMirrorEditor
                value={content}
                onChange={handleContentChange}
                onSelectionChange={handleSelectionChange}
                placeholder="Start typing your note in Markdown..."
                className="markdown-codemirror"
                autoFocus
              />
            </div>
          </div>
        </div>
      </ImageDropZone>

      {/* Status Bar */}
      <div className="markdown-editor-status">
        <span>{wordCount} mots · {charCount} caractères</span>
      </div>

      {/* Image Dialog (T036) */}
      <ImageDialog
        isOpen={imageDialogOpen}
        workspaceId={workspaceId}
        onInsert={handleImageInserted}
        onClose={() => setImageDialogOpen(false)}
      />

      {/* Link Dialog (T046) */}
      <LinkDialog
        isOpen={linkDialogOpen}
        selectedText={getSelectedText()}
        onInsert={handleLinkInserted}
        onClose={() => setLinkDialogOpen(false)}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if item ID or content changed
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.content === nextProps.item.content;
});

export default MarkdownEditor;
