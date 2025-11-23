# Implementation Plan: Workspace Navigator

**Branch**: `001-workspace-navigator` | **Date**: 2025-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-workspace-navigator/spec.md`

## Summary

Workspace Navigator is a cross-platform desktop application combining CEF-based web browsing, MarkText Markdown editing, and AI assistance in an IDE-style workspace. The application transforms ephemeral web browsing into persistent knowledge management through automatic item creation, hierarchical organization, and intelligent deduplication. Core technical challenges include multi-webview CEF management, workspace-tab synchronization, crash-resilient storage, and cross-platform performance optimization (<2s launch, <200ms tab opening).

## Technical Context

**Language/Version**: C++ 17 (CEF integration, core engine) + Electron/TypeScript 5.x (UI layer, workspace management)
**Primary Dependencies**:
- CEF (Chromium Embedded Framework) 120+ for web rendering
- MarkText integration via local app:// protocol
- SQLite 3.42+ with SQLCipher for encrypted storage
- Node.js 20 LTS for Electron runtime

**Storage**: SQLite (workspace metadata, items, folders) + JSON (session state, configuration) + File system (Markdown note content)
**Testing**: Jest (unit), Playwright (E2E), CEF unit tests (C++ layer)
**Target Platform**: Desktop - Windows 10+, macOS 12+, Ubuntu 20.04+
**Project Type**: Desktop application (Electron main + CEF renderer processes)
**Performance Goals**:
- Launch: <2s cold start
- Tab creation: <200ms
- Search: <1s for 500+ items
- Memory: <500MB baseline with 10 tabs

**Constraints**:
- Local-only storage (no cloud sync V1)
- CEF sandbox must remain enabled
- Cross-platform binary size <300MB
- 70%+ test coverage required

**Scale/Scope**:
- Support workspaces with 500+ items
- Handle 20+ simultaneous tabs (soft limit with warning)
- Target: 10k daily active users post-launch

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Security & Privacy ✅

- **CEF Sandbox**: Enabled by default, isolated processes per webview
- **Encrypted Storage**: SQLCipher for workspace database
- **No Data Transmission**: All AI interactions via official web interfaces (no API interception)
- **Content Security Policy**: Strict CSP for untrusted web content
- **Status**: PASS - All requirements met

### Performance Standards ✅

- **Launch Time**: Target <2s via lazy initialization, preloaded CEF binary
- **Tab Creation**: Target <200ms via webview pooling
- **Memory Optimization**: Shared CEF process for similar origins, tab suspension after 20+
- **Workspace Caching**: In-memory LRU cache for frequent queries
- **Status**: PASS - Architecture supports all targets

### Code Quality & Architecture ✅

- **Modularity**: 6 core modules (CEF Engine, Workspace Engine, Tab Manager, Storage Layer, MarkText Bridge, AI Panel Manager)
- **Documentation**: TSDoc for TypeScript, Doxygen for C++
- **Code Review**: Required for all PRs
- **Test Coverage**: 70%+ target (Jest + Playwright)
- **Naming**: Enforced via ESLint + clang-format
- **Status**: PASS - Standards defined

### Technical Standards & Compatibility ✅

- **CEF Guidelines**: Multi-webview with process-per-site-instance
- **IDE Patterns**: Three-column layout inspired by VS Code architecture
- **MarkText Integration**: Embedded as local renderer, no core modifications
- **Workspace Schema**: Versioned JSON schema with migration support
- **Cross-Platform**: Electron + native modules for each OS
- **Status**: PASS - Standards documented

### User Experience Principles ✅

- **Three-Column Layout**: Fixed widths, resizable splitters
- **AI Panel**: Persistent, non-collapsible right column
- **Drag & Drop**: Native OS drag-drop for workspace organization
- **Auto Date Folders**: DD.MM.YYYY format per clarification
- **Instant Reopen**: <200ms from workspace click to tab display
- **Keyboard Shortcuts**: Standard IDE shortcuts (Ctrl/Cmd+T, Ctrl/Cmd+W, etc.)
- **Status**: PASS - UX requirements clear

### Maintainability ✅

- **Layer Separation**: IPC boundaries between main/renderer/CEF
- **Minimal Dependencies**: Audit via npm audit + Dependabot
- **Structured Logging**: Winston with JSON output
- **Workspace Versioning**: Schema v1 with forward/backward compat
- **ADRs**: Required for architecture decisions
- **Quarterly Refactoring**: Scheduled technical debt reviews
- **Status**: PASS - Processes defined

**Constitution Gate**: ✅ **PASSED** - All principles satisfied, no violations to justify

## Project Structure

### Documentation (this feature)

```text
specs/001-workspace-navigator/
├── plan.md              # This file
├── research.md          # Technology decisions (Phase 0)
├── data-model.md        # Entity schemas (Phase 1)
├── quickstart.md        # Development setup (Phase 1)
├── contracts/           # Internal APIs (Phase 1)
│   ├── workspace-engine-api.md
│   ├── cef-bridge-api.md
│   └── storage-layer-api.md
└── tasks.md             # Implementation tasks (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── main/                          # Electron main process
│   ├── index.ts                   # Application entry point
│   ├── workspace-engine/          # Workspace management
│   │   ├── WorkspaceManager.ts
│   │   ├── ItemManager.ts
│   │   ├── FolderManager.ts
│   │   └── DuplicationDetector.ts
│   ├── storage/                   # Persistence layer
│   │   ├── Database.ts            # SQLite + SQLCipher
│   │   ├── SessionStore.ts        # JSON session state
│   │   └── IntegrityValidator.ts  # Crash recovery
│   ├── cef-engine/                # CEF integration (C++ bridge)
│   │   ├── CEFManager.cpp
│   │   ├── WebViewPool.cpp
│   │   └── SandboxConfig.cpp
│   └── ipc/                       # Inter-process communication
│       └── handlers/
├── renderer/                      # Electron renderer process
│   ├── App.tsx                    # React root component
│   ├── components/
│   │   ├── WorkspacePanel/        # Left column
│   │   │   ├── FileTree.tsx
│   │   │   ├── ItemNode.tsx
│   │   │   └── DragDropManager.ts
│   │   ├── TabArea/               # Center column
│   │   │   ├── TabBar.tsx
│   │   │   ├── WebTab.tsx
│   │   │   └── MarkdownTab.tsx
│   │   └── AIPanel/               # Right column
│   │       ├── AISelector.tsx
│   │       └── AIWebView.tsx
│   ├── services/
│   │   ├── WorkspaceService.ts    # IPC to main
│   │   ├── TabManager.ts
│   │   └── AutosaveManager.ts     # 500ms debounce
│   └── hooks/
│       ├── useWorkspace.ts
│       └── useTabs.ts
├── cef-native/                    # C++ CEF integration
│   ├── src/
│   │   ├── app/
│   │   │   ├── CEFApp.cpp
│   │   │   └── BrowserClient.cpp
│   │   ├── handlers/
│   │   │   ├── LoadHandler.cpp
│   │   │   └── RequestHandler.cpp
│   │   └── bridge/
│   │       └── NodeCEFBridge.cpp  # N-API bindings
│   └── include/
├── marktext-integration/          # MarkText as local app
│   ├── protocol-handler/          # app://editor
│   │   └── EditorProtocol.ts
│   └── renderer/
│       └── MarkTextRenderer.tsx
└── shared/
    ├── types/                     # TypeScript definitions
    │   ├── Workspace.ts
    │   ├── Item.ts
    │   └── Session.ts
    └── constants/
        └── Config.ts

tests/
├── unit/                          # Jest unit tests
│   ├── workspace/
│   ├── storage/
│   └── services/
├── integration/                   # Cross-module tests
│   ├── workspace-tab-sync/
│   └── crash-recovery/
└── e2e/                           # Playwright end-to-end
    ├── workspace-creation.spec.ts
    ├── tab-management.spec.ts
    └── session-restore.spec.ts

build/                             # Build configuration
├── electron-builder.json
├── cmake/                         # CMake for C++ CEF
└── scripts/
    ├── build-cef.sh
    └── package-app.sh
```

**Structure Decision**: Hybrid Electron + Native CEF architecture selected for:
1. **Electron**: Rapid UI development, cross-platform windowing, IPC infrastructure
2. **Native C++ CEF**: Performance-critical web rendering, multi-process isolation
3. **Separation**: Main process (Node.js) for business logic, native addon for CEF bridging

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Workspace Navigator                       │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Workspace  │  │   Tab Area   │  │    AI Panel       │  │
│  │   Panel     │  │              │  │                   │  │
│  │   (React)   │  │  (CEF Views) │  │   (CEF View)      │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┴────────────────────┘             │
│                           │                                  │
│                  ┌────────▼─────────┐                        │
│                  │  Renderer Process │                        │
│                  │   (Electron)      │                        │
│                  └────────┬──────────┘                        │
│                           │ IPC                               │
│                  ┌────────▼──────────┐                        │
│                  │   Main Process    │                        │
│                  │                   │                        │
│   ┌──────────────┼───────────────────┼──────────────┐        │
│   │              │                   │              │        │
│   ▼              ▼                   ▼              ▼        │
│ ┌─────────┐  ┌────────┐  ┌──────────┐  ┌──────────────┐    │
│ │Workspace│  │  Tab   │  │   CEF    │  │   Storage    │    │
│ │ Engine  │  │Manager │  │  Engine  │  │    Layer     │    │
│ └─────────┘  └────────┘  └──────────┘  └──────────────┘    │
│                               │                 │            │
│                          ┌────▼─────┐      ┌───▼───┐        │
│                          │  CEF     │      │SQLite │        │
│                          │Subprocess│      │+Cipher│        │
│                          └──────────┘      └───────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Module Descriptions

#### 1. CEF Engine (C++ Native Module)

**Responsibilities**:
- Initialize and manage CEF runtime
- Create and pool webview instances
- Handle browser process lifecycle
- Enforce sandbox and security policies
- Bridge between Node.js and CEF via N-API

**Key Components**:
- `CEFManager`: Singleton managing CEF lifecycle
- `WebViewPool`: Reusable CEF browser instances (max 20 active)
- `BrowserClient`: CEF client implementation for load events
- `NodeCEFBridge`: N-API addon exposing CEF to Electron

**Performance Strategy**:
- Process-per-site-instance model (share processes for same domain)
- Lazy CEF initialization (delay until first tab opened)
- Preload 2 webview instances in pool for instant tab creation
- Suspend offscreen tabs after 30s inactivity (restore on focus)

#### 2. Workspace Engine (TypeScript Main Process)

**Responsibilities**:
- Manage workspace CRUD operations
- Maintain folder hierarchy in memory
- Track items and their metadata
- Detect duplicate URLs (same-day + same-folder logic)
- Auto-create date folders (DD.MM.YYYY)
- Coordinate with Storage Layer for persistence

**Key Components**:
- `WorkspaceManager`: Active workspace state + operations
- `ItemManager`: Item creation, deduplication, metadata
- `FolderManager`: Hierarchy traversal, drag-drop validation
- `DuplicationDetector`: URL comparison + temporal logic

**State Management**:
- In-memory workspace tree (hydrated from DB on load)
- Event-driven updates broadcast to renderer via IPC
- Optimistic updates with rollback on DB failure

#### 3. Tab Manager (TypeScript Main + Renderer)

**Responsibilities**:
- Coordinate tab lifecycle (open, close, switch)
- Synchronize tabs ↔ workspace items
- Enforce soft limit of 20 tabs (warning UI)
- Manage tab-to-webview binding
- Handle navigation events (URL changes, title updates)

**Key Components**:
- `TabManager` (main): Tab state authority, webview assignment
- `TabBar` (renderer): Visual tab UI, user interactions
- `WebTab`/`MarkdownTab` (renderer): Content-specific renderers
- `NavigationHandler`: Back/forward/refresh for web tabs

**Tab-Item Sync Logic**:
```
User Opens Item → TabManager.openItem(itemId)
                → CEFEngine.requestWebView()
                → Assign webview to tab
                → Load item.url in webview
                → Update item.lastOpenedAt
                → Broadcast tab opened event

User Closes Tab → TabManager.closeTab(tabId)
                → Release webview to pool
                → Item remains in workspace
                → Broadcast tab closed event

User Changes URL → NavigationHandler.onLoadEnd(url)
                 → Check duplicate (same workspace/folder/day)
                 → If duplicate: focus existing item's tab
                 → Else: ItemManager.createWebItem(url)
                 → Update tab binding to new item
```

#### 4. Storage Layer (TypeScript Main Process)

**Responsibilities**:
- Persist workspace metadata (SQLite + SQLCipher)
- Save session state (JSON: active workspace, open tabs, positions)
- Store Markdown note content (file system)
- Validate integrity on startup (detect corruption)
- Provide crash recovery

**Key Components**:
- `Database`: SQLite connection pool, query builder
- `SessionStore`: Atomic JSON writes with temp + rename
- `IntegrityValidator`: Schema version check, FK validation
- `MigrationRunner`: Schema upgrades (v1 → v2+)

**Schema Design** (see data-model.md for full schema):
```sql
-- Core tables
workspaces(id, name, created_at, last_opened_at)
folders(id, workspace_id, parent_id, name, created_at)
items(id, workspace_id, folder_id, type, title, url, content_path, tags, created_at, last_opened_at)
session_state(workspace_id, tabs_json, window_geometry, updated_at)
```

**Crash Recovery Flow**:
```
1. Startup: Read session_state.json
2. Validate workspace DB integrity (FK constraints, schema version)
3. If valid: Restore workspace + tabs from session_state
4. If corrupt: Attempt recovery (restore from .backup), notify user
5. If recovery fails: Start with empty workspace, log corruption
```

#### 5. MarkText Integration

**Responsibilities**:
- Render Markdown notes in tabs
- Provide live preview
- Auto-save with 500ms debounce
- Integrate as local app://editor protocol

**Key Components**:
- `EditorProtocol`: Custom protocol handler (app://editor/<note-id>)
- `MarkTextRenderer`: Embedded MarkText component
- `AutosaveManager`: Debounced save to file system + DB update

**Autosave Flow**:
```
User types → onChange event
          → AutosaveManager.scheduleS ave(noteId, content)
          → Debounce 500ms
          → Write to file system (notes/<noteId>.md)
          → Update items.updated_at in DB
          → Show "Saved at HH:MM:SS" indicator
```

#### 6. AI Panel Manager

**Responsibilities**:
- Display AI provider selector (ChatGPT, Claude, Gemini, custom)
- Load selected provider in dedicated CEF webview
- Persist AI sessions across app restarts
- Keep panel visible regardless of tab changes

**Key Components**:
- `AISelector`: Dropdown UI + preference persistence
- `AIWebView`: Dedicated CEF instance for AI panel
- `SessionPersistence`: Store cookies/localStorage for AI login

**Session Persistence**:
- CEF cookies stored in dedicated profile directory (per AI provider)
- Cookies persist across app restarts (CEF default behavior)
- No manual cookie handling required

## Workflow Design

### Workspace Lifecycle

**Creation**:
```
1. User: File > New Workspace
2. Prompt for workspace name
3. WorkspaceManager.create(name)
   → INSERT INTO workspaces
   → Create root folder entry
   → Set as active workspace
   → Clear tab area
   → Update UI
```

**Opening**:
```
1. User: File > Open Workspace (or recent list)
2. WorkspaceManager.open(workspaceId)
   → Load workspace tree from DB
   → Hydrate in-memory hierarchy
   → Restore session state (if exists)
   → Open tabs from session_state
   → Render workspace tree in left panel
```

**Deletion**:
```
1. User: Right-click workspace > Delete
2. Confirm dialog: "Delete workspace and all items?"
3. WorkspaceManager.delete(workspaceId)
   → DELETE FROM items WHERE workspace_id = ?
   → DELETE FROM folders WHERE workspace_id = ?
   → DELETE FROM workspaces WHERE id = ?
   → Close all tabs for that workspace
   → Switch to default workspace (or none)
```

### Item Creation

**Automatic Web Item Creation**:
```
User types URL in address bar → onBeforeNavigate event
                              → Extract URL, domain
                              → Check duplication:
                                 - Same URL?
                                 - In current workspace?
                                 - Created today?
                                 - In same folder?
                              → If all true: focus existing tab
                              → Else: ItemManager.createWebItem()
                                      → Fetch title, favicon
                                      → Determine folder (date folder or manual)
                                      → INSERT INTO items
                                      → Update workspace tree UI
```

**Manual Note Creation**:
```
User: Right-click folder > New Note → Prompt for note name
                                    → ItemManager.createNoteItem(name, folderId)
                                    → Generate unique noteId
                                    → Create file: notes/<noteId>.md
                                    → INSERT INTO items (type='note')
                                    → Open MarkText tab
                                    → Focus editor
```

### Auto Date Folder Logic

**Trigger**: Item created at workspace root (no parent folder assigned)

**Flow**:
```
ItemManager.createItem(…, folderId=null)
  → Detect folderId is null (workspace root)
  → Get today's date: 2025-11-22
  → Format: "22.11.2025"
  → Check if folder exists: SELECT id FROM folders WHERE name='22.11.2025' AND workspace_id=? AND parent_id IS NULL
  → If exists: Use existing folder ID
  → If not exists: FolderManager.create("22.11.2025", workspaceId, null)
  → Assign item.folder_id = dateFolderId
  → Continue item creation
```

**Clarification Applied**: Per option B, date folders are created per-item when added to workspace root. Items manually placed in folders skip auto-organization.

### Drag & Drop Organization

**Flow**:
```
User drags item node → onDragStart(itemId, sourceFolder)
User drops on folder → onDrop(itemId, targetFolderId)
                     → FolderManager.validateMove(itemId, targetFolderId)
                        - Check not dropping folder on itself
                        - Check not creating circular reference
                     → If valid: ItemManager.moveItem(itemId, targetFolderId)
                                 → UPDATE items SET folder_id=?, updated_at=NOW() WHERE id=?
                                 → Broadcast item moved event
                                 → Update UI (re-render tree)
                     → If invalid: Show error toast
```

### Tab Limit Warning

**Soft Limit**: 20 tabs (option C)

**Flow**:
```
TabManager.openTab(…)
  → currentTabCount = tabs.length
  → If currentTabCount >= 20:
     → Show warning toast: "You have 20+ tabs open. Performance may be impacted."
     → Allow tab to open (no hard limit)
  → Else: Open tab silently
```

**Warning UI**: Non-blocking toast notification, appears for 5s, dismissible

### Session Restore (Crash Recovery)

**Continuous Save** (option C):
```
On tab opened/closed/reordered:
  → SessionStore.saveState({
       workspaceId,
       tabs: [{ itemId, url, scrollPosition, … }],
       activeTabIndex,
       windowGeometry
     })
  → Write to session_state.json (atomic: temp + rename)
```

**Restore on Startup**:
```
1. Read session_state.json
2. IntegrityValidator.validate(workspaceId)
   → Check workspace exists
   → Check folder FK constraints
   → Check schema version matches
3. If valid:
   → WorkspaceManager.open(session.workspaceId)
   → For each tab in session.tabs:
      → TabManager.openItem(tab.itemId)
      → Restore scroll position, zoom level
   → Set activeTabIndex
4. If invalid:
   → Attempt recovery from session_state.backup.json
   → If backup valid: restore from backup
   → Else: Log error, start with empty workspace
5. Show status: "Session restored" or "Could not restore previous session"
```

### Autosave (Markdown)

**Debounced 500ms** (option B):
```
MarkdownTab.onChange(content)
  → AutosaveManager.scheduleS ave(noteId, content)
    → Cancel existing timer (if any)
    → Start new timer: 500ms
    → On timer complete:
       → fs.writeFile(notes/<noteId>.md, content)
       → UPDATE items SET updated_at=NOW() WHERE id=?
       → Update UI: "Saved at 14:32:18"
```

**Visual Indicator**: Subtle timestamp in editor status bar, updates on each save

## Product Roadmap

### MVP (Minimum Viable Product)

**Goal**: Validate core value proposition - persistent browsing + note-taking

**Features**:
- Single workspace (no multi-workspace switching)
- Web item creation (automatic from URL navigation)
- Note item creation (Markdown editor)
- Basic folder structure (manual folders only, no auto date folders)
- Tab management (open, close, switch - no limit warning)
- Session persistence (workspace + items persist across restarts)
- Basic UI (three columns: workspace tree, tabs, AI panel)
- AI panel (fixed to ChatGPT only)

**Target**: 4-week sprint (2 developers)

**Success Criteria**:
- Users can browse web + create notes in single workspace
- Data persists across app restarts
- Launch time <3s (relaxed for MVP)
- Basic usability validated

### V1 (Full Specification)

**Goal**: Deliver complete feature set per specification + clarifications

**Additional Features Beyond MVP**:
- Multi-workspace management (create, open, delete, switch)
- Auto date folders (DD.MM.YYYY format)
- URL deduplication (same-day + same-folder logic)
- Tab limit warning (soft limit 20 tabs)
- Advanced organization (tags, search, rename items)
- Drag & drop reorganization
- Markdown autosave (500ms debounce) with timestamp indicator
- Crash recovery (full session restore)
- AI provider selector (ChatGPT, Claude, Gemini, custom URL)
- Performance optimization (CEF pooling, lazy load)
- Cross-platform builds (Win, Mac, Linux)
- Light + dark themes

**Target**: 12-week sprint (4 developers)

**Success Criteria**: All acceptance scenarios from spec.md pass

### V2 (Future Enhancements)

**Features Under Consideration**:
- Cloud sync (optional, opt-in)
- Collaborative workspaces (share with team)
- Advanced search (full-text, filters, saved searches)
- Workspace templates (pre-configured folder structures)
- Export/import (JSON, HTML, Markdown)
- Browser extensions (capture pages from external browser)
- Mobile companion app (view-only workspace access)
- Plugin system (custom integrations)
- AI context sharing (send selected text to AI panel)
- Workspace statistics (page count, reading time, usage trends)
- Offline mode enhancements (cache web pages locally)
- Advanced Markdown features (diagrams, math equations)

**Target**: 6-month roadmap post-V1 launch

## Technical Implementation Details

### CEF Integration

**Initialization**:
```cpp
// CEFManager.cpp
void CEFManager::Initialize() {
  CefMainArgs main_args;
  CefSettings settings;

  // Enable sandbox
  settings.no_sandbox = false;

  // Multi-process model
  settings.multi_threaded_message_loop = true;

  // Cache path
  CefString(&settings.cache_path).FromString(GetCachePath());

  // Initialize CEF
  CefInitialize(main_args, settings, app_.get(), nullptr);
}
```

**WebView Pool**:
```cpp
class WebViewPool {
  std::vector<CefRefPtr<CefBrowser>> available_;
  std::map<int, CefRefPtr<CefBrowser>> in_use_;
  const size_t MAX_POOL_SIZE = 20;

  CefRefPtr<CefBrowser> Acquire() {
    if (available_.empty() && in_use_.size() < MAX_POOL_SIZE) {
      return CreateNewBrowser();
    }
    auto browser = available_.back();
    available_.pop_back();
    in_use_[browser->GetIdentifier()] = browser;
    return browser;
  }

  void Release(CefRefPtr<CefBrowser> browser) {
    in_use_.erase(browser->GetIdentifier());
    available_.push_back(browser);
  }
};
```

**Security Configuration**:
- Sandbox enabled (no-sandbox = false)
- Process-per-site-instance isolation
- CSP headers enforced for all content
- Disable file:// access by default
- HTTPS upgrade automatic

### Storage Implementation

**SQLite Schema** (excerpt, full in data-model.md):
```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_opened_at INTEGER
);

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  folder_id TEXT,  -- NULL for root
  type TEXT NOT NULL CHECK(type IN ('web', 'note')),
  title TEXT NOT NULL,
  url TEXT,  -- NULL for notes
  content_path TEXT,  -- NULL for web items
  tags TEXT,  -- JSON array
  created_at INTEGER NOT NULL,
  last_opened_at INTEGER,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE INDEX idx_items_workspace ON items(workspace_id);
CREATE INDEX idx_items_folder ON items(folder_id);
CREATE INDEX idx_items_created ON items(created_at);
```

**Encryption**:
```typescript
// Database.ts
import SQLite from 'better-sqlite3';
import SQLCipher from '@journeyapps/sqlcipher';

class Database {
  private db: SQLite.Database;

  constructor(dbPath: string, key: string) {
    this.db = new SQLCipher(dbPath);
    this.db.pragma(`key='${key}'`);
    this.db.pragma('cipher_page_size=4096');
  }
}
```

**Crash Detection & Recovery**:
```typescript
// IntegrityValidator.ts
class IntegrityValidator {
  async validate(workspaceId: string): Promise<ValidationResult> {
    try {
      // Check workspace exists
      const workspace = await db.get('SELECT * FROM workspaces WHERE id = ?', workspaceId);
      if (!workspace) return { valid: false, reason: 'Workspace not found' };

      // Check FK constraints
      const orphanedItems = await db.all(`
        SELECT id FROM items
        WHERE workspace_id = ?
          AND folder_id IS NOT NULL
          AND folder_id NOT IN (SELECT id FROM folders)
      `, workspaceId);

      if (orphanedItems.length > 0) {
        // Auto-repair: move orphaned items to root
        await db.run('UPDATE items SET folder_id = NULL WHERE id IN (?)', orphanedItems.map(i => i.id));
      }

      // Check schema version
      const version = await db.get('PRAGMA user_version');
      if (version.user_version !== CURRENT_SCHEMA_VERSION) {
        return { valid: false, reason: 'Schema version mismatch', requiresMigration: true };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }
}
```

### Workspace Engine API

**Internal API** (IPC handlers):
```typescript
// WorkspaceManager.ts
class WorkspaceManager {
  // Workspace operations
  async createWorkspace(name: string): Promise<Workspace>;
  async openWorkspace(id: string): Promise<Workspace>;
  async deleteWorkspace(id: string): Promise<void>;
  async listWorkspaces(): Promise<Workspace[]>;

  // Item operations
  async createWebItem(workspaceId: string, url: string, folderId?: string): Promise<Item>;
  async createNoteItem(workspaceId: string, title: string, folderId?: string): Promise<Item>;
  async moveItem(itemId: string, targetFolderId: string): Promise<void>;
  async renameItem(itemId: string, newTitle: string): Promise<void>;
  async deleteItem(itemId: string): Promise<void>;
  async addTags(itemId: string, tags: string[]): Promise<void>;

  // Folder operations
  async createFolder(workspaceId: string, name: string, parentId?: string): Promise<Folder>;
  async renameFolder(folderId: string, newName: string): Promise<void>;
  async deleteFolder(folderId: string, deleteItems: boolean): Promise<void>;

  // Search
  async searchItems(workspaceId: string, query: string): Promise<Item[]>;
}
```

**Tab ↔ Item Synchronization**:
```typescript
// Synchronization logic
class TabItemSync {
  // When user opens item from workspace
  async openItemInTab(itemId: string) {
    const item = await workspace.getItem(itemId);
    const tab = await tabManager.createTab({
      itemId: item.id,
      type: item.type,
      url: item.url || `app://editor/${item.id}`
    });

    // Update item last opened time
    await workspace.updateItemTimestamp(itemId);

    return tab;
  }

  // When user navigates to new URL in existing tab
  async onNavigationCommitted(tabId: string, url: string) {
    const workspaceId = workspace.getActiveWorkspaceId();

    // Check duplication logic (same URL + same day + same folder)
    const duplicate = await this.checkDuplicate(workspaceId, url);

    if (duplicate) {
      // Focus existing item's tab
      await tabManager.focusTab(duplicate.tabId);
      await tabManager.closeTab(tabId);
    } else {
      // Create new item
      const item = await workspace.createWebItem(workspaceId, url);

      // Update tab to point to new item
      await tabManager.updateTab(tabId, { itemId: item.id });
    }
  }

  private async checkDuplicate(workspaceId: string, url: string): Promise<Item | null> {
    const today = new Date().toISOString().split('T')[0];

    // Find items with same URL, created today, in current workspace
    const candidates = await db.all(`
      SELECT * FROM items
      WHERE workspace_id = ?
        AND url = ?
        AND DATE(created_at, 'unixepoch') = ?
    `, workspaceId, url, today);

    if (candidates.length === 0) return null;

    // Check if any are in the same folder as current context
    // (Current context = active folder in workspace tree, or root)
    const currentFolder = workspace.getActiveFolderId() || null;
    const match = candidates.find(c => c.folder_id === currentFolder);

    return match || null;
  }
}
```

## UI/UX Design

### Three-Column Layout

```
┌──────────────────────────────────────────────────────────────┐
│  File  Edit  View  Workspace  Window  Help          [min][max][x] │
├────────────┬─────────────────────────────────┬────────────────┤
│            │                                 │                │
│  Workspace │         Tab Area                │   AI Panel     │
│   Panel    │                                 │                │
│            │  ┌─Tab1─┬─Tab2─┬─Tab3─┬─+─┐    │  ┌──────────┐  │
│ ▼Research  │  │Web   │Note  │Web   │   │    │  │ Provider │  │
│   ▼Ch1     │  └──────────────────────────┘    │  │ ChatGPT ▼│  │
│     Page1  │  ┌─────────────────────────┐    │  └──────────┘  │
│     Page2  │  │                         │    │                │
│   ▼Ch2     │  │    Active Tab Content   │    │   Chat UI      │
│     Note1  │  │     (CEF or MarkText)   │    │   (CEF View)   │
│ ▼Folder2   │  │                         │    │                │
│   Page3    │  └─────────────────────────┘    │                │
│            │  Address: https://...            │                │
│            │  [ ← ] [ → ] [ ↻ ]               │                │
│ [+] Folder │                                 │                │
│ [+] Note   │  Status: Saved at 14:32:18       │                │
└────────────┴─────────────────────────────────┴────────────────┘
  20% width      60% width                     20% width
  (resizable)    (resizable)                   (fixed min)
```

### Component Details

**Workspace Panel** (FileTree):
- Hierarchical tree view (folders + items)
- Icons: 📁 folder, 🌐 web item, 📝 note item
- Drag & drop enabled (visual feedback on hover)
- Right-click context menu: New Folder, New Note, Rename, Delete
- Search bar at top (filters tree in real-time)
- Badge counts on folders (number of items inside)

**Tab Bar**:
- Horizontal scrollable tabs (auto-scroll to active)
- Close button (X) on each tab (hover to reveal)
- Tab indicators: favicon (web), 📝 icon (note), modified dot (unsaved note)
- Tab limit warning: Yellow border + toast after 20th tab
- Drag to reorder tabs

**Tab Content Area**:
- Web tabs: Embedded CEF webview
  - Address bar (URL input + suggestions)
  - Navigation controls (back, forward, refresh)
  - Loading progress bar
- Note tabs: MarkText editor
  - Split view: Markdown source + live preview
  - Toolbar: Bold, Italic, Link, Image, Code, Table
  - Auto-save indicator: "Saved at HH:MM:SS" (bottom right)

**AI Panel**:
- Provider selector dropdown (top)
- Full-height CEF webview below
- No close button (permanently visible)
- Minimum width: 300px, resizable splitter on left edge

### Visual States

**Workspace Items**:
- Default: Gray text, standard icon
- Hovered: Light blue background
- Selected: Blue background, white text
- Dragging: Semi-transparent, dashed outline on drop target
- Error: Red icon + tooltip (e.g., "Page failed to load")

**Tabs**:
- Active: White background, border top blue accent
- Inactive: Gray background, dimmed text
- Loading: Spinner icon replacing favicon
- Modified (notes): Orange dot next to title
- Warning (20+): Yellow border on tab bar

**Autosave Indicator**:
- Idle: "Saved at HH:MM:SS" (gray text)
- Saving: "Saving..." (animated dots)
- Error: "Save failed" (red text) + retry button

### Keyboard Shortcuts

**Global**:
- `Ctrl/Cmd + T`: New tab (opens blank web page)
- `Ctrl/Cmd + W`: Close active tab
- `Ctrl/Cmd + Tab`: Next tab
- `Ctrl/Cmd + Shift + Tab`: Previous tab
- `Ctrl/Cmd + 1-9`: Jump to tab N
- `Ctrl/Cmd + F`: Focus search in workspace panel
- `Ctrl/Cmd + N`: New note in active folder
- `Ctrl/Cmd + Shift + N`: New folder in workspace root

**Web Tabs**:
- `Ctrl/Cmd + L`: Focus address bar
- `Ctrl/Cmd + R`: Refresh page
- `Alt + ←`: Back
- `Alt + →`: Forward

**Note Tabs**:
- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + K`: Insert link
- `Ctrl/Cmd + S`: Manual save (triggers immediate autosave)

## Engineering Plan

### Build System

**Multi-Platform Build**:
```json
// electron-builder.json
{
  "appId": "com.workspacenav.app",
  "productName": "Workspace Navigator",
  "directories": {
    "output": "dist",
    "buildResources": "build"
  },
  "files": [
    "dist-electron/**/*",
    "dist-renderer/**/*",
    "node_modules/**/*"
  ],
  "extraResources": [
    {
      "from": "cef-native/build/Release",
      "to": "cef-binary",
      "filter": ["*.dll", "*.so", "*.dylib", "*.pak", "*.bin"]
    }
  ],
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icon.png",
    "category": "Utility"
  }
}
```

**CEF Native Compilation**:
```cmake
# cef-native/CMakeLists.txt
cmake_minimum_required(VERSION 3.19)
project(workspace-navigator-cef)

set(CMAKE_CXX_STANDARD 17)

# Find CEF
find_package(CEF REQUIRED)

# Add CEF helper executables
add_subdirectory(${CEF_LIBCEF_DLL_WRAPPER_PATH} libcef_dll_wrapper)

# Main CEF library
add_library(cef-bridge SHARED
  src/app/CEFApp.cpp
  src/handlers/BrowserClient.cpp
  src/bridge/NodeCEFBridge.cpp
)

target_link_libraries(cef-bridge
  libcef_dll_wrapper
  ${CEF_STANDARD_LIBS}
)

# N-API addon
add_node_addon(cef-node-bridge
  src/bridge/NodeCEFBridge.cpp
)
```

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
# .github/workflows/build.yml
name: Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [20]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Unit tests
        run: npm run test:unit
      - name: Integration tests
        run: npm run test:integration
      - name: E2E tests
        run: npm run test:e2e

  build:
    needs: test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v3
      - name: Build CEF native
        run: npm run build:cef
      - name: Build Electron app
        run: npm run build
      - name: Package app
        run: npm run package
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: workspace-navigator-${{ matrix.os }}
          path: dist/*.{exe,dmg,AppImage,deb}
```

### Testing Strategy

**Unit Tests** (Jest):
```typescript
// tests/unit/workspace/ItemManager.test.ts
describe('ItemManager', () => {
  describe('createWebItem', () => {
    it('should create item in date folder when folderId is null', async () => {
      const workspace = await createTestWorkspace();
      const item = await itemManager.createWebItem(workspace.id, 'https://example.com', null);

      expect(item.folder_id).not.toBeNull();

      const folder = await folderManager.getFolder(item.folder_id);
      expect(folder.name).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    });

    it('should detect duplicate URL in same folder on same day', async () => {
      const workspace = await createTestWorkspace();
      const folder = await folderManager.createFolder(workspace.id, 'Test', null);

      const item1 = await itemManager.createWebItem(workspace.id, 'https://example.com', folder.id);
      const item2 = await itemManager.createWebItem(workspace.id, 'https://example.com', folder.id);

      // Should return existing item, not create new
      expect(item2.id).toBe(item1.id);
    });
  });
});
```

**Integration Tests**:
```typescript
// tests/integration/workspace-tab-sync/sync.test.ts
describe('Workspace-Tab Synchronization', () => {
  it('should create workspace item when navigating to new URL in tab', async () => {
    const app = await launchApp();
    const workspace = await app.createWorkspace('Test');

    // Open a blank tab
    const tab = await app.openTab();

    // Navigate to URL
    await tab.navigate('https://example.com');

    // Wait for page load
    await tab.waitForLoad();

    // Check item was created
    const items = await workspace.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com');
    expect(items[0].title).toBe('Example Domain');
  });
});
```

**E2E Tests** (Playwright):
```typescript
// tests/e2e/session-restore.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test('should restore session after crash', async () => {
  // Launch app
  const app = await electron.launch({ args: ['main.js'] });
  const window = await app.firstWindow();

  // Create workspace and open items
  await window.click('text=New Workspace');
  await window.fill('[placeholder="Workspace name"]', 'Test');
  await window.click('text=Create');

  // Open 3 web pages
  for (const url of ['https://a.com', 'https://b.com', 'https://c.com']) {
    await window.click('[title="New tab"]');
    await window.fill('[placeholder="Enter URL"]', url);
    await window.press('Enter');
    await window.waitForLoadState('networkidle');
  }

  // Verify 3 tabs open
  const tabs = await window.locator('.tab').count();
  expect(tabs).toBe(3);

  // Force crash (kill process)
  await app.close();

  // Relaunch
  const app2 = await electron.launch({ args: ['main.js'] });
  const window2 = await app2.firstWindow();

  // Wait for restoration
  await window2.waitForSelector('.tab', { timeout: 5000 });

  // Verify session restored
  const restoredTabs = await window2.locator('.tab').count();
  expect(restoredTabs).toBe(3);

  const urls = await window2.locator('.tab').allTextContents();
  expect(urls).toContain('a.com');
  expect(urls).toContain('b.com');
  expect(urls).toContain('c.com');
});
```

### Logging & Monitoring

**Structured Logging**:
```typescript
// src/main/logging/Logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage
logger.info('Workspace created', { workspaceId, name });
logger.error('Failed to save item', { itemId, error: err.message, stack: err.stack });
```

**Crash Reporting**:
```typescript
// src/main/crash-reporter.ts
import { crashReporter } from 'electron';

crashReporter.start({
  productName: 'Workspace Navigator',
  companyName: 'Your Company',
  submitURL: 'https://crash-reports.your-domain.com/submit',
  uploadToServer: true
});
```

## Security Implementation

### CEF Sandbox Configuration

**Enable Sandbox** (enforced):
```cpp
// cef-native/src/app/CEFApp.cpp
void CEFApp::OnBeforeCommandLineProcessing(
    const CefString& process_type,
    CefRefPtr<CefCommandLine> command_line) {

  // Ensure sandbox is NOT disabled
  if (command_line->HasSwitch("no-sandbox")) {
    command_line->RemoveSwitch("no-sandbox");
  }

  // Enable additional security features
  command_line->AppendSwitch("enable-features", "NetworkService,NetworkServiceInProcess");
  command_line->AppendSwitch("disable-features", "TranslateUI");

  // Disable unnecessary features
  command_line->AppendSwitch("disable-background-networking");
  command_line->AppendSwitch("disable-sync");
  command_line->AppendSwitch("disable-default-apps");
}
```

### Content Security Policy

**Enforce CSP**:
```typescript
// src/main/cef-engine/SecurityPolicy.ts
class SecurityPolicy {
  getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Needed for some web apps
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "font-src 'self' data:",
      "frame-src 'self' https:",  // Allow AI provider iframes
      "upgrade-insecure-requests"
    ].join('; ');
  }
}

// Apply to all requests
cefClient.onBeforeBrowse((url) => {
  return {
    headers: {
      'Content-Security-Policy': securityPolicy.getCSPHeader()
    }
  };
});
```

### Workspace Validation

**Integrity Checks** (see IntegrityValidator above):
- Foreign key constraint validation
- Schema version compatibility
- Orphaned item detection + auto-repair
- Backup restoration on corruption

### Encryption Key Management

**Key Derivation**:
```typescript
// src/main/storage/KeyManager.ts
import crypto from 'crypto';
import { app } from 'electron';

class KeyManager {
  private key: Buffer;

  constructor() {
    // Derive key from machine-specific data + user password (if set)
    const machineId = getMachineId();  // OS-specific unique identifier
    const salt = app.getPath('userData');

    this.key = crypto.pbkdf2Sync(
      machineId,
      salt,
      100000,  // iterations
      32,      // key length
      'sha256'
    );
  }

  getKey(): string {
    return this.key.toString('hex');
  }
}
```

**Note**: For enhanced security, prompt user for master password on first launch. Store password hash in keychain (macOS/Linux) or Credential Manager (Windows).

## Sprint Roadmap

### Sprint 1-2: Foundation (Weeks 1-4)

**Goal**: Project setup + core infrastructure

**Tasks**:
- Project scaffolding (Electron + TypeScript + build system)
- CEF integration (C++ addon, basic browser window)
- SQLite storage layer (schema v1, basic CRUD)
- Three-column UI skeleton (React components, layout)
- IPC infrastructure (main ↔ renderer communication)

**Deliverables**:
- App launches with empty UI
- Can create/open/delete test workspaces (in-memory only)
- Basic CEF webview renders web pages

**Team**:
- 2 senior developers (1 C++/CEF, 1 TypeScript/Electron)
- 1 UI designer (mockups)

### Sprint 3-4: MVP (Weeks 5-8)

**Goal**: Working MVP per MVP scope

**Tasks**:
- Single workspace implementation
- Web item creation (automatic from navigation)
- Note item creation (basic Markdown editor)
- Manual folder creation
- Tab management (open, close, switch)
- Session persistence (workspace + items)
- AI panel (ChatGPT only)

**Deliverables**:
- Users can create workspace, browse web, take notes
- Data persists across app restarts
- Basic usability validated by internal testing

**Team**:
- 2 senior developers (feature implementation)
- 1 QA engineer (manual testing)

### Sprint 5-8: V1 Core Features (Weeks 9-16)

**Goal**: Multi-workspace, auto-organization, crash recovery

**Tasks**:
- Multi-workspace management
- Auto date folders (DD.MM.YYYY)
- URL deduplication logic
- Markdown autosave (500ms debounce)
- Session restore (crash recovery)
- Tab limit warning (20+ tabs)
- Performance optimization (CEF pooling, lazy load)

**Deliverables**:
- Full workspace lifecycle working
- All clarifications implemented
- Crash recovery functional

**Team**:
- 3 developers (2 senior, 1 mid)
- 1 QA engineer

### Sprint 9-10: V1 Polish & Advanced Features (Weeks 17-20)

**Goal**: Search, tags, drag-drop, themes

**Tasks**:
- Advanced organization (tags, rename)
- Full-text search across items
- Drag & drop reorganization
- AI provider selector (ChatGPT, Claude, Gemini, custom)
- Light + dark themes
- Keyboard shortcuts
- Performance profiling & optimization

**Deliverables**:
- All spec.md acceptance scenarios pass
- Performance targets met (<2s launch, <200ms tab)
- User testing with 10+ beta users

**Team**:
- 3 developers
- 1 QA engineer
- 1 UI/UX designer (polish)

### Sprint 11-12: Cross-Platform & Release (Weeks 21-24)

**Goal**: Multi-platform builds, packaging, launch

**Tasks**:
- Cross-platform testing (Win, Mac, Linux)
- Platform-specific bugs fixes
- Installer creation (NSIS, DMG, AppImage)
- Documentation (user manual, FAQ)
- Marketing materials (website, demo video)
- Release process (code signing, distribution)

**Deliverables**:
- Stable builds for all three platforms
- Public launch (website, downloads)
- User onboarding flow

**Team**:
- 2 developers (bug fixes)
- 1 DevOps engineer (CI/CD, release)
- 1 technical writer (docs)

## Critical Dependencies

**Must Complete Before Next Phase**:
1. CEF integration → All web-related features
2. Storage layer → Workspace persistence
3. IPC infrastructure → UI updates
4. Workspace engine → Item management
5. Tab manager → Multi-tab functionality

**External Dependencies**:
- CEF binaries (download ~1GB, build time 2-4 hours)
- MarkText library (MIT license, compatible)
- SQLCipher (build from source for Electron compatibility)

## Major Risks & Mitigations

### Risk 1: CEF Performance on Low-End Hardware

**Impact**: High - Violates <2s launch target
**Probability**: Medium
**Mitigation**:
- Lazy CEF initialization (delay until first tab opened)
- Webview pooling (reuse instances)
- Tab suspension (freeze offscreen tabs after 30s)
- Fallback: Relax launch target to <3s for low-end hardware

### Risk 2: Cross-Platform CEF Build Complexity

**Impact**: High - Blocks multi-platform release
**Probability**: High (CEF notorious for build issues)
**Mitigation**:
- Use pre-built CEF binaries (official downloads)
- Docker-based build environment for consistency
- Dedicated DevOps engineer for build pipeline
- Fallback: Single-platform release first (Windows), then Mac/Linux

### Risk 3: Storage Corruption in Crash Scenarios

**Impact**: High - Data loss violates core promise
**Probability**: Low (SQLite ACID guarantees)
**Mitigation**:
- Atomic writes (temp + rename for JSON files)
- Foreign key constraints + integrity validation
- Automatic backups (.backup files)
- User-facing recovery UI
- Extensive crash testing (kill -9 during operations)

### Risk 4: Memory Usage with 20+ Tabs

**Impact**: Medium - Performance degradation
**Probability**: High (CEF per-tab overhead)
**Mitigation**:
- Soft limit with warning (20 tabs)
- Tab suspension for inactive tabs
- Process sharing for same-origin tabs
- User education (close unused tabs)

### Risk 5: MarkText Integration Complexity

**Impact**: Medium - Markdown editing degraded
**Probability**: Medium (third-party library)
**Mitigation**:
- Isolate MarkText as separate renderer process
- Fallback to simple textarea + preview if integration fails
- Extensive testing of MarkText features
- Contribute fixes upstream if needed

## Team Roles & Responsibilities

### Architect (1 person)

**Responsibilities**:
- High-level system design
- Technology selection
- Architecture documentation (ADRs)
- Code review (architecture changes)
- Performance profiling

**Skills**: C++, TypeScript, Electron, CEF, system design

### Senior Developers (2 people)

**Person 1 - CEF Specialist**:
- CEF integration (C++ addon)
- Multi-webview management
- Security configuration
- Performance optimization

**Person 2 - Electron Specialist**:
- Electron main process
- Workspace engine
- Storage layer
- IPC infrastructure

**Skills**: Respective specializations + full-stack capable

### Mid-Level Developer (1 person)

**Responsibilities**:
- UI components (React)
- Feature implementation (tags, search, drag-drop)
- Bug fixes
- Unit tests

**Skills**: TypeScript, React, Jest

### UI/UX Designer (1 person)

**Responsibilities**:
- UI mockups (Figma)
- Visual design (icons, colors, spacing)
- UX flows (user journeys, interactions)
- Usability testing

**Skills**: Figma, user research, prototyping

### DevOps Engineer (1 person)

**Responsibilities**:
- CI/CD pipeline (GitHub Actions)
- Build system (CMake, electron-builder)
- Cross-platform builds
- Release process (signing, distribution)

**Skills**: Docker, CMake, GitHub Actions, build tools

### QA Engineer (1 person)

**Responsibilities**:
- Manual testing
- Test plan creation
- E2E test automation (Playwright)
- Bug reporting & triage

**Skills**: Playwright, test methodologies, attention to detail

### Technical Writer (part-time)

**Responsibilities**:
- User documentation
- Developer documentation
- API reference
- Onboarding guides

**Skills**: Technical writing, Markdown, documentation tools

## Next Steps

This implementation plan is now complete and ready for:

1. **Phase 0: Research** - Generate `research.md` with detailed technology decisions
2. **Phase 1: Design** - Generate `data-model.md`, `contracts/`, and `quickstart.md`
3. **Phase 2: Tasks** - Run `/speckit.tasks` to generate actionable task breakdown

**Recommended Next Command**: `/speckit.tasks` to convert this plan into executable tasks organized by user story.

## Appendices

### A. Technology Alternatives Considered

**CEF vs. Electron's built-in webview**:
- **Chosen**: CEF (via native addon)
- **Rationale**: Better multi-view performance, process isolation, easier to pool instances
- **Trade-off**: More complex build process

**SQLite vs. LevelDB**:
- **Chosen**: SQLite + SQLCipher
- **Rationale**: SQL queries for complex searches, encryption support, better corruption recovery
- **Trade-off**: Slightly slower writes (negligible for our use case)

**React vs. Vue vs. Svelte**:
- **Chosen**: React
- **Rationale**: Larger ecosystem, better TypeScript support, team familiarity
- **Trade-off**: Larger bundle size (mitigated by tree-shaking)

### B. Performance Benchmarks (Targets)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Launch time | <2s | Time from process start to main window interactive |
| Tab creation | <200ms | Time from click to webview rendered |
| Item creation | <50ms | Time from URL navigate to DB insert |
| Search (500 items) | <1s | Time from query to results displayed |
| Memory (baseline) | <500MB | 0 tabs open, workspace loaded |
| Memory (10 tabs) | <1.5GB | 10 web pages open |
| Memory (20 tabs) | <2.5GB | 20 tabs (warning threshold) |

### C. Glossary

- **CEF**: Chromium Embedded Framework - library for embedding Chromium in desktop apps
- **Item**: Core entity representing either a web page or Markdown note
- **Workspace**: Container for organized items (like a project in an IDE)
- **Tab**: UI element displaying content of an item (transient, can be closed)
- **Webview**: CEF browser instance rendering web content
- **Session State**: Snapshot of active workspace + open tabs for crash recovery
- **Date Folder**: Auto-created folder named DD.MM.YYYY containing items from that day
- **Duplication Detection**: Logic to avoid creating multiple items for same URL
- **Autosave**: Automatic saving of Markdown notes 500ms after user stops typing
- **Soft Limit**: Warning threshold (20 tabs) that doesn't block user action
- **Hard Limit**: Enforced maximum (none in V1)

---

**End of Implementation Plan**

This plan provides comprehensive technical guidance for implementing Workspace Navigator V1. All constitutional principles are satisfied, clarifications are integrated, and the architecture is designed for maintainability and cross-platform performance.
