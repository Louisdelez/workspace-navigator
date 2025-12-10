/**
 * Invisible Markdown Syntax Extension for CodeMirror 6
 *
 * This extension hides Markdown syntax (# for headings, ** for bold, * for italic)
 * when the cursor is NOT in the affected region, creating a Typora-like WYSIWYG experience.
 *
 * When the cursor enters a formatted region, the syntax characters reappear for editing.
 */

import { syntaxTree } from '@codemirror/language';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { EditorState, Range } from '@codemirror/state';

// Widget for rendering formatted content without syntax
class HeadingWidget extends WidgetType {
  constructor(readonly level: number, readonly content: string) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = `cm-heading-content cm-heading-${this.level}`;
    span.textContent = this.content;
    return span;
  }

  eq(other: HeadingWidget): boolean {
    return other.level === this.level && other.content === this.content;
  }
}

/**
 * Check if cursor position is within a given range
 */
function isCursorInRange(state: EditorState, from: number, to: number): boolean {
  const { head } = state.selection.main;
  return head >= from && head <= to;
}

/**
 * Check if selection overlaps with a given range
 */
function selectionOverlapsRange(state: EditorState, from: number, to: number): boolean {
  const sel = state.selection.main;
  return !(sel.to < from || sel.from > to);
}

/**
 * Build decorations for the current document state
 */
function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const decorations: Range<Decoration>[] = [];

  // Iterate through visible ranges for performance
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const nodeFrom = node.from;
        const nodeTo = node.to;
        const cursorInNode = selectionOverlapsRange(state, nodeFrom, nodeTo);

        // Handle ATX Headings (# Heading)
        if (node.name.startsWith('ATXHeading')) {
          const level = parseInt(node.name.replace('ATXHeading', ''), 10) || 1;
          const line = state.doc.lineAt(nodeFrom);

          // Find the HeaderMark (the # characters)
          let headerMarkEnd = nodeFrom;
          node.node.cursor().iterate((child) => {
            if (child.name === 'HeaderMark') {
              headerMarkEnd = child.to;
              return false; // Stop iteration
            }
            return true;
          });

          // Skip whitespace after #
          let contentStart = headerMarkEnd;
          const lineText = state.doc.sliceString(line.from, line.to);
          const hashMatch = lineText.match(/^#{1,6}\s*/);
          if (hashMatch) {
            contentStart = line.from + hashMatch[0].length;
          }

          if (!cursorInNode) {
            // Hide the # and space when cursor is outside
            if (contentStart > nodeFrom) {
              decorations.push(
                Decoration.replace({}).range(nodeFrom, contentStart)
              );
            }
          }

          // Always apply heading style to the line
          decorations.push(
            Decoration.line({ class: `cm-heading-line cm-heading-${level}` }).range(line.from)
          );
        }

        // Handle Strong Emphasis (**bold**)
        if (node.name === 'StrongEmphasis') {
          const text = state.doc.sliceString(nodeFrom, nodeTo);

          // Detect marker type (** or __)
          const marker = text.startsWith('**') ? '**' : '__';
          const markerLen = marker.length;

          if (!cursorInNode) {
            // Hide opening marker
            decorations.push(
              Decoration.replace({}).range(nodeFrom, nodeFrom + markerLen)
            );
            // Hide closing marker
            decorations.push(
              Decoration.replace({}).range(nodeTo - markerLen, nodeTo)
            );
          }

          // Apply bold styling to content (between markers)
          decorations.push(
            Decoration.mark({ class: 'cm-strong' }).range(
              nodeFrom + markerLen,
              nodeTo - markerLen
            )
          );
        }

        // Handle Emphasis (*italic* or _italic_)
        if (node.name === 'Emphasis') {
          const text = state.doc.sliceString(nodeFrom, nodeTo);

          // Detect marker type (* or _)
          const marker = text.startsWith('*') ? '*' : '_';
          const markerLen = marker.length;

          if (!cursorInNode) {
            // Hide opening marker
            decorations.push(
              Decoration.replace({}).range(nodeFrom, nodeFrom + markerLen)
            );
            // Hide closing marker
            decorations.push(
              Decoration.replace({}).range(nodeTo - markerLen, nodeTo)
            );
          }

          // Apply italic styling to content (between markers)
          decorations.push(
            Decoration.mark({ class: 'cm-emphasis' }).range(
              nodeFrom + markerLen,
              nodeTo - markerLen
            )
          );
        }

        // Handle Inline Code (`code`)
        if (node.name === 'InlineCode') {
          const markerLen = 1; // Single backtick

          if (!cursorInNode) {
            // Hide opening backtick
            decorations.push(
              Decoration.replace({}).range(nodeFrom, nodeFrom + markerLen)
            );
            // Hide closing backtick
            decorations.push(
              Decoration.replace({}).range(nodeTo - markerLen, nodeTo)
            );
          }

          // Apply code styling to content
          decorations.push(
            Decoration.mark({ class: 'cm-inline-code' }).range(
              nodeFrom + markerLen,
              nodeTo - markerLen
            )
          );
        }

        // Handle Strikethrough (~~text~~)
        if (node.name === 'Strikethrough') {
          const markerLen = 2;

          if (!cursorInNode) {
            // Hide opening ~~
            decorations.push(
              Decoration.replace({}).range(nodeFrom, nodeFrom + markerLen)
            );
            // Hide closing ~~
            decorations.push(
              Decoration.replace({}).range(nodeTo - markerLen, nodeTo)
            );
          }

          // Apply strikethrough styling
          decorations.push(
            Decoration.mark({ class: 'cm-strikethrough' }).range(
              nodeFrom + markerLen,
              nodeTo - markerLen
            )
          );
        }

        // Handle Links [text](url)
        if (node.name === 'Link') {
          // Find the link text and URL parts
          let linkTextFrom = -1;
          let linkTextTo = -1;
          let urlFrom = -1;
          let urlTo = -1;

          node.node.cursor().iterate((child) => {
            if (child.name === 'LinkLabel') {
              // This is [text]
              linkTextFrom = child.from + 1; // Skip [
              linkTextTo = child.to - 1; // Skip ]
            }
            if (child.name === 'URL') {
              urlFrom = child.from;
              urlTo = child.to;
            }
            return true;
          });

          if (!cursorInNode && linkTextFrom >= 0 && linkTextTo >= 0) {
            // Hide [ before text
            decorations.push(
              Decoration.replace({}).range(nodeFrom, nodeFrom + 1)
            );
            // Hide ] after text
            if (linkTextTo >= 0) {
              decorations.push(
                Decoration.replace({}).range(linkTextTo, linkTextTo + 1)
              );
            }
            // Hide (url) part
            if (urlFrom >= 0 && urlTo >= 0) {
              decorations.push(
                Decoration.replace({}).range(linkTextTo + 1, nodeTo)
              );
            }
          }

          // Apply link styling to text
          if (linkTextFrom >= 0 && linkTextTo >= 0) {
            decorations.push(
              Decoration.mark({ class: 'cm-link' }).range(linkTextFrom, linkTextTo)
            );
          }
        }

        // Handle Blockquotes (> text)
        if (node.name === 'Blockquote') {
          // Apply blockquote styling to the whole block
          const startLine = state.doc.lineAt(nodeFrom);
          const endLine = state.doc.lineAt(nodeTo);

          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            const line = state.doc.line(lineNum);
            const lineText = line.text;

            // Find > marker
            const quoteMatch = lineText.match(/^(\s*>\s*)/);
            if (quoteMatch) {
              const markerEnd = line.from + quoteMatch[0].length;

              // Check if cursor is on this line
              const cursorOnLine = selectionOverlapsRange(state, line.from, line.to);

              if (!cursorOnLine) {
                // Hide the > marker
                decorations.push(
                  Decoration.replace({}).range(line.from, markerEnd)
                );
              }

              // Apply blockquote line style
              decorations.push(
                Decoration.line({ class: 'cm-blockquote-line' }).range(line.from)
              );
            }
          }
        }

        // Handle List Items
        if (node.name === 'ListItem') {
          const line = state.doc.lineAt(nodeFrom);
          const lineText = line.text;

          // Find bullet or number marker
          const bulletMatch = lineText.match(/^(\s*[-*+]\s+)/);
          const numberMatch = lineText.match(/^(\s*\d+\.\s+)/);

          const cursorOnLine = selectionOverlapsRange(state, line.from, line.to);

          if (bulletMatch && !cursorOnLine) {
            const markerEnd = line.from + bulletMatch[0].length;
            // Replace with a bullet character
            decorations.push(
              Decoration.replace({
                widget: new BulletWidget(),
              }).range(line.from, markerEnd)
            );
          }

          // Apply list item styling
          decorations.push(
            Decoration.line({ class: 'cm-list-item-line' }).range(line.from)
          );
        }
      },
    });
  }

  // Sort decorations by position (required by CodeMirror)
  decorations.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);

  return Decoration.set(decorations, true);
}

// Widget for bullet points
class BulletWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-bullet';
    span.textContent = '•  ';
    return span;
  }

  eq(): boolean {
    return true;
  }
}

/**
 * The main ViewPlugin that manages WYSIWYG decorations
 */
export const invisibleMarkdownSyntax = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      // Rebuild decorations on document changes, selection changes, or viewport changes
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * Theme extension with base styles for the WYSIWYG rendering
 */
export const wysiwygTheme = EditorView.baseTheme({
  // Headings
  '.cm-heading-line.cm-heading-1': {
    fontSize: '2em',
    fontWeight: '700',
    lineHeight: '1.3',
    marginTop: '0.5em',
    marginBottom: '0.25em',
  },
  '.cm-heading-line.cm-heading-2': {
    fontSize: '1.5em',
    fontWeight: '600',
    lineHeight: '1.35',
    marginTop: '0.4em',
    marginBottom: '0.2em',
  },
  '.cm-heading-line.cm-heading-3': {
    fontSize: '1.25em',
    fontWeight: '600',
    lineHeight: '1.4',
    marginTop: '0.3em',
    marginBottom: '0.15em',
  },
  '.cm-heading-line.cm-heading-4': {
    fontSize: '1.1em',
    fontWeight: '600',
    lineHeight: '1.45',
  },
  '.cm-heading-line.cm-heading-5': {
    fontSize: '1em',
    fontWeight: '600',
    lineHeight: '1.5',
  },
  '.cm-heading-line.cm-heading-6': {
    fontSize: '0.9em',
    fontWeight: '600',
    lineHeight: '1.5',
    color: 'var(--text-secondary, #666)',
  },

  // Strong (bold)
  '.cm-strong': {
    fontWeight: 'bold',
  },

  // Emphasis (italic)
  '.cm-emphasis': {
    fontStyle: 'italic',
  },

  // Inline code
  '.cm-inline-code': {
    fontFamily: 'monospace',
    backgroundColor: 'var(--bg-code, rgba(0, 0, 0, 0.05))',
    padding: '0.1em 0.3em',
    borderRadius: '3px',
    fontSize: '0.9em',
  },

  // Strikethrough
  '.cm-strikethrough': {
    textDecoration: 'line-through',
  },

  // Links
  '.cm-link': {
    color: 'var(--accent-color, #2196f3)',
    textDecoration: 'underline',
    cursor: 'pointer',
  },

  // Blockquote
  '.cm-blockquote-line': {
    borderLeft: '3px solid var(--accent-color, #2196f3)',
    paddingLeft: '1em',
    color: 'var(--text-secondary, #666)',
    fontStyle: 'italic',
  },

  // List items
  '.cm-list-item-line': {
    paddingLeft: '0.5em',
  },
  '.cm-bullet': {
    color: 'var(--accent-color, #2196f3)',
    fontWeight: 'bold',
  },
});

/**
 * Combined extension for WYSIWYG markdown editing
 */
export const wysiwygMarkdown = [invisibleMarkdownSyntax, wysiwygTheme];

export default invisibleMarkdownSyntax;
