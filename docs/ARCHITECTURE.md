# Workspace Navigator - Architecture Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Main Process](#3-main-process)
4. [Renderer Process](#4-renderer-process)
5. [Data Layer](#5-data-layer)
6. [IPC Communication](#6-ipc-communication)
7. [Security Model](#7-security-model)
8. [Performance Considerations](#8-performance-considerations)

---

## 1. Overview

Workspace Navigator is built on Electron, combining a Chromium-based renderer with Node.js capabilities. The architecture follows Electron best practices with strict process isolation and secure IPC communication.

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Electron 30+ | Desktop application shell |
| UI | React 18 | Component-based UI |
| Language | TypeScript 5.3 | Type safety |
| Build | Vite | Fast bundling and HMR |
| Database | better-sqlite3 | Synchronous SQLite |
| Testing | Vitest + Playwright | Unit and E2E tests |

### Design Principles

1. **Process Isolation**: Main and renderer processes are strictly separated
2. **Secure by Default**: Context isolation, sandboxing, CSP
3. **Performance First**: Lazy loading, pooling, caching
4. **Data Integrity**: ACID transactions, crash recovery
5. **Cross-Platform**: Consistent behavior across Windows, macOS, Linux

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ELECTRON APPLICATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      MAIN PROCESS (Node.js)                        │ │
│  │                                                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │ │
│  │  │   Window    │  │ BrowserView │  │    Tab      │                │ │
│  │  │   Manager   │  │   Manager   │  │   Manager   │                │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │ │
│  │         │                │                │                        │ │
│  │  ┌──────┴────────────────┴────────────────┴──────┐                │ │
│  │  │              IPC Handlers                      │                │ │
│  │  └──────────────────────┬────────────────────────┘                │ │
│  │                         │                                          │ │
│  │  ┌──────────────────────┴────────────────────────┐                │ │
│  │  │           Workspace Engine                     │                │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │                │ │
│  │  │  │ Folder  │ │  Item   │ │  Duplication    │  │                │ │
│  │  │  │ Manager │ │ Manager │ │  Detector       │  │                │ │
│  │  │  └────┬────┘ └────┬────┘ └────────┬────────┘  │                │ │
│  │  └───────┴───────────┴───────────────┴───────────┘                │ │
│  │                         │                                          │ │
│  │  ┌──────────────────────┴────────────────────────┐                │ │
│  │  │              Database Layer                    │                │ │
│  │  │  ┌─────────────────┐  ┌────────────────────┐  │                │ │
│  │  │  │ WorkspaceDatabase│  │  SQLite (better-  │  │                │ │
│  │  │  │ (ORM wrapper)    │  │  sqlite3)         │  │                │ │
│  │  │  └─────────────────┘  └────────────────────┘  │                │ │
│  │  └───────────────────────────────────────────────┘                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                              ↕ IPC (contextBridge)                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    RENDERER PROCESS (Chromium)                     │ │
│  │                                                                     │ │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐            │ │
│  │  │  Workspace  │  │  Tabs Container │  │  AI Panel   │            │ │
│  │  │   Panel     │  │  ┌───────────┐  │  │             │            │ │
│  │  │  ┌───────┐  │  │  │  Tab Bar  │  │  │  Provider   │            │ │
│  │  │  │Search │  │  │  └───────────┘  │  │  Selector   │            │ │
│  │  │  │  Bar  │  │  │  ┌───────────┐  │  │             │            │ │
│  │  │  └───────┘  │  │  │ Navigation│  │  │  BrowserView│            │ │
│  │  │  ┌───────┐  │  │  │    Bar    │  │  │  Container  │            │ │
│  │  │  │Folder │  │  │  └───────────┘  │  │             │            │ │
│  │  │  │ Tree  │  │  │  ┌───────────┐  │  │             │            │ │
│  │  │  └───────┘  │  │  │BrowserView│  │  │             │            │ │
│  │  │             │  │  │ Container │  │  │             │            │ │
│  │  └─────────────┘  └─────────────────┘  └─────────────┘            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    BROWSERVIEW INSTANCES                           │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │ │
│  │  │  Tab 1  │  │  Tab 2  │  │  Tab 3  │  │AI Panel │               │ │
│  │  │ (web)   │  │ (web)   │  │(markdown)│  │ (AI)    │               │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Main Process

The main process runs in Node.js and handles:
- Window management
- BrowserView lifecycle
- Database operations
- File system access
- Native system integration

### Key Components

#### WindowManager (`src/main/window-manager.ts`)

```typescript
class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): void;
  getMainWindow(): BrowserWindow;
  saveWindowState(): void;
  restoreWindowState(): void;
}
```

Responsibilities:
- Create and configure main window
- Save/restore window geometry
- Handle window events (close, resize, etc.)

#### BrowserViewManager (`src/main/browser-view-manager.ts`)

```typescript
class BrowserViewManager {
  private views: Map<string, BrowserView> = new Map();
  private viewPool: BrowserView[] = [];

  createView(tabId: string, url: string): BrowserView;
  showView(tabId: string): void;
  hideView(tabId: string): void;
  destroyView(tabId: string): void;
  getOrCreateFromPool(): BrowserView;
}
```

Responsibilities:
- Manage BrowserView instances
- View pooling for performance
- Position views within window bounds
- Handle view lifecycle

#### TabManager (`src/main/tab-manager.ts`)

```typescript
interface Tab {
  id: string;
  itemId: string;
  type: 'web' | 'markdown';
  url?: string;
  title: string;
  isLoading: boolean;
}

class TabManager {
  private tabs: Tab[] = [];
  private activeTabId: string | null = null;

  openTab(itemId: string): Promise<Tab>;
  closeTab(tabId: string): void;
  switchTab(tabId: string): void;
  updateTab(tabId: string, updates: Partial<Tab>): void;
}
```

Responsibilities:
- Track open tabs
- Coordinate with BrowserViewManager
- Handle tab events

#### SessionManager (`src/main/session-manager.ts`)

```typescript
class SessionManager {
  saveSession(): void;
  restoreSession(): Promise<void>;
  getSessionState(): SessionState;
}
```

Responsibilities:
- Persist session state to database
- Restore tabs on startup
- Handle crash recovery

---

## 4. Renderer Process

The renderer process runs React in a Chromium context with limited Node.js access via the preload script.

### Component Hierarchy

```
App
├── WorkspacePanel
│   ├── WorkspaceSelector
│   ├── SearchBar
│   ├── FolderTree
│   │   └── TreeNode (recursive)
│   └── ActionButtons
├── TabsContainer
│   ├── TabBar
│   │   └── Tab (multiple)
│   ├── NavigationBar
│   └── ContentArea
│       ├── BrowserViewPlaceholder (for web tabs)
│       └── MarkdownEditor (for note tabs)
├── AIPanel
│   ├── ProviderSelector
│   └── BrowserViewPlaceholder
└── Dialogs
    ├── ShortcutsHelp
    ├── TagEditor
    └── ConfirmDialog
```

### State Management

The application uses React's built-in state management with context:

```typescript
// Workspace context
interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  folders: Folder[];
  items: Item[];
}

// Tab context
interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

// Theme context
interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

### Hooks

Custom hooks encapsulate common patterns:

```typescript
// Keyboard shortcuts
useKeyboardShortcuts(shortcuts: ShortcutConfig[]): void;

// IPC communication
useIPC<T>(channel: string, initialValue: T): [T, (data: T) => void];

// Search with debounce
useSearch(query: string, debounceMs: number): SearchResults;
```

---

## 5. Data Layer

### Database Schema

```sql
-- Workspaces
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  settings TEXT DEFAULT '{}',
  is_deleted INTEGER DEFAULT 0
);

-- Folders (hierarchical)
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL,
  folder_type TEXT DEFAULT 'custom',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Items (web pages and notes)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  folder_id TEXT,
  item_type TEXT NOT NULL,  -- 'web' or 'note'
  title TEXT NOT NULL,
  url TEXT,                  -- for web items
  favicon TEXT,              -- base64 or URL
  content TEXT,              -- for note items
  metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#808080',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Item-Tag relationship
CREATE TABLE item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Session state (singleton)
CREATE TABLE session_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_workspace_id TEXT,
  window_state TEXT DEFAULT '{}',
  open_tabs TEXT DEFAULT '[]',
  updated_at INTEGER NOT NULL
);
```

### WorkspaceDatabase Class

```typescript
class WorkspaceDatabase {
  constructor(dbPath: string);

  // Workspace operations
  getAllWorkspaces(): Workspace[];
  getWorkspaceById(id: string): Workspace | null;
  createWorkspace(workspace: Workspace): void;
  updateWorkspace(id: string, updates: Partial<Workspace>): void;
  deleteWorkspace(id: string, hard?: boolean): void;

  // Folder operations
  getRootFolders(workspaceId: string): Folder[];
  getChildFolders(parentId: string): Folder[];
  createFolder(folder: Folder): void;
  updateFolder(id: string, updates: Partial<Folder>): void;
  deleteFolder(id: string): void;

  // Item operations
  getItemsInFolder(folderId: string): Item[];
  getItemById(id: string): Item | null;
  createItem(item: Item): void;
  updateItem(id: string, updates: Partial<Item>): void;
  deleteItem(id: string): void;
  searchItems(workspaceId: string, query: string): Item[];

  // Tag operations
  getAllTags(workspaceId: string): Tag[];
  createTag(workspaceId: string, name: string, color: string): Tag;
  getItemTags(itemId: string): Tag[];
  addItemTags(itemId: string, tagIds: string[]): void;
  removeItemTags(itemId: string, tagIds: string[]): void;

  // Session operations
  getSessionState(): SessionState;
  updateSessionState(updates: Partial<SessionState>): void;

  // Utility
  transaction<T>(fn: () => T): T;
  close(): void;
}
```

---

## 6. IPC Communication

### Channel Naming Convention

All IPC channels use prefixed names:

| Prefix | Purpose |
|--------|---------|
| `workspace:` | Workspace operations |
| `browser:` | BrowserView operations |
| `ai:` | AI panel operations |
| `session:` | Session management |
| `search:` | Search operations |
| `tag:` | Tag operations |
| `shortcut:` | Keyboard shortcuts |
| `crash:` | Crash reporting |

### Preload API

```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // Workspace
  workspace: {
    getAll: () => ipcRenderer.invoke('workspace:getAll'),
    getById: (id: string) => ipcRenderer.invoke('workspace:getById', id),
    create: (name: string) => ipcRenderer.invoke('workspace:create', name),
    delete: (id: string) => ipcRenderer.invoke('workspace:delete', id),
    switch: (id: string) => ipcRenderer.invoke('workspace:switch', id),
  },

  // Folders
  folder: {
    getRoots: (workspaceId: string) => ipcRenderer.invoke('folder:getRoots', workspaceId),
    getChildren: (folderId: string) => ipcRenderer.invoke('folder:getChildren', folderId),
    create: (data: CreateFolderData) => ipcRenderer.invoke('folder:create', data),
    rename: (id: string, name: string) => ipcRenderer.invoke('folder:rename', id, name),
    delete: (id: string) => ipcRenderer.invoke('folder:delete', id),
  },

  // Items
  item: {
    getInFolder: (folderId: string) => ipcRenderer.invoke('item:getInFolder', folderId),
    create: (data: CreateItemData) => ipcRenderer.invoke('item:create', data),
    update: (id: string, updates: object) => ipcRenderer.invoke('item:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('item:delete', id),
    move: (id: string, folderId: string) => ipcRenderer.invoke('item:move', id, folderId),
  },

  // Browser
  browser: {
    navigate: (tabId: string, url: string) => ipcRenderer.invoke('browser:navigate', tabId, url),
    goBack: (tabId: string) => ipcRenderer.invoke('browser:goBack', tabId),
    goForward: (tabId: string) => ipcRenderer.invoke('browser:goForward', tabId),
    reload: (tabId: string) => ipcRenderer.invoke('browser:reload', tabId),
  },

  // Events (renderer listens)
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  off: (channel: string, callback: Function) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
```

### Event Flow

```
User Action (Renderer)
        │
        ▼
  ipcRenderer.invoke('channel', data)
        │
        ▼
  IPC Handler (Main Process)
        │
        ▼
  Business Logic (WorkspaceEngine, etc.)
        │
        ▼
  Database Operation
        │
        ▼
  Return Result to Renderer
        │
        ▼
  webContents.send('event', data)  ← Broadcast to all renderers
        │
        ▼
  UI Update (React state)
```

---

## 7. Security Model

### Electron Security Configuration

```typescript
// Main window
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // No direct Node.js access
    contextIsolation: true,      // Separate contexts
    sandbox: false,              // Required for native modules
    preload: preloadPath,        // Safe API bridge
    webSecurity: true,           // Same-origin policy
  }
});

// BrowserViews (web content)
new BrowserView({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,               // Full sandbox for untrusted content
    preload: undefined,          // No preload for web content
  }
});
```

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https: wss:;
frame-src 'none';
object-src 'none';
base-uri 'self';
```

### IPC Validation

All IPC handlers validate input:

```typescript
ipcMain.handle('workspace:create', async (_, name: unknown) => {
  // Type validation
  if (typeof name !== 'string') {
    throw new Error('Invalid name type');
  }

  // Length validation
  if (name.length < 1 || name.length > 100) {
    throw new Error('Name must be 1-100 characters');
  }

  // Sanitization
  const sanitizedName = name.trim();

  // Business logic
  return workspaceEngine.createWorkspace(sanitizedName);
});
```

---

## 8. Performance Considerations

### BrowserView Pooling

```typescript
class BrowserViewManager {
  private viewPool: BrowserView[] = [];
  private maxPoolSize = 3;
  private maxActiveViews = 10;

  getOrCreateFromPool(): BrowserView {
    if (this.viewPool.length > 0) {
      return this.viewPool.pop()!;
    }
    return this.createNewView();
  }

  returnToPool(view: BrowserView): void {
    if (this.viewPool.length < this.maxPoolSize) {
      view.webContents.loadURL('about:blank');
      this.viewPool.push(view);
    } else {
      view.webContents.destroy();
    }
  }
}
```

### Lazy Loading

```typescript
// React lazy loading
const AIPanel = React.lazy(() => import('./components/AIPanel'));
const ShortcutsHelp = React.lazy(() => import('./components/ShortcutsHelp'));

// Usage with Suspense
<Suspense fallback={<Loading />}>
  <AIPanel />
</Suspense>
```

### Database Indexing

```sql
-- Performance indexes
CREATE INDEX idx_folders_workspace ON folders(workspace_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_items_workspace ON items(workspace_id);
CREATE INDEX idx_items_folder ON items(folder_id);
CREATE INDEX idx_items_type ON items(item_type);
CREATE INDEX idx_tags_workspace ON tags(workspace_id);
CREATE INDEX idx_item_tags_item ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);
```

### Memory Management

```typescript
class MemoryManager {
  private memoryThreshold = 500 * 1024 * 1024; // 500MB

  startMonitoring(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      if (usage.heapUsed > this.memoryThreshold) {
        this.performCleanup();
      }
    }, 30000);
  }

  performCleanup(): void {
    // Clear view pool
    browserViewManager.clearPool();
    // Force garbage collection (if exposed)
    if (global.gc) global.gc();
  }
}
```

---

## Appendix: File Structure

```
src/
├── main/
│   ├── index.ts                 # Entry point
│   ├── browser-view-manager.ts  # BrowserView lifecycle
│   ├── window-manager.ts        # Window management
│   ├── tab-manager.ts           # Tab operations
│   ├── session-manager.ts       # Session persistence
│   ├── ipc-handlers.ts          # IPC handlers
│   ├── menu.ts                  # Application menu
│   ├── crash-manager.ts         # Crash detection
│   └── crash-reporter.ts        # Crash reporting
│
├── preload/
│   └── index.ts                 # Context bridge API
│
├── renderer/
│   ├── index.tsx                # React entry
│   ├── App.tsx                  # Root component
│   ├── components/              # UI components
│   ├── hooks/                   # Custom hooks
│   └── styles/                  # CSS styles
│
├── core/
│   ├── workspace/
│   │   ├── workspace-engine.ts  # Business logic
│   │   ├── folder-manager.ts    # Folder operations
│   │   ├── item-manager.ts      # Item operations
│   │   ├── autosave-manager.ts  # Autosave logic
│   │   └── duplication-detector.ts
│   ├── storage/
│   │   ├── database.ts          # SQLite wrapper
│   │   └── schema.sql           # Database schema
│   └── logging/
│       ├── logger.ts            # Logging
│       └── error-handler.ts     # Error handling
│
└── types/
    ├── entities.ts              # Data models
    ├── contracts.ts             # Interfaces
    └── electron.d.ts            # Type declarations
```

---

*Last updated: 2025-11-25*
