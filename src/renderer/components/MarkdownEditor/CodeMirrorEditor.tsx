/**
 * CodeMirror 6 Editor Component
 *
 * A React wrapper for CodeMirror 6 with WYSIWYG markdown rendering.
 * Hides markdown syntax when cursor is outside, shows it when editing.
 */

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { wysiwygMarkdown } from './invisibleMarkdownSyntax';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: { start: number; end: number; text: string }) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const CodeMirrorEditor = memo(function CodeMirrorEditor({
  value,
  onChange,
  onSelectionChange,
  placeholder = 'Start typing your note in Markdown...',
  className = '',
  autoFocus = false,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectionChangeRef = useRef(onSelectionChange);

  // Keep refs up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    // Create update listener
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newContent = update.state.doc.toString();
        onChangeRef.current(newContent);
      }

      if (update.selectionSet && onSelectionChangeRef.current) {
        const { from, to } = update.state.selection.main;
        const text = update.state.doc.sliceString(from, to);
        onSelectionChangeRef.current({ start: from, end: to, text });
      }
    });

    // Placeholder extension
    const placeholderExtension = EditorView.contentAttributes.of({
      'data-placeholder': placeholder,
    });

    // Create editor state
    const state = EditorState.create({
      doc: value,
      extensions: [
        // Core functionality
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),

        // Keymaps
        keymap.of([...defaultKeymap, ...historyKeymap]),

        // Markdown language support
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(defaultHighlightStyle),

        // WYSIWYG markdown rendering
        ...wysiwygMarkdown,

        // Update listener
        updateListener,

        // Placeholder
        placeholderExtension,

        // Theme customizations
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14px',
            fontFamily: 'var(--font-mono, "SF Mono", Monaco, "Cascadia Code", monospace)',
          },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: 'inherit',
          },
          '.cm-content': {
            padding: '12px 16px',
            minHeight: '100%',
            caretColor: 'var(--accent-color, #2196f3)',
          },
          '.cm-line': {
            padding: '0 4px',
            lineHeight: '1.6',
          },
          '.cm-gutters': {
            backgroundColor: 'var(--bg-secondary, #f5f5f5)',
            borderRight: '1px solid var(--border-color, #e0e0e0)',
            color: 'var(--text-secondary, #666)',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 12px 0 8px',
            minWidth: '40px',
            fontSize: '12px',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'var(--bg-hover, rgba(0, 0, 0, 0.05))',
          },
          '.cm-activeLine': {
            backgroundColor: 'var(--bg-hover, rgba(0, 0, 0, 0.03))',
          },
          '.cm-selectionBackground': {
            backgroundColor: 'var(--selection-bg, rgba(33, 150, 243, 0.2)) !important',
          },
          '&.cm-focused .cm-selectionBackground': {
            backgroundColor: 'var(--selection-bg-focused, rgba(33, 150, 243, 0.3)) !important',
          },
          '.cm-cursor': {
            borderLeftColor: 'var(--accent-color, #2196f3)',
            borderLeftWidth: '2px',
          },
          // Placeholder styling
          '&[data-placeholder]:empty::before': {
            content: 'attr(data-placeholder)',
            color: 'var(--text-placeholder, #999)',
            pointerEvents: 'none',
          },
        }),

        // Dark theme support
        EditorView.theme(
          {
            '&': {
              backgroundColor: 'var(--bg-primary, #1e1e1e)',
              color: 'var(--text-primary, #cccccc)',
            },
            '.cm-gutters': {
              backgroundColor: 'var(--bg-secondary, #252526)',
              borderRightColor: 'var(--border-color, #3c3c3c)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'var(--bg-active, #37373d)',
            },
            '.cm-activeLine': {
              backgroundColor: 'var(--bg-active, rgba(255, 255, 255, 0.05))',
            },
          },
          { dark: true }
        ),
      ],
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Auto focus if requested
    if (autoFocus) {
      view.focus();
    }

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run once on mount

  // Update content when value prop changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // Expose methods for external control
  const insertText = useCallback((text: string) => {
    const view = viewRef.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    view.focus();
  }, []);

  const getSelection = useCallback(() => {
    const view = viewRef.current;
    if (!view) return { start: 0, end: 0, text: '' };

    const { from, to } = view.state.selection.main;
    const text = view.state.doc.sliceString(from, to);
    return { start: from, end: to, text };
  }, []);

  const focus = useCallback(() => {
    viewRef.current?.focus();
  }, []);

  // Attach methods to ref for parent access
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any).insertText = insertText;
      (editorRef.current as any).getSelection = getSelection;
      (editorRef.current as any).focus = focus;
    }
  }, [insertText, getSelection, focus]);

  return (
    <div
      ref={editorRef}
      className={`codemirror-editor ${className}`}
    />
  );
});

export default CodeMirrorEditor;
