# Workspace Navigator - API Reference

**Version**: 1.0.0
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [IPC API](#1-ipc-api)
2. [Database API](#2-database-api)
3. [WorkspaceEngine API](#3-workspaceengine-api)
4. [BrowserViewManager API](#4-browserviewmanager-api)
5. [TabManager API](#5-tabmanager-api)
6. [Type Definitions](#6-type-definitions)

---

## 1. IPC API

The IPC API is exposed to the renderer process via `window.electronAPI`.

### Workspace Operations

#### `electronAPI.workspace.getAll()`

Get all workspaces.

**Returns**: `Promise<Workspace[]>`

```typescript
const workspaces = await window.electronAPI.workspace.getAll();
```

#### `electronAPI.workspace.getById(id)`

Get a workspace by ID.

**Parameters**:
- `id: string` - Workspace ID

**Returns**: `Promise<Workspace | null>`

```typescript
const workspace = await window.electronAPI.workspace.getById('uuid-here');
```

#### `electronAPI.workspace.create(name)`

Create a new workspace.

**Parameters**:
- `name: string` - Workspace name (1-100 characters)

**Returns**: `Promise<Workspace>`

```typescript
const workspace = await window.electronAPI.workspace.create('My Project');
```

#### `electronAPI.workspace.delete(id)`

Delete a workspace and all its contents.

**Parameters**:
- `id: string` - Workspace ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.workspace.delete('uuid-here');
```

#### `electronAPI.workspace.switch(id)`

Switch to a different workspace.

**Parameters**:
- `id: string` - Workspace ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.workspace.switch('uuid-here');
```

---

### Folder Operations

#### `electronAPI.folder.getRoots(workspaceId)`

Get root-level folders for a workspace.

**Parameters**:
- `workspaceId: string` - Workspace ID

**Returns**: `Promise<Folder[]>`

```typescript
const folders = await window.electronAPI.folder.getRoots('workspace-id');
```

#### `electronAPI.folder.getChildren(folderId)`

Get child folders of a folder.

**Parameters**:
- `folderId: string` - Parent folder ID

**Returns**: `Promise<Folder[]>`

```typescript
const children = await window.electronAPI.folder.getChildren('folder-id');
```

#### `electronAPI.folder.create(data)`

Create a new folder.

**Parameters**:
- `data: CreateFolderData`
  - `workspaceId: string` - Workspace ID
  - `name: string` - Folder name
  - `parentId?: string` - Parent folder ID (optional)

**Returns**: `Promise<Folder>`

```typescript
const folder = await window.electronAPI.folder.create({
  workspaceId: 'workspace-id',
  name: 'New Folder',
  parentId: 'parent-folder-id' // optional
});
```

#### `electronAPI.folder.rename(id, name)`

Rename a folder.

**Parameters**:
- `id: string` - Folder ID
- `name: string` - New name

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.folder.rename('folder-id', 'Renamed Folder');
```

#### `electronAPI.folder.delete(id)`

Delete a folder and its contents.

**Parameters**:
- `id: string` - Folder ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.folder.delete('folder-id');
```

#### `electronAPI.folder.move(id, newParentId)`

Move a folder to a new parent.

**Parameters**:
- `id: string` - Folder ID
- `newParentId: string | null` - New parent folder ID (null for root)

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.folder.move('folder-id', 'new-parent-id');
```

---

### Item Operations

#### `electronAPI.item.getInFolder(folderId, workspaceId)`

Get items in a folder.

**Parameters**:
- `folderId: string | null` - Folder ID (null for root items)
- `workspaceId: string` - Workspace ID (required when folderId is null)

**Returns**: `Promise<Item[]>`

```typescript
const items = await window.electronAPI.item.getInFolder('folder-id');
const rootItems = await window.electronAPI.item.getInFolder(null, 'workspace-id');
```

#### `electronAPI.item.create(data)`

Create a new item.

**Parameters**:
- `data: CreateItemData`
  - `workspaceId: string` - Workspace ID
  - `type: 'web' | 'note'` - Item type
  - `title: string` - Item title
  - `url?: string` - URL (for web items)
  - `folderId?: string` - Folder ID (optional)

**Returns**: `Promise<Item>`

```typescript
// Web item
const webItem = await window.electronAPI.item.create({
  workspaceId: 'workspace-id',
  type: 'web',
  title: 'Google',
  url: 'https://google.com'
});

// Note item
const noteItem = await window.electronAPI.item.create({
  workspaceId: 'workspace-id',
  type: 'note',
  title: 'My Notes'
});
```

#### `electronAPI.item.update(id, updates)`

Update an item.

**Parameters**:
- `id: string` - Item ID
- `updates: Partial<Item>` - Fields to update

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.item.update('item-id', {
  title: 'New Title',
  content: '# Updated content'
});
```

#### `electronAPI.item.delete(id)`

Delete an item.

**Parameters**:
- `id: string` - Item ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.item.delete('item-id');
```

#### `electronAPI.item.move(id, folderId)`

Move an item to a different folder.

**Parameters**:
- `id: string` - Item ID
- `folderId: string | null` - Target folder ID (null for root)

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.item.move('item-id', 'new-folder-id');
```

---

### Search Operations

#### `electronAPI.search.items(workspaceId, query)`

Search items in a workspace.

**Parameters**:
- `workspaceId: string` - Workspace ID
- `query: string` - Search query

**Returns**: `Promise<Item[]>`

```typescript
const results = await window.electronAPI.search.items('workspace-id', 'meeting notes');
```

---

### Tag Operations

#### `electronAPI.tag.getAll(workspaceId)`

Get all tags in a workspace.

**Parameters**:
- `workspaceId: string` - Workspace ID

**Returns**: `Promise<Tag[]>`

```typescript
const tags = await window.electronAPI.tag.getAll('workspace-id');
```

#### `electronAPI.tag.create(workspaceId, name, color)`

Create a new tag.

**Parameters**:
- `workspaceId: string` - Workspace ID
- `name: string` - Tag name
- `color: string` - Hex color code

**Returns**: `Promise<Tag>`

```typescript
const tag = await window.electronAPI.tag.create('workspace-id', 'Important', '#ff0000');
```

#### `electronAPI.tag.getForItem(itemId)`

Get tags for an item.

**Parameters**:
- `itemId: string` - Item ID

**Returns**: `Promise<Tag[]>`

```typescript
const tags = await window.electronAPI.tag.getForItem('item-id');
```

#### `electronAPI.tag.addToItem(itemId, tagIds)`

Add tags to an item.

**Parameters**:
- `itemId: string` - Item ID
- `tagIds: string[]` - Array of tag IDs

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.tag.addToItem('item-id', ['tag-1', 'tag-2']);
```

#### `electronAPI.tag.removeFromItem(itemId, tagIds)`

Remove tags from an item.

**Parameters**:
- `itemId: string` - Item ID
- `tagIds: string[]` - Array of tag IDs

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.tag.removeFromItem('item-id', ['tag-1']);
```

#### `electronAPI.tag.delete(tagId)`

Delete a tag.

**Parameters**:
- `tagId: string` - Tag ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.tag.delete('tag-id');
```

---

### Browser Operations

#### `electronAPI.browser.navigate(tabId, url)`

Navigate a tab to a URL.

**Parameters**:
- `tabId: string` - Tab ID
- `url: string` - Target URL

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.browser.navigate('tab-id', 'https://example.com');
```

#### `electronAPI.browser.goBack(tabId)`

Navigate back in history.

**Parameters**:
- `tabId: string` - Tab ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.browser.goBack('tab-id');
```

#### `electronAPI.browser.goForward(tabId)`

Navigate forward in history.

**Parameters**:
- `tabId: string` - Tab ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.browser.goForward('tab-id');
```

#### `electronAPI.browser.reload(tabId)`

Reload the current page.

**Parameters**:
- `tabId: string` - Tab ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.browser.reload('tab-id');
```

---

### Tab Operations

#### `electronAPI.tab.open(itemId)`

Open an item in a new tab.

**Parameters**:
- `itemId: string` - Item ID

**Returns**: `Promise<Tab>`

```typescript
const tab = await window.electronAPI.tab.open('item-id');
```

#### `electronAPI.tab.close(tabId)`

Close a tab.

**Parameters**:
- `tabId: string` - Tab ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.tab.close('tab-id');
```

#### `electronAPI.tab.switch(tabId)`

Switch to a tab.

**Parameters**:
- `tabId: string` - Tab ID

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.tab.switch('tab-id');
```

#### `electronAPI.tab.getAll()`

Get all open tabs.

**Returns**: `Promise<Tab[]>`

```typescript
const tabs = await window.electronAPI.tab.getAll();
```

---

### AI Panel Operations

#### `electronAPI.ai.setProvider(providerId)`

Set the AI provider.

**Parameters**:
- `providerId: string` - Provider ID ('chatgpt', 'claude', 'gemini', 'custom')

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.ai.setProvider('claude');
```

#### `electronAPI.ai.setCustomUrl(url)`

Set custom AI provider URL.

**Parameters**:
- `url: string` - Custom URL

**Returns**: `Promise<void>`

```typescript
await window.electronAPI.ai.setCustomUrl('https://my-ai.example.com');
```

#### `electronAPI.ai.getProvider()`

Get current AI provider.

**Returns**: `Promise<string>`

```typescript
const provider = await window.electronAPI.ai.getProvider();
```

---

### Event Listeners

#### `electronAPI.on(channel, callback)`

Listen for events from main process.

**Parameters**:
- `channel: string` - Event channel
- `callback: (data: any) => void` - Event handler

**Available events**:
- `workspace:updated` - Workspace changed
- `folder:updated` - Folder changed
- `item:updated` - Item changed
- `tab:updated` - Tab state changed
- `tab:titleChanged` - Tab title changed
- `tab:faviconChanged` - Tab favicon changed
- `tab:loadingChanged` - Tab loading state changed

```typescript
window.electronAPI.on('tab:titleChanged', (data) => {
  console.log(`Tab ${data.tabId} title: ${data.title}`);
});
```

#### `electronAPI.off(channel, callback)`

Remove event listener.

**Parameters**:
- `channel: string` - Event channel
- `callback: Function` - Previously registered handler

```typescript
window.electronAPI.off('tab:titleChanged', myHandler);
```

---

## 2. Database API

The `WorkspaceDatabase` class provides direct database access (main process only).

### Constructor

```typescript
const db = new WorkspaceDatabase(dbPath: string);
```

### Workspace Methods

```typescript
db.getAllWorkspaces(): Workspace[]
db.getWorkspaceById(id: string): Workspace | null
db.createWorkspace(workspace: Workspace): void
db.updateWorkspace(id: string, updates: Partial<Workspace>): void
db.deleteWorkspace(id: string, hard?: boolean): void
```

### Folder Methods

```typescript
db.getRootFolders(workspaceId: string): Folder[]
db.getChildFolders(parentId: string): Folder[]
db.getFolderById(id: string): Folder | null
db.createFolder(folder: Folder): void
db.updateFolder(id: string, updates: Partial<Folder>): void
db.deleteFolder(id: string): void
db.getOrCreateDateFolder(workspaceId: string, folderName: string): Folder
```

### Item Methods

```typescript
db.getItemsInFolder(folderId: string | null, workspaceId?: string): Item[]
db.getItemById(id: string): Item | null
db.createItem(item: Item): void
db.updateItem(id: string, updates: Partial<Item>): void
db.deleteItem(id: string): void
db.findDuplicateWebItem(workspaceId: string, url: string, folderId: string | null): Item | null
db.searchItems(workspaceId: string, query: string, limit?: number): Item[]
```

### Tag Methods

```typescript
db.getAllTags(workspaceId: string): Tag[]
db.createTag(workspaceId: string, name: string, color?: string): Tag
db.getItemTags(itemId: string): Tag[]
db.addItemTags(itemId: string, tagIds: string[]): void
db.removeItemTags(itemId: string, tagIds: string[]): void
db.removeAllItemTags(itemId: string): void
db.getItemsByTag(workspaceId: string, tagId: string): Item[]
db.deleteTag(tagId: string): void
```

### Session Methods

```typescript
db.getSessionState(): SessionState
db.updateSessionState(updates: Partial<SessionState>): void
```

### Utility Methods

```typescript
db.prepare(sql: string): Statement
db.transaction<T>(fn: () => T): T
db.close(): void
```

---

## 3. WorkspaceEngine API

The `WorkspaceEngine` class provides high-level workspace operations.

### Constructor

```typescript
const engine = new WorkspaceEngine(database: WorkspaceDatabase);
```

### Methods

```typescript
// Workspace operations
engine.createWorkspace(name: string): Promise<Workspace>
engine.getWorkspace(id: string): Promise<Workspace | null>
engine.getAllWorkspaces(): Promise<Workspace[]>
engine.deleteWorkspace(id: string): Promise<void>
engine.switchWorkspace(id: string): Promise<void>
engine.getCurrentWorkspace(): Workspace | null

// Folder operations
engine.createFolder(workspaceId: string, name: string, parentId?: string): Promise<Folder>
engine.renameFolder(folderId: string, newName: string): Promise<void>
engine.moveFolder(folderId: string, newParentId: string | null): Promise<void>
engine.deleteFolder(folderId: string): Promise<void>
engine.getFolderHierarchy(workspaceId: string): Promise<FolderNode[]>

// Item operations
engine.createWebItem(workspaceId: string, url: string, title: string, folderId?: string): Promise<Item>
engine.createNoteItem(workspaceId: string, title: string, folderId?: string): Promise<Item>
engine.updateItem(itemId: string, updates: Partial<Item>): Promise<void>
engine.deleteItem(itemId: string): Promise<void>
engine.moveItem(itemId: string, targetFolderId: string | null): Promise<void>

// Search
engine.searchItems(workspaceId: string, query: string): Promise<Item[]>
```

---

## 4. BrowserViewManager API

The `BrowserViewManager` class manages BrowserView instances.

### Constructor

```typescript
const manager = new BrowserViewManager(mainWindow: BrowserWindow);
```

### Methods

```typescript
// View lifecycle
manager.createView(tabId: string, url: string): BrowserView
manager.showView(tabId: string): void
manager.hideView(tabId: string): void
manager.destroyView(tabId: string): void

// Navigation
manager.navigateView(tabId: string, url: string): void
manager.goBack(tabId: string): void
manager.goForward(tabId: string): void
manager.reload(tabId: string): void
manager.canGoBack(tabId: string): boolean
manager.canGoForward(tabId: string): boolean

// Bounds
manager.setBounds(tabId: string, bounds: Rectangle): void
manager.updateAllBounds(): void

// Pool management
manager.clearPool(): void
manager.getActiveViewCount(): number
```

---

## 5. TabManager API

The `TabManager` class manages tab state and operations.

### Constructor

```typescript
const tabManager = new TabManager(
  browserViewManager: BrowserViewManager,
  workspaceEngine: WorkspaceEngine
);
```

### Methods

```typescript
// Tab operations
tabManager.openTab(itemId: string): Promise<Tab>
tabManager.closeTab(tabId: string): void
tabManager.switchTab(tabId: string): void
tabManager.updateTab(tabId: string, updates: Partial<Tab>): void

// Queries
tabManager.getActiveTab(): Tab | null
tabManager.getAllTabs(): Tab[]
tabManager.getTabById(tabId: string): Tab | null
tabManager.getTabByItemId(itemId: string): Tab | null

// Session
tabManager.saveTabs(): void
tabManager.restoreTabs(tabs: SavedTab[]): Promise<void>
```

---

## 6. Type Definitions

### Workspace

```typescript
interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: WorkspaceSettings;
  isDeleted: boolean;
}

interface WorkspaceSettings {
  theme?: 'light' | 'dark';
  [key: string]: any;
}
```

### Folder

```typescript
interface Folder {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  folderType: 'custom' | 'date';
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
}

interface FolderNode extends Folder {
  children: FolderNode[];
  items: Item[];
}
```

### Item

```typescript
interface Item {
  id: string;
  workspaceId: string;
  folderId: string | null;
  itemType: 'web' | 'note';
  title: string;
  url?: string;
  favicon?: string;
  content?: string;
  metadata: ItemMetadata;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
}

interface ItemMetadata {
  [key: string]: any;
}
```

### Tag

```typescript
interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: number;
}
```

### Tab

```typescript
interface Tab {
  id: string;
  itemId: string;
  type: 'web' | 'markdown';
  url?: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface SavedTab {
  itemId: string;
  url?: string;
  scrollPosition?: { x: number; y: number };
}
```

### Session State

```typescript
interface SessionState {
  activeWorkspaceId: string | null;
  windowState: WindowState;
  openTabs: SavedTab[];
  updatedAt: number;
}

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}
```

### Events

```typescript
type WorkspaceEvent =
  | { type: 'workspace:created'; workspace: Workspace }
  | { type: 'workspace:updated'; workspace: Workspace }
  | { type: 'workspace:deleted'; workspaceId: string }
  | { type: 'workspace:switched'; workspaceId: string };

type FolderEvent =
  | { type: 'folder:created'; folder: Folder }
  | { type: 'folder:updated'; folder: Folder }
  | { type: 'folder:deleted'; folderId: string };

type ItemEvent =
  | { type: 'item:created'; item: Item }
  | { type: 'item:updated'; item: Item }
  | { type: 'item:deleted'; itemId: string }
  | { type: 'item:moved'; itemId: string; folderId: string | null };

type TabEvent =
  | { type: 'tab:opened'; tab: Tab }
  | { type: 'tab:closed'; tabId: string }
  | { type: 'tab:switched'; tabId: string }
  | { type: 'tab:updated'; tab: Tab };
```

---

*Last updated: 2025-11-25*
