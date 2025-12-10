# Tasks: Éditeur Markdown Avancé

**Input**: Design documents from `/specs/001-markdown/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ipc-api.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and folder structure

- [x] T001 Install KaTeX and math plugin: `npm install katex @milkdown/plugin-math && npm install -D @types/katex`
- [x] T002 [P] Create `src/renderer/components/MarkdownEditor/` directory structure
- [x] T003 [P] Create `src/renderer/hooks/` directory for new hooks
- [x] T004 [P] Create `src/core/assets/` directory for asset manager
- [x] T005 [P] Create `tests/unit/` directory structure for markdown tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### TypeScript Types & Data Model

- [x] T006 [P] Extend `ItemMetadata` interface in `src/types/entities.ts` with `editorScrollPosition`, `previewEnabled`, `cursorPosition`
- [x] T007 [P] Create `TransformationType` and `TransformationResult` types in `src/renderer/utils/markdown-transformers.ts`
- [x] T008 [P] Create `EditorState` and `Selection` interfaces in `src/renderer/hooks/useMarkdownEditor.ts`

### Asset Manager (Core Module)

- [x] T009 Create `AssetManager` class in `src/core/assets/asset-manager.ts`:
  - `copyAsset(sourcePath, workspaceId): Promise<string>` - copy image to workspace
  - `getAssetPath(workspaceId): string` - get assets directory path
  - `deleteAsset(assetPath, workspaceId): Promise<void>` - delete asset
  - Constants: `SUPPORTED_IMAGE_FORMATS`, `MAX_IMAGE_SIZE`
  - Filename sanitization and collision handling

### IPC Handlers (Main Process)

- [x] T010 Add `markdown:copyAsset` IPC handler in `src/main/ipc-handlers.ts` per contracts/ipc-api.md
- [x] T011 [P] Add `markdown:getAssetPath` IPC handler in `src/main/ipc-handlers.ts`
- [x] T012 [P] Add `markdown:selectImage` IPC handler in `src/main/ipc-handlers.ts` (dialog)
- [x] T013 [P] Add `markdown:deleteAsset` IPC handler in `src/main/ipc-handlers.ts`

### Preload API

- [x] T014 Expose `markdown` API in `src/preload/index.ts`:
  - `copyAsset(request): Promise<CopyAssetResponse>`
  - `getAssetPath(workspaceId): Promise<string>`
  - `selectImage(): Promise<SelectImageResponse>`
  - `deleteAsset(request): Promise<DeleteAssetResponse>`

### Markdown Transformers (Pure Functions)

- [x] T015 Implement all transformation functions in `src/renderer/utils/markdown-transformers.ts`:
  - `applyBold(content, selection)` - wrap with `**`
  - `applyItalic(content, selection)` - wrap with `*`
  - `applyUnderline(content, selection)` - wrap with `<u>`
  - `applyStrikethrough(content, selection)` - wrap with `~~`
  - `applyHeading(content, lineStart, level)` - prefix with `#`
  - `applyBulletList(content, selection)` - prefix lines with `- `
  - `applyNumberedList(content, selection)` - prefix lines with `1. `
  - `applyQuote(content, selection)` - prefix lines with `> `
  - `applyCodeInline(content, selection)` - wrap with backticks
  - `applyCodeBlock(content, selection)` - wrap with triple backticks
  - `applyLink(content, selection, url)` - create `[text](url)`
  - `applyImage(content, position, path, alt)` - insert `![alt](path)`
  - `applyMath(content, selection, isBlock)` - wrap with `$` or `$$`

### Tests for Foundational (Unit Tests)

- [x] T016 [P] Write unit tests for all markdown transformers in `tests/unit/markdown-transformers.test.ts`
- [ ] T017 [P] Write unit tests for AssetManager in `tests/unit/asset-manager.test.ts`

**Checkpoint**: Foundation ready - Transformers tested, IPC handlers working, types defined

---

## Phase 3: User Story 1 - Écriture Markdown avec Rendu Live (Priority: P1) 🎯 MVP

**Goal**: Allow users to type markdown and see live rendering immediately

**Independent Test**: Create a note, type markdown (headings, lists, bold), verify live rendering

### Core Hook

- [x] T018 [US1] Implement `useMarkdownEditor` hook in `src/renderer/hooks/useMarkdownEditor.ts`:
  - State: `content`, `originalContent`, `isDirty`, `selection`, `cursorPosition`
  - Effect: Sync content when item changes
  - Effect: Integrate with autosave via `window.electronAPI.autosave.schedule`
  - Returns: `{ content, setContent, selection, isDirty, lastSaved }`

### Main Editor Component

- [x] T019 [US1] Create `MarkdownEditor/index.tsx` main component:
  - Integrate Milkdown with `@milkdown/react`
  - Configure with `commonmark`, `gfm`, `listener` plugins
  - Handle content changes via `useMarkdownEditor` hook
  - Apply CSS styles from `styles.css`

- [x] T020 [P] [US1] Create `MarkdownEditor/styles.css` with base editor styles:
  - Editor container layout
  - Milkdown styling overrides
  - Typography for markdown elements (headings, lists, code)

### Integration with TabsContainer

- [x] T021 [US1] Modify `src/renderer/components/TabsContainer.tsx`:
  - Import new `MarkdownEditor` from `./MarkdownEditor`
  - Route `type: 'note'` tabs to the new editor component
  - Pass `item` and `onUpdate` props

### Tests for US1

- [ ] T022 [P] [US1] Write integration tests for MarkdownEditor in `tests/integration/markdown-editor.test.ts`
- [ ] T023 [P] [US1] Write unit tests for `useMarkdownEditor` hook in `tests/unit/use-markdown-editor.test.ts`

**Checkpoint**: US1 complete - Users can type markdown with live rendering in tabs

---

## Phase 4: User Story 2 - Barre d'Outils de Formatage (Priority: P2)

**Goal**: Provide toolbar buttons for non-technical users to format text

**Independent Test**: Select text, click toolbar buttons, verify formatting applied

### Toolbar Component

- [x] T024 [US2] Create `MarkdownEditor/MarkdownToolbar.tsx`:
  - Button groups: Text (B, I, U, S), Headings (H1-H6), Lists (bullet, numbered), Blocks (quote, code inline, code block)
  - Props: `onAction(type: TransformationType)`, `disabled: boolean`
  - Accessible button labels and keyboard navigation
  - NOTE: Implemented inline in MarkdownEditor/index.tsx

### Transformation Hook

- [x] T025 [US2] Implement `useMarkdownTransformations` hook in `src/renderer/hooks/useMarkdownTransformations.ts`:
  - `applyTransformation(type: TransformationType)` - apply to current selection
  - `insertAtCursor(text: string)` - insert at cursor position
  - Get current selection from editor ref
  - Update content and restore cursor position
  - NOTE: Implemented as `handleTransformation` in MarkdownEditor/index.tsx

### Integration

- [x] T026 [US2] Integrate toolbar with `MarkdownEditor/index.tsx`:
  - Add `<MarkdownToolbar>` above editor pane
  - Wire `onAction` to `useMarkdownTransformations`
  - Handle keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)

### Tests for US2

- [ ] T027 [P] [US2] Write integration tests for toolbar in `tests/integration/markdown-toolbar.test.ts`

**Checkpoint**: US2 complete - Toolbar functional with all formatting buttons

---

## Phase 5: User Story 3 - Sauvegarde Automatique Intelligente (Priority: P2)

**Goal**: Auto-save content with visual indicator, zero data loss

**Independent Test**: Edit note, wait 500ms, close app, reopen, verify content preserved

### Save Indicator

- [x] T028 [US3] Add save status indicator to `MarkdownEditor/index.tsx`:
  - Display "Saved at HH:MM:SS" after successful save
  - Display error indicator on save failure
  - Listen to `note:saved` and `note:save-failed` events
  - NOTE: Implemented via useMarkdownEditor hook lastSaved state

### Flush on Close

- [x] T029 [US3] Ensure flush on tab/app close:
  - Verify `AutosaveManager.flushSave(itemId)` is called in TabManager.closeTab
  - Verify `AutosaveManager.flushAll()` is called in `app.on('before-quit')`
  - NOTE: Already implemented in existing AutosaveManager

### Tests for US3

- [ ] T030 [P] [US3] Write integration tests for autosave in `tests/integration/markdown-autosave.test.ts`

**Checkpoint**: US3 complete - Autosave working with visual feedback

---

## Phase 6: User Story 4 - Intégration avec les Onglets du Workspace (Priority: P2)

**Goal**: Notes open in tabs, session restore works

**Independent Test**: Open multiple notes in tabs, close app, reopen, verify tabs restored

### Tab Title Sync

- [x] T031 [US4] Implement tab title update from first H1:
  - Extract first H1 from content on change
  - Emit `note:title-updated` event with new title
  - Update tab title in TabManager
  - NOTE: extractFirstH1 implemented in MarkdownEditor/index.tsx with onTitleChange callback

### Session Restoration

- [x] T032 [US4] Verify session restore with markdown tabs:
  - Ensure `SessionManager.restoreSession()` handles `type: 'note'` tabs
  - Verify content is loaded correctly on restore
  - Restore `metadata.editorScrollPosition` if present
  - NOTE: Session restore already handled by existing SessionManager for 'note' type items

### Tests for US4

- [ ] T033 [P] [US4] Write e2e test for session restore in `tests/e2e/markdown-session.spec.ts`

**Checkpoint**: US4 complete - Full tab integration with session restore

---

## Phase 7: User Story 5 - Insertion d'Images (Priority: P3)

**Goal**: Insert images via drag & drop or button

**Independent Test**: Drag image into editor, verify copied to assets and link inserted

### Image Drop Zone

- [x] T034 [US5] Create `MarkdownEditor/ImageDropZone.tsx`:
  - Wrap editor with drop zone
  - Handle `onDrop` event, extract file path from Electron file object
  - Validate format (PNG, JPG, GIF, WebP) and size (<10MB)
  - Call `window.electronAPI.markdown.copyAsset()`
  - Insert markdown link via `useMarkdownTransformations`

### Image Dialog

- [x] T035 [US5] Create `MarkdownEditor/ImageDialog.tsx`:
  - Modal with "Select Image" button
  - Call `window.electronAPI.markdown.selectImage()`
  - Optional description field for alt text
  - On confirm: copy asset and insert link

### Integration

- [x] T036 [US5] Add image button to toolbar and wire to dialog:
  - Add "Image" button group to `MarkdownToolbar.tsx`
  - Open `ImageDialog` on click

### Tests for US5

- [ ] T037 [P] [US5] Write e2e test for image insertion in `tests/e2e/markdown-images.spec.ts`

**Checkpoint**: US5 complete - Images insertable via drag & drop and button

---

## Phase 8: User Story 6 - Numérotation des Lignes (Priority: P3)

**Goal**: Display line numbers synchronized with scroll

**Independent Test**: Open long note, scroll, verify line numbers stay in sync

### Line Numbers Component

- [x] T038 [US6] Create `MarkdownEditor/LineNumbers.tsx`:
  - Props: `lineCount`, `scrollTop`, `lineHeight`
  - Render line numbers 1 to N
  - Sync scroll position with editor via shared ref
  - Handle line wrapping (show one number per logical line)
  - NOTE: Implemented inline in MarkdownEditor/index.tsx as renderLineNumbers()

### Integration

- [x] T039 [US6] Integrate `LineNumbers` with `MarkdownEditor/index.tsx`:
  - Position as fixed column left of editor (width: 48px)
  - Forward scroll events to sync scrollTop
  - Update line count on content change

### Tests for US6

- [ ] T040 [P] [US6] Write integration tests for line numbers in `tests/integration/markdown-line-numbers.test.ts`

**Checkpoint**: US6 complete - Line numbers displayed and synchronized

---

## Phase 9: User Story 7 - Prévisualisation Intégrée (Priority: P3)

**Goal**: Toggle preview pane with scroll sync

**Independent Test**: Toggle preview, edit text, verify preview updates and scroll syncs

### Preview Component

- [x] T041 [US7] Create `MarkdownEditor/MarkdownPreview.tsx`:
  - Render markdown to HTML using Milkdown renderer
  - Support GFM and math rendering
  - Props: `content`, `scrollTop`
  - NOTE: Implemented inline in MarkdownEditor/index.tsx as renderMarkdown()

### Scroll Sync Hook

- [x] T042 [US7] Implement `useScrollSync` hook in `src/renderer/hooks/useScrollSync.ts`:
  - Build line mappings from source lines to preview DOM elements
  - `syncEditorToPreview(editorScrollTop)` - calculate preview scroll position
  - `syncPreviewToEditor(previewScrollTop)` - calculate editor scroll position
  - Prevent feedback loops with `isScrolling` flags
  - NOTE: Implemented inline in MarkdownEditor/index.tsx as handleEditorScroll() with ratio-based sync

### Integration

- [x] T043 [US7] Integrate preview with `MarkdownEditor/index.tsx`:
  - Add toggle button in toolbar (or footer)
  - Split view layout: Editor (50%) | Preview (50%)
  - Wire scroll sync between editor and preview
  - Persist `previewEnabled` in item metadata

### Tests for US7

- [ ] T044 [P] [US7] Write integration tests for preview in `tests/integration/markdown-preview.test.ts`

**Checkpoint**: US7 complete - Preview toggleable with scroll synchronization

---

## Phase 10: User Story 8 - Insertion de Liens (Priority: P3)

**Goal**: Insert hyperlinks via dialog

**Independent Test**: Select text, click link button, enter URL, verify link created

### Link Dialog

- [x] T045 [US8] Create `MarkdownEditor/LinkDialog.tsx`:
  - Modal with URL input (required)
  - Text input (pre-filled if selection, required if no selection)
  - Validation: URL format check
  - On confirm: call `applyLink()` transformer

### Integration

- [x] T046 [US8] Add link button to toolbar:
  - Add "Link" button (Ctrl+K shortcut)
  - Open `LinkDialog` with current selection as text
  - Handle click in preview: open URL in new web tab

### Tests for US8

- [ ] T047 [P] [US8] Write integration tests for links in `tests/integration/markdown-links.test.ts`

**Checkpoint**: US8 complete - Links insertable via dialog

---

## Phase 11: User Story 9 - Formules Mathématiques LaTeX (Priority: P4)

**Goal**: Write and render LaTeX formulas

**Independent Test**: Type `$E=mc^2$`, verify formula renders in preview

### Math Plugin Integration

- [x] T048 [US9] Integrate KaTeX with Milkdown in `MarkdownEditor/index.tsx`:
  - Import `@milkdown/plugin-math`
  - Configure editor with `.use(math)`
  - Import KaTeX CSS for styling
  - NOTE: Implemented directly with KaTeX in renderMarkdown() function

### Math Toolbar Action

- [x] T049 [US9] Add math button to toolbar:
  - Insert `$...$` for inline math
  - Insert `$$...$$` for block math (via dropdown or shift+click)
  - NOTE: Added fx and F(x) buttons to toolbar

### Error Handling

- [x] T050 [US9] Handle LaTeX parse errors:
  - Display error indicator in preview for invalid formulas
  - Show helpful error message
  - NOTE: Implemented with try/catch in renderMarkdown() showing .math-error class

### Tests for US9

- [ ] T051 [P] [US9] Write unit tests for math rendering in `tests/unit/markdown-math.test.ts`

**Checkpoint**: US9 complete - LaTeX formulas render correctly

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance

- [ ] T052 [P] Add lazy loading for KaTeX (import only when math content detected)
- [ ] T053 [P] Implement virtualization for notes > 5000 lines in `LineNumbers.tsx`
- [ ] T054 Measure and optimize render time to ensure < 50ms per keystroke

### Accessibility

- [x] T055 [P] Add ARIA labels to all toolbar buttons
  - NOTE: Added role="toolbar", role="group", aria-label, aria-pressed attributes
- [x] T056 [P] Implement keyboard navigation in toolbar
  - NOTE: Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.) already implemented
- [x] T057 Add focus management in dialogs (focus trap, Escape to close)
  - NOTE: Added role="dialog", aria-modal, aria-labelledby to dialogs. Escape key handling implemented.

### Documentation

- [ ] T058 [P] Add JSDoc comments to all public functions and components
- [ ] T059 Validate quickstart.md against actual implementation

### Final E2E Test

- [ ] T060 Write comprehensive e2e workflow test in `tests/e2e/markdown-workflow.spec.ts`:
  - Create note, add content, format with toolbar
  - Insert image, insert link
  - Toggle preview, verify scroll sync
  - Close app, reopen, verify restoration

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL ───┐
    │                                     │
    ▼                                     ▼
Phase 3 (US1: Live Edit) ◄──────────────────────────────────────┐
    │                                                            │
    ├──► Phase 4 (US2: Toolbar) - needs editor                  │
    │                                                            │
    ├──► Phase 5 (US3: Autosave) - needs editor                 │
    │                                                            │
    └──► Phase 6 (US4: Tabs) - needs editor                     │
                                                                 │
Phase 7 (US5: Images) - needs toolbar, IPC ──────────────────────┤
                                                                 │
Phase 8 (US6: Line Numbers) - independent after US1 ─────────────┤
                                                                 │
Phase 9 (US7: Preview) - needs editor, scroll sync ──────────────┤
                                                                 │
Phase 10 (US8: Links) - needs toolbar ───────────────────────────┤
                                                                 │
Phase 11 (US9: Math) - needs editor, KaTeX ──────────────────────┘
    │
    ▼
Phase 12 (Polish) - after all user stories
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (P1) | Phase 2 only | - |
| US2 (P2) | US1 | US3, US4 |
| US3 (P2) | US1 | US2, US4 |
| US4 (P2) | US1 | US2, US3 |
| US5 (P3) | US1, US2 (toolbar) | US6, US8 |
| US6 (P3) | US1 | US5, US7, US8 |
| US7 (P3) | US1 | US5, US6, US8 |
| US8 (P3) | US1, US2 (toolbar) | US5, US6, US7 |
| US9 (P4) | US1 | All P3 stories |

### Within Each Phase

- Tasks marked [P] can run in parallel
- Models/types before hooks
- Hooks before components
- Components before integration
- Integration before tests

### Parallel Opportunities

```bash
# Phase 2 - All [P] tasks can run together:
T006 (types) || T007 (types) || T008 (types)
T011 (IPC) || T012 (IPC) || T013 (IPC)
T016 (tests) || T017 (tests)

# After US1, multiple stories can proceed in parallel:
US2 (Toolbar) || US3 (Autosave) || US4 (Tabs)

# P3 stories can proceed in parallel after their dependencies:
US5 (Images) || US6 (Lines) || US7 (Preview) || US8 (Links)
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (1h)
2. Complete Phase 2: Foundational (4h)
3. Complete Phase 3: US1 - Live Edit (4h)
4. **STOP and VALIDATE**: Test markdown editing independently
5. Deploy/demo: Basic markdown editing works!

### Core Experience (US1 + US2 + US3 + US4)

1. Complete MVP
2. Add US2: Toolbar (3h)
3. Add US3: Autosave indicator (1h)
4. Add US4: Tab integration (2h)
5. **VALIDATE**: Full core editing experience

### Full Feature (All Stories)

1. Complete Core Experience
2. Add US5: Images (3h)
3. Add US6: Line Numbers (2h)
4. Add US7: Preview (3h)
5. Add US8: Links (2h)
6. Add US9: Math (2h)
7. Complete Phase 12: Polish (4h)
8. **FINAL VALIDATION**: E2E test suite passes

---

## Task Summary

| Phase | Tasks | Priority | Estimated |
|-------|-------|----------|-----------|
| Phase 1: Setup | T001-T005 | P0 | 1h |
| Phase 2: Foundational | T006-T017 | P0 | 4h |
| Phase 3: US1 Live Edit | T018-T023 | P1 | 4h |
| Phase 4: US2 Toolbar | T024-T027 | P2 | 3h |
| Phase 5: US3 Autosave | T028-T030 | P2 | 1h |
| Phase 6: US4 Tabs | T031-T033 | P2 | 2h |
| Phase 7: US5 Images | T034-T037 | P3 | 3h |
| Phase 8: US6 Lines | T038-T040 | P3 | 2h |
| Phase 9: US7 Preview | T041-T044 | P3 | 3h |
| Phase 10: US8 Links | T045-T047 | P3 | 2h |
| Phase 11: US9 Math | T048-T051 | P4 | 2h |
| Phase 12: Polish | T052-T060 | P3 | 4h |
| **Total** | **60 tasks** | - | **~31h** |

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing infrastructure: AutosaveManager, TabManager, SessionManager - minimal modifications needed
