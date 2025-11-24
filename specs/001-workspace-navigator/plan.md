# Implementation Plan: Workspace Navigator

**Branch**: `001-workspace-navigator` | **Date**: 2024-11-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-workspace-navigator/spec.md`

**ARCHITECTURE PIVOT**: Switched from CEF (Chromium Embedded Framework) to Electron's built-in BrowserView API for V1 stability and simplicity.

## Summary

Workspace Navigator is a cross-platform desktop application that combines web browsing, Markdown editing, and AI assistant access in an IDE-style interface. Users organize web pages and notes in hierarchical workspaces with automatic persistence. The application uses Electron's BrowserView for native Chromium rendering, SQLite for local storage, and React for the UI.

**Technical Approach**: Electron app with three-panel layout. Left panel (React) shows workspace tree. Center panel hosts multiple BrowserViews for web tabs and MarkText editor for Markdown. Right panel (React) embeds AI provider web interfaces. All workspace data persists to local SQLite database.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20.x (LTS)
**Primary Dependencies**:
- Electron 30+ (BrowserView/WebContentsView API)
- React 18
- SQLite3 (better-sqlite3)
- MarkText component

**Storage**: SQLite database (local file) with schema versioning
**Testing**: Vitest (unit), Playwright (E2E), Electron test harness
**Target Platform**: Cross-platform desktop (Windows 10+, macOS 12+, Ubuntu 20.04+)
**Project Type**: Electron desktop application (main process + renderer)
**Performance Goals**:
- App launch: < 2 seconds (cold start)
- Tab creation: < 200ms
- Workspace tree render: < 100ms for 1000 items

**Constraints**:
- Memory: < 500MB baseline with 10 tabs
- Local-only (no cloud sync in V1)
- No native code compilation (pure Electron/Node.js)

**Scale/Scope**:
- 50-100 workspaces per user
- 1000-5000 items per workspace
- 20 simultaneous tabs (soft limit)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security & Privacy ✅

**Compliance**:
- ✅ BrowserView instances run sandboxed with `sandbox: true`
- ✅ SQLite with encryption at rest (SQLCipher)
- ✅ No external data transmission (local-only)
- ✅ AI providers accessed via standard web pages (no interception)
- ✅ Content Security Policy enforced on all BrowserViews
- ✅ Dependencies audited via `npm audit`

**Justification**: Electron BrowserView provides same Chromium sandbox as CEF with simpler integration.

### II. Performance Standards ✅

**Compliance**:
- ✅ Launch target: < 2s (Electron optimized startup)
- ✅ Tab creation: < 200ms (BrowserView instantiation is fast)
- ✅ Memory optimization: BrowserView pooling/reuse strategy
- ✅ Workspace caching: In-memory with lazy loading
- ✅ Cross-platform parity: Electron handles platform differences

**Measurements**: CI/CD pipeline will validate targets on all platforms.

### III. Code Quality & Architecture ✅

**Compliance**:
- ✅ Modular: Workspace management, browser management, storage, UI layers separated
- ✅ Documentation: TSDoc for all public APIs, ADRs for decisions
- ✅ Code review: Required for all merges
- ✅ Test coverage: 70%+ target (unit + integration)
- ✅ Naming: TypeScript + ESLint enforces consistency

**Architecture**:
```
Main Process (Node.js)
├── BrowserViewManager (manages BrowserView instances)
├── WorkspaceEngine (business logic)
├── Database (SQLite access layer)
└── IPC handlers

Renderer Process (React)
├── WorkspacePanel (left sidebar)
├── TabsContainer (center - React UI only)
├── AIAssistant (right sidebar)
└── State management (Zustand/Redux)
```

### IV. Technical Standards & Compatibility ✅

**Compliance**:
- ✅ Electron BrowserView: Official Electron API, well-documented
- ✅ IDE patterns: Three-panel layout from VSCode/Cursor
- ✅ MarkText: Integrated as sandboxed component (no modifications)
- ✅ Workspace schema: Versioned JSON schema with migrations
- ✅ Platform support: Windows 10+, macOS 12+, Ubuntu 20.04+

**Change from Constitution**:
- **Original**: CEF integration following CEF guidelines
- **Updated**: Electron BrowserView following Electron best practices
- **Rationale**: BrowserView is native to Electron, more stable, zero C++ compilation

### V. User Experience Principles ✅

**Compliance**:
- ✅ Three-column layout preserved
- ✅ AI column persistent and non-collapsible
- ✅ Full drag-and-drop support (React DnD)
- ✅ Auto date folders (YYYY-MM-DD format)
- ✅ Instant item reopening from history
- ✅ Keyboard shortcuts discoverable

**No changes** - UX principles remain identical.

### VI. Maintainability & Long-term Health ✅

**Compliance**:
- ✅ Layer separation: Data/UI/Browser strictly isolated
- ✅ Minimal dependencies: Electron + React + SQLite core stack
- ✅ Structured logging: Winston with JSON format
- ✅ Workspace schema versioning: Migration system included
- ✅ ADRs for all architectural decisions
- ✅ Quarterly refactoring cycles planned

**Improvement**: Electron-only eliminates CEF maintenance burden and native build complexity.

### Constitution Amendment Required: ✅

**Principle I.1** - Update reference from "CEF instances" to "BrowserView instances"
**Principle III.1** - Update reference from "CEF engine" to "Browser engine (Electron BrowserView)"
**Principle IV.1** - Replace "CEF integration MUST follow official CEF guidelines" with "Electron BrowserView integration MUST follow Electron best practices"
**Principle VI.1** - Update reference from "CEF engine" to "Electron browser engine"

**Amendment Justification**: Technical implementation change (CEF → Electron) without weakening security, performance, or quality standards. All gates still pass. Migration path clear.

## Project Structure

### Documentation (this feature)

```text
specs/001-workspace-navigator/
├── plan.md              # This file
├── research.md          # Phase 0: Electron BrowserView research
├── data-model.md        # Phase 1: Workspace schema, entities
├── quickstart.md        # Phase 1: Dev setup guide
├── contracts/           # Phase 1: IPC contracts, database schema
│   ├── ipc-contracts.ts
│   ├── database-schema.sql
│   └── workspace-schema.json
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
src/
├── main/                        # Electron main process
│   ├── index.ts                 # App entry point
│   ├── browser-view-manager.ts  # BrowserView lifecycle management
│   ├── window-manager.ts        # Main window creation/state
│   ├── ipc-handlers.ts          # IPC message handlers
│   └── menu.ts                  # Application menus
│
├── core/                        # Business logic (shared)
│   ├── workspace/
│   │   ├── workspace-engine.ts  # Core workspace operations
│   │   ├── item-manager.ts      # Items (web/markdown) management
│   │   └── folder-manager.ts    # Folder hierarchy logic
│   ├── storage/
│   │   ├── database.ts          # SQLite access layer
│   │   ├── migrations/          # Schema migrations
│   │   └── cache.ts             # In-memory caching
│   └── types/
│       ├── entities.ts          # Workspace, Item, Folder types
│       └── contracts.ts         # IPC contracts
│
├── renderer/                    # React UI
│   ├── components/
│   │   ├── WorkspacePanel.tsx   # Left sidebar
│   │   ├── TabsContainer.tsx    # Center tab management
│   │   ├── AIAssistant.tsx      # Right sidebar
│   │   └── ...
│   ├── hooks/                   # React hooks
│   ├── store/                   # State management
│   └── index.tsx                # Renderer entry
│
├── preload/                     # Preload scripts
│   └── index.ts                 # Electron API exposure
│
└── types/                       # Shared TypeScript types
    └── electron.d.ts

tests/
├── unit/                        # Vitest unit tests
│   ├── workspace/
│   ├── storage/
│   └── browser-manager/
├── integration/                 # Integration tests
│   └── workspace-flows/
└── e2e/                         # Playwright E2E tests
    └── main-flows/

native/                          # ❌ REMOVED (no CEF)
dist/                            # Build outputs
.specify/                        # Specify framework
```

**Structure Decision**: Standard Electron app with main/renderer split. Core business logic extracted to `src/core` for testability and potential future reuse. No native C++ code required - pure TypeScript/Node.js.

## Complexity Tracking

**No violations** - All constitution gates pass with Electron BrowserView architecture.

**Complexity Assessment**:
- **Medium complexity** - Electron app with multiple BrowserViews and SQLite
- **Lower than CEF approach** - No C++ compilation, simpler window management
- **Standard Electron patterns** - Well-documented, community support

## Phase 0: Research & Discovery

### Research Questions

1. **Electron BrowserView vs WebContentsView**
   - Which API for Electron 30+?
   - Positioning/sizing strategy for tab switching
   - Performance characteristics

2. **BrowserView Lifecycle Management**
   - Pool/reuse strategy
   - Memory management best practices
   - Multi-window support

3. **SQLite with Encryption**
   - SQLCipher integration in Electron
   - Performance impact of encryption
   - Key management strategy

4. **MarkText Integration**
   - Embedding as BrowserView or iframe?
   - Communication with main app
   - Persistence strategy

5. **Cross-platform Packaging**
   - electron-builder configuration
   - Code signing requirements
   - Auto-update strategy

### Research Output: `research.md`

Document decisions for each question above with:
- Selected approach
- Rationale
- Alternatives considered
- Implementation notes

## Phase 1: Design & Contracts

### Data Model: `data-model.md`

**Entities**:
1. **Workspace**: id, name, createdAt, lastActiveAt
2. **Folder**: id, workspaceId, parentId, name, displayOrder
3. **Item**: id, workspaceId, folderId, type, url/content, title, createdAt
4. **TabState**: browserId, itemId, lastUrl, scrollPosition

**Relationships**:
- Workspace 1:N Folder (root folders have parentId=null)
- Folder 1:N Folder (nested folders)
- Folder 1:N Item
- Item 1:1 TabState (if open)

**Validation Rules**:
- Workspace name: 1-100 chars, required
- Folder name: 1-100 chars, required
- Item URL: valid URL format for web items
- Auto-folders: created at workspace root with date format YYYY-MM-DD

### API Contracts: `contracts/`

**IPC Contracts** (`ipc-contracts.ts`):
```typescript
interface WorkspaceAPI {
  // Workspace operations
  createWorkspace(name: string): Promise<Workspace>
  getWorkspace(id: string): Promise<Workspace>
  getAllWorkspaces(): Promise<Workspace[]>

  // Item operations
  createWebItem(workspaceId: string, url: string): Promise<Item>
  createMarkdownItem(workspaceId: string, title: string): Promise<Item>
  openItem(itemId: string): Promise<BrowserViewId>

  // Browser management
  navigateTab(browserId: string, url: string): Promise<void>
  closeTab(browserId: string): Promise<void>
}
```

**Database Schema** (`database-schema.sql`):
```sql
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL
);

CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (parent_id) REFERENCES folders(id)
);

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  folder_id TEXT,
  type TEXT CHECK(type IN ('web', 'markdown')),
  url TEXT,
  content TEXT,
  title TEXT,
  favicon TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id)
);

CREATE INDEX idx_items_workspace ON items(workspace_id);
CREATE INDEX idx_folders_workspace ON folders(workspace_id);
```

### Quick Start Guide: `quickstart.md`

1. Prerequisites: Node.js 20+, npm 10+
2. Install: `npm install`
3. Build native modules: `npm run rebuild`
4. Dev mode: `npm run dev` (launches Electron + Vite)
5. Build: `npm run build && npm run electron:build`
6. Test: `npm test`

## Phase 2: Task Generation

**Deferred to `/speckit.tasks` command**

Task categories will include:
- BrowserView manager implementation
- Workspace engine core logic
- Database layer with migrations
- React UI components
- IPC bridge
- Tab management
- Session persistence
- Testing & CI/CD

---

**Plan Status**: ✅ Complete
**Next Step**: Run `/speckit.tasks` to generate implementation tasks
**Architecture**: Electron BrowserView (stable, no native compilation required)
