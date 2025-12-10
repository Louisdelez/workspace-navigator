/**
 * Markdown Transformation Functions (T007, T015)
 * Pure functions for applying markdown formatting to text
 */

// ============================================================================
// Types (T007)
// ============================================================================

export type TransformationType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bulletList'
  | 'numberedList'
  | 'quote'
  | 'codeInline'
  | 'codeBlock'
  | 'link'
  | 'image'
  | 'math'
  | 'mathBlock';

export interface Selection {
  start: number;
  end: number;
}

export interface TransformationResult {
  content: string;
  newSelection: Selection;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the start of the current line from a position
 */
function getLineStart(content: string, position: number): number {
  const lastNewline = content.lastIndexOf('\n', position - 1);
  return lastNewline === -1 ? 0 : lastNewline + 1;
}

/**
 * Get the end of the current line from a position
 */
function getLineEnd(content: string, position: number): number {
  const nextNewline = content.indexOf('\n', position);
  return nextNewline === -1 ? content.length : nextNewline;
}

/**
 * Get all lines in a selection range
 */
function getSelectedLines(content: string, selection: Selection): { start: number; end: number }[] {
  const lines: { start: number; end: number }[] = [];
  let pos = getLineStart(content, selection.start);

  while (pos <= selection.end && pos < content.length) {
    const lineEnd = getLineEnd(content, pos);
    lines.push({ start: pos, end: lineEnd });
    pos = lineEnd + 1;
    if (pos > content.length) break;
  }

  return lines;
}

// ============================================================================
// Transformation Functions (T015)
// ============================================================================

/**
 * Apply bold formatting: **text**
 */
export function applyBold(content: string, selection: Selection): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  // Check if already bold - toggle off
  if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
    const unwrapped = selected.slice(2, -2);
    return {
      content: before + unwrapped + after,
      newSelection: { start: selection.start, end: selection.start + unwrapped.length }
    };
  }

  return {
    content: `${before}**${selected}**${after}`,
    newSelection: { start: selection.start + 2, end: selection.end + 2 }
  };
}

/**
 * Apply italic formatting: *text*
 */
export function applyItalic(content: string, selection: Selection): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  // Check if already italic - toggle off
  if (selected.startsWith('*') && selected.endsWith('*') && !selected.startsWith('**') && selected.length >= 2) {
    const unwrapped = selected.slice(1, -1);
    return {
      content: before + unwrapped + after,
      newSelection: { start: selection.start, end: selection.start + unwrapped.length }
    };
  }

  return {
    content: `${before}*${selected}*${after}`,
    newSelection: { start: selection.start + 1, end: selection.end + 1 }
  };
}

/**
 * Apply underline formatting: <u>text</u>
 */
export function applyUnderline(content: string, selection: Selection): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  return {
    content: `${before}<u>${selected}</u>${after}`,
    newSelection: { start: selection.start + 3, end: selection.end + 3 }
  };
}

/**
 * Apply strikethrough formatting: ~~text~~
 */
export function applyStrikethrough(content: string, selection: Selection): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  // Check if already strikethrough - toggle off
  if (selected.startsWith('~~') && selected.endsWith('~~') && selected.length >= 4) {
    const unwrapped = selected.slice(2, -2);
    return {
      content: before + unwrapped + after,
      newSelection: { start: selection.start, end: selection.start + unwrapped.length }
    };
  }

  return {
    content: `${before}~~${selected}~~${after}`,
    newSelection: { start: selection.start + 2, end: selection.end + 2 }
  };
}

/**
 * Apply heading formatting: # to ###### prefix
 */
export function applyHeading(content: string, selection: Selection, level: 1 | 2 | 3 | 4 | 5 | 6): TransformationResult {
  const lineStart = getLineStart(content, selection.start);
  const lineEnd = getLineEnd(content, selection.start);
  const lineContent = content.slice(lineStart, lineEnd);

  // Remove existing heading prefix
  const cleanLine = lineContent.replace(/^#{1,6}\s*/, '');
  const prefix = '#'.repeat(level) + ' ';

  const newLine = prefix + cleanLine;
  const newContent = content.slice(0, lineStart) + newLine + content.slice(lineEnd);

  // Adjust selection to account for prefix changes
  const prefixDiff = newLine.length - lineContent.length;

  return {
    content: newContent,
    newSelection: {
      start: Math.max(lineStart, selection.start + prefixDiff),
      end: Math.max(lineStart, selection.end + prefixDiff)
    }
  };
}

/**
 * Apply bullet list: - prefix to each line
 */
export function applyBulletList(content: string, selection: Selection): TransformationResult {
  const lines = getSelectedLines(content, selection);
  let newContent = content;
  let offset = 0;

  for (const line of lines) {
    const lineContent = content.slice(line.start, line.end);

    // Check if line already has bullet
    if (/^[-*]\s/.test(lineContent)) {
      // Remove bullet
      const newLine = lineContent.replace(/^[-*]\s/, '');
      newContent = newContent.slice(0, line.start + offset) + newLine + newContent.slice(line.end + offset);
      offset += newLine.length - lineContent.length;
    } else {
      // Add bullet
      const newLine = '- ' + lineContent.replace(/^\d+\.\s*/, ''); // Remove numbered list if present
      newContent = newContent.slice(0, line.start + offset) + newLine + newContent.slice(line.end + offset);
      offset += newLine.length - lineContent.length;
    }
  }

  return {
    content: newContent,
    newSelection: { start: selection.start, end: selection.end + offset }
  };
}

/**
 * Apply numbered list: 1. prefix to each line
 */
export function applyNumberedList(content: string, selection: Selection): TransformationResult {
  const lines = getSelectedLines(content, selection);
  let newContent = content;
  let offset = 0;
  let num = 1;

  for (const line of lines) {
    const lineContent = content.slice(line.start, line.end);

    // Check if line already has number
    if (/^\d+\.\s/.test(lineContent)) {
      // Remove number
      const newLine = lineContent.replace(/^\d+\.\s/, '');
      newContent = newContent.slice(0, line.start + offset) + newLine + newContent.slice(line.end + offset);
      offset += newLine.length - lineContent.length;
    } else {
      // Add number
      const newLine = `${num}. ` + lineContent.replace(/^[-*]\s/, ''); // Remove bullet if present
      newContent = newContent.slice(0, line.start + offset) + newLine + newContent.slice(line.end + offset);
      offset += newLine.length - lineContent.length;
      num++;
    }
  }

  return {
    content: newContent,
    newSelection: { start: selection.start, end: selection.end + offset }
  };
}

/**
 * Apply quote formatting: > prefix to each line
 */
export function applyQuote(content: string, selection: Selection): TransformationResult {
  const lines = getSelectedLines(content, selection);
  let newContent = content;
  let offset = 0;

  for (const line of lines) {
    const lineContent = content.slice(line.start, line.end);

    // Check if line already has quote
    if (/^>\s?/.test(lineContent)) {
      // Remove quote
      const newLine = lineContent.replace(/^>\s?/, '');
      newContent = newContent.slice(0, line.start + offset) + newLine + newContent.slice(line.end + offset);
      offset += newLine.length - lineContent.length;
    } else {
      // Add quote
      const newLine = '> ' + lineContent;
      newContent = newContent.slice(0, line.start + offset) + newLine + newContent.slice(line.end + offset);
      offset += newLine.length - lineContent.length;
    }
  }

  return {
    content: newContent,
    newSelection: { start: selection.start, end: selection.end + offset }
  };
}

/**
 * Apply inline code: `code`
 */
export function applyCodeInline(content: string, selection: Selection): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  // Check if already code - toggle off
  if (selected.startsWith('`') && selected.endsWith('`') && selected.length >= 2) {
    const unwrapped = selected.slice(1, -1);
    return {
      content: before + unwrapped + after,
      newSelection: { start: selection.start, end: selection.start + unwrapped.length }
    };
  }

  return {
    content: `${before}\`${selected}\`${after}`,
    newSelection: { start: selection.start + 1, end: selection.end + 1 }
  };
}

/**
 * Apply code block: ```\ncode\n```
 */
export function applyCodeBlock(content: string, selection: Selection): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end);
  const after = content.slice(selection.end);

  const newContent = `${before}\`\`\`\n${selected}\n\`\`\`${after}`;

  return {
    content: newContent,
    newSelection: { start: selection.start + 4, end: selection.end + 4 }
  };
}

/**
 * Apply link: [text](url)
 */
export function applyLink(content: string, selection: Selection, url: string = ''): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end) || 'link text';
  const after = content.slice(selection.end);

  const linkMarkdown = `[${selected}](${url})`;

  return {
    content: `${before}${linkMarkdown}${after}`,
    newSelection: {
      start: selection.start + 1,
      end: selection.start + 1 + selected.length
    }
  };
}

/**
 * Apply image: ![alt](path)
 */
export function applyImage(content: string, position: number, path: string, alt: string = 'image'): TransformationResult {
  const before = content.slice(0, position);
  const after = content.slice(position);

  const imageMarkdown = `![${alt}](${path})`;

  return {
    content: `${before}${imageMarkdown}${after}`,
    newSelection: {
      start: position + imageMarkdown.length,
      end: position + imageMarkdown.length
    }
  };
}

/**
 * Apply inline math: $formula$
 */
export function applyMath(content: string, selection: Selection, isBlock: boolean = false): TransformationResult {
  const before = content.slice(0, selection.start);
  const selected = content.slice(selection.start, selection.end) || 'formula';
  const after = content.slice(selection.end);

  if (isBlock) {
    const newContent = `${before}$$\n${selected}\n$$${after}`;
    return {
      content: newContent,
      newSelection: { start: selection.start + 3, end: selection.start + 3 + selected.length }
    };
  }

  return {
    content: `${before}$${selected}$${after}`,
    newSelection: { start: selection.start + 1, end: selection.end + 1 }
  };
}

// ============================================================================
// Main Transformation Dispatcher
// ============================================================================

/**
 * Apply a transformation by type
 */
export function applyTransformation(
  content: string,
  selection: Selection,
  type: TransformationType,
  options?: { url?: string; path?: string; alt?: string }
): TransformationResult {
  switch (type) {
    case 'bold':
      return applyBold(content, selection);
    case 'italic':
      return applyItalic(content, selection);
    case 'underline':
      return applyUnderline(content, selection);
    case 'strikethrough':
      return applyStrikethrough(content, selection);
    case 'h1':
      return applyHeading(content, selection, 1);
    case 'h2':
      return applyHeading(content, selection, 2);
    case 'h3':
      return applyHeading(content, selection, 3);
    case 'h4':
      return applyHeading(content, selection, 4);
    case 'h5':
      return applyHeading(content, selection, 5);
    case 'h6':
      return applyHeading(content, selection, 6);
    case 'bulletList':
      return applyBulletList(content, selection);
    case 'numberedList':
      return applyNumberedList(content, selection);
    case 'quote':
      return applyQuote(content, selection);
    case 'codeInline':
      return applyCodeInline(content, selection);
    case 'codeBlock':
      return applyCodeBlock(content, selection);
    case 'link':
      return applyLink(content, selection, options?.url);
    case 'image':
      return applyImage(content, selection.start, options?.path || '', options?.alt);
    case 'math':
      return applyMath(content, selection, false);
    case 'mathBlock':
      return applyMath(content, selection, true);
    default:
      return { content, newSelection: selection };
  }
}
