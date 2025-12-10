# Tasks: Workspace Navigator

**Input**: Design documents from `/specs/003-workspace-navigator/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/ipc-api.ts, research.md, quickstart.md

**Tests**: Tests are included (70%+ coverage target per constitution)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Electron + React + Vite setup, TypeScript strict mode

- [X] T001 Create project structure: src/main/, src/renderer/, src/preload/, src/core/, src/types/
- [X] T002 Initialize Electron + React + Vite project with TypeScript strict mode in package.json
- [X] T003 [P] Configure ESLint with TypeScript rules in .eslintrc.json
- [X] T004 [P] Configure Prettier in .prettierrc.json
- [X] T005 [P] Setup Husky pre-commit hooks in .husky/
- [X] T006 [P] Configure Vitest for unit testing in vitest.config.ts
- [X] T007 [P] Configure Playwright for E2E testing in playwright.config.ts
- [X] T008 Create main process entry point in src/main/index.ts
- [X] T009 Create preload script with contextBridge in src/preload/index.ts
- [X] T010 Create React app entry point in src/renderer/App.tsx
- [X] T011 [P] Setup winston for structured logging in src/core/logging/logger.ts
- [X] T012 [P] Create base CSS with dark theme tokens in src/renderer/styles/index.css
- [ ] T013 [P] Import Inter font family in src/renderer/styles/fonts.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Layer

- [X] T014 Create SQLite connection with WAL mode in src/core/storage/database.ts
- [X] T015 Create migration runner in src/core/storage/database.ts (initialize method)
- [X] T016 Create initial schema in src/core/storage/schema.sql
- [X] T017 Unit test database connection in tests/unit/storage/database.test.ts

### Entity Types

- [X] T018 [P] Define Workspace entity interface in src/types/entities.ts
- [X] T019 [P] Define Folder entity interface in src/types/entities.ts
- [X] T020 [P] Define Item entity interface in src/types/entities.ts
- [X] T021 [P] Define Tab entity interface (SessionState with openTabs) in src/types/entities.ts
- [X] T022 [P] Define AIProvider entity interface in src/types/entities.ts
- [X] T023 [P] Define TreeNode type for UI in src/types/tree.ts

### Zod Validation Schemas

- [X] T024 [P] Create Workspace Zod schemas in src/types/schemas.ts
- [X] T025 [P] Create Folder Zod schemas in src/types/schemas.ts
- [X] T026 [P] Create Item Zod schemas in src/types/schemas.ts
- [X] T027 [P] Create Tab Zod schemas in src/types/schemas.ts
- [X] T028 [P] Create Search Zod schemas in src/types/schemas.ts

### Repositories (Data Access Layer)

- [X] T029 Create WorkspaceRepository with CRUD operations in src/core/storage/database.ts
- [X] T030 Create FolderRepository with CRUD + tree operations in src/core/storage/database.ts
- [X] T031 Create ItemRepository with CRUD + search operations in src/core/storage/database.ts
- [X] T032 Create TabRepository (SessionState) in src/core/storage/database.ts
- [X] T033 Create SessionRepository for state persistence in src/core/storage/database.ts
- [X] T034 [P] Unit test database/workspace operations in tests/unit/storage/database.test.ts
- [ ] T035 [P] Unit test FolderRepository in tests/unit/repositories/folder.test.ts
- [ ] T036 [P] Unit test ItemRepository in tests/unit/repositories/item.test.ts

### IPC Infrastructure

- [X] T037 Create typed IPC handler framework in src/main/ipc-handlers.ts (needs Zod validation)
- [X] T038 Create preload API exposure in src/preload/index.ts
- [X] T039 Create IPC type definitions in src/types/ipc.ts
- [X] T040 [P] Unit test IPC validation in tests/unit/ipc/validation.test.ts

### Core UI Shell

- [X] T041 Create 3-panel layout component (Sidebar/Main/AIPanel) in src/renderer/App.tsx
- [X] T042 Create resizable panel splitters in src/renderer/components/Layout/Splitter.tsx
- [X] T043 Create window controls (min/max/close) in src/renderer/components/TitleBar/TitleBar.tsx
- [X] T044 Setup Zustand stores structure in src/renderer/store/index.ts

### Event Bus

- [ ] T045 Create event bus for cross-component communication in src/core/events/eventBus.ts
- [ ] T046 Define event types in src/core/events/types.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Navigation Web avec Sauvegarde Automatique (Priority: P1) 🎯 MVP

**Goal**: Users can browse the web and have pages automatically saved to workspace with date folders

**Independent Test**: Open multiple web pages and verify they appear in the workspace tree with correct metadata (title, URL, date)

### Tests for User Story 1

- [ ] T047 [P] [US1] Unit test WebContentsView pool in tests/unit/webview/pool.test.ts
- [ ] T048 [P] [US1] Unit test auto-item creation in tests/unit/services/item-auto-create.test.ts
- [ ] T049 [P] [US1] Unit test duplicate URL detection in tests/unit/services/url-duplicate.test.ts
- [ ] T050 [US1] Integration test: navigate and auto-save in tests/integration/navigation-save.test.ts

### WebView Manager

- [X] T051 [US1] Create BrowserView manager in src/main/browser-view-manager.ts
- [X] T052 [US1] Implement view creation with sandbox enabled in src/main/browser-view-manager.ts
- [X] T053 [US1] Implement view management for memory optimization in src/main/browser-view-manager.ts

### Tab Management

- [X] T054 [US1] Implement tab:open IPC handler in src/main/ipc-handlers.ts
- [X] T055 [US1] Implement tab:navigate IPC handler in src/main/ipc-handlers.ts
- [X] T056 [US1] Implement tab:close IPC handler in src/main/ipc-handlers.ts
- [X] T057 [US1] Implement tab:switch (setActive) IPC handler in src/main/ipc-handlers.ts

### Auto-Save on Navigation

- [X] T058 [US1] Create NavigationWatcher in src/main/tab-manager.ts (handles page load events)
- [X] T059 [US1] Auto-create item on navigation in src/core/workspace/workspace-engine.ts
- [X] T060 [US1] Extract page title and favicon from webview in src/main/tab-manager.ts
- [X] T061 [US1] Implement getOrCreateDateFolder in src/core/storage/database.ts

### Duplicate URL Detection

- [X] T062 [US1] Implement findDuplicateWebItem in src/core/storage/database.ts
- [X] T063 [US1] Duplicate detection in WorkspaceEngine.createWebItem in src/core/workspace/workspace-engine.ts

### Tab Bar UI

- [X] T064 [US1] Create TabBar component in src/renderer/components/TabBar.tsx
- [X] T065 [US1] Create Tab component in src/renderer/components/Tab.tsx
- [X] T066 [US1] Tab state management in TabsContainer (uses IPC) in src/renderer/components/TabsContainer.tsx
- [X] T067 [US1] Implement tab switching UI in src/renderer/components/TabsContainer.tsx

### Address Bar

- [X] T068 [US1] Create NavigationBar component in src/renderer/components/NavigationBar.tsx
- [X] T069 [US1] Implement navigation buttons (back/forward/reload) in src/renderer/components/NavigationBar.tsx
- [X] T070 [US1] Connect navigation bar to IPC in src/renderer/components/NavigationBar.tsx

### Session Restore

- [X] T071 [US1] Implement session:save IPC handler in src/main/ipc-handlers.ts
- [X] T072 [US1] Implement session:restore IPC handler in src/main/ipc-handlers.ts
- [X] T073 [US1] Auto-save session in src/main/session-manager.ts
- [X] T074 [US1] Restore tabs on app startup in src/main/index.ts (restoreTabs function)
- [X] T075 [US1] Handle crash recovery via WAL mode in src/core/storage/database.ts

**Checkpoint**: User Story 1 complete - web navigation with auto-save works independently

---

## Phase 4: User Story 2 - Organisation Hiérarchique du Workspace (Priority: P1) 🎯 MVP

**Goal**: Users can organize items in a hierarchical folder structure with drag & drop and instant search

**Independent Test**: Create folders, move items via drag & drop, verify structure persists after restart, search works < 100ms

### Tests for User Story 2

- [ ] T076 [P] [US2] Unit test folder tree building in tests/unit/services/folder-tree.test.ts
- [ ] T077 [P] [US2] Unit test drag & drop reordering in tests/unit/services/dnd-reorder.test.ts
- [ ] T078 [P] [US2] Unit test FTS search performance in tests/unit/repositories/search.test.ts
- [ ] T079 [US2] Integration test: folder operations persist in tests/integration/folder-crud.test.ts

### Folder Operations

- [X] T080 [US2] Implement folder:create IPC handler in src/main/ipc-handlers.ts
- [ ] T081 [US2] Implement folder:rename IPC handler in src/main/ipc-handlers.ts
- [X] T082 [US2] Implement folder:delete IPC handler (cascade) in src/main/ipc-handlers.ts
- [X] T083 [US2] Implement folder:move IPC handler in src/main/ipc-handlers.ts
- [X] T084 [US2] Implement folder:getTree IPC handler in src/main/ipc-handlers.ts

### Item Move Operations

- [X] T085 [US2] Implement item:move IPC handler in src/main/ipc-handlers.ts
- [X] T086 [US2] Move item operations in src/core/workspace/item-manager.ts

### Search

- [X] T087 [US2] Implement workspace:search IPC handler with LIKE in src/main/ipc-handlers.ts
- [X] T088 [US2] Implement searchItems in src/core/storage/database.ts
- [ ] T089 [US2] Create SearchService with caching in src/main/services/search-service.ts

### Sidebar Tree View

- [X] T090 [US2] Create TreeView (WorkspacePanel with FolderTreeNode) in src/renderer/components/WorkspacePanel.tsx
- [X] T091 [US2] Create TreeNode component (folder/item) in src/renderer/components/WorkspacePanel.tsx
- [ ] T092 [US2] Create workspaceStore with Zustand in src/renderer/stores/workspaceStore.ts
- [X] T093 [US2] Implement tree expand/collapse in src/renderer/components/WorkspacePanel.tsx
- [ ] T094 [US2] Install and configure @dnd-kit for drag & drop in package.json
- [X] T095 [US2] Implement drag & drop for items (native HTML5) in src/renderer/components/WorkspacePanel.tsx
- [X] T096 [US2] Implement drag & drop for folders (native HTML5) in src/renderer/components/WorkspacePanel.tsx

### Search UI

- [X] T097 [US2] Create SearchBar component in src/renderer/components/SearchBar.tsx
- [X] T098 [US2] Create SearchResults dropdown in src/renderer/components/SearchBar.tsx
- [X] T099 [US2] Implement debounced search in src/renderer/components/SearchBar.tsx

### Context Menu

- [ ] T100 [US2] Create ContextMenu component in src/renderer/components/ui/ContextMenu.tsx
- [ ] T101 [US2] Implement folder context menu (new, rename, delete) in src/renderer/components/Sidebar/FolderContextMenu.tsx
- [ ] T102 [US2] Implement item context menu (open, move, delete) in src/renderer/components/Sidebar/ItemContextMenu.tsx

**Checkpoint**: User Story 2 complete - workspace organization works independently

---

## Phase 5: User Story 3 - Création et Édition de Notes Markdown (Priority: P2)

**Goal**: Users can create and edit Markdown notes with autosave in dedicated tabs

**Independent Test**: Create note, type content, verify autosave triggers at 500ms, check content persists

### Tests for User Story 3

- [ ] T103 [P] [US3] Unit test autosave debounce in tests/unit/hooks/useAutosave.test.ts
- [X] T104 [P] [US3] Unit test markdown transformers in tests/unit/markdown-transformers.test.ts
- [ ] T105 [US3] Integration test: create note and autosave in tests/integration/markdown-autosave.test.ts

### Note Item Operations

- [X] T106 [US3] Implement item:createNote IPC handler in src/main/ipc-handlers.ts
- [X] T107 [US3] Implement item:update IPC handler for content in src/main/ipc-handlers.ts

### Markdown Editor

- [X] T108 [US3] Install Milkdown/CodeMirror dependencies in package.json
- [X] T109 [US3] Create MarkdownEditor component in src/renderer/components/MarkdownEditor/index.tsx
- [X] T110 [US3] Create markdown transformers in src/renderer/utils/markdown-transformers.ts
- [X] T111 [US3] Create editor toolbar in src/renderer/components/MarkdownEditor/CodeMirrorEditor.tsx
- [X] T112 [US3] Apply dark theme styling in src/renderer/components/MarkdownEditor/styles.css

### Autosave

- [X] T113 [US3] Create useMarkdownEditor hook with autosave in src/renderer/hooks/useMarkdownEditor.ts
- [X] T114 [US3] Create SaveIndicator in src/renderer/components/MarkdownEditor/CodeMirrorEditor.tsx
- [X] T115 [US3] Connect autosave to IPC in src/renderer/components/MarkdownEditor/CodeMirrorEditor.tsx

### Tab Integration

- [X] T116 [US3] Distinguish note tabs from web tabs in TabsContainer in src/renderer/components/TabsContainer.tsx
- [X] T117 [US3] Open note in editor when tab activated in src/renderer/components/TabsContainer.tsx

**Checkpoint**: User Story 3 complete - Markdown notes work independently

---

## Phase 6: User Story 4 - Panneau IA Dédié (Priority: P2)

**Goal**: Users can access AI assistants (ChatGPT, Claude, Gemini) in a persistent side panel

**Independent Test**: Open AI panel, switch providers, verify session persists after app restart

### Tests for User Story 4

- [ ] T118 [P] [US4] Unit test AI provider switching in tests/unit/services/ai-provider.test.ts
- [ ] T119 [US4] Integration test: AI session persistence in tests/integration/ai-session.test.ts

### AI Panel Backend

- [ ] T120 [US4] Create AIProviderRepository in src/main/database/repositories/ai-provider.ts
- [ ] T121 [US4] Implement ai:listProviders IPC handler in src/main/ipc-handlers.ts
- [X] T122 [US4] Implement ai:switchProvider IPC handler in src/main/ipc-handlers.ts
- [X] T123 [US4] Implement ai:getCurrentProvider IPC handler in src/main/ipc-handlers.ts
- [X] T124 [US4] Create AI webview with partition in src/main/browser-view-manager.ts (switchAIProvider)

### AI Panel UI

- [X] T125 [US4] Create AIPanel container component in src/renderer/components/AIPanel.tsx
- [X] T126 [US4] Create ProviderSelector (dropdown) in src/renderer/components/AIPanel.tsx
- [ ] T127 [US4] Create aiStore with Zustand in src/renderer/stores/aiStore.ts
- [X] T128 [US4] Style AI panel with fixed width (400px) in src/renderer/styles/index.css
- [ ] T129 [US4] Add open/close animation (150ms) in src/renderer/components/AIPanel/AIPanel.css

### Session Persistence

- [X] T130 [US4] Save AI provider in session state in src/main/session-manager.ts
- [X] T131 [US4] Restore AI provider on app startup in src/renderer/App.tsx (loadSession)

**Checkpoint**: User Story 4 complete - AI panel works independently

---

## Phase 7: User Story 5 - Gestion Multi-Onglets Performante (Priority: P2)

**Goal**: Users can open 20+ tabs with < 200ms performance and soft limit warnings

**Independent Test**: Open 25 tabs, measure load times, verify warning appears at 21st tab

### Tests for User Story 5

- [ ] T132 [P] [US5] Performance test: tab opening < 200ms in tests/performance/tab-open.test.ts
- [ ] T133 [P] [US5] Unit test tab count warning in tests/unit/services/tab-limit.test.ts

### Performance Optimization

- [X] T134 [US5] Implement tab management with optimizations in src/main/tab-manager.ts
- [X] T135 [US5] Implement parallel tab restoration (T053) in src/main/index.ts
- [ ] T136 [US5] Add performance timing metrics in src/main/services/metrics.ts

### Tab Limit Warning

- [X] T137 [US5] Implement tab:getAll for count in src/main/ipc-handlers.ts
- [ ] T138 [US5] Create TabLimitWarning toast component in src/renderer/components/ui/Toast.tsx
- [ ] T139 [US5] Show warning when opening 21st tab in src/renderer/components/TabsContainer.tsx

### Tab ↔ Item Sync

- [X] T140 [US5] Implement tab-item mapping in src/main/tab-manager.ts
- [X] T141 [US5] Focus existing tab when item clicked in src/renderer/components/WorkspacePanel.tsx

**Checkpoint**: User Story 5 complete - multi-tab performance optimized

---

## Phase 8: User Story 6 - Interface Moderne Dark Mode (Priority: P3)

**Goal**: Premium dark mode UI with glassmorphism, glow effects, and fluid animations (120-180ms)

**Independent Test**: Navigate interface, verify visual consistency and animation timing

### Tests for User Story 6

- [ ] T142 [US6] Visual regression tests with Playwright screenshots in tests/e2e/visual-regression.test.ts

### Design System

- [X] T143 [P] [US6] Create color tokens (dark palette) in src/renderer/styles/index.css (CSS variables)
- [ ] T144 [P] [US6] Create spacing tokens in src/renderer/styles/tokens/spacing.css
- [ ] T145 [P] [US6] Create animation tokens (120-180ms) in src/renderer/styles/tokens/animations.css
- [ ] T146 [P] [US6] Create shadow/glow tokens in src/renderer/styles/tokens/effects.css

### UI Polish

- [ ] T147 [US6] Apply glassmorphism effect to panels in src/renderer/styles/components/panels.css
- [ ] T148 [US6] Add subtle glow to active elements in src/renderer/styles/components/interactive.css
- [X] T149 [US6] Style TabBar with tabs in src/renderer/styles/index.css
- [X] T150 [US6] Style sidebar with tree view in src/renderer/styles/index.css
- [X] T151 [US6] Add hover interactions in src/renderer/styles/index.css

### Animations

- [ ] T152 [US6] Add folder expand/collapse animation (120-150ms) in src/renderer/components/Sidebar/TreeNode.css
- [ ] T153 [US6] Add tab switch fade animation (80-120ms) in src/renderer/components/TabsContainer/TabContent.css
- [ ] T154 [US6] Add panel resize smooth transitions in src/renderer/components/Layout/Splitter.css

### Accessibility

- [ ] T155 [US6] Ensure AA contrast ratios in all color tokens
- [ ] T156 [US6] Add keyboard navigation to TreeView in src/renderer/components/WorkspacePanel.tsx
- [X] T157 [US6] Add keyboard shortcuts in src/renderer/hooks/useKeyboardShortcuts.ts
- [ ] T158 [US6] Add focus indicators to all interactive elements in src/renderer/styles/components/focus.css

**Checkpoint**: User Story 6 complete - UI polish finished

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final testing, optimization, documentation, and release packaging

### E2E Tests

- [X] T159 E2E test: app launch in tests/e2e/app-launch.e2e.ts
- [ ] T160 E2E test: session restore after crash in tests/e2e/session-restore.test.ts
- [ ] T161 E2E test: search performance with 10k items in tests/e2e/search-performance.test.ts

### Performance Validation

- [ ] T162 Validate app launch < 2s in tests/performance/startup.test.ts
- [ ] T163 Validate search < 100ms with 10k items in tests/performance/search.test.ts
- [ ] T164 Validate memory usage with 20 tabs in tests/performance/memory.test.ts

### Optimization

- [X] T165 Implement lazy loading for renderer modules in src/renderer/App.tsx (Suspense + lazy)
- [ ] T166 Implement virtualized list in TreeView (react-window) in src/renderer/components/Sidebar/TreeView.tsx
- [X] T167 Add in-memory cache in src/core/storage/cache.ts

### Security Hardening

- [X] T168 Implement CSP in src/core/security/csp.ts
- [X] T169 Security audit in src/core/security/security-audit.ts
- [ ] T170 Validate all IPC inputs with Zod in src/main/ipc-handlers.ts

### Documentation

- [ ] T171 [P] Create API documentation in docs/api/ipc.md
- [ ] T172 [P] Create architecture overview in docs/architecture.md
- [ ] T173 Update quickstart.md with final instructions in specs/003-workspace-navigator/quickstart.md

### Build & Packaging

- [X] T174 Configure electron-builder for Windows in package.json (build section)
- [X] T175 Configure electron-builder for macOS in package.json (build section)
- [X] T176 Configure electron-builder for Linux in package.json (build section)
- [X] T177 Setup CI/CD pipeline in .github/workflows/
- [ ] T178 Create release script in scripts/release.sh

**Checkpoint**: All tasks complete - ready for v1.0 release

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if staffed
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational - May use tab infrastructure from US1
- **User Story 4 (P2)**: Can start after Foundational - Independent from other stories
- **User Story 5 (P2)**: Depends on US1 (tab infrastructure)
- **User Story 6 (P3)**: Can start anytime after Foundational - UI polish layer

### Within Each User Story

- Tests SHOULD be written and FAIL before implementation (TDD)
- Backend/IPC before frontend components
- Core functionality before UI polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational entity/schema tasks marked [P] can run in parallel
- All repository tasks can run in parallel within Phase 2
- Tests marked [P] within a story can run in parallel
- US1 and US2 can run in parallel (both P1)
- US3 and US4 can run in parallel (both P2)
- US6 can run in parallel with any other story

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all entity definitions in parallel:
Task: "Define Workspace entity interface in src/types/entities.ts"
Task: "Define Folder entity interface in src/types/entities.ts"
Task: "Define Item entity interface in src/types/entities.ts"
Task: "Define Tab entity interface in src/types/entities.ts"

# Launch all Zod schemas in parallel:
Task: "Create Workspace Zod schemas in src/types/schemas.ts"
Task: "Create Folder Zod schemas in src/types/schemas.ts"
Task: "Create Item Zod schemas in src/types/schemas.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Web navigation + auto-save)
4. Complete Phase 4: User Story 2 (Workspace organization)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test → Deploy (web browsing works)
3. Add US2 → Test → Deploy (organization works)
4. Add US3 → Test → Deploy (notes work)
5. Add US4 → Test → Deploy (AI works)
6. Add US5 → Test → Deploy (performance optimized)
7. Add US6 → Test → Deploy (UI polished)
8. Polish Phase → Final testing → Release v1.0

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Navigation)
   - Developer B: User Story 2 (Organization)
   - Developer C: User Story 6 (UI Polish - can layer on later)
3. Stories complete and integrate independently

---

## Summary

| Phase | Story | Task Count | Parallel Tasks |
|-------|-------|------------|----------------|
| 1 | Setup | 13 | 7 |
| 2 | Foundational | 33 | 18 |
| 3 | US1 - Navigation | 29 | 4 |
| 4 | US2 - Organization | 27 | 4 |
| 5 | US3 - Markdown | 15 | 3 |
| 6 | US4 - AI Panel | 14 | 2 |
| 7 | US5 - Multi-tabs | 10 | 2 |
| 8 | US6 - Dark Mode UI | 17 | 4 |
| 9 | Polish | 20 | 2 |
| **Total** | | **178** | **46** |

**MVP Scope**: Phases 1-4 (102 tasks) - Web navigation + Organization
**Full V1**: All phases (178 tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Performance targets: < 2s startup, < 200ms tab open, < 100ms search
