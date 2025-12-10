# Quickstart: Éditeur Markdown Avancé

**Feature**: 001-markdown
**Date**: 2025-12-09

## Prerequisites

- Node.js 18+
- npm 9+
- Workspace Navigator project cloned and set up

## Quick Setup

### 1. Install New Dependencies

```bash
cd /home/louis/Documents/Navigateur
npm install katex @milkdown/plugin-math
npm install -D @types/katex
```

### 2. Verify Existing Dependencies

The following should already be in `package.json`:
- `@milkdown/core`: ^7.17.2
- `@milkdown/react`: ^7.17.2
- `@milkdown/preset-commonmark`: ^7.17.2
- `@milkdown/preset-gfm`: ^7.17.2
- `@milkdown/plugin-listener`: ^7.17.2

### 3. Start Development

```bash
npm run electron:dev
```

## File Structure Overview

```
src/renderer/components/MarkdownEditor/
├── index.tsx              # Main component
├── MarkdownToolbar.tsx    # Formatting toolbar
├── MarkdownPreview.tsx    # Preview pane
├── LineNumbers.tsx        # Line numbering
├── ImageDropZone.tsx      # Drag & drop handler
├── LinkDialog.tsx         # Link insertion modal
├── ImageDialog.tsx        # Image insertion modal
└── styles.css             # Component styles

src/renderer/hooks/
├── useMarkdownEditor.ts   # Editor state hook
├── useMarkdownTransformations.ts
└── useScrollSync.ts

src/renderer/utils/
└── markdown-transformers.ts

src/core/assets/
└── asset-manager.ts
```

## Development Workflow

### 1. Create the Editor Component Directory

```bash
mkdir -p src/renderer/components/MarkdownEditor
mkdir -p src/renderer/hooks
mkdir -p src/core/assets
```

### 2. Implement Core Hook First

Start with `useMarkdownEditor.ts` as it's the foundation:

```typescript
// src/renderer/hooks/useMarkdownEditor.ts
import { useState, useEffect, useRef } from 'react';
import type { NoteItem } from '../../types/entities';

export function useMarkdownEditor(item: NoteItem) {
  const [content, setContent] = useState(item.content || '');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Sync when item changes
  useEffect(() => {
    setContent(item.content || '');
  }, [item.id]);

  // Autosave
  useEffect(() => {
    if (content !== item.content) {
      window.electronAPI.autosave.schedule(item.id, content);
    }
  }, [content]);

  return { content, setContent, lastSaved };
}
```

### 3. Implement Transformers

Pure functions for markdown transformations:

```typescript
// src/renderer/utils/markdown-transformers.ts
export function applyBold(content: string, start: number, end: number) {
  const before = content.slice(0, start);
  const selected = content.slice(start, end);
  const after = content.slice(end);
  return `${before}**${selected}**${after}`;
}

export function applyHeading(content: string, lineStart: number, level: number) {
  const prefix = '#'.repeat(level) + ' ';
  return content.slice(0, lineStart) + prefix + content.slice(lineStart);
}
// ... more transformers
```

### 4. Create Main Component

```typescript
// src/renderer/components/MarkdownEditor/index.tsx
import React from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { useMarkdownEditor } from '../../hooks/useMarkdownEditor';
import { MarkdownToolbar } from './MarkdownToolbar';
import type { NoteItem } from '../../../types/entities';
import './styles.css';

interface Props {
  item: NoteItem;
  onUpdate: (content: string) => void;
}

export function MarkdownEditor({ item, onUpdate }: Props) {
  const { content, setContent, lastSaved } = useMarkdownEditor(item);

  return (
    <div className="markdown-editor">
      <MarkdownToolbar onAction={(type) => { /* handle */ }} />
      <MilkdownProvider>
        <Milkdown />
      </MilkdownProvider>
      {lastSaved && <div className="save-indicator">Saved at {lastSaved}</div>}
    </div>
  );
}
```

## Testing

### Run Unit Tests

```bash
npm test src/renderer/utils/markdown-transformers.test.ts
```

### Run Integration Tests

```bash
npm test src/renderer/components/MarkdownEditor/
```

### Run E2E Tests

```bash
npm run test:e2e tests/e2e/markdown-workflow.spec.ts
```

## Key APIs

### Autosave

```typescript
// Schedule autosave (debounced 500ms)
window.electronAPI.autosave.schedule(itemId, content);
```

### Image Handling

```typescript
// Open file dialog
const result = await window.electronAPI.markdown.selectImage();

// Copy image to workspace
const asset = await window.electronAPI.markdown.copyAsset({
  sourcePath: '/path/to/image.png',
  workspaceId: 'uuid',
  description: 'My Image'
});
// Returns: { success: true, markdownLink: '![My Image](assets/images/xxx.png)' }
```

### Transformation Example

```typescript
import { applyBold, applyHeading } from '../utils/markdown-transformers';

// Apply bold to selection
const newContent = applyBold(content, selectionStart, selectionEnd);

// Apply H2 to current line
const newContent = applyHeading(content, lineStart, 2);
```

## Common Issues

### Milkdown Not Rendering

1. Ensure `MilkdownProvider` wraps the component
2. Check that all presets are imported correctly
3. Verify the target element exists before editor creation

### Autosave Not Working

1. Check that `window.electronAPI.autosave` is exposed in preload
2. Verify `AutosaveManager` is initialized in main process
3. Check console for IPC errors

### Images Not Displaying

1. Verify the assets folder exists: `workspace/assets/images/`
2. Check that paths are relative to workspace root
3. Ensure image file was actually copied (check filesystem)

## Performance Tips

1. **Memoize heavy computations**: Use `useMemo` for markdown parsing
2. **Debounce preview updates**: Don't re-render preview on every keystroke
3. **Virtualize line numbers**: For notes > 5000 lines
4. **Lazy load KaTeX**: Only import when math content detected

## Next Steps

After setting up the basic structure:

1. Implement full toolbar with all actions
2. Add scroll synchronization
3. Implement image drag & drop
4. Add keyboard shortcuts
5. Write comprehensive tests
6. Performance optimization pass

## Reference Documentation

- [Plan](./plan.md) - Full implementation plan
- [Research](./research.md) - Technical decisions
- [Data Model](./data-model.md) - Entity definitions
- [IPC Contracts](./contracts/ipc-api.md) - API specifications
- [Milkdown Docs](https://milkdown.dev/) - Editor framework
- [KaTeX Docs](https://katex.org/) - Math rendering
