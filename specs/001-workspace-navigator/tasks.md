# Implementation Tasks: Workspace Navigator

**Branch**: `001-workspace-navigator` | **Date**: 2025-11-22
**Based on**: [spec.md](./spec.md), [plan.md](./plan.md), constitution.md, clarifications

## Task Organization

This document contains all actionable tasks to implement Workspace Navigator from MVP to V1. Tasks are organized by module, with clear MVP/V1 designation and dependency tracking.

**Legend**:
- 🎯 **MVP**: Minimum viable product (4-week sprint)
- 🚀 **V1**: Full V1 release (additional 8 weeks after MVP)
- 🔮 **V2**: Future enhancements (post-V1)
- ⚠️ **Dependency**: Must complete prerequisite tasks first

---

## 0. Project Foundation (Infrastructure)

### 0.1. Repository Setup 🎯
**Dependencies**: None

- 0.1.1. Initialize Git repository with .gitignore
- 0.1.2. Create project directory structure (src/, tests/, build/, docs/)
- 0.1.3. Set up package.json with Electron + TypeScript dependencies
- 0.1.4. Configure TypeScript compiler (tsconfig.json for main + renderer)
- 0.1.5. Set up ESLint + Prettier for code formatting
- 0.1.6. Create README.md with project overview
- 0.1.7. Set up LICENSE file (choose appropriate license)

### 0.2. Build System Configuration 🎯
**Dependencies**: 0.1 complete

- 0.2.1. Configure Webpack for renderer process bundling
- 0.2.2. Configure electron-builder for packaging
  - 0.2.2.1. Windows build configuration (NSIS installer)
  - 0.2.2.2. macOS build configuration (DMG + zip)
  - 0.2.2.3. Linux build configuration (AppImage + deb)
- 0.2.3. Create build scripts (npm run build, build:dev, build:prod)
- 0.2.4. Configure source maps for debugging
- 0.2.5. Set up hot reload for development

### 0.3. CEF Native Build Setup 🎯
**Dependencies**: 0.1 complete

- 0.3.1. Download CEF binary distribution (120+) for each platform
- 0.3.2. Create CMakeLists.txt for C++ CEF addon
  - 0.3.2.1. Configure CEF library linking
  - 0.3.2.2. Configure N-API bindings
  - 0.3.2.3. Set up cross-platform compilation flags
- 0.3.3. Create build scripts for CEF native addon
  - 0.3.3.1. build-cef-windows.bat
  - 0.3.3.2. build-cef-mac.sh
  - 0.3.3.3. build-cef-linux.sh
- 0.3.4. Test CEF compilation on all target platforms

### 0.4. Testing Infrastructure 🎯
**Dependencies**: 0.1, 0.2 complete

- 0.4.1. Configure Jest for unit testing
  - 0.4.1.1. Set up TypeScript support in Jest
  - 0.4.1.2. Configure coverage thresholds (70%+)
  - 0.4.1.3. Create test utilities and mocks
- 0.4.2. Configure Playwright for E2E testing
  - 0.4.2.1. Set up Electron Playwright integration
  - 0.4.2.2. Create E2E test helpers
  - 0.4.2.3. Configure screenshot/video capture
- 0.4.3. Set up test database fixtures
- 0.4.4. Create npm test scripts (test, test:unit, test:e2e, test:coverage)

### 0.5. CI/CD Pipeline 🎯
**Dependencies**: 0.1, 0.2, 0.4 complete

- 0.5.1. Create GitHub Actions workflow (.github/workflows/build.yml)
  - 0.5.1.1. Configure matrix builds (Windows, macOS, Linux)
  - 0.5.1.2. Add linting step
  - 0.5.1.3. Add unit test step
  - 0.5.1.4. Add E2E test step
  - 0.5.1.5. Add build step
  - 0.5.1.6. Add package step
  - 0.5.1.7. Configure artifact upload
- 0.5.2. Set up code coverage reporting (Codecov or similar)
- 0.5.3. Configure automated dependency updates (Dependabot)

---

## 1. CEF Engine Module

### 1.1. CEF Core Integration 🎯
**Dependencies**: 0.3 complete

- 1.1.1. Implement CEFManager class (C++)
  - 1.1.1.1. Initialize CEF runtime with sandbox enabled
  - 1.1.1.2. Configure multi-threaded message loop
  - 1.1.1.3. Set cache directory path
  - 1.1.1.4. Implement CEF shutdown logic
  - 1.1.1.5. Handle CEF subprocess lifecycle
- 1.1.2. Implement CEFApp class extending CefApp
  - 1.1.2.1. Override OnBeforeCommandLineProcessing
  - 1.1.2.2. Enforce sandbox (remove --no-sandbox if present)
  - 1.1.2.3. Configure CEF command-line switches
  - 1.1.2.4. Disable unnecessary CEF features
- 1.1.3. Create N-API bridge (NodeCEFBridge.cpp)
  - 1.1.3.1. Expose CEF initialization to Node.js
  - 1.1.3.2. Expose browser creation functions
  - 1.1.3.3. Expose navigation functions
  - 1.1.3.4. Implement event callbacks (onLoad, onError, etc.)
- 1.1.4. Write unit tests for CEF initialization

### 1.2. Browser Client Implementation 🎯
**Dependencies**: 1.1 complete

- 1.2.1. Implement BrowserClient class extending CefClient
  - 1.2.1.1. Override GetLoadHandler
  - 1.2.1.2. Override GetRequestHandler
  - 1.2.1.3. Override GetLifeSpanHandler
  - 1.2.1.4. Override GetDisplayHandler (for title/favicon)
- 1.2.2. Implement LoadHandler
  - 1.2.2.1. OnLoadStart callback
  - 1.2.2.2. OnLoadEnd callback (trigger item creation)
  - 1.2.2.3. OnLoadError callback
  - 1.2.2.4. OnLoadingStateChange callback
- 1.2.3. Implement RequestHandler
  - 1.2.3.1. OnBeforeBrowse (URL validation)
  - 1.2.3.2. OnBeforeResourceLoad
  - 1.2.3.3. Apply Content Security Policy headers
- 1.2.4. Implement DisplayHandler
  - 1.2.4.1. OnTitleChange callback
  - 1.2.4.2. OnFaviconURLChange callback
  - 1.2.4.3. OnLoadingProgressChange callback

### 1.3. WebView Pool 🚀
**Dependencies**: 1.2 complete

- 1.3.1. Implement WebViewPool class
  - 1.3.1.1. Maintain available_ vector of CefBrowser instances
  - 1.3.1.2. Maintain in_use_ map of active browsers
  - 1.3.1.3. Define MAX_POOL_SIZE = 20
- 1.3.2. Implement Acquire() method
  - 1.3.2.1. Check available pool
  - 1.3.2.2. Create new browser if pool empty and under limit
  - 1.3.2.3. Return browser from available pool
  - 1.3.2.4. Track browser as in_use
- 1.3.3. Implement Release() method
  - 1.3.3.1. Remove browser from in_use
  - 1.3.3.2. Reset browser state (clear cookies/cache for this instance)
  - 1.3.3.3. Return browser to available pool
- 1.3.4. Implement CreateNewBrowser() helper
  - 1.3.4.1. Create CefBrowserHost settings
  - 1.3.4.2. Create browser in offscreen mode
  - 1.3.4.3. Attach BrowserClient
  - 1.3.4.4. Return CefBrowser reference
- 1.3.5. Write unit tests for pool management
- 1.3.6. Write integration tests for pool reuse

### 1.4. Process Management 🚀
**Dependencies**: 1.2 complete

- 1.4.1. Implement process-per-site-instance model
  - 1.4.1.1. Configure CEF to share processes for same origin
  - 1.4.1.2. Monitor process count
  - 1.4.1.3. Log process creation/destruction
- 1.4.2. Implement tab suspension for inactive tabs
  - 1.4.2.1. Detect tab inactivity (30s threshold)
  - 1.4.2.2. Suspend tab rendering
  - 1.4.2.3. Resume rendering on tab focus
  - 1.4.2.4. Preserve tab state during suspension
- 1.4.3. Handle CEF subprocess crashes
  - 1.4.3.1. Detect subprocess termination
  - 1.4.3.2. Notify user of crash
  - 1.4.3.3. Recreate subprocess if needed
  - 1.4.3.4. Log crash details

### 1.5. Security Configuration 🎯
**Dependencies**: 1.1 complete

- 1.5.1. Enforce CEF sandbox
  - 1.5.1.1. Verify sandbox is enabled on startup
  - 1.5.1.2. Log warning if sandbox disabled
  - 1.5.1.3. Refuse to start if sandbox cannot be enabled
- 1.5.2. Configure Content Security Policy
  - 1.5.2.1. Define CSP policy string
  - 1.5.2.2. Apply CSP to all web requests
  - 1.5.2.3. Log CSP violations
- 1.5.3. Disable unnecessary protocols
  - 1.5.3.1. Block file:// access
  - 1.5.3.2. Allow only https:// and http:// (upgraded)
  - 1.5.3.3. Allow custom app:// protocol for MarkText
- 1.5.4. Configure HTTPS upgrade
  - 1.5.4.1. Automatically upgrade http to https
  - 1.5.4.2. Log upgrade events
- 1.5.5. Write security audit tests

### 1.6. Navigation & History 🎯
**Dependencies**: 1.2 complete

- 1.6.1. Implement navigation functions
  - 1.6.1.1. LoadURL(url) function
  - 1.6.1.2. GoBack() function
  - 1.6.1.3. GoForward() function
  - 1.6.1.4. Reload() function
  - 1.6.1.5. StopLoad() function
- 1.6.2. Track navigation history per browser
  - 1.6.2.1. Maintain history stack
  - 1.6.2.2. Expose CanGoBack() query
  - 1.6.2.3. Expose CanGoForward() query
- 1.6.3. Handle URL changes
  - 1.6.3.1. Emit onNavigate event to Node.js
  - 1.6.3.2. Include URL, title, favicon in event
  - 1.6.3.3. Trigger duplication check (via Workspace Engine)
- 1.6.4. Write unit tests for navigation

---

## 2. Storage Layer Module

### 2.1. Database Setup 🎯
**Dependencies**: 0.1 complete

- 2.1.1. Install SQLite + SQLCipher dependencies
  - 2.1.1.1. Add @journeyapps/sqlcipher to package.json
  - 2.1.1.2. Build SQLCipher for Electron compatibility
  - 2.1.1.3. Test SQLCipher encryption
- 2.1.2. Create Database class (Database.ts)
  - 2.1.2.1. Constructor accepting dbPath and encryption key
  - 2.1.2.2. Initialize SQLite connection
  - 2.1.2.3. Apply encryption key via PRAGMA
  - 2.1.2.4. Set WAL mode for concurrency
  - 2.1.2.5. Enable foreign keys
- 2.1.3. Define database schema (schema.sql)
  - 2.1.3.1. Create workspaces table
  - 2.1.3.2. Create folders table with FK to workspaces
  - 2.1.3.3. Create items table with FK to workspaces + folders
  - 2.1.3.4. Create session_state table
  - 2.1.3.5. Create indexes for performance
- 2.1.4. Implement schema migration system
  - 2.1.4.1. Track schema version (PRAGMA user_version)
  - 2.1.4.2. Create MigrationRunner class
  - 2.1.4.3. Write migration scripts (v1 → v2, etc.)
  - 2.1.4.4. Apply migrations on startup
- 2.1.5. Write database initialization tests

### 2.2. Workspace Persistence 🎯
**Dependencies**: 2.1 complete

- 2.2.1. Implement workspace CRUD operations
  - 2.2.1.1. createWorkspace(name) → INSERT workspace
  - 2.2.1.2. getWorkspace(id) → SELECT workspace
  - 2.2.1.3. listWorkspaces() → SELECT all workspaces
  - 2.2.1.4. updateWorkspace(id, data) → UPDATE workspace
  - 2.2.1.5. deleteWorkspace(id) → DELETE CASCADE
- 2.2.2. Implement folder CRUD operations
  - 2.2.2.1. createFolder(workspaceId, name, parentId?)
  - 2.2.2.2. getFolder(id)
  - 2.2.2.3. listFolders(workspaceId)
  - 2.2.2.4. getFolderHierarchy(workspaceId) → nested tree
  - 2.2.2.5. updateFolder(id, data)
  - 2.2.2.6. deleteFolder(id, deleteItems boolean)
- 2.2.3. Implement item CRUD operations
  - 2.2.3.1. createItem(workspaceId, folderId, type, data)
  - 2.2.3.2. getItem(id)
  - 2.2.3.3. listItems(workspaceId, folderId?)
  - 2.2.3.4. updateItem(id, data)
  - 2.2.3.5. deleteItem(id)
  - 2.2.3.6. moveItem(itemId, targetFolderId)
- 2.2.4. Write unit tests for all CRUD operations
- 2.2.5. Write integration tests for cascading deletes

### 2.3. Session State Management 🚀
**Dependencies**: 2.1 complete, clarification C applied

- 2.3.1. Create SessionStore class (SessionStore.ts)
  - 2.3.1.1. saveState(state) → atomic JSON write
  - 2.3.1.2. loadState() → read JSON file
  - 2.3.1.3. Implement temp + rename pattern for atomicity
  - 2.3.1.4. Create backup on each save (.backup)
- 2.3.2. Define session state schema (TypeScript interface)
  - 2.3.2.1. activeWorkspaceId
  - 2.3.2.2. tabs: array of {itemId, url, type, scrollPosition, zoomLevel}
  - 2.3.2.3. activeTabIndex
  - 2.3.2.4. windowGeometry: {x, y, width, height}
  - 2.3.2.5. lastSaved timestamp
- 2.3.3. Implement continuous session saving
  - 2.3.3.1. Save on tab open/close
  - 2.3.3.2. Save on workspace switch
  - 2.3.3.3. Save on window resize/move
  - 2.3.3.4. Debounce saves (max 1 save per second)
- 2.3.4. Write unit tests for session persistence
- 2.3.5. Write integration tests for state restoration

### 2.4. Integrity Validation 🚀
**Dependencies**: 2.1 complete, clarification C applied

- 2.4.1. Create IntegrityValidator class
  - 2.4.1.1. validate(workspaceId) → ValidationResult
  - 2.4.1.2. Check workspace exists
  - 2.4.1.3. Check foreign key constraints
  - 2.4.1.4. Check schema version
  - 2.4.1.5. Detect orphaned items (folder FK invalid)
- 2.4.2. Implement auto-repair logic
  - 2.4.2.1. Move orphaned items to workspace root
  - 2.4.2.2. Fix invalid folder parent references
  - 2.4.2.3. Log all repairs
  - 2.4.2.4. Notify user of repairs performed
- 2.4.3. Implement backup restoration
  - 2.4.3.1. Detect corrupted database on startup
  - 2.4.3.2. Attempt restoration from .backup file
  - 2.4.3.3. Log restoration result
  - 2.4.3.4. Notify user of data recovery
- 2.4.4. Write unit tests for validation logic
- 2.4.5. Write integration tests for corruption recovery

### 2.5. Encryption Key Management 🚀
**Dependencies**: 2.1 complete

- 2.5.1. Create KeyManager class
  - 2.5.1.1. Derive encryption key from machine ID
  - 2.5.1.2. Use PBKDF2 with appropriate iterations
  - 2.5.1.3. Store salt in userData directory
  - 2.5.1.4. Expose getKey() method
- 2.5.2. Implement master password support (optional)
  - 2.5.2.1. Prompt user for password on first launch
  - 2.5.2.2. Derive key from password + machine ID
  - 2.5.2.3. Store password hash in OS keychain
  - 2.5.2.4. Verify password on subsequent launches
- 2.5.3. Handle key rotation (V2 feature - document approach)
- 2.5.4. Write security tests for key derivation

### 2.6. Search & Indexing 🚀
**Dependencies**: 2.2 complete

- 2.6.1. Implement searchItems(workspaceId, query)
  - 2.6.1.1. Search by title (LIKE %query%)
  - 2.6.1.2. Search by tags (JSON array contains)
  - 2.6.1.3. Search by URL (web items only)
  - 2.6.1.4. Return ranked results
- 2.6.2. Create full-text search index (FTS5)
  - 2.6.2.1. Create FTS virtual table for items
  - 2.6.2.2. Index title, tags, URL
  - 2.6.2.3. For notes: index Markdown content
  - 2.6.2.4. Update FTS on item creation/update
- 2.6.3. Optimize search performance
  - 2.6.3.1. Add covering indexes for common queries
  - 2.6.3.2. Limit results to 100
  - 2.6.3.3. Implement search result caching
- 2.6.4. Write unit tests for search
- 2.6.5. Write performance tests (search 500+ items)

---

## 3. Workspace Engine Module

### 3.1. WorkspaceManager Implementation 🎯
**Dependencies**: 2.2 complete

- 3.1.1. Create WorkspaceManager class (WorkspaceManager.ts)
  - 3.1.1.1. Maintain activeWorkspace state
  - 3.1.1.2. Maintain in-memory workspace tree
  - 3.1.1.3. Expose createWorkspace(name) method
  - 3.1.1.4. Expose openWorkspace(id) method
  - 3.1.1.5. Expose deleteWorkspace(id) method
  - 3.1.1.6. Expose listWorkspaces() method
- 3.1.2. Implement workspace lifecycle
  - 3.1.2.1. Create: INSERT workspace + root folder
  - 3.1.2.2. Open: Load tree from DB, hydrate memory
  - 3.1.2.3. Delete: Confirm dialog, CASCADE delete
  - 3.1.2.4. Switch: Save current state, load new workspace
- 3.1.3. Emit workspace events
  - 3.1.3.1. onWorkspaceCreated
  - 3.1.3.2. onWorkspaceOpened
  - 3.1.3.3. onWorkspaceDeleted
  - 3.1.3.4. onWorkspaceSwitched
- 3.1.4. Write unit tests for WorkspaceManager
- 3.1.5. Write integration tests for multi-workspace switching

### 3.2. ItemManager Implementation 🎯
**Dependencies**: 2.2 complete, clarifications B applied

- 3.2.1. Create ItemManager class (ItemManager.ts)
  - 3.2.1.1. Expose createWebItem(workspaceId, url, folderId?) method
  - 3.2.1.2. Expose createNoteItem(workspaceId, title, folderId?) method
  - 3.2.1.3. Expose moveItem(itemId, targetFolderId) method
  - 3.2.1.4. Expose renameItem(itemId, newTitle) method
  - 3.2.1.5. Expose deleteItem(itemId) method
  - 3.2.1.6. Expose addTags(itemId, tags[]) method
- 3.2.2. Implement auto date folder logic (clarification B)
  - 3.2.2.1. Check if folderId is null (workspace root)
  - 3.2.2.2. Get today's date in DD.MM.YYYY format
  - 3.2.2.3. Check if date folder exists
  - 3.2.2.4. Create date folder if not exists
  - 3.2.2.5. Assign item to date folder
- 3.2.3. Implement web item creation
  - 3.2.3.1. Extract URL, title, favicon from CEF
  - 3.2.3.2. Run duplication check (see 3.3)
  - 3.2.3.3. If duplicate: return existing item
  - 3.2.3.4. If not: INSERT new item, emit event
- 3.2.4. Implement note item creation
  - 3.2.4.1. Generate unique noteId (UUID)
  - 3.2.4.2. Create empty file: notes/<noteId>.md
  - 3.2.4.3. INSERT item with type='note'
  - 3.2.4.4. Emit itemCreated event
- 3.2.5. Write unit tests for ItemManager
- 3.2.6. Write integration tests for date folder logic

### 3.3. DuplicationDetector Implementation 🚀
**Dependencies**: 2.2 complete, clarification B applied

- 3.3.1. Create DuplicationDetector class (DuplicationDetector.ts)
  - 3.3.1.1. checkDuplicate(workspaceId, url) → Item | null
  - 3.3.1.2. Query items with same URL in workspace
  - 3.3.1.3. Filter by created_at = today
  - 3.3.1.4. Filter by folder_id = current context folder
  - 3.3.1.5. Return match or null
- 3.3.2. Implement current context detection
  - 3.3.2.1. Get active folder from workspace tree selection
  - 3.3.2.2. Default to null (root) if no folder selected
  - 3.3.2.3. Use folder from last opened item if available
- 3.3.3. Handle duplicate found scenario
  - 3.3.3.1. Focus existing item's tab
  - 3.3.3.2. Close new navigation tab
  - 3.3.3.3. Update item.lastOpenedAt
  - 3.3.3.4. Log duplication event
- 3.3.4. Write unit tests for duplication logic
- 3.3.5. Write integration tests for same-day + same-folder detection

### 3.4. FolderManager Implementation 🎯
**Dependencies**: 2.2 complete

- 3.4.1. Create FolderManager class (FolderManager.ts)
  - 3.4.1.1. Expose createFolder(workspaceId, name, parentId?) method
  - 3.4.1.2. Expose renameFolder(folderId, newName) method
  - 3.4.1.3. Expose deleteFolder(folderId, deleteItems) method
  - 3.4.1.4. Expose moveFolder(folderId, newParentId) method
  - 3.4.1.5. Expose getFolderHierarchy(workspaceId) method
- 3.4.2. Implement folder validation
  - 3.4.2.1. Prevent circular references (folder as own parent)
  - 3.4.2.2. Check folder name uniqueness in parent
  - 3.4.2.3. Validate parent exists in same workspace
- 3.4.3. Implement folder deletion
  - 3.4.3.1. If deleteItems=true: CASCADE delete items
  - 3.4.3.2. If deleteItems=false: move items to parent or root
  - 3.4.3.3. Show confirmation dialog with item count
  - 3.4.3.4. Emit folderDeleted event
- 3.4.4. Build in-memory tree structure
  - 3.4.4.1. Load all folders for workspace
  - 3.4.4.2. Build parent-child relationships
  - 3.4.4.3. Sort folders alphabetically
  - 3.4.4.4. Cache tree in memory
- 3.4.5. Write unit tests for FolderManager
- 3.4.6. Write integration tests for circular reference prevention

### 3.5. Workspace Event System 🎯
**Dependencies**: 3.1, 3.2, 3.4 complete

- 3.5.1. Define event types (TypeScript enums)
  - 3.5.1.1. WorkspaceCreated, WorkspaceOpened, WorkspaceDeleted
  - 3.5.1.2. ItemCreated, ItemMoved, ItemRenamed, ItemDeleted
  - 3.5.1.3. FolderCreated, FolderRenamed, FolderDeleted
  - 3.5.1.4. TagsAdded, TagsRemoved
- 3.5.2. Implement EventEmitter for workspace events
  - 3.5.2.1. Extend Node.js EventEmitter
  - 3.5.2.2. Emit events from WorkspaceManager
  - 3.5.2.3. Emit events from ItemManager
  - 3.5.2.4. Emit events from FolderManager
- 3.5.3. Create IPC handlers to broadcast events to renderer
  - 3.5.3.1. Listen to workspace events in main process
  - 3.5.3.2. Send IPC messages to renderer (webContents.send)
  - 3.5.3.3. Include event data (ids, names, etc.)
- 3.5.4. Write unit tests for event emission
- 3.5.5. Write integration tests for event propagation

---

## 4. Tab Manager Module

### 4.1. TabManager Core 🎯
**Dependencies**: 1.6, 3.2 complete

- 4.1.1. Create TabManager class (TabManager.ts)
  - 4.1.1.1. Maintain tabs[] array of Tab objects
  - 4.1.1.2. Maintain activeTabIndex
  - 4.1.1.3. Expose openTab(itemId) method
  - 4.1.1.4. Expose closeTab(tabId) method
  - 4.1.1.5. Expose switchTab(tabIndex) method
  - 4.1.1.6. Expose reorderTab(fromIndex, toIndex) method
- 4.1.2. Define Tab interface
  - 4.1.2.1. id (unique UUID)
  - 4.1.2.2. itemId (FK to workspace item)
  - 4.1.2.3. type ('web' | 'note')
  - 4.1.2.4. url (for web tabs)
  - 4.1.2.5. title
  - 4.1.2.6. favicon (for web tabs)
  - 4.1.2.7. webviewId (CEF browser ID)
  - 4.1.2.8. isLoading boolean
  - 4.1.2.9. scrollPosition, zoomLevel
- 4.1.3. Implement openTab logic
  - 4.1.3.1. Get item from ItemManager
  - 4.1.3.2. Acquire webview from CEF pool (for web) or create MarkText view (for note)
  - 4.1.3.3. Create Tab object
  - 4.1.3.4. Add to tabs array
  - 4.1.3.5. Set as active tab
  - 4.1.3.6. Emit tabOpened event
- 4.1.4. Implement closeTab logic
  - 4.1.4.1. Remove tab from tabs array
  - 4.1.4.2. Release webview to pool
  - 4.1.4.3. Update activeTabIndex if needed
  - 4.1.4.4. Emit tabClosed event
  - 4.1.4.5. Item remains in workspace (do NOT delete)
- 4.1.5. Write unit tests for TabManager
- 4.1.6. Write integration tests for tab lifecycle

### 4.2. Tab Limit Warning 🚀
**Dependencies**: 4.1 complete, clarification C applied

- 4.2.1. Implement soft limit check (20 tabs)
  - 4.2.1.1. Check tabs.length before opening new tab
  - 4.2.1.2. If >= 20: emit warning event
  - 4.2.1.3. Allow tab to open (no hard block)
- 4.2.2. Create warning UI component (React)
  - 4.2.2.1. Display toast: "20+ tabs open, performance may be impacted"
  - 4.2.2.2. Show for 5 seconds
  - 4.2.2.3. Allow user to dismiss
  - 4.2.2.4. Add yellow border to tab bar
- 4.2.3. Log tab count metrics
  - 4.2.3.1. Track peak tab count per session
  - 4.2.3.2. Log when warning triggered
- 4.2.4. Write unit tests for limit logic
- 4.2.5. Write E2E tests for warning display

### 4.3. Tab-Item Synchronization 🎯
**Dependencies**: 3.2, 4.1 complete

- 4.3.1. Implement openItemInTab(itemId)
  - 4.3.1.1. Get item from WorkspaceManager
  - 4.3.1.2. Call TabManager.openTab(itemId)
  - 4.3.1.3. Update item.lastOpenedAt timestamp
  - 4.3.1.4. Return tab object
- 4.3.2. Implement onNavigationCommitted handler (from CEF)
  - 4.3.2.1. Receive (tabId, url) from CEF LoadHandler
  - 4.3.2.2. Run DuplicationDetector.checkDuplicate(workspaceId, url)
  - 4.3.2.3. If duplicate: focus existing tab, close current
  - 4.3.2.4. If not: ItemManager.createWebItem(workspaceId, url)
  - 4.3.2.5. Update tab.itemId to new item
  - 4.3.2.6. Emit tabUpdated event
- 4.3.3. Handle title/favicon updates
  - 4.3.3.1. Receive updates from CEF DisplayHandler
  - 4.3.3.2. Update tab.title, tab.favicon
  - 4.3.3.3. Update item.title in database
  - 4.3.3.4. Emit tabUpdated event
- 4.3.4. Write unit tests for synchronization logic
- 4.3.5. Write integration tests for full sync flow

### 4.4. Tab State Persistence 🚀
**Dependencies**: 2.3, 4.1 complete, clarification C applied

- 4.4.1. Serialize tab state for session storage
  - 4.4.1.1. Extract tabs array → JSON-serializable format
  - 4.4.1.2. Include itemId, url, scrollPosition, zoomLevel
  - 4.4.1.3. Exclude webviewId (transient)
  - 4.4.1.4. Store activeTabIndex
- 4.4.2. Implement tab restoration on startup
  - 4.4.2.1. Load session state from SessionStore
  - 4.4.2.2. For each tab in session.tabs: TabManager.openTab(tab.itemId)
  - 4.4.2.3. Restore scroll position, zoom level
  - 4.4.2.4. Set activeTabIndex
  - 4.4.2.5. Log restoration success/failure
- 4.4.3. Handle restoration failures
  - 4.4.3.1. If item no longer exists: skip tab
  - 4.4.3.2. If webview creation fails: retry once
  - 4.4.3.3. Log skipped tabs
  - 4.4.3.4. Notify user of partial restoration
- 4.4.4. Write unit tests for serialization
- 4.4.5. Write integration tests for full crash recovery

### 4.5. Navigation Controls 🎯
**Dependencies**: 1.6, 4.1 complete

- 4.5.1. Implement back() for active tab
  - 4.5.1.1. Get activeTab
  - 4.5.1.2. Call CEF GoBack() on tab.webviewId
  - 4.5.1.3. Update tab state
- 4.5.2. Implement forward() for active tab
  - 4.5.2.1. Get activeTab
  - 4.5.2.2. Call CEF GoForward() on tab.webviewId
  - 4.5.2.3. Update tab state
- 4.5.3. Implement reload() for active tab
  - 4.5.3.1. Get activeTab
  - 4.5.3.2. Call CEF Reload() on tab.webviewId
- 4.5.4. Expose canGoBack(), canGoForward() queries
  - 4.5.4.1. Query CEF navigation state
  - 4.5.4.2. Return boolean
  - 4.5.4.3. Update UI button states
- 4.5.5. Write unit tests for navigation
- 4.5.6. Write E2E tests for back/forward/reload

---

## 5. MarkText Integration Module

### 5.1. Protocol Handler Setup 🎯
**Dependencies**: 0.2 complete

- 5.1.1. Create EditorProtocol class (EditorProtocol.ts)
  - 5.1.1.1. Register custom protocol: app://editor
  - 5.1.1.2. Handle requests: app://editor/<noteId>
  - 5.1.1.3. Load note content from file system
  - 5.1.1.4. Return HTML with MarkText renderer embedded
- 5.1.2. Set up protocol privileges
  - 5.1.2.1. Allow service workers
  - 5.1.2.2. Allow fetch API
  - 5.1.2.3. Enable standard security
- 5.1.3. Write unit tests for protocol handling

### 5.2. MarkText Renderer Integration 🎯
**Dependencies**: 5.1 complete

- 5.2.1. Integrate MarkText library
  - 5.2.1.1. Install MarkText as npm dependency
  - 5.2.1.2. Import MarkText component
  - 5.2.1.3. Configure MarkText options (syntax highlight, preview, etc.)
- 5.2.2. Create MarkTextRenderer component (React)
  - 5.2.2.1. Receive noteId as prop
  - 5.2.2.2. Load note content from file system
  - 5.2.2.3. Initialize MarkText with content
  - 5.2.2.4. Render editor + preview split view
  - 5.2.2.5. Handle onChange events
- 5.2.3. Implement split view layout
  - 5.2.3.1. Left pane: Markdown source editor
  - 5.2.3.2. Right pane: Live preview
  - 5.2.3.3. Resizable splitter between panes
  - 5.2.3.4. Sync scroll position between editor and preview
- 5.2.4. Add toolbar
  - 5.2.4.1. Bold, Italic, Strikethrough
  - 5.2.4.2. Heading levels (H1-H6)
  - 5.2.4.3. Lists (ordered, unordered)
  - 5.2.4.4. Links, Images
  - 5.2.4.5. Code blocks, Tables
- 5.2.5. Write unit tests for renderer component
- 5.2.6. Write E2E tests for editor functionality

### 5.3. Autosave Manager 🚀
**Dependencies**: 5.2 complete, clarification B applied

- 5.3.1. Create AutosaveManager class (AutosaveManager.ts)
  - 5.3.1.1. Maintain map of noteId → debounce timer
  - 5.3.1.2. Expose scheduleSave(noteId, content) method
  - 5.3.1.3. Cancel existing timer for noteId
  - 5.3.1.4. Start new timer: 500ms
  - 5.3.1.5. On timer complete: save content
- 5.3.2. Implement save logic
  - 5.3.2.1. Write content to notes/<noteId>.md
  - 5.3.2.2. Use atomic write (temp + rename)
  - 5.3.2.3. UPDATE items SET updated_at=NOW() WHERE id=noteId
  - 5.3.2.4. Emit saved event with timestamp
- 5.3.3. Create save indicator UI
  - 5.3.3.1. Display "Saved at HH:MM:SS" in editor status bar
  - 5.3.3.2. Show "Saving..." while timer active
  - 5.3.3.3. Show "Save failed" on error with retry button
  - 5.3.3.4. Update timestamp on successful save
- 5.3.4. Handle edge cases
  - 5.3.4.1. Tab closed while timer active: flush save immediately
  - 5.3.4.2. App closing: flush all pending saves
  - 5.3.4.3. Filesystem errors: retry once, then notify user
- 5.3.5. Write unit tests for debounce logic
- 5.3.6. Write integration tests for autosave flow

### 5.4. Note File Management 🎯
**Dependencies**: 2.2 complete

- 5.4.1. Create notes/ directory structure
  - 5.4.1.1. Store notes in userData/workspaces/<workspaceId>/notes/
  - 5.4.1.2. One .md file per note item
  - 5.4.1.3. File name = item UUID
- 5.4.2. Implement readNoteContent(noteId)
  - 5.4.2.1. Construct file path
  - 5.4.2.2. Read file content (UTF-8)
  - 5.4.2.3. Return Markdown string
  - 5.4.2.4. Handle file not found (create empty)
- 5.4.3. Implement writeNoteContent(noteId, content)
  - 5.4.3.1. Construct file path
  - 5.4.3.2. Write to temp file
  - 5.4.3.3. Rename temp to final (atomic)
  - 5.4.3.4. Handle write errors
- 5.4.4. Implement note deletion
  - 5.4.4.1. Delete .md file when item deleted
  - 5.4.4.2. Log deletion
- 5.4.5. Write unit tests for file operations
- 5.4.6. Write integration tests for note lifecycle

---

## 6. AI Panel Manager Module

### 6.1. AI Provider Selector 🎯
**Dependencies**: 0.2 complete

- 6.1.1. Create AISelector component (React)
  - 6.1.1.1. Dropdown with AI provider options
  - 6.1.1.2. Options: ChatGPT, Claude, Gemini, Custom URL
  - 6.1.1.3. Store selected provider in localStorage
  - 6.1.1.4. Emit onProviderChange event
- 6.1.2. Define AI provider URLs
  - 6.1.2.1. ChatGPT: https://chat.openai.com
  - 6.1.2.2. Claude: https://claude.ai
  - 6.1.2.3. Gemini: https://gemini.google.com
  - 6.1.2.4. Custom: Allow user input
- 6.1.3. Implement provider switching
  - 6.1.3.1. Unload current AI webview
  - 6.1.3.2. Create new CEF webview for selected provider
  - 6.1.3.3. Load provider URL
  - 6.1.3.4. Restore session cookies
- 6.1.4. Write unit tests for selector
- 6.1.5. Write E2E tests for provider switching

### 6.2. AI WebView Management 🎯
**Dependencies**: 1.2 complete

- 6.2.1. Create AIWebView component (React)
  - 6.2.1.1. Create dedicated CEF webview for AI
  - 6.2.1.2. Separate from tab webviews (not pooled)
  - 6.2.1.3. Load AI provider URL
  - 6.2.1.4. Keep webview visible (never hidden)
- 6.2.2. Configure AI webview settings
  - 6.2.2.1. Enable cookies, localStorage
  - 6.2.2.2. Allow third-party cookies (for OAuth)
  - 6.2.2.3. Use dedicated cache directory per provider
  - 6.2.2.4. Disable navigation (stay on AI domain)
- 6.2.3. Handle webview lifecycle
  - 6.2.3.1. Create webview on app startup
  - 6.2.3.2. Persist across workspace switches
  - 6.2.3.3. Destroy webview on provider change
  - 6.2.3.4. Recreate webview on app restart
- 6.2.4. Write unit tests for webview management
- 6.2.5. Write E2E tests for AI panel visibility

### 6.3. Session Persistence 🚀
**Dependencies**: 6.2 complete

- 6.3.1. Configure CEF cookie storage
  - 6.3.1.1. Set cache_path per AI provider
  - 6.3.1.2. Enable persist_session_cookies flag
  - 6.3.1.3. Store cookies in userData/ai-sessions/<provider>/
- 6.3.2. Verify session persistence
  - 6.3.2.1. Login to AI provider
  - 6.3.2.2. Close app
  - 6.3.2.3. Reopen app
  - 6.3.2.4. Verify still logged in
- 6.3.3. Handle session expiration
  - 6.3.3.1. Detect 401/403 responses
  - 6.3.3.2. Notify user session expired
  - 6.3.3.3. Allow re-login without clearing cookies
- 6.3.4. Write integration tests for session persistence

### 6.4. AI Panel UI 🎯
**Dependencies**: 6.1, 6.2 complete

- 6.4.1. Create AI panel layout
  - 6.4.1.1. Top: AI provider selector dropdown
  - 6.4.1.2. Below: Full-height webview container
  - 6.4.1.3. Minimum width: 300px
  - 6.4.1.4. Resizable splitter on left edge
- 6.4.2. Style AI panel
  - 6.4.2.1. Consistent with app theme (light/dark)
  - 6.4.2.2. Border on left side
  - 6.4.2.3. No close button (always visible)
  - 6.4.2.4. Loading spinner while webview loads
- 6.4.3. Handle webview errors
  - 6.4.3.1. Display error message if AI site unreachable
  - 6.4.3.2. Provide retry button
  - 6.4.3.3. Log error details
- 6.4.4. Write UI component tests
- 6.4.5. Write E2E tests for panel interactions

---

## 7. UI/UX Module

### 7.1. Application Shell 🎯
**Dependencies**: 0.2 complete

- 7.1.1. Create main window (Electron BrowserWindow)
  - 7.1.1.1. Set window size (1920x1080 default)
  - 7.1.1.2. Set minimum size (1280x720)
  - 7.1.1.3. Enable window frame, title bar
  - 7.1.1.4. Load renderer HTML
  - 7.1.1.5. Configure devTools (dev mode only)
- 7.1.2. Create App component (React root)
  - 7.1.2.1. Render three-column layout
  - 7.1.2.2. Left: WorkspacePanel
  - 7.1.2.3. Center: TabArea
  - 7.1.2.4. Right: AIPanel
  - 7.1.2.5. Handle window resize
- 7.1.3. Implement menu bar
  - 7.1.3.1. File menu: New Workspace, Open, Close, Exit
  - 7.1.3.2. Edit menu: Cut, Copy, Paste, Select All
  - 7.1.3.3. View menu: Reload, Toggle DevTools, Theme
  - 7.1.3.4. Workspace menu: Switch, Delete
  - 7.1.3.5. Window menu: Minimize, Maximize, Close
  - 7.1.3.6. Help menu: Documentation, About
- 7.1.4. Write UI component tests
- 7.1.5. Write E2E tests for window lifecycle

### 7.2. Workspace Panel (Left Column) 🎯
**Dependencies**: 3.1, 3.4 complete

- 7.2.1. Create WorkspacePanel component
  - 7.2.1.1. Render workspace selector dropdown (top)
  - 7.2.1.2. Render search bar
  - 7.2.1.3. Render FileTree component
  - 7.2.1.4. Render action buttons (New Folder, New Note)
- 7.2.2. Create FileTree component
  - 7.2.2.1. Render hierarchical tree from workspace data
  - 7.2.2.2. Use recursive component for nested folders
  - 7.2.2.3. Display icons: 📁 folder, 🌐 web, 📝 note
  - 7.2.2.4. Show badge counts on folders
  - 7.2.2.5. Expand/collapse folders on click
- 7.2.3. Create ItemNode component
  - 7.2.3.1. Render item with icon, title
  - 7.2.3.2. Show favicon for web items
  - 7.2.3.3. Truncate long titles with tooltip
  - 7.2.3.4. Highlight on hover
  - 7.2.3.5. Highlight when selected
- 7.2.4. Implement context menu
  - 7.2.4.1. Right-click folder: New Folder, New Note, Rename, Delete
  - 7.2.4.2. Right-click item: Open, Rename, Move to, Delete
  - 7.2.4.3. Execute actions via IPC to main process
- 7.2.5. Write UI component tests
- 7.2.6. Write E2E tests for tree interactions

### 7.3. Drag & Drop 🚀
**Dependencies**: 7.2 complete

- 7.3.1. Implement drag source
  - 7.3.1.1. Make ItemNode draggable
  - 7.3.1.2. Set drag data: itemId, sourceFolder
  - 7.3.1.3. Show drag preview (semi-transparent item)
- 7.3.2. Implement drop target
  - 7.3.2.1. Make folders accept drops
  - 7.3.2.2. Highlight folder on dragEnter
  - 7.3.2.3. Remove highlight on dragLeave
  - 7.3.2.4. Handle drop event
- 7.3.3. Implement move validation
  - 7.3.3.1. Call FolderManager.validateMove(itemId, targetFolderId)
  - 7.3.3.2. If invalid: show error toast, revert UI
  - 7.3.3.3. If valid: ItemManager.moveItem(), update UI
- 7.3.4. Add visual feedback
  - 7.3.4.1. Dashed outline on drop target
  - 7.3.4.2. Drop not allowed cursor for invalid targets
  - 7.3.4.3. Smooth animation for item move
- 7.3.5. Write unit tests for drag-drop logic
- 7.3.6. Write E2E tests for drag-drop flow

### 7.4. Tab Area (Center Column) 🎯
**Dependencies**: 4.1 complete

- 7.4.1. Create TabArea component
  - 7.4.1.1. Render TabBar at top
  - 7.4.1.2. Render active tab content below
  - 7.4.1.3. Handle tab switching
- 7.4.2. Create TabBar component
  - 7.4.2.1. Render horizontal list of tabs
  - 7.4.2.2. Each tab: favicon/icon, title, close button
  - 7.4.2.3. Highlight active tab
  - 7.4.2.4. Show loading spinner for loading tabs
  - 7.4.2.5. Show modified dot for unsaved notes
  - 7.4.2.6. Auto-scroll to active tab
  - 7.4.2.7. New tab button (+) at end
- 7.4.3. Implement tab drag-to-reorder
  - 7.4.3.1. Make tabs draggable horizontally
  - 7.4.3.2. Show drop indicator line
  - 7.4.3.3. Call TabManager.reorderTab() on drop
  - 7.4.3.4. Animate tab movement
- 7.4.4. Create WebTab component
  - 7.4.4.1. Render CEF webview container
  - 7.4.4.2. Render address bar (URL input)
  - 7.4.4.3. Render navigation buttons (back, forward, refresh)
  - 7.4.4.4. Render loading progress bar
  - 7.4.4.5. Handle navigation input (Enter key)
- 7.4.5. Create MarkdownTab component
  - 7.4.5.1. Render MarkTextRenderer
  - 7.4.5.2. Render save indicator ("Saved at HH:MM:SS")
  - 7.4.5.3. Render editor toolbar
- 7.4.6. Write UI component tests
- 7.4.7. Write E2E tests for tab management

### 7.5. Search Functionality 🚀
**Dependencies**: 2.6, 7.2 complete

- 7.5.1. Create SearchBar component
  - 7.5.1.1. Text input with search icon
  - 7.5.1.2. Debounce input (300ms)
  - 7.5.1.3. Call WorkspaceManager.searchItems(query)
  - 7.5.1.4. Display results in dropdown
- 7.5.2. Display search results
  - 7.5.2.1. Show item icon, title, folder path
  - 7.5.2.2. Highlight matching text
  - 7.5.2.3. Limit to 100 results
  - 7.5.2.4. Click result: open item in tab
- 7.5.3. Filter tree view (live search)
  - 7.5.3.1. Show only matching items + their parent folders
  - 7.5.3.2. Expand folders containing matches
  - 7.5.3.3. Clear filter on search clear
- 7.5.4. Write UI component tests
- 7.5.5. Write E2E tests for search

### 7.6. Themes (Light/Dark) 🚀
**Dependencies**: 7.1 complete

- 7.6.1. Define theme variables (CSS custom properties)
  - 7.6.1.1. Background colors (primary, secondary, tertiary)
  - 7.6.1.2. Text colors (primary, secondary, muted)
  - 7.6.1.3. Border colors
  - 7.6.1.4. Accent colors (blue, red, yellow, green)
- 7.6.2. Create light theme
  - 7.6.2.1. White backgrounds
  - 7.6.2.2. Dark gray text
  - 7.6.2.3. Light gray borders
- 7.6.3. Create dark theme
  - 7.6.3.1. Dark gray backgrounds
  - 7.6.3.2. Light gray text
  - 7.6.3.3. Darker borders
- 7.6.4. Implement theme switcher
  - 7.6.4.1. Add toggle in View menu
  - 7.6.4.2. Store preference in localStorage
  - 7.6.4.3. Apply theme on startup
  - 7.6.4.4. Update all components on theme change
- 7.6.5. Apply theme to CEF webviews
  - 7.6.5.1. Inject CSS into webviews
  - 7.6.5.2. Respect prefers-color-scheme
- 7.6.6. Write UI tests for themes
- 7.6.7. Write E2E tests for theme switching

### 7.7. Keyboard Shortcuts 🚀
**Dependencies**: 7.1, 7.4 complete

- 7.7.1. Implement global shortcuts
  - 7.7.1.1. Ctrl/Cmd+T: New tab
  - 7.7.1.2. Ctrl/Cmd+W: Close active tab
  - 7.7.1.3. Ctrl/Cmd+Tab: Next tab
  - 7.7.1.4. Ctrl/Cmd+Shift+Tab: Previous tab
  - 7.7.1.5. Ctrl/Cmd+1-9: Jump to tab N
  - 7.7.1.6. Ctrl/Cmd+F: Focus search
  - 7.7.1.7. Ctrl/Cmd+N: New note
  - 7.7.1.8. Ctrl/Cmd+Shift+N: New folder
- 7.7.2. Implement web tab shortcuts
  - 7.7.2.1. Ctrl/Cmd+L: Focus address bar
  - 7.7.2.2. Ctrl/Cmd+R: Refresh
  - 7.7.2.3. Alt+←: Back
  - 7.7.2.4. Alt+→: Forward
- 7.7.3. Implement note tab shortcuts
  - 7.7.3.1. Ctrl/Cmd+B: Bold
  - 7.7.3.2. Ctrl/Cmd+I: Italic
  - 7.7.3.3. Ctrl/Cmd+K: Insert link
  - 7.7.3.4. Ctrl/Cmd+S: Manual save
- 7.7.4. Create shortcut help dialog
  - 7.7.4.1. List all shortcuts
  - 7.7.4.2. Grouped by context (global, web, note)
  - 7.7.4.3. Accessible via Help menu or Ctrl+?
- 7.7.5. Write unit tests for shortcut handling
- 7.7.6. Write E2E tests for shortcuts

---

## 8. Security Module

### 8.1. CEF Sandbox Enforcement 🎯
**Dependencies**: 1.5 complete

- 8.1.1. Verify sandbox enabled on startup
  - 8.1.1.1. Check CEF command-line for --no-sandbox
  - 8.1.1.2. Log error if sandbox disabled
  - 8.1.1.3. Refuse to start if sandbox cannot be enabled
- 8.1.2. Monitor sandbox status
  - 8.1.2.1. Periodically verify subprocess sandboxing
  - 8.1.2.2. Alert if sandbox breach detected
- 8.1.3. Write security tests for sandbox

### 8.2. Content Security Policy 🎯
**Dependencies**: 1.5 complete

- 8.2.1. Define CSP policy (SecurityPolicy.ts)
  - 8.2.1.1. default-src 'self'
  - 8.2.1.2. script-src 'self' 'unsafe-inline' 'unsafe-eval' (required for some web apps)
  - 8.2.1.3. style-src 'self' 'unsafe-inline'
  - 8.2.1.4. img-src 'self' data: https:
  - 8.2.1.5. connect-src 'self' https:
  - 8.2.1.6. frame-src 'self' https: (for AI iframes)
  - 8.2.1.7. upgrade-insecure-requests
- 8.2.2. Apply CSP to all web requests
  - 8.2.2.1. Inject CSP header in CEF RequestHandler
  - 8.2.2.2. Log CSP violations
- 8.2.3. Write security tests for CSP

### 8.3. Data Encryption 🚀
**Dependencies**: 2.5 complete

- 8.3.1. Generate encryption key on first launch
  - 8.3.1.1. Derive from machine ID + optional password
  - 8.3.1.2. Store key securely (OS keychain)
  - 8.3.1.3. Log key generation
- 8.3.2. Encrypt database at rest
  - 8.3.2.1. Apply SQLCipher encryption
  - 8.3.2.2. Verify encryption on startup
- 8.3.3. Encrypt session state files
  - 8.3.3.1. Use AES-256-GCM
  - 8.3.3.2. Store IV with ciphertext
- 8.3.4. Write security tests for encryption

### 8.4. Audit Logging 🚀
**Dependencies**: 0.1 complete

- 8.4.1. Create audit logger (AuditLog.ts)
  - 8.4.1.1. Log security-relevant events (login, access, changes)
  - 8.4.1.2. Include timestamp, user action, resource
  - 8.4.1.3. Write to dedicated audit.log file
  - 8.4.1.4. Rotate logs daily
- 8.4.2. Log critical events
  - 8.4.2.1. Workspace creation/deletion
  - 8.4.2.2. Item access (web + note)
  - 8.4.2.3. Configuration changes
  - 8.4.2.4. Encryption key usage
  - 8.4.2.5. CSP violations
- 8.4.3. Write unit tests for audit logging

---

## 9. Crash Recovery Module

### 9.1. Crash Detection 🚀
**Dependencies**: 2.4 complete, clarification C applied

- 9.1.1. Detect unclean shutdown
  - 9.1.1.1. Set "running" flag on startup
  - 9.1.1.2. Clear flag on clean exit
  - 9.1.1.3. If flag still set on next launch: crash detected
- 9.1.2. Validate workspace integrity on startup
  - 9.1.2.1. Run IntegrityValidator.validate(lastWorkspace)
  - 9.1.2.2. Check FK constraints
  - 9.1.2.3. Check schema version
  - 9.1.2.4. Log validation results
- 9.1.3. Write unit tests for crash detection

### 9.2. Session Restoration 🚀
**Dependencies**: 2.3, 4.4 complete, clarification C applied

- 9.2.1. Load session state from JSON
  - 9.2.1.1. Read session_state.json
  - 9.2.1.2. Parse JSON (handle parse errors)
  - 9.2.1.3. Validate session data structure
- 9.2.2. Restore workspace
  - 9.2.2.1. WorkspaceManager.open(session.workspaceId)
  - 9.2.2.2. Load workspace tree
  - 9.2.2.3. Hydrate in-memory state
- 9.2.3. Restore tabs
  - 9.2.3.1. For each tab in session.tabs: TabManager.openTab(tab.itemId)
  - 9.2.3.2. Restore scroll position, zoom level
  - 9.2.3.3. Set activeTabIndex
  - 9.2.3.4. Skip tabs for non-existent items
- 9.2.4. Restore window geometry
  - 9.2.4.1. Apply window position (x, y)
  - 9.2.4.2. Apply window size (width, height)
  - 9.2.4.3. Ensure window is on visible screen
- 9.2.5. Write integration tests for full restoration

### 9.3. Backup & Recovery 🚀
**Dependencies**: 2.4 complete

- 9.3.1. Create backup on session save
  - 9.3.1.1. Copy session_state.json to session_state.backup.json
  - 9.3.1.2. Keep last 3 backups (rotate)
- 9.3.2. Restore from backup on corruption
  - 9.3.2.1. If session_state.json corrupt: try .backup
  - 9.3.2.2. If .backup valid: restore from backup
  - 9.3.2.3. Log restoration event
  - 9.3.2.4. Notify user of recovery
- 9.3.3. Database backup
  - 9.3.3.1. Create workspace.db.backup on clean exit
  - 9.3.3.2. Restore from .backup if DB corrupt
- 9.3.4. Write integration tests for backup/restore

### 9.4. User Notification 🚀
**Dependencies**: 9.2 complete

- 9.4.1. Display recovery status on startup
  - 9.4.1.1. If restored successfully: "Session restored"
  - 9.4.1.2. If partial restore: "Some tabs could not be restored"
  - 9.4.1.3. If failed: "Could not restore previous session"
- 9.4.2. Provide manual recovery option
  - 9.4.2.1. Show "Restore previous session" button if auto-restore failed
  - 9.4.2.2. Allow user to retry restoration
  - 9.4.2.3. Provide "Start fresh" option
- 9.4.3. Write UI tests for recovery notifications

---

## 10. Multi-Platform Build Module

### 10.1. Windows Build 🚀
**Dependencies**: 0.2, 0.3 complete

- 10.1.1. Configure electron-builder for Windows
  - 10.1.1.1. NSIS installer target
  - 10.1.1.2. Portable .exe target
  - 10.1.1.3. Set app icon (.ico)
  - 10.1.1.4. Configure installer options (per-user vs. per-machine)
- 10.1.2. Build CEF native addon for Windows
  - 10.1.2.1. Compile C++ with MSVC
  - 10.1.2.2. Link CEF libraries (.lib, .dll)
  - 10.1.2.3. Package DLLs in build output
- 10.1.3. Test on Windows 10, Windows 11
  - 10.1.3.1. Verify installation
  - 10.1.3.2. Verify CEF webview rendering
  - 10.1.3.3. Verify performance targets
- 10.1.4. Sign Windows binaries (code signing certificate)
  - 10.1.4.1. Obtain code signing cert
  - 10.1.4.2. Configure electron-builder signing
  - 10.1.4.3. Verify signature after build
- 10.1.5. Create installer artifacts
  - 10.1.5.1. NSIS installer .exe
  - 10.1.5.2. Portable .exe
  - 10.1.5.3. Upload to dist/

### 10.2. macOS Build 🚀
**Dependencies**: 0.2, 0.3 complete

- 10.2.1. Configure electron-builder for macOS
  - 10.2.1.1. DMG target
  - 10.2.1.2. Zip target
  - 10.2.1.3. Set app icon (.icns)
  - 10.2.1.4. Enable hardened runtime
  - 10.2.1.5. Disable gatekeeper assess
- 10.2.2. Build CEF native addon for macOS
  - 10.2.2.1. Compile C++ with clang
  - 10.2.2.2. Link CEF framework
  - 10.2.2.3. Package framework in app bundle
- 10.2.3. Test on macOS 12 (Monterey), macOS 13 (Ventura)
  - 10.2.3.1. Verify installation
  - 10.2.3.2. Verify CEF webview rendering
  - 10.2.3.3. Verify performance targets
- 10.2.4. Sign and notarize macOS app
  - 10.2.4.1. Obtain Apple Developer ID
  - 10.2.4.2. Sign app bundle
  - 10.2.4.3. Notarize with Apple
  - 10.2.4.4. Staple notarization ticket
- 10.2.5. Create installer artifacts
  - 10.2.5.1. DMG disk image
  - 10.2.5.2. Zip archive
  - 10.2.5.3. Upload to dist/

### 10.3. Linux Build 🚀
**Dependencies**: 0.2, 0.3 complete

- 10.3.1. Configure electron-builder for Linux
  - 10.3.1.1. AppImage target
  - 10.3.1.2. Debian package (.deb) target
  - 10.3.1.3. Set app icon (.png)
  - 10.3.1.4. Set desktop file category (Utility)
- 10.3.2. Build CEF native addon for Linux
  - 10.3.2.1. Compile C++ with GCC
  - 10.3.2.2. Link CEF shared libraries (.so)
  - 10.3.2.3. Package .so files in build output
- 10.3.3. Test on Ubuntu 20.04, Ubuntu 22.04
  - 10.3.3.1. Verify installation
  - 10.3.3.2. Verify CEF webview rendering
  - 10.3.3.3. Verify performance targets
- 10.3.4. Create installer artifacts
  - 10.3.4.1. AppImage
  - 10.3.4.2. .deb package
  - 10.3.4.3. Upload to dist/

### 10.4. Cross-Platform Testing 🚀
**Dependencies**: 10.1, 10.2, 10.3 complete

- 10.4.1. Set up test matrix (Win, Mac, Linux)
  - 10.4.1.1. Create VMs or use cloud CI
  - 10.4.1.2. Install dependencies on each platform
  - 10.4.1.3. Run build on each platform
- 10.4.2. Verify feature parity
  - 10.4.2.1. All features work on all platforms
  - 10.4.2.2. No platform-specific bugs
  - 10.4.2.3. Consistent UI/UX
- 10.4.3. Verify performance parity
  - 10.4.3.1. Launch time <2s on all platforms
  - 10.4.3.2. Tab creation <200ms on all platforms
  - 10.4.3.3. Memory usage comparable
- 10.4.4. Document platform-specific quirks
  - 10.4.4.1. List known issues per platform
  - 10.4.4.2. Document workarounds
  - 10.4.4.3. Create platform-specific tests

---

## 11. QA & Automation Module

### 11.1. Unit Testing 🎯
**Dependencies**: 0.4 complete

- 11.1.1. Write unit tests for WorkspaceManager
  - 11.1.1.1. Test createWorkspace()
  - 11.1.1.2. Test openWorkspace()
  - 11.1.1.3. Test deleteWorkspace()
  - 11.1.1.4. Test event emission
- 11.1.2. Write unit tests for ItemManager
  - 11.1.2.1. Test createWebItem()
  - 11.1.2.2. Test createNoteItem()
  - 11.1.2.3. Test date folder logic
  - 11.1.2.4. Test moveItem()
- 11.1.3. Write unit tests for DuplicationDetector
  - 11.1.3.1. Test same URL + same day + same folder detection
  - 11.1.3.2. Test different day (no duplicate)
  - 11.1.3.3. Test different folder (no duplicate)
- 11.1.4. Write unit tests for TabManager
  - 11.1.4.1. Test openTab()
  - 11.1.4.2. Test closeTab()
  - 11.1.4.3. Test tab limit warning
- 11.1.5. Write unit tests for AutosaveManager
  - 11.1.5.1. Test 500ms debounce
  - 11.1.5.2. Test save flush on tab close
  - 11.1.5.3. Test save retry on error
- 11.1.6. Achieve 70%+ code coverage
  - 11.1.6.1. Run coverage reports
  - 11.1.6.2. Identify uncovered branches
  - 11.1.6.3. Write tests for uncovered code
  - 11.1.6.4. Update coverage threshold in Jest config

### 11.2. Integration Testing 🚀
**Dependencies**: 0.4 complete

- 11.2.1. Write workspace-tab sync tests
  - 11.2.1.1. Open workspace → open tabs → close app → reopen → verify tabs restored
  - 11.2.1.2. Navigate to new URL → verify item created
  - 11.2.1.3. Duplicate URL → verify focus existing tab
- 11.2.2. Write crash recovery tests
  - 11.2.2.1. Simulate crash (kill process)
  - 11.2.2.2. Reopen app
  - 11.2.2.3. Verify session restored
  - 11.2.2.4. Verify integrity validation ran
- 11.2.3. Write storage integrity tests
  - 11.2.3.1. Corrupt database file
  - 11.2.3.2. Start app
  - 11.2.3.3. Verify auto-repair or backup restore
- 11.2.4. Write multi-workspace tests
  - 11.2.4.1. Create 3 workspaces
  - 11.2.4.2. Switch between them
  - 11.2.4.3. Verify isolation
  - 11.2.4.4. Delete one workspace
  - 11.2.4.5. Verify CASCADE delete

### 11.3. End-to-End Testing 🚀
**Dependencies**: 0.4 complete

- 11.3.1. Write workspace creation E2E test
  - 11.3.1.1. Launch app
  - 11.3.1.2. Click File > New Workspace
  - 11.3.1.3. Enter name
  - 11.3.1.4. Verify workspace created
  - 11.3.1.5. Verify UI updated
- 11.3.2. Write web browsing E2E test
  - 11.3.2.1. Open workspace
  - 11.3.2.2. Open new tab
  - 11.3.2.3. Navigate to https://example.com
  - 11.3.2.4. Verify page loads
  - 11.3.2.5. Verify item created in workspace
- 11.3.3. Write note creation E2E test
  - 11.3.3.1. Open workspace
  - 11.3.3.2. Right-click folder > New Note
  - 11.3.3.3. Type Markdown content
  - 11.3.3.4. Wait 500ms
  - 11.3.3.5. Verify "Saved at HH:MM:SS" appears
- 11.3.4. Write session restore E2E test
  - 11.3.4.1. Open workspace with 3 tabs
  - 11.3.4.2. Force close app (kill process)
  - 11.3.4.3. Reopen app
  - 11.3.4.4. Verify 3 tabs restored
  - 11.3.4.5. Verify URLs match
- 11.3.5. Write AI panel E2E test
  - 11.3.5.1. Open app
  - 11.3.5.2. Select ChatGPT from AI selector
  - 11.3.5.3. Verify chat.openai.com loads
  - 11.3.5.4. Switch to Claude
  - 11.3.5.5. Verify claude.ai loads

### 11.4. Performance Testing 🚀
**Dependencies**: All modules complete

- 11.4.1. Test launch time
  - 11.4.1.1. Measure time from process start to window interactive
  - 11.4.1.2. Verify <2s on all platforms
  - 11.4.1.3. Identify bottlenecks if over target
  - 11.4.1.4. Optimize and re-test
- 11.4.2. Test tab creation time
  - 11.4.2.1. Measure time from click to webview rendered
  - 11.4.2.2. Verify <200ms
  - 11.4.2.3. Test with cold pool (no webviews available)
  - 11.4.2.4. Test with warm pool (webviews available)
- 11.4.3. Test search performance
  - 11.4.3.1. Create workspace with 500 items
  - 11.4.3.2. Measure search query time
  - 11.4.3.3. Verify <1s
  - 11.4.3.4. Test full-text search on notes
- 11.4.4. Test memory usage
  - 11.4.4.1. Measure baseline (0 tabs)
  - 11.4.4.2. Measure with 10 tabs
  - 11.4.4.3. Measure with 20 tabs
  - 11.4.4.4. Verify targets: <500MB, <1.5GB, <2.5GB
  - 11.4.4.5. Check for memory leaks (prolonged usage)

### 11.5. Security Testing 🚀
**Dependencies**: 8.1, 8.2, 8.3 complete

- 11.5.1. Test sandbox enforcement
  - 11.5.1.1. Verify CEF sandbox enabled
  - 11.5.1.2. Attempt to bypass sandbox (should fail)
  - 11.5.1.3. Verify subprocesses are sandboxed
- 11.5.2. Test CSP enforcement
  - 11.5.2.1. Load page with inline scripts
  - 11.5.2.2. Verify CSP blocks execution
  - 11.5.2.3. Check CSP violation logs
- 11.5.3. Test encryption
  - 11.5.3.1. Verify database encrypted at rest
  - 11.5.3.2. Attempt to open DB without key (should fail)
  - 11.5.3.3. Verify session files encrypted
- 11.5.4. Test data isolation
  - 11.5.4.1. Create 2 workspaces
  - 11.5.4.2. Verify no data leakage between workspaces
  - 11.5.4.3. Delete workspace
  - 11.5.4.4. Verify all data removed

---

## 12. Documentation Module

### 12.1. User Documentation 🚀
**Dependencies**: All features complete

- 12.1.1. Write user manual
  - 12.1.1.1. Getting started guide
  - 12.1.1.2. Creating workspaces
  - 12.1.1.3. Managing items and folders
  - 12.1.1.4. Using tabs
  - 12.1.1.5. Markdown editing
  - 12.1.1.6. AI panel usage
  - 12.1.1.7. Keyboard shortcuts reference
- 12.1.2. Create FAQ
  - 12.1.2.1. How do I...?
  - 12.1.2.2. Troubleshooting common issues
  - 12.1.2.3. Performance tips
  - 12.1.2.4. Security and privacy
- 12.1.3. Record video tutorials
  - 12.1.3.1. Quick start (5 minutes)
  - 12.1.3.2. Advanced features (15 minutes)
  - 12.1.3.3. Tips and tricks (10 minutes)

### 12.2. Developer Documentation 🚀
**Dependencies**: All modules complete

- 12.2.1. Write architecture overview
  - 12.2.1.1. System diagram
  - 12.2.1.2. Module descriptions
  - 12.2.1.3. Data flow diagrams
  - 12.2.1.4. Security architecture
- 12.2.2. Document internal APIs
  - 12.2.2.1. WorkspaceManager API
  - 12.2.2.2. ItemManager API
  - 12.2.2.3. TabManager API
  - 12.2.2.4. Storage Layer API
  - 12.2.2.5. CEF Bridge API
- 12.2.3. Write development setup guide
  - 12.2.3.1. Prerequisites
  - 12.2.3.2. Building from source
  - 12.2.3.3. Running tests
  - 12.2.3.4. Debugging tips
- 12.2.4. Document code style guide
  - 12.2.4.1. TypeScript conventions
  - 12.2.4.2. C++ conventions
  - 12.2.4.3. Naming standards
  - 12.2.4.4. Comment guidelines

### 12.3. Release Documentation 🚀
**Dependencies**: 10.1, 10.2, 10.3 complete

- 12.3.1. Write changelog
  - 12.3.1.1. Version history
  - 12.3.1.2. New features per version
  - 12.3.1.3. Bug fixes per version
  - 12.3.1.4. Breaking changes
- 12.3.2. Create release notes
  - 12.3.2.1. Highlights
  - 12.3.2.2. Known issues
  - 12.3.2.3. Upgrade instructions
- 12.3.3. Document installation process
  - 12.3.3.1. Windows installation
  - 12.3.3.2. macOS installation
  - 12.3.3.3. Linux installation
  - 12.3.3.4. Troubleshooting installation issues

---

## Task Summary by Phase

### MVP Tasks (🎯) - Total: ~150 tasks
**Duration**: 4 weeks (2 developers)

**Critical Path**:
1. Foundation (0.x) → 2 weeks
2. CEF Core (1.1-1.2, 1.5-1.6) + Storage (2.1-2.2) → parallel, 1 week
3. Workspace Engine (3.1-3.2, 3.4-3.5) → 1 week
4. Tab Manager (4.1, 4.3) + MarkText (5.1-5.2, 5.4) → parallel, 1 week
5. AI Panel (6.1-6.2, 6.4) + UI (7.1-7.2, 7.4) → parallel, 1 week
6. Integration & Testing (11.1) → 1 week

### V1 Tasks (🚀) - Total: ~200 tasks
**Duration**: Additional 8 weeks after MVP (4 developers)

**Critical Path**:
1. Advanced features (1.3-1.4, 2.3-2.6, 3.3, 4.2, 4.4-4.5, 5.3) → 2 weeks
2. UI polish (7.3, 7.5-7.7) → 2 weeks
3. Security (8.1-8.4) + Crash Recovery (9.1-9.4) → parallel, 2 weeks
4. Multi-platform builds (10.1-10.4) → 2 weeks
5. QA (11.2-11.5) → 2 weeks
6. Documentation (12.1-12.3) → 2 weeks

### V2 Tasks (🔮) - Total: ~50 tasks
**Duration**: Post-V1 (6-month roadmap)

**Features**:
- Cloud sync
- Collaborative workspaces
- Export/import
- Plugin system
- Mobile companion app
- Advanced search
- AI context sharing

---

## Dependency Summary

**Foundation (0.x)** → Blocks all modules

**CEF (1.x)** → Blocks Tab Manager (4.x), AI Panel (6.x)

**Storage (2.x)** → Blocks Workspace Engine (3.x), Crash Recovery (9.x)

**Workspace Engine (3.x)** → Blocks Tab Manager (4.x), UI (7.x)

**Tab Manager (4.x)** → Blocks UI Tab Area (7.4)

**MarkText (5.x)** → Blocks UI Tab Area (7.4)

**AI Panel (6.x)** → Independent (parallel with other modules)

**UI (7.x)** → Requires 3.x, 4.x, 5.x, 6.x

**Security (8.x)** → Can be developed in parallel, applied late

**Crash Recovery (9.x)** → Requires 2.x, 4.x

**Multi-platform (10.x)** → Requires all features complete

**QA (11.x)** → Continuous throughout, final validation at end

**Documentation (12.x)** → Final phase

---

**End of Task List**

This comprehensive task list covers all implementation work from project setup through V1 release. Each task is actionable, properly scoped, and organized by module with clear MVP/V1 designations and dependency tracking.
