# Implementation Tasks: Workspace Navigator

**Branch**: `001-workspace-navigator` | **Date**: 2025-11-24
**Architecture**: Electron BrowserView (Pivot from CEF)
**Based on**: [spec.md](./spec.md), [plan.md](./plan.md), [ARCHITECTURE_PIVOT.md](../../ARCHITECTURE_PIVOT.md)

## Overview

This task list implements Workspace Navigator using **Electron's built-in BrowserView API** instead of CEF. The architecture pivot eliminates native C++ compilation while maintaining all product features.

**Key Changes from CEF Approach**:
- ✅ No native code compilation
- ✅ Electron BrowserView for web rendering
- ✅ Simpler build process
- ✅ Faster development cycle
- ✅ Same user experience

**Task Organization**:
- 🎯 **MVP** (Minimum Viable Product) - 4-week sprint
- 🚀 **V1** (Full Version 1) - Additional 8 weeks
- ⚡ **Parallel** - Can be executed concurrently with other tasks

---

## Phase 1: Project Setup & CEF Removal

**Goal**: Remove CEF dependencies and configure pure Electron architecture
**Duration**: 3-5 days

### T001: Remove CEF Native Code 🎯
**Priority**: P0 (Blocking)
**Dependencies**: None
**Estimated Time**: 2 hours

**Tasks**:
1. Delete `native/` directory entirely
   - Remove `native/src/` (all C++ files)
   - Remove `native/include/` (all headers)
   - Remove `native/build-cef-*.sh` scripts
   - Remove CMakeLists.txt
2. Archive CEF documentation
   - Move `CEF_*.md` files to `archive/cef-experiment/`
   - Keep ARCHITECTURE_PIVOT.md in root for reference
3. Verify no references to CEF in codebase
   - Search for "cef" (case insensitive)
   - Search for "webview_pool"
   - Search for "browser_client"

**Acceptance Criteria**:
- `native/` directory does not exist
- No CEF-related imports in TypeScript files
- Build completes without CEF references

---

### T002: Update Package Dependencies 🎯
**Priority**: P0 (Blocking)
**Dependencies**: T001
**Estimated Time**: 1 hour

**Tasks**:
1. Remove CEF dependencies from package.json
   - Remove any CEF-related npm packages
   - Remove node-gyp dependencies
   - Remove cmake-js dependencies
2. Update Electron to version 30+
   - Ensure BrowserView API available
   - Update @types/electron
3. Add required dependencies
   - better-sqlite3 (SQLite with native bindings)
   - electron-builder (packaging)
   - vite (renderer bundling)
4. Run `npm install`
5. Verify electron can launch: `npx electron .`

**Acceptance Criteria**:
- package.json has no CEF references
- Electron 30+ installed
- `npm install` completes successfully
- Basic Electron window opens

---

### T003: Configure Build System 🎯
**Priority**: P0
**Dependencies**: T002
**Estimated Time**: 3 hours

**Tasks**:
1. Update `package.json` scripts
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build:renderer": "vite build",
       "build:main": "tsc -p tsconfig.main.json",
       "build": "npm run build:main && npm run build:renderer",
       "electron:dev": "electron .",
       "electron:build": "electron-builder"
     }
   }
   ```
2. Create/update tsconfig files
   - `tsconfig.main.json` for main process
   - `tsconfig.renderer.json` for renderer process
3. Configure Vite for renderer
   - Create `vite.config.ts`
   - Set up React support
   - Configure build output to `dist/renderer/`
4. Configure electron-builder
   - Create `electron-builder.json5`
   - Set targets: Windows, macOS, Linux
   - Configure app metadata

**Acceptance Criteria**:
- `npm run build` succeeds
- `npm run electron:dev` launches app
- Hot reload works for renderer
- Main process restarts on changes

---

### T004: Update Project Structure 🎯
**Priority**: P0
**Dependencies**: T003
**Estimated Time**: 2 hours

**Tasks**:
1. Ensure directory structure matches plan.md:
   ```
   src/
   ├── main/                    # Electron main process
   ├── core/                    # Business logic (shared)
   │   ├── workspace/
   │   ├── storage/
   │   └── types/
   ├── renderer/                # React UI
   │   ├── components/
   │   ├── hooks/
   │   └── store/
   └── preload/                 # Preload scripts
   ```
2. Create placeholder files in each directory
3. Set up module exports/imports
4. Update import paths in existing files

**Acceptance Criteria**:
- Directory structure matches plan.md
- All modules can import from `src/core/types`
- No broken imports

---

### T005: Set Up Testing Infrastructure 🎯
**Priority**: P1
**Dependencies**: T003
**Estimated Time**: 4 hours
**Parallel**: Can run alongside T006-T008

**Tasks**:
1. Install testing dependencies
   - vitest (unit tests)
   - @testing-library/react (React component tests)
   - playwright (E2E tests)
   - @playwright/test + electron
2. Configure Vitest
   - Create `vitest.config.ts`
   - Set up coverage thresholds (70%+)
   - Configure test environment
3. Configure Playwright
   - Create `playwright.config.ts`
   - Set up Electron test harness
   - Configure screenshot/video capture
4. Create test utilities
   - Mock IPC handlers
   - Database fixtures
   - Helper functions
5. Write sample tests to verify setup

**Acceptance Criteria**:
- `npm test` runs Vitest
- `npm run test:e2e` runs Playwright
- Coverage reports generated
- Sample tests pass

---

### T006: Set Up CI/CD Pipeline 🎯
**Priority**: P1
**Dependencies**: T005
**Estimated Time**: 3 hours
**Parallel**: Can run alongside T007-T008

**Tasks**:
1. Create `.github/workflows/ci.yml`
   - Matrix build: [ubuntu-latest, macos-latest, windows-latest]
   - Steps: install, lint, test, build
   - Upload build artifacts
2. Configure linting
   - ESLint for TypeScript
   - Prettier for formatting
   - Pre-commit hooks (husky)
3. Set up code coverage
   - Report to Codecov or similar
   - Enforce 70% minimum coverage
4. Configure Dependabot
   - Auto-update dependencies
   - Security vulnerability scanning

**Acceptance Criteria**:
- CI pipeline runs on push
- All platforms build successfully
- Coverage reports uploaded
- Linting enforced

---

### T007: Create Development Documentation 🎯
**Priority**: P2
**Dependencies**: T003
**Estimated Time**: 2 hours
**Parallel**: Can run with any task

**Tasks**:
1. Create `specs/001-workspace-navigator/quickstart.md`
   - Prerequisites (Node.js 20+, npm 10+)
   - Installation steps
   - Development mode commands
   - Build commands
   - Testing commands
   - Troubleshooting common issues
2. Update root README.md
   - Project overview
   - Architecture diagram
   - Link to quickstart guide
   - Contributing guidelines

**Acceptance Criteria**:
- New developer can set up project from quickstart.md
- All commands documented
- Troubleshooting section covers common errors

---

### T008: Milestone 1 Validation 🎯
**Priority**: P0
**Dependencies**: T001-T007
**Estimated Time**: 1 hour

**Validation Checklist**:
- [ ] CEF code completely removed
- [ ] Electron 30+ installed and working
- [ ] Build system functional (dev + prod)
- [ ] Tests run successfully
- [ ] CI pipeline green on all platforms
- [ ] Documentation complete

**Deliverable**: Clean Electron-only codebase ready for implementation

---

## Phase 2: Core Infrastructure

**Goal**: Database layer, IPC contracts, basic window management
**Duration**: 1 week

### T009: Database Layer - Schema & Migrations 🎯
**Priority**: P0 (Blocking)
**Dependencies**: T008
**Estimated Time**: 6 hours

**Tasks**:
1. Install better-sqlite3
   - Add to package.json
   - Build native module for Electron: `npm run rebuild`
2. Create `src/core/storage/database.ts`
   ```typescript
   export class Database {
     constructor(dbPath: string)
     initialize(): void
     close(): void
     query<T>(sql: string, params: any[]): T[]
     execute(sql: string, params: any[]): void
   }
   ```
3. Create database schema (based on plan.md contracts/database-schema.sql)
   - `workspaces` table
   - `folders` table (with parent_id FK)
   - `items` table (type: web | markdown)
   - `session_state` table (for crash recovery)
   - Indexes for performance
4. Create migration system
   - `src/core/storage/migrations/001-initial.sql`
   - Migration runner in `database.ts`
   - Track version with PRAGMA user_version
5. Write unit tests
   - Database initialization
   - Schema creation
   - Migration application
   - CRUD operations

**Acceptance Criteria**:
- Database initializes with correct schema
- Migrations run automatically on startup
- Foreign key constraints enforced
- Unit tests pass (90%+ coverage)

---

### T010: Database Layer - Entity Access 🎯
**Priority**: P0
**Dependencies**: T009
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/core/types/entities.ts`
   ```typescript
   export interface Workspace {
     id: string
     name: string
     created_at: number
     last_active_at: number
   }

   export interface Folder {
     id: string
     workspace_id: string
     parent_id: string | null
     name: string
     display_order: number
   }

   export interface Item {
     id: string
     workspace_id: string
     folder_id: string | null
     type: 'web' | 'markdown'
     url?: string
     content?: string
     title: string
     favicon?: string
     created_at: number
   }
   ```
2. Create data access methods in `database.ts`
   - Workspace CRUD
   - Folder CRUD (with hierarchy query)
   - Item CRUD (with filtering by folder)
3. Add caching layer (in-memory)
   - Cache workspace tree structure
   - Invalidate on writes
4. Write unit tests for all CRUD operations

**Acceptance Criteria**:
- All entity types can be created/read/updated/deleted
- Cascading deletes work correctly
- Caching improves read performance
- Unit tests pass

---

### T011: IPC Contracts Definition 🎯
**Priority**: P0
**Dependencies**: T010
**Estimated Time**: 3 hours

**Tasks**:
1. Create `src/core/types/contracts.ts` (based on plan.md)
   ```typescript
   export interface WorkspaceAPI {
     // Workspace operations
     createWorkspace(name: string): Promise<Workspace>
     getWorkspace(id: string): Promise<Workspace>
     getAllWorkspaces(): Promise<Workspace[]>
     deleteWorkspace(id: string): Promise<void>

     // Folder operations
     createFolder(workspaceId: string, name: string, parentId?: string): Promise<Folder>
     renameFolder(folderId: string, newName: string): Promise<void>
     deleteFolder(folderId: string, deleteItems: boolean): Promise<void>

     // Item operations
     createWebItem(workspaceId: string, url: string, folderId?: string): Promise<Item>
     createMarkdownItem(workspaceId: string, title: string, folderId?: string): Promise<Item>
     openItem(itemId: string): Promise<void>
     moveItem(itemId: string, targetFolderId: string): Promise<void>

     // Browser operations
     navigateTab(url: string): Promise<void>
     goBack(): Promise<void>
     goForward(): Promise<void>
     reload(): Promise<void>
     closeTab(tabId: string): Promise<void>
   }
   ```
2. Create event types
   ```typescript
   export type WorkspaceEvent =
     | { type: 'workspace:created', workspace: Workspace }
     | { type: 'item:created', item: Item }
     | { type: 'folder:created', folder: Folder }
     // ...etc
   ```
3. Document all contracts in comments (TSDoc)

**Acceptance Criteria**:
- All IPC contracts defined with TypeScript types
- Events defined for all state changes
- Full TSDoc documentation

---

### T012: IPC Bridge Implementation 🎯
**Priority**: P0
**Dependencies**: T011
**Estimated Time**: 5 hours

**Tasks**:
1. Create `src/main/ipc-handlers.ts`
   - Register handlers for all WorkspaceAPI methods
   - Use `ipcMain.handle()` for async requests
   - Use `webContents.send()` for events
2. Create `src/preload/index.ts`
   - Expose safe IPC methods via contextBridge
   - Create type-safe API for renderer
   ```typescript
   contextBridge.exposeInMainWorld('workspaceAPI', {
     createWorkspace: (name: string) => ipcRenderer.invoke('workspace:create', name),
     // ...all other methods
     onWorkspaceEvent: (callback: (event: WorkspaceEvent) => void) => {
       ipcRenderer.on('workspace:event', (_, event) => callback(event))
     }
   })
   ```
3. Create TypeScript declaration
   - `src/types/electron.d.ts`
   - Extend Window interface with workspaceAPI
4. Write integration tests
   - Mock IPC calls
   - Verify data flows correctly

**Acceptance Criteria**:
- All IPC methods work from renderer to main
- Events propagate from main to renderer
- Type safety enforced at compile time
- Integration tests pass

---

### T013: Main Window Setup 🎯
**Priority**: P0
**Dependencies**: T012
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/main/window-manager.ts`
   ```typescript
   export class WindowManager {
     private mainWindow: BrowserWindow | null = null

     createMainWindow(): void
     getMainWindow(): BrowserWindow
     restoreWindowGeometry(geometry: WindowGeometry): void
     getWindowGeometry(): WindowGeometry
   }
   ```
2. Implement window creation
   - Default size: 1920x1080
   - Minimum size: 1280x720
   - Enable web preferences for security
   - Load renderer HTML
3. Implement window state persistence
   - Save position/size on move/resize
   - Restore on startup
   - Handle multi-monitor scenarios
4. Set up window event handlers
   - Close handler (save state)
   - Minimize/maximize handlers
   - Focus handlers
5. Create main.html template
   - Basic HTML shell
   - Load bundled renderer JS
   - Include React root div

**Acceptance Criteria**:
- Main window opens with correct size
- Window state persists across restarts
- Window stays on visible screen
- Renderer loads successfully

---

### T014: React Application Shell 🎯
**Priority**: P0
**Dependencies**: T013
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/renderer/index.tsx`
   - React 18 root setup
   - Render App component
2. Create `src/renderer/App.tsx`
   - Three-column layout (Flexbox)
   - Left: Workspace panel (300px, resizable)
   - Center: Tab area (flex: 1)
   - Right: AI panel (300px, resizable)
3. Create layout components
   - `<ResizablePanels>` wrapper
   - `<Splitter>` component for resize handles
4. Set up CSS structure
   - CSS modules or styled-components
   - Base theme variables
   - Layout styles
5. Create placeholder components
   - `<WorkspacePanel>` - "Workspace Tree Here"
   - `<TabArea>` - "Tabs Here"
   - `<AIPanel>` - "AI Assistant Here"

**Acceptance Criteria**:
- Three-column layout renders correctly
- Panels are resizable with splitters
- Minimum panel widths enforced
- Responsive to window resize

---

### T015: State Management Setup 🎯
**Priority**: P1
**Dependencies**: T014
**Estimated Time**: 3 hours

**Tasks**:
1. Choose state management library
   - Option A: Zustand (recommended - simpler)
   - Option B: Redux Toolkit
2. Create stores (using Zustand example)
   - `src/renderer/store/workspace-store.ts`
     - Current workspace
     - Workspace list
     - Folder tree
   - `src/renderer/store/tab-store.ts`
     - Open tabs
     - Active tab index
   - `src/renderer/store/ui-store.ts`
     - Theme (light/dark)
     - Panel sizes
3. Create hooks
   - `useWorkspace()`
   - `useTabs()`
   - `useTheme()`
4. Connect stores to IPC
   - Listen to workspace events
   - Update store on events

**Acceptance Criteria**:
- State updates trigger React re-renders
- State persists across IPC calls
- Hooks provide type-safe access

---

### T016: Error Handling & Logging 🎯
**Priority**: P1
**Dependencies**: T009
**Estimated Time**: 3 hours

**Tasks**:
1. Set up logging library (winston or electron-log)
2. Create `src/core/logger.ts`
   - Log levels: error, warn, info, debug
   - File output: logs/app.log (rotated daily)
   - Console output in dev mode
3. Create error handler utilities
   - `src/core/errors.ts`
   - Custom error classes (DatabaseError, IPCError, etc.)
   - Error serialization for IPC
4. Add global error handlers
   - Main process: `process.on('uncaughtException')`
   - Renderer: `window.onerror`, `window.onunhandledrejection`
   - Log all errors with stack traces
5. Create error boundary component (React)
   - Catch renderer errors
   - Display user-friendly message
   - Log error details

**Acceptance Criteria**:
- All errors logged to file
- User sees friendly error messages
- Stack traces available for debugging
- No crashes from unhandled errors

---

### T017: Milestone 2 Validation 🎯
**Priority**: P0
**Dependencies**: T009-T016
**Estimated Time**: 2 hours

**Validation Checklist**:
- [ ] Database creates and migrates successfully
- [ ] IPC communication works (main ↔ renderer)
- [ ] Main window renders React app
- [ ] Three-column layout displays
- [ ] State management functional
- [ ] Errors logged and handled gracefully
- [ ] All unit tests pass
- [ ] Integration tests pass

**Deliverable**: Functional application shell with data layer

---

## Phase 3: Workspace Management (User Story 1 - Core Workspace)

**Goal**: Implement workspace creation, folder hierarchy, item management
**Duration**: 1 week

### T018: Workspace Engine - Core Operations 🎯
**Priority**: P0 (Blocking)
**Dependencies**: T017
**Estimated Time**: 6 hours

**Tasks**:
1. Create `src/core/workspace/workspace-engine.ts`
   ```typescript
   export class WorkspaceEngine {
     constructor(database: Database)

     createWorkspace(name: string): Promise<Workspace>
     getWorkspace(id: string): Promise<Workspace>
     getAllWorkspaces(): Promise<Workspace[]>
     deleteWorkspace(id: string): Promise<void>
     switchWorkspace(id: string): Promise<void>

     private activeWorkspaceId: string | null
   }
   ```
2. Implement createWorkspace
   - Validate name (1-100 chars)
   - Generate UUID for workspace
   - INSERT into database
   - Emit 'workspace:created' event
3. Implement getWorkspace
   - Query database by ID
   - Return workspace or throw error
4. Implement deleteWorkspace
   - Show confirmation (via IPC event)
   - CASCADE delete (folders, items)
   - Emit 'workspace:deleted' event
5. Implement switchWorkspace
   - Save current workspace state
   - Load new workspace tree
   - Emit 'workspace:switched' event
6. Write unit tests

**Acceptance Criteria**:
- Can create workspace with valid name
- Can retrieve workspace by ID
- Delete cascades to all folders/items
- Switch workspace changes active context
- Unit tests pass (90%+ coverage)

---

### T019: Folder Management 🎯
**Priority**: P0
**Dependencies**: T018
**Estimated Time**: 5 hours

**Tasks**:
1. Create `src/core/workspace/folder-manager.ts`
   ```typescript
   export class FolderManager {
     constructor(database: Database)

     createFolder(workspaceId: string, name: string, parentId?: string): Promise<Folder>
     renameFolder(folderId: string, newName: string): Promise<void>
     moveFolder(folderId: string, newParentId: string): Promise<void>
     deleteFolder(folderId: string, deleteItems: boolean): Promise<void>
     getFolderHierarchy(workspaceId: string): Promise<FolderNode[]>
   }
   ```
2. Implement createFolder
   - Validate name (1-100 chars)
   - Validate parent exists (if provided)
   - Calculate display_order (max + 1)
   - INSERT into database
3. Implement getFolderHierarchy
   - Query all folders for workspace
   - Build tree structure (recursive)
   - Sort by display_order
   - Return root-level FolderNode[]
4. Implement moveFolder
   - Validate new parent exists
   - Prevent circular references
   - UPDATE parent_id
5. Implement deleteFolder
   - If deleteItems=true: CASCADE
   - If deleteItems=false: Move items to parent or root
   - Show confirmation with item count
6. Write unit tests

**Acceptance Criteria**:
- Folders can be nested arbitrarily
- Circular references prevented
- Delete behavior matches specification
- Hierarchy query returns correct tree
- Unit tests pass

---

### T020: Auto Date Folders (Clarification B) 🎯
**Priority**: P0
**Dependencies**: T019
**Estimated Time**: 3 hours

**Tasks**:
1. Create `src/core/workspace/date-folder-manager.ts`
   ```typescript
   export class DateFolderManager {
     constructor(database: Database, folderManager: FolderManager)

     ensureDateFolder(workspaceId: string, date: Date): Promise<string>
   }
   ```
2. Implement ensureDateFolder
   - Format date as DD.MM.YYYY (e.g., "24.11.2025")
   - Query for folder with this name at workspace root (parentId=null)
   - If exists: return folderId
   - If not: create folder, return folderId
3. Integrate with item creation (next task)
   - Check if folderId is null (workspace root)
   - If null: get/create date folder
   - Assign item to date folder
4. Write unit tests
   - Same date = same folder
   - Different dates = different folders
   - Manual folder placement skips auto-folder

**Acceptance Criteria**:
- Items added to root auto-placed in date folders
- Date format is DD.MM.YYYY
- Folders created only once per date
- Manual placement bypasses auto-folders
- Unit tests pass

---

### T021: Item Management - Web Items 🎯
**Priority**: P0
**Dependencies**: T020
**Estimated Time**: 5 hours

**Tasks**:
1. Create `src/core/workspace/item-manager.ts`
   ```typescript
   export class ItemManager {
     constructor(
       database: Database,
       dateFolderManager: DateFolderManager
     )

     createWebItem(workspaceId: string, url: string, title: string, folderId?: string): Promise<Item>
     createMarkdownItem(workspaceId: string, title: string, folderId?: string): Promise<Item>
     updateItem(itemId: string, updates: Partial<Item>): Promise<void>
     deleteItem(itemId: string): Promise<void>
     moveItem(itemId: string, targetFolderId: string): Promise<void>
     getItem(itemId: string): Promise<Item>
   }
   ```
2. Implement createWebItem
   - Validate URL format
   - If folderId is null: get date folder
   - Generate UUID for item
   - INSERT with type='web'
   - Emit 'item:created' event
3. Implement updateItem
   - Allow updating title, favicon, tags
   - UPDATE in database
   - Emit 'item:updated' event
4. Implement deleteItem
   - DELETE from database
   - Emit 'item:deleted' event
5. Implement moveItem
   - Validate target folder exists
   - UPDATE folder_id
   - Emit 'item:moved' event
6. Write unit tests

**Acceptance Criteria**:
- Web items created with URL, title, favicon
- Items placed in date folders when folderId is null
- Items can be moved between folders
- Unit tests pass

---

### T022: Item Management - Markdown Items 🎯
**Priority**: P0
**Dependencies**: T021
**Estimated Time**: 4 hours

**Tasks**:
1. Extend ItemManager with note file handling
2. Implement createMarkdownItem
   - If folderId is null: get date folder
   - Generate UUID for item
   - Create empty file: `userData/notes/<itemId>.md`
   - INSERT with type='markdown', content=null
   - Emit 'item:created' event
3. Implement note file operations
   - `readNoteContent(itemId): Promise<string>`
   - `writeNoteContent(itemId, content): Promise<void>`
   - Use atomic writes (temp file + rename)
4. Implement deleteItem (note variant)
   - DELETE from database
   - Delete .md file
   - Emit 'item:deleted' event
5. Write unit tests

**Acceptance Criteria**:
- Markdown items create .md files
- Note content persists to file
- Atomic writes prevent corruption
- Delete removes both DB entry and file
- Unit tests pass

---

### T023: Workspace Panel UI 🎯
**Priority**: P0
**Dependencies**: T022
**Estimated Time**: 8 hours

**Tasks**:
1. Create `src/renderer/components/WorkspacePanel.tsx`
   - Workspace selector dropdown (top)
   - Search bar
   - File tree (scrollable)
   - Action buttons (New Folder, New Note)
2. Create `src/renderer/components/FolderTree.tsx`
   - Recursive tree component
   - Render folders with expand/collapse
   - Render items with icons
   - Handle click events
3. Create `src/renderer/components/TreeNode.tsx`
   - Folder node: 📁 icon, name, expand arrow, badge count
   - Web item node: 🌐 or favicon, title
   - Markdown item node: 📝 icon, title
   - Hover effects
   - Selected state
4. Implement workspace selector
   - Dropdown populated from workspace store
   - Click workspace: call IPC switchWorkspace
5. Implement action buttons
   - "New Folder" button: show input dialog, call createFolder
   - "New Note" button: call createMarkdownItem, open in tab
6. Connect to state management
   - Load workspaces on mount
   - Subscribe to workspace events
   - Update tree on item/folder changes
7. Style components
   - Tree indentation
   - Icons
   - Hover/selection colors

**Acceptance Criteria**:
- Workspace tree displays correctly
- Can switch workspaces
- Can create folders and notes from UI
- Tree updates in real-time on changes
- UI matches design mockups

---

### T024: Context Menu & Actions 🎯
**Priority**: P1
**Dependencies**: T023
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/renderer/components/ContextMenu.tsx`
   - Generic context menu component
   - Position at mouse coordinates
   - List of actions with icons
2. Add context menu to tree nodes
   - Right-click folder: New Folder, New Note, Rename, Delete
   - Right-click item: Open, Rename, Move to, Delete
3. Implement actions
   - Rename: inline edit or dialog
   - Delete: confirmation dialog with IPC call
   - Move to: folder picker dialog
4. Add keyboard shortcuts
   - F2: Rename selected
   - Delete: Delete selected (with confirmation)
   - Ctrl+N: New note
   - Ctrl+Shift+N: New folder

**Acceptance Criteria**:
- Context menu appears on right-click
- All actions work correctly
- Confirmations shown for destructive actions
- Keyboard shortcuts work

---

### T025: Workspace Persistence & Restoration 🎯
**Priority**: P0
**Dependencies**: T024
**Estimated Time**: 3 hours

**Tasks**:
1. Implement session state saving
   - Save active workspace ID
   - Save on workspace switch
   - Save on app close
2. Implement restoration on startup
   - Read last active workspace from session
   - Load workspace tree
   - Update UI state
3. Handle edge cases
   - Workspace deleted: load first available or create new
   - Corrupted session: start fresh
   - No workspaces: prompt to create first
4. Write integration tests
   - Create workspace → close app → reopen → verify restored

**Acceptance Criteria**:
- Last workspace reopens on startup
- Workspace tree fully loaded
- No data loss across restarts
- Integration tests pass

---

### T026: Milestone 3 Validation (User Story 1) 🎯
**Priority**: P0
**Dependencies**: T018-T025
**Estimated Time**: 3 hours

**Validation (Spec User Story 1 Acceptance Criteria)**:
- [ ] AS1.1: Can create workspace "Research Project"
- [ ] AS1.2: Web items auto-created with URL, title, favicon
- [ ] AS1.3: Can create folder and drag 5 items into it
- [ ] AS1.4: Date folders auto-created (DD.MM.YYYY format)
- [ ] AS1.5: Can click saved item → opens in tab (prepare for Phase 4)
- [ ] AS1.6: Close + reopen → all structure preserved

**End-to-End Test**:
1. Launch app
2. Create workspace "Test Workspace"
3. Add 5 web items
4. Create folder "Chapter 1"
5. Move 3 items to folder
6. Close app
7. Reopen app
8. Verify workspace structure intact

**Deliverable**: Functional workspace management (User Story 1 complete)

---

## Phase 4: BrowserView Integration & Tab Management (User Story 5)

**Goal**: Implement Electron BrowserView for web tabs, tab lifecycle
**Duration**: 1 week

### T027: BrowserView Manager - Core 🎯
**Priority**: P0 (Blocking)
**Dependencies**: T026
**Estimated Time**: 8 hours

**Tasks**:
1. Create `src/main/browser-view-manager.ts`
   ```typescript
   export class BrowserViewManager {
     private views: Map<string, BrowserView> = new Map()
     private availablePool: BrowserView[] = []
     private maxPoolSize = 20

     constructor(private mainWindow: BrowserWindow)

     createView(tabId: string, url: string): BrowserView
     showView(tabId: string): void
     hideView(tabId: string): void
     destroyView(tabId: string): void
     navigateView(tabId: string, url: string): void

     // Navigation
     goBack(tabId: string): void
     goForward(tabId: string): void
     reload(tabId: string): void
     canGoBack(tabId: string): boolean
     canGoForward(tabId: string): boolean
   }
   ```
2. Implement createView
   - Check available pool first
   - If available: reuse BrowserView
   - If not: create new BrowserView
   ```typescript
   const view = new BrowserView({
     webPreferences: {
       nodeIntegration: false,
       contextIsolation: true,
       sandbox: true
     }
   })
   ```
   - Add to mainWindow: `mainWindow.addBrowserView(view)`
   - Position view in center panel area
   - Load URL: `view.webContents.loadURL(url)`
   - Track in views Map
3. Implement showView
   - Get view from Map
   - Call `view.setBounds()` with visible coordinates
   - Hide all other views
4. Implement hideView
   - Set view bounds off-screen OR
   - Call `mainWindow.removeBrowserView(view)` temporarily
5. Implement destroyView
   - Remove from mainWindow
   - Destroy view: `view.webContents.destroy()`
   - Return to pool OR remove from Map
6. Implement navigation methods
   - goBack: `view.webContents.goBack()`
   - goForward: `view.webContents.goForward()`
   - reload: `view.webContents.reload()`
   - canGoBack: `view.webContents.canGoBack()`
7. Set up webContents event handlers
   - 'did-navigate': emit navigation event
   - 'page-title-updated': emit title change
   - 'page-favicon-updated': emit favicon change
   - 'did-fail-load': emit error event
8. Calculate bounds correctly
   - Account for workspace panel width
   - Account for tab bar height
   - Account for AI panel width
9. Write unit tests

**Acceptance Criteria**:
- BrowserView creates and displays web content
- View positioning correct in layout
- Navigation methods work
- View pooling/reuse functional
- Events propagate to main process
- Unit tests pass

---

### T028: Tab Manager - Core 🎯
**Priority**: P0
**Dependencies**: T027
**Estimated Time**: 6 hours

**Tasks**:
1. Create `src/main/tab-manager.ts`
   ```typescript
   export interface Tab {
     id: string
     itemId: string
     type: 'web' | 'markdown'
     url?: string
     title: string
     favicon?: string
     isLoading: boolean
   }

   export class TabManager {
     private tabs: Tab[] = []
     private activeTabId: string | null = null

     constructor(
       private browserViewManager: BrowserViewManager,
       private itemManager: ItemManager
     )

     openTab(itemId: string): Promise<Tab>
     closeTab(tabId: string): void
     switchTab(tabId: string): void
     getActiveTab(): Tab | null
     getAllTabs(): Tab[]
   }
   ```
2. Implement openTab
   - Get item from ItemManager
   - Generate tab ID (UUID)
   - If type='web':
     - Create BrowserView via BrowserViewManager
     - Load item.url
   - If type='markdown':
     - Mark for Markdown rendering (Phase 5)
   - Add to tabs array
   - Set as active tab
   - Emit 'tab:opened' event
3. Implement closeTab
   - Remove from tabs array
   - Destroy BrowserView
   - If was active: switch to adjacent tab
   - Emit 'tab:closed' event
4. Implement switchTab
   - Hide current active view
   - Show target view
   - Update activeTabId
   - Emit 'tab:switched' event
5. Wire up IPC handlers
   - Handle 'tab:open' from renderer
   - Handle 'tab:close' from renderer
   - Handle 'tab:switch' from renderer
6. Write unit tests

**Acceptance Criteria**:
- Can open multiple tabs
- Switching tabs shows correct view
- Closing tab removes it but keeps item
- Active tab tracked correctly
- Unit tests pass

---

### T029: BrowserView Event Handling 🎯
**Priority**: P0
**Dependencies**: T028
**Estimated Time**: 5 hours

**Tasks**:
1. Set up webContents event listeners in BrowserViewManager
2. Handle 'did-navigate' event
   - Emit to TabManager with (tabId, newUrl)
   - Update tab.url
   - Trigger item creation if new URL (see T030)
3. Handle 'page-title-updated' event
   - Extract title
   - Update tab.title
   - Update item.title in database
   - Emit 'tab:updated' event to renderer
4. Handle 'page-favicon-updated' event
   - Extract favicon URLs
   - Download favicon as base64 (optional optimization)
   - Update tab.favicon
   - Update item.favicon in database
5. Handle 'did-start-loading' event
   - Set tab.isLoading = true
   - Emit 'tab:loading' event
6. Handle 'did-stop-loading' event
   - Set tab.isLoading = false
   - Emit 'tab:loaded' event
7. Handle 'did-fail-load' event
   - Check error code
   - If not ERR_ABORTED: show error in tab
   - Emit 'tab:error' event
8. Forward events to renderer
   - Use webContents.send() to main window
   - Renderer updates tab UI

**Acceptance Criteria**:
- Tab title updates when page loads
- Tab favicon updates when available
- Loading state visible in UI
- Failed loads show error page
- All events reach renderer

---

### T030: Duplication Detector (Clarification B) 🎯
**Priority**: P0
**Dependencies**: T029
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/core/workspace/duplication-detector.ts`
   ```typescript
   export class DuplicationDetector {
     constructor(private database: Database)

     checkDuplicate(workspaceId: string, url: string, contextFolderId: string | null): Promise<Item | null>
   }
   ```
2. Implement checkDuplicate
   - Query items WHERE:
     - workspace_id = workspaceId
     - url = url
     - folder_id = contextFolderId (or IS NULL)
     - DATE(created_at) = TODAY
   - Return first match or null
3. Integrate with navigation flow
   - On 'did-navigate' event:
     - Call duplicationDetector.checkDuplicate()
     - If duplicate found:
       - Focus existing tab with that item
       - Close new tab
       - Update item.lastOpenedAt (if tracked)
     - If not duplicate:
       - Create new web item (ItemManager)
       - Link tab to new item
4. Determine context folder
   - Use last selected folder in workspace tree
   - OR use parent folder of last opened item
   - Default to null (root)
5. Write unit tests
   - Same URL + same day + same folder = duplicate
   - Same URL + different day = not duplicate
   - Same URL + different folder = not duplicate

**Acceptance Criteria**:
- Navigating to same URL (today, same folder) focuses existing tab
- Different day creates new item
- Different folder creates new item
- Unit tests pass (all cases covered)

---

### T031: Tab Bar UI 🎯
**Priority**: P0
**Dependencies**: T030
**Estimated Time**: 6 hours

**Tasks**:
1. Create `src/renderer/components/TabBar.tsx`
   - Horizontal scrollable container
   - Render Tab components
   - New tab button (+) at end
2. Create `src/renderer/components/Tab.tsx`
   - Favicon or icon
   - Title (truncated with tooltip)
   - Loading spinner (if isLoading)
   - Close button (X)
   - Active state styling
   - Hover effects
3. Connect to tab store
   - Subscribe to tab events
   - Update tab list on changes
   - Highlight active tab
4. Implement tab interactions
   - Click tab: call IPC to switch tab
   - Click close (X): call IPC to close tab
   - Click new (+): open new empty tab or show URL input
5. Implement tab reordering (drag-and-drop)
   - Make tabs draggable
   - Show drop indicator
   - Update tab order in store
   - Persist order in session
6. Style tab bar
   - Fixed height (40px)
   - Background color
   - Tab separators
   - Overflow scrolling with arrows

**Acceptance Criteria**:
- Tab bar shows all open tabs
- Clicking tab switches view
- Close button closes tab
- Drag-drop reorders tabs
- Loading state visible
- UI matches design

---

### T032: Navigation Controls UI 🎯
**Priority**: P0
**Dependencies**: T031
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/renderer/components/NavigationBar.tsx`
   - Back button (← arrow)
   - Forward button (→ arrow)
   - Reload button (⟳ circular)
   - URL input bar (address bar)
   - Go button or Enter key
2. Implement button states
   - Back: disabled if !canGoBack
   - Forward: disabled if !canGoForward
   - Reload: always enabled
3. Implement URL input
   - Show current URL
   - Editable text input
   - On Enter: navigate to URL
   - Validate URL format (add https:// if missing)
4. Connect to IPC
   - Back button: call IPC 'tab:goBack'
   - Forward button: call IPC 'tab:goForward'
   - Reload button: call IPC 'tab:reload'
   - URL submit: call IPC 'tab:navigate'
5. Update URL on navigation
   - Subscribe to 'tab:updated' events
   - Update URL input value
6. Style navigation bar
   - Place above BrowserView area
   - Fixed height (50px)
   - Button icons
   - URL bar styling

**Acceptance Criteria**:
- Back/forward navigation works
- Reload refreshes page
- Can navigate to new URL from bar
- Button states update correctly
- URL updates on page navigation

---

### T033: Tab State Persistence (Clarification C) 🎯
**Priority**: P1
**Dependencies**: T032
**Estimated Time**: 4 hours

**Tasks**:
1. Extend session state schema
   ```typescript
   interface SessionState {
     activeWorkspaceId: string
     tabs: {
       itemId: string
       url: string
       scrollPosition: { x: number, y: number }
       zoomLevel: number
     }[]
     activeTabIndex: number
   }
   ```
2. Implement session saving
   - Save on tab open/close
   - Save on workspace switch
   - Save on tab switch
   - Save on app close
   - Debounce saves (max 1/second)
3. Implement tab restoration on startup
   - Read session state
   - For each tab:
     - Call TabManager.openTab(itemId)
     - Restore scrollPosition (BrowserView API)
     - Restore zoomLevel
   - Set activeTabIndex
4. Handle restoration failures
   - Item deleted: skip tab
   - Item moved: still restore
   - Log skipped tabs
5. Write integration tests
   - Open 3 tabs → close app → reopen → verify tabs restored

**Acceptance Criteria**:
- Tabs restore on startup with correct URLs
- Active tab is correct after restore
- Scroll position and zoom restored
- Integration tests pass

---

### T034: Tab Limit Warning (Clarification C) 🚀
**Priority**: P2
**Dependencies**: T033
**Estimated Time**: 2 hours

**Tasks**:
1. Implement soft limit check in TabManager
   - Check tabs.length before opening
   - If >= 20: emit 'tab:limit-warning' event
   - Allow tab to open (no hard block)
2. Create `src/renderer/components/Toast.tsx`
   - Generic toast notification component
   - Auto-dismiss after 5 seconds
   - Close button
3. Show warning in renderer
   - Subscribe to 'tab:limit-warning' event
   - Display toast: "20+ tabs open, performance may be impacted"
   - Add yellow border to tab bar
4. Log tab metrics
   - Track peak tab count per session
   - Log to analytics (optional)
5. Write unit tests

**Acceptance Criteria**:
- Warning shown when 20th tab opens
- Can still open more tabs
- Warning dismisses automatically
- Unit tests pass

---

### T035: Milestone 4 Validation (User Story 5) 🎯
**Priority**: P0
**Dependencies**: T027-T034
**Estimated Time**: 3 hours

**Validation (Spec User Story 5 Acceptance Criteria)**:
- [ ] AS5.1: Can open 5 different items → 5 tabs appear
- [ ] AS5.2: Back/forward/refresh buttons work
- [ ] AS5.3: Closing 3 tabs → tabs close, items remain in workspace
- [ ] AS5.4: Type new URL → page loads, new item created
- [ ] AS5.5: Switching tabs → each retains state (scroll, etc.)

**End-to-End Test**:
1. Open workspace
2. Open 5 web items (e.g., google.com, github.com, etc.)
3. Verify 5 tabs in tab bar
4. Navigate within a tab (click links)
5. Use back button
6. Switch to different tab
7. Close 2 tabs
8. Verify items still in workspace tree
9. Enter new URL in address bar
10. Verify page loads and new item created

**Deliverable**: Functional web browsing with tabs (User Story 5 complete)

---

## Phase 5: Markdown Editor Integration (User Story 2)

**Goal**: Markdown note creation, editing, autosave
**Duration**: 3-4 days

### T036: MarkText Renderer Component 🎯
**Priority**: P0
**Dependencies**: T035
**Estimated Time**: 6 hours

**Tasks**:
1. Research MarkText integration options
   - Option A: Integrate MarkText library directly
   - Option B: Use alternative (Milkdown, Tiptap, etc.)
   - Option C: Custom Markdown editor (CodeMirror + marked)
   - **Recommendation**: Milkdown (better Electron support)
2. Install chosen library
   - `npm install @milkdown/core @milkdown/preset-commonmark @milkdown/react`
3. Create `src/renderer/components/MarkdownEditor.tsx`
   - Split view: editor (left) | preview (right)
   - Use chosen Markdown library
   - Resizable splitter between panes
4. Implement editor initialization
   - Load note content from IPC: `workspaceAPI.readNoteContent(itemId)`
   - Initialize editor with content
   - Render preview
5. Implement onChange handler
   - Capture editor content changes
   - Trigger autosave (next task)
6. Implement toolbar
   - Bold, Italic, Strikethrough
   - Headings (H1-H6)
   - Lists, Links, Images
   - Code blocks
7. Style editor
   - Syntax highlighting
   - Line numbers (optional)
   - Theme matching (light/dark)

**Acceptance Criteria**:
- Markdown editor renders correctly
- Split view functional
- Toolbar buttons work
- Syntax highlighting visible
- Theme matches app theme

---

### T037: Autosave Manager (Clarification D) 🎯
**Priority**: P0
**Dependencies**: T036
**Estimated Time**: 4 hours

**Tasks**:
1. Create `src/core/workspace/autosave-manager.ts`
   ```typescript
   export class AutosaveManager {
     private timers: Map<string, NodeJS.Timeout> = new Map()

     scheduleSave(itemId: string, content: string): void
     flushSave(itemId: string): Promise<void>
     flushAll(): Promise<void>
   }
   ```
2. Implement scheduleSave
   - Clear existing timer for itemId
   - Start new timer: 500ms debounce
   - On timer complete: call ItemManager.writeNoteContent()
   - Emit 'note:saved' event with timestamp
3. Implement flushSave
   - Cancel timer if active
   - Save immediately
   - Return Promise
4. Implement flushAll
   - Flush all pending saves
   - Use Promise.all()
5. Integrate with MarkdownEditor
   - Call autosaveManager.scheduleSave() on onChange
   - Call autosaveManager.flushSave() on tab close
6. Create save indicator UI
   - `src/renderer/components/SaveIndicator.tsx`
   - Display "Saving..." while timer active
   - Display "Saved at HH:MM:SS" after save
   - Display "Save failed" on error with retry button
7. Handle edge cases
   - Tab closed before save: flush immediately
   - App closing: flush all pending (T038)
   - Write errors: retry once, then notify user
8. Write unit tests

**Acceptance Criteria**:
- Content saves 500ms after typing stops
- Save indicator shows correct state
- Tab close flushes pending save
- Write errors handled gracefully
- Unit tests pass (debounce logic verified)

---

### T038: App Shutdown Save Flush 🎯
**Priority**: P1
**Dependencies**: T037
**Estimated Time**: 2 hours

**Tasks**:
1. Add 'before-quit' handler in main process
   ```typescript
   app.on('before-quit', async (event) => {
     event.preventDefault()
     await autosaveManager.flushAll()
     app.quit()
   })
   ```
2. Implement timeout for flush
   - Max wait: 3 seconds
   - If timeout: log warning, allow quit
3. Show progress indicator (optional)
   - "Saving notes..." dialog
   - Only if flush takes >1 second
4. Write integration tests

**Acceptance Criteria**:
- All pending saves complete before app quits
- Timeout prevents indefinite hang
- No data loss on normal quit
- Integration tests pass

---

### T039: Markdown Tab Integration 🎯
**Priority**: P0
**Dependencies**: T038
**Estimated Time**: 3 hours

**Tasks**:
1. Update TabManager to handle markdown tabs
   - When opening markdown item:
     - Don't create BrowserView
     - Set tab.type = 'markdown'
     - Emit 'tab:opened' with markdown flag
2. Update `src/renderer/components/TabArea.tsx`
   - Render MarkdownEditor if activeTab.type === 'markdown'
   - Render BrowserView container if activeTab.type === 'web'
3. Handle tab switching
   - Web → Markdown: hide BrowserView, show MarkdownEditor
   - Markdown → Web: hide MarkdownEditor, show BrowserView
   - Markdown → Markdown: load different note content
4. Implement note loading
   - On markdown tab switch: load note content via IPC
   - Initialize MarkdownEditor with content
5. Write integration tests

**Acceptance Criteria**:
- Can open markdown items as tabs
- Editor displays note content
- Switching between web/markdown tabs works
- Multiple markdown tabs supported
- Integration tests pass

---

### T040: Milestone 5 Validation (User Story 2) 🎯
**Priority**: P0
**Dependencies**: T036-T039
**Estimated Time**: 2 hours

**Validation (Spec User Story 2 Acceptance Criteria)**:
- [ ] AS2.1: Creating markdown note → opens in editor tab
- [ ] AS2.2: Typing content → live preview updates → autosaves
- [ ] AS2.3: Notes and web items coexist in same folders
- [ ] AS2.4: Clicking note in tree → opens with saved content
- [ ] AS2.5: Rename/move notes → changes persist

**End-to-End Test**:
1. Create workspace
2. Right-click folder → New Note
3. Type "# Test Note" in editor
4. Verify preview renders correctly
5. Wait 1 second
6. Verify "Saved at XX:XX:XX" appears
7. Close tab
8. Close app
9. Reopen app
10. Click note in tree
11. Verify content preserved

**Deliverable**: Functional Markdown editing (User Story 2 complete)

---

## Phase 6: AI Assistant Panel (User Story 3)

**Goal**: Persistent AI panel with provider selection
**Duration**: 2-3 days

### T041: AI Provider Selector 🎯
**Priority**: P0
**Dependencies**: T040
**Estimated Time**: 3 hours

**Tasks**:
1. Create `src/renderer/components/AIPanel.tsx`
   - Dropdown selector at top
   - BrowserView container below
2. Create AI provider config
   ```typescript
   const AI_PROVIDERS = [
     { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com' },
     { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
     { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
     { id: 'custom', name: 'Custom URL', url: '' }
   ]
   ```
3. Implement provider selector UI
   - Dropdown component
   - Show selected provider
   - On change: emit IPC event
4. Store selected provider
   - Save to localStorage
   - Restore on app start
5. Handle custom URL
   - Show text input if "Custom URL" selected
   - Validate URL format
6. Write component tests

**Acceptance Criteria**:
- Dropdown shows all providers
- Selection persists across restarts
- Custom URL input works
- Component tests pass

---

### T042: AI BrowserView Management 🎯
**Priority**: P0
**Dependencies**: T041
**Estimated Time**: 5 hours

**Tasks**:
1. Extend BrowserViewManager for AI panel
   - `createAIView(providerId: string, url: string): BrowserView`
   - Dedicated view (not pooled)
   - Separate cache directory per provider
2. Create AI view on startup
   - Initialize with last selected provider
   - Position in right panel area
3. Implement provider switching
   - Destroy current AI view
   - Create new AI view with new provider URL
   - Load provider URL
4. Configure AI view settings
   ```typescript
   const aiView = new BrowserView({
     webPreferences: {
       nodeIntegration: false,
       contextIsolation: true,
       sandbox: true,
       partition: `persist:ai-${providerId}`, // Separate session per provider
     }
   })
   ```
5. Calculate AI panel bounds
   - Position in right panel
   - Account for panel width (300px default)
   - Full height minus top bar
6. Handle view lifecycle
   - Persist across workspace switches
   - Destroy only on provider change
   - Recreate on app restart
7. Set up IPC handlers
   - 'ai:switch-provider'
   - 'ai:get-current-provider'
8. Write unit tests

**Acceptance Criteria**:
- AI view loads provider URL
- View positioned correctly
- Provider switching works
- Separate sessions per provider
- Unit tests pass

---

### T043: AI Session Persistence 🚀
**Priority**: P1
**Dependencies**: T042
**Estimated Time**: 2 hours

**Tasks**:
1. Configure session persistence
   - Use `partition: 'persist:ai-${providerId}'` in webPreferences
   - Electron automatically persists cookies
2. Verify session persistence
   - Login to ChatGPT
   - Close app
   - Reopen app
   - Verify still logged in
3. Test with all providers
   - ChatGPT
   - Claude
   - Gemini
4. Handle session expiration
   - Detect 401/403 responses (via webRequest)
   - Notify user (toast notification)
   - Allow re-login without clearing cookies
5. Write integration tests

**Acceptance Criteria**:
- Login sessions persist across restarts
- Each provider has separate session
- Session expiration handled gracefully
- Integration tests pass

---

### T044: AI Panel UI Polish 🎯
**Priority**: P2
**Dependencies**: T043
**Estimated Time**: 3 hours

**Tasks**:
1. Style AI panel
   - Background color matching theme
   - Border on left side
   - Dropdown styling
2. Implement resizable splitter
   - Allow resizing AI panel width
   - Minimum width: 200px
   - Maximum width: 600px
   - Persist width in localStorage
3. Add loading state
   - Show spinner while AI view loads
   - Display "Loading ChatGPT..." message
4. Handle load errors
   - Display error message if provider unreachable
   - Provide retry button
   - Log error details
5. Prevent navigation outside AI domain (optional security)
   - Intercept navigation events
   - If URL domain changes: block or warn
6. Write UI tests

**Acceptance Criteria**:
- AI panel styling matches app theme
- Resizable width with persistence
- Loading states visible
- Errors handled gracefully
- UI tests pass

---

### T045: Milestone 6 Validation (User Story 3) 🎯
**Priority**: P0
**Dependencies**: T041-T044
**Estimated Time**: 2 hours

**Validation (Spec User Story 3 Acceptance Criteria)**:
- [ ] AS3.1: Select ChatGPT → chat.openai.com loads and remains visible
- [ ] AS3.2: Switch center tabs → AI panel remains visible, no reload
- [ ] AS3.3: Login to AI provider → session persists across restarts
- [ ] AS3.4: Change provider (ChatGPT → Claude) → new interface loads
- [ ] AS3.5: Interact with AI → all features work (no data interception)

**End-to-End Test**:
1. Launch app
2. Select ChatGPT from AI dropdown
3. Verify chat.openai.com loads
4. Login to ChatGPT (if not logged in)
5. Open 3 web tabs in center
6. Switch between tabs
7. Verify AI panel remains visible
8. Switch to Claude
9. Verify claude.ai loads
10. Close app
11. Reopen app
12. Verify Claude still loaded and logged in

**Deliverable**: Functional AI assistant panel (User Story 3 complete)

---

## Phase 7: Advanced Features (User Stories 4, 6)

**Goal**: Search, tags, drag-drop, multi-workspace, themes
**Duration**: 1 week

### T046: Search Functionality 🚀
**Priority**: P1
**Dependencies**: T045
**Estimated Time**: 6 hours

**Tasks**:
1. Implement database search
   - Extend Database class with searchItems method
   - Query: `WHERE workspace_id = ? AND (title LIKE ? OR url LIKE ?)`
2. Add full-text search (optional - FTS5)
   - Create FTS virtual table
   - Index title, url, markdown content
   - Use FTS MATCH queries
3. Create `src/renderer/components/SearchBar.tsx`
   - Text input with search icon
   - Dropdown for results
   - Debounce input (300ms)
4. Implement search in renderer
   - On input change: call IPC 'workspace:search'
   - Display results in dropdown
   - Limit to 100 results
5. Display search results
   - Item icon, title, folder path
   - Highlight matching text
   - Click result: open item in tab
6. Implement tree filtering (optional)
   - Filter tree to show only matching items
   - Expand parent folders
   - Clear filter on search clear
7. Write unit tests

**Acceptance Criteria**:
- Search finds items by title
- Search finds web items by URL
- Results display correctly
- Clicking result opens item
- Unit tests pass

---

### T047: Tagging System 🚀
**Priority**: P2
**Dependencies**: T046
**Estimated Time**: 5 hours

**Tasks**:
1. Extend database schema
   - Add `tags` column to items table (JSON array)
   - Or create separate tags table (normalized)
   - Add index on tags column
2. Update Item type
   ```typescript
   interface Item {
     // ...existing fields
     tags: string[]
   }
   ```
3. Implement tag CRUD in ItemManager
   - `addTags(itemId: string, tags: string[]): Promise<void>`
   - `removeTags(itemId: string, tags: string[]): Promise<void>`
   - `getItemsByTag(workspaceId: string, tag: string): Promise<Item[]>`
4. Create `src/renderer/components/TagEditor.tsx`
   - Show existing tags as chips
   - Input to add new tags
   - Click tag chip: remove tag
5. Integrate tags into UI
   - Show tags on tree items (badges)
   - Show tags in context menu
   - Add "Add Tag" action
6. Extend search to include tags
   - Search by tag name
   - Filter by multiple tags (AND/OR)
7. Write unit tests

**Acceptance Criteria**:
- Can add tags to items
- Tags persist and display correctly
- Can search by tags
- Tags visible in tree view
- Unit tests pass

---

### T048: Drag & Drop Organization 🚀
**Priority**: P1
**Dependencies**: T047
**Estimated Time**: 6 hours

**Tasks**:
1. Install drag-drop library (optional)
   - react-dnd or @dnd-kit
   - Or use native HTML5 drag-drop
2. Make tree items draggable
   - Add `draggable` prop to TreeNode
   - Set drag data: itemId, sourceFolder
   - Show drag preview (semi-transparent)
3. Make folders drop targets
   - Add drag event handlers to folder nodes
   - `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop`
4. Implement drop validation
   - Prevent dropping item into itself
   - Prevent circular references for folders
   - Show error if invalid drop
5. Implement move action
   - On drop: call IPC 'item:move'
   - Update tree UI optimistically
   - Revert on error
6. Add visual feedback
   - Highlight drop target on dragOver
   - Show drop not allowed cursor for invalid targets
   - Animate item movement
7. Handle folder drag-drop
   - Allow moving folders into other folders
   - Prevent circular references
8. Write E2E tests

**Acceptance Criteria**:
- Can drag items between folders
- Can drag folders into other folders
- Invalid drops prevented
- Visual feedback clear
- E2E tests pass

---

### T049: Multi-Workspace Switching (User Story 6) 🚀
**Priority**: P1
**Dependencies**: T048
**Estimated Time**: 4 hours

**Tasks**:
1. Update workspace selector UI
   - Show all workspaces in dropdown
   - Current workspace highlighted
   - "Create New Workspace" option
   - "Delete Workspace" option
2. Implement workspace switching
   - Call WorkspaceEngine.switchWorkspace()
   - Save current workspace state
   - Close all tabs
   - Load new workspace tree
   - Emit 'workspace:switched' event
3. Implement workspace deletion
   - Show confirmation dialog
   - Display item count
   - Call WorkspaceEngine.deleteWorkspace()
   - Switch to another workspace or create new
4. Ensure workspace isolation
   - Each workspace has separate folder tree
   - Items belong to one workspace only
   - Tabs cleared on switch
5. Write integration tests

**Acceptance Criteria**:
- Can switch between multiple workspaces
- Each workspace isolated
- Delete confirmation shown
- Integration tests verify isolation

---

### T050: Theme System (Light/Dark) 🚀
**Priority**: P2
**Dependencies**: T049
**Estimated Time**: 4 hours

**Tasks**:
1. Define CSS custom properties
   - `variables.css` with theme tokens
   - Background, text, border, accent colors
2. Create light theme
   - White backgrounds
   - Dark text
   - Light borders
3. Create dark theme
   - Dark backgrounds
   - Light text
   - Darker borders
4. Implement theme switcher
   - Toggle in View menu
   - Store preference in localStorage
   - Apply theme by adding class to root element
5. Apply theme to all components
   - Update component styles to use CSS variables
   - Ensure contrast ratios meet accessibility standards
6. Sync with system theme (optional)
   - Detect `prefers-color-scheme`
   - Auto-switch theme
   - Allow manual override
7. Write UI tests

**Acceptance Criteria**:
- Light theme looks good
- Dark theme looks good
- Toggle switches themes instantly
- Preference persists
- UI tests pass

---

### T051: Keyboard Shortcuts 🚀
**Priority**: P2
**Dependencies**: T050
**Estimated Time**: 4 hours

**Tasks**:
1. Register global shortcuts in main process
   - Ctrl/Cmd+T: New tab
   - Ctrl/Cmd+W: Close tab
   - Ctrl/Cmd+Tab: Next tab
   - Ctrl/Cmd+Shift+Tab: Previous tab
   - Ctrl/Cmd+1-9: Jump to tab N
   - Ctrl/Cmd+F: Focus search
   - Ctrl/Cmd+N: New note
   - Ctrl/Cmd+Shift+N: New folder
2. Implement web tab shortcuts
   - Ctrl/Cmd+L: Focus address bar
   - Ctrl/Cmd+R: Reload
   - Alt+←: Back
   - Alt+→: Forward
3. Implement markdown shortcuts
   - Ctrl/Cmd+B: Bold
   - Ctrl/Cmd+I: Italic
   - Ctrl/Cmd+K: Insert link
4. Create keyboard shortcut help dialog
   - List all shortcuts
   - Grouped by context
   - Accessible via Help menu or Ctrl+?
5. Write E2E tests

**Acceptance Criteria**:
- All shortcuts work
- Shortcuts context-aware (web vs markdown tab)
- Help dialog shows all shortcuts
- E2E tests pass

---

### T052: Milestone 7 Validation (User Stories 4, 6) 🚀
**Priority**: P0
**Dependencies**: T046-T051
**Estimated Time**: 3 hours

**Validation (User Story 4)**:
- [ ] AS4.1: Can add tags "important" and "chapter-3" to item
- [ ] AS4.2: Search "chapter-3" → only tagged items shown
- [ ] AS4.3: Drag item from folder A to folder B → item moves
- [ ] AS4.4: Rename web item → custom name persisted
- [ ] AS4.5: Full-text search works and is fast

**Validation (User Story 6)**:
- [ ] AS6.1: Create "Work" and "Personal" workspaces
- [ ] AS6.2: Switch from "Work" to "Personal" → correct items shown
- [ ] AS6.3: Delete workspace → confirmation → data removed
- [ ] AS6.4: Multiple workspaces maintain independent state
- [ ] AS6.5: Last workspace restored on app restart

**End-to-End Test**:
1. Create 3 workspaces
2. Add items to each
3. Add tags to some items
4. Search by tag
5. Drag items between folders
6. Switch workspaces
7. Verify isolation
8. Delete one workspace
9. Verify deletion
10. Close and reopen app
11. Verify last workspace restored

**Deliverable**: Full-featured workspace management (User Stories 4, 6 complete)

---

## Phase 8: Performance, Security, Cross-Platform

**Goal**: Optimize performance, harden security, package for all platforms
**Duration**: 1 week

### T053: Performance Optimization - Launch Time 🚀
**Priority**: P1
**Dependencies**: T052
**Estimated Time**: 4 hours

**Tasks**:
1. Profile app launch
   - Measure time to window visible
   - Identify bottlenecks
2. Optimize database initialization
   - Lazy load non-critical data
   - Use indexes for first queries
3. Optimize React rendering
   - Lazy load components
   - Use React.memo for expensive components
   - Virtualize long lists (workspace tree)
4. Optimize main process startup
   - Defer non-critical initialization
   - Load BrowserViews on demand
5. Measure improvements
   - Target: <2 seconds cold start
   - Verify on all platforms
6. Write performance tests

**Acceptance Criteria**:
- Cold start <2 seconds
- Warm start <1 second
- Performance tests pass on all platforms

---

### T054: Performance Optimization - Memory Management 🚀
**Priority**: P1
**Dependencies**: T053
**Estimated Time**: 4 hours

**Tasks**:
1. Implement BrowserView pooling optimization
   - Pool size: 20 views
   - LRU eviction strategy
   - Destroy views beyond pool size
2. Implement tab suspension (optional)
   - Suspend inactive tabs after 30 minutes
   - Destroy BrowserView, keep tab metadata
   - Recreate on tab activation
3. Monitor memory usage
   - Log memory stats periodically
   - Detect memory leaks
   - Alert if usage exceeds thresholds
4. Optimize database queries
   - Add missing indexes
   - Use prepared statements
   - Limit result sets
5. Measure improvements
   - Baseline: <500MB with 10 tabs
   - Target: <1.5GB with 20 tabs
6. Write memory leak tests

**Acceptance Criteria**:
- Memory usage within targets
- No memory leaks detected
- Tab suspension works (if implemented)
- Memory tests pass

---

### T055: Security Hardening 🚀
**Priority**: P0
**Dependencies**: T054
**Estimated Time**: 6 hours

**Tasks**:
1. Enforce Content Security Policy
   - Define CSP for renderer
   - Block inline scripts (if possible)
   - Allow only HTTPS resources
2. Review all webPreferences
   - Ensure `nodeIntegration: false`
   - Ensure `contextIsolation: true`
   - Ensure `sandbox: true`
3. Validate IPC inputs
   - Check types and ranges
   - Sanitize strings
   - Prevent injection attacks
4. Implement SQLite encryption (optional - SQLCipher)
   - Install SQLCipher
   - Generate encryption key
   - Apply encryption to database
5. Secure note files
   - Store in userData directory
   - Set appropriate file permissions
6. Run security audit
   - `npm audit`
   - Fix high/critical vulnerabilities
7. Run penetration testing (basic)
   - Test XSS in web items
   - Test SQL injection (should be prevented by prepared statements)
8. Write security tests

**Acceptance Criteria**:
- All webPreferences secure
- IPC inputs validated
- npm audit shows no high/critical issues
- Security tests pass

---

### T056: Error Recovery & Crash Handling (Clarification C) 🚀
**Priority**: P1
**Dependencies**: T055
**Estimated Time**: 5 hours

**Tasks**:
1. Implement crash detection
   - Set "running" flag on startup
   - Clear flag on clean exit
   - Detect flag on next launch = crash
2. Validate workspace integrity on startup
   - Check foreign key constraints
   - Check for orphaned items
   - Auto-repair if possible
3. Restore session after crash
   - Load session state
   - Restore workspace
   - Restore tabs (as per T033)
   - Notify user: "Session restored after crash"
4. Implement backup restoration
   - If session state corrupted: try .backup
   - If database corrupted: try .backup
   - Notify user of recovery actions
5. Handle partial restoration
   - If some tabs can't restore: skip them
   - Log skipped tabs
   - Show warning: "Some tabs could not be restored"
6. Write integration tests

**Acceptance Criteria**:
- Crash detected on restart
- Session restored successfully
- Integrity validation runs
- Backup restoration works
- Integration tests pass

---

### T057: Windows Build & Packaging 🚀
**Priority**: P0
**Dependencies**: T056
**Estimated Time**: 6 hours

**Tasks**:
1. Configure electron-builder for Windows
   ```json
   {
     "win": {
       "target": ["nsis", "portable"],
       "icon": "build/icon.ico"
     }
   }
   ```
2. Create app icon
   - Design 256x256 icon
   - Convert to .ico format
3. Configure NSIS installer
   - Per-user installation
   - Desktop shortcut
   - Start menu entry
   - Uninstaller
4. Build on Windows
   - `npm run electron:build`
   - Test NSIS installer
   - Test portable .exe
5. Test on Windows 10 and Windows 11
   - Install and uninstall
   - Verify all features work
   - Check for Windows-specific issues
6. Sign binaries (optional - requires certificate)
   - Obtain code signing certificate
   - Configure electron-builder signing
7. Document Windows build process

**Acceptance Criteria**:
- NSIS installer installs app correctly
- Portable .exe works without installation
- App functions identically on Windows
- Build documented in quickstart.md

---

### T058: macOS Build & Packaging 🚀
**Priority**: P0
**Dependencies**: T056
**Estimated Time**: 6 hours

**Tasks**:
1. Configure electron-builder for macOS
   ```json
   {
     "mac": {
       "target": ["dmg", "zip"],
       "icon": "build/icon.icns",
       "category": "public.app-category.productivity",
       "hardenedRuntime": true
     }
   }
   ```
2. Create app icon
   - Design 1024x1024 icon
   - Convert to .icns format
3. Build on macOS
   - `npm run electron:build`
   - Test DMG installer
   - Test .app directly
4. Test on macOS 12 (Monterey) and macOS 13 (Ventura)
   - Install from DMG
   - Verify all features work
   - Check for macOS-specific issues
5. Sign and notarize (optional - requires Apple Developer account)
   - Obtain Apple Developer ID
   - Sign app bundle
   - Notarize with Apple
   - Staple notarization ticket
6. Document macOS build process

**Acceptance Criteria**:
- DMG creates and mounts correctly
- App installs via drag-drop
- App functions identically on macOS
- Build documented in quickstart.md

---

### T059: Linux Build & Packaging 🚀
**Priority**: P0
**Dependencies**: T056
**Estimated Time**: 5 hours

**Tasks**:
1. Configure electron-builder for Linux
   ```json
   {
     "linux": {
       "target": ["AppImage", "deb"],
       "icon": "build/icon.png",
       "category": "Utility"
     }
   }
   ```
2. Create app icon
   - Design 512x512 icon
   - Save as .png
3. Build on Linux
   - `npm run electron:build`
   - Test AppImage
   - Test .deb package
4. Test on Ubuntu 20.04 and Ubuntu 22.04
   - Install .deb package
   - Run AppImage directly
   - Verify all features work
   - Check for Linux-specific issues
5. Document Linux build process
6. Optional: Create snap package

**Acceptance Criteria**:
- AppImage runs without installation
- .deb package installs correctly
- App functions identically on Linux
- Build documented in quickstart.md

---

### T060: Cross-Platform Testing 🚀
**Priority**: P0
**Dependencies**: T057, T058, T059
**Estimated Time**: 6 hours

**Tasks**:
1. Set up test matrix
   - Windows 10, Windows 11
   - macOS 12, macOS 13
   - Ubuntu 20.04, Ubuntu 22.04
2. Run E2E tests on all platforms
   - Use GitHub Actions or local VMs
   - Verify all E2E tests pass
3. Manual testing on each platform
   - Install app
   - Create workspace
   - Add items
   - Open tabs
   - Test markdown editor
   - Test AI panel
   - Test search, tags, drag-drop
   - Verify persistence
4. Document platform-specific quirks
   - Known issues per platform
   - Workarounds
   - Performance differences
5. Fix critical platform-specific bugs
6. Verify performance targets met on all platforms

**Acceptance Criteria**:
- E2E tests pass on all platforms
- Manual testing successful on all platforms
- No critical platform-specific bugs
- Performance targets met on all platforms

---

### T061: Milestone 8 Validation (Performance, Security, Packaging) 🚀
**Priority**: P0
**Dependencies**: T053-T060
**Estimated Time**: 3 hours

**Validation Checklist**:
- [ ] Launch time <2 seconds on all platforms
- [ ] Memory usage within targets
- [ ] Security audit clean
- [ ] Crash recovery works
- [ ] Windows build functional
- [ ] macOS build functional
- [ ] Linux build functional
- [ ] All E2E tests pass on all platforms

**Deliverable**: Production-ready builds for all platforms

---

## Phase 9: Documentation & Release

**Goal**: User/developer documentation, release preparation
**Duration**: 3-4 days

### T062: User Documentation 🚀
**Priority**: P1
**Dependencies**: T061
**Estimated Time**: 6 hours

**Tasks**:
1. Write user manual (Markdown)
   - Getting Started
   - Creating Workspaces
   - Managing Folders and Items
   - Using Tabs (Web and Markdown)
   - AI Assistant Panel
   - Search and Tags
   - Keyboard Shortcuts
   - Troubleshooting
2. Create FAQ
   - Common questions
   - Known issues
   - Workarounds
3. Create video tutorials (optional)
   - Quick start (5 min)
   - Advanced features (15 min)
4. Generate PDF from docs
5. Include docs in app (Help menu)

**Acceptance Criteria**:
- User manual complete and clear
- FAQ addresses common questions
- Documentation accessible from app

---

### T063: Developer Documentation 🚀
**Priority**: P2
**Dependencies**: T061
**Estimated Time**: 5 hours

**Tasks**:
1. Write architecture overview
   - System diagram
   - Module descriptions
   - Data flow
2. Document internal APIs
   - WorkspaceEngine API
   - ItemManager API
   - BrowserViewManager API
   - Database API
3. Write development setup guide
   - Prerequisites
   - Building from source
   - Running tests
   - Debugging tips
4. Document code style
   - TypeScript conventions
   - Naming standards
   - Comment guidelines
5. Write contributing guide
   - How to submit PRs
   - Code review process
   - Testing requirements

**Acceptance Criteria**:
- Architecture documented
- APIs documented with examples
- Setup guide allows new contributors to build project
- Contributing guide clear

---

### T064: Release Preparation 🚀
**Priority**: P0
**Dependencies**: T062, T063
**Estimated Time**: 4 hours

**Tasks**:
1. Write CHANGELOG.md
   - Version 1.0.0
   - All features listed
   - Known issues
2. Write release notes
   - Highlights
   - Installation instructions per platform
   - Upgrade instructions (if applicable)
3. Create release checklist
   - All tests pass
   - All docs complete
   - All builds created
   - Binaries signed (if applicable)
4. Prepare distribution
   - Upload builds to releases page
   - Create download page
   - Set up auto-update (optional - Electron updater)
5. Prepare announcement
   - Blog post
   - Social media posts
   - Email to beta testers (if any)

**Acceptance Criteria**:
- CHANGELOG complete
- Release notes clear and accurate
- All release artifacts ready
- Distribution plan in place

---

### T065: Final Validation & Release 🚀
**Priority**: P0
**Dependencies**: T064
**Estimated Time**: 4 hours

**Final Checklist**:
- [ ] All 6 user stories validated
- [ ] All success criteria met
- [ ] All tests passing
- [ ] All documentation complete
- [ ] All platforms built and tested
- [ ] Security audit clean
- [ ] Performance targets met
- [ ] No critical bugs
- [ ] Release artifacts created

**Release Actions**:
1. Create Git tag: v1.0.0
2. Push tag to GitHub
3. Create GitHub release with notes
4. Upload build artifacts
5. Publish announcement
6. Monitor for issues

**Deliverable**: Workspace Navigator V1.0 released! 🎉

---

## Task Summary

### By Phase

| Phase | Tasks | Duration | Deliverable |
|-------|-------|----------|-------------|
| 1: Project Setup | T001-T008 | 3-5 days | Clean Electron-only codebase |
| 2: Core Infrastructure | T009-T017 | 1 week | Functional app shell with data layer |
| 3: Workspace Management | T018-T026 | 1 week | User Story 1 complete |
| 4: BrowserView & Tabs | T027-T035 | 1 week | User Story 5 complete |
| 5: Markdown Editor | T036-T040 | 3-4 days | User Story 2 complete |
| 6: AI Panel | T041-T045 | 2-3 days | User Story 3 complete |
| 7: Advanced Features | T046-T052 | 1 week | User Stories 4, 6 complete |
| 8: Performance, Security | T053-T061 | 1 week | Production-ready builds |
| 9: Documentation | T062-T065 | 3-4 days | V1.0 released |

**Total Duration**: 8-10 weeks (with 2-3 developers working in parallel)

### By Priority

- **🎯 MVP (P0-P1)**: T001-T045 (≈6 weeks) - Core functionality
- **🚀 V1 (P2)**: T046-T065 (≈3 weeks) - Polish and release

### Parallel Execution Opportunities

**Phase 1**:
- T005 (Testing), T006 (CI/CD), T007 (Docs) can run in parallel

**Phase 2**:
- T015 (State Management) and T016 (Error Handling) can run in parallel with T013-T014

**Phase 3**:
- T023 (UI) can start once T021 is complete, parallel with T024-T025

**Phase 4**:
- T031-T032 (UI) can run parallel with T033-T034 once T030 is done

**Phase 8**:
- T057, T058, T059 (Platform builds) can run in parallel

### Dependencies Graph

```
T001 → T002 → T003 → T004, T005, T006, T007
         ↓
       T008 (Milestone 1)
         ↓
    T009 → T010 → T011 → T012 → T013 → T014 → T015, T016
                                            ↓
                                         T017 (Milestone 2)
                                            ↓
                          T018 → T019 → T020 → T021 → T022 → T023 → T024, T025
                                                                        ↓
                                                                   T026 (Milestone 3)
                                                                        ↓
                                       T027 → T028 → T029 → T030 → T031 → T032 → T033, T034
                                                                                      ↓
                                                                                T035 (Milestone 4)
                                                                                      ↓
                                                                   T036 → T037 → T038 → T039
                                                                                      ↓
                                                                                T040 (Milestone 5)
                                                                                      ↓
                                                                   T041 → T042 → T043 → T044
                                                                                      ↓
                                                                                T045 (Milestone 6)
                                                                                      ↓
                                          T046 → T047 → T048 → T049 → T050 → T051
                                                                                      ↓
                                                                                T052 (Milestone 7)
                                                                                      ↓
                                                T053 → T054 → T055 → T056 → [T057, T058, T059] → T060
                                                                                                    ↓
                                                                                              T061 (Milestone 8)
                                                                                                    ↓
                                                                                        [T062, T063] → T064 → T065
```

---

## Edge Cases & Clarifications Addressed

**Clarification B** (Duplication Detection):
- T030: Implements same URL + same day + same folder check
- T029: Integrates with navigation flow

**Clarification C** (Crash Recovery):
- T033: Tab state persistence
- T056: Crash detection and session restoration
- T038: Pending save flush on app shutdown

**Clarification D** (Autosave):
- T037: 500ms debounce autosave
- T037: Save indicator UI showing "Saved at HH:MM:SS"

**Edge Cases**:
- Tab limit warning: T034 (soft limit of 20)
- Failed page loads: T029 (error handling)
- Folder deletion: T019 (confirmation with options)
- Offline mode: Handled by browser (pages won't load, AI unavailable)
- Duplicate URLs: T030 (focus existing tab)
- Unsaved notes on close: T037, T038 (autosave flushes)
- Corrupted workspace: T056 (integrity validation and repair)
- Partial session restore: T056 (skip invalid tabs, notify user)

---

## Success Criteria Mapping

All success criteria from spec.md addressed:

- **SC-001**: Workspace creation + persistence → T018-T025, T056
- **SC-002**: Item opening <200ms → T027-T028 (BrowserView is fast)
- **SC-003**: Launch <2s → T053 (performance optimization)
- **SC-004**: 500+ items no lag → T046 (indexed search), T053 (optimization)
- **SC-005**: User onboarding → T062 (user documentation)
- **SC-006**: Note persistence without manual save → T037-T038 (autosave)
- **SC-007**: AI provider switching <3s → T042 (BrowserView loads fast)
- **SC-008**: Cross-platform parity → T057-T060 (all platforms tested)
- **SC-009**: Replace browser + notes + AI → All phases (integrated experience)
- **SC-010**: Zero data loss → T009-T010 (database), T037-T038 (autosave), T056 (recovery)

---

**END OF TASKS**

This comprehensive task list implements Workspace Navigator V1 using Electron BrowserView architecture. All CEF references removed. Ready for implementation! 🚀
