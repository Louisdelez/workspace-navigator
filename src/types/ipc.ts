/**
 * IPC Type Definitions (T039)
 * Defines typed channels and payloads for Electron IPC communication
 */

import type { Workspace, Folder, Item, WebItem, NoteItem, SessionState, Tag, Tab } from './entities';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  CreateFolderInput,
  MoveFolderInput,
  CreateWebItemInput,
  CreateNoteItemInput,
  UpdateItemInput,
  MoveItemInput,
  SearchQueryInput,
  CreateTagInput,
  AddItemTagsInput,
  RemoveItemTagsInput,
  SwitchAIProviderInput,
  ScheduleAutosaveInput,
  CopyAssetInput,
  DeleteAssetInput
} from './schemas';

// ==================== IPC Channel Names ====================

/**
 * All IPC channel names as const for type safety
 */
export const IPC_CHANNELS = {
  // Workspace
  WORKSPACE_GET_ALL: 'workspace:getAll',
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_GET: 'workspace:get',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_SEARCH: 'workspace:search',

  // Folder
  FOLDER_CREATE: 'folder:create',
  FOLDER_GET_TREE: 'folder:getTree',
  FOLDER_MOVE: 'folder:move',
  FOLDER_DELETE: 'folder:delete',

  // Item
  ITEM_CREATE_WEB: 'item:createWeb',
  ITEM_CREATE_NOTE: 'item:createNote',
  ITEM_GET: 'item:get',
  ITEM_UPDATE: 'item:update',
  ITEM_MOVE: 'item:move',
  ITEM_DELETE: 'item:delete',
  ITEM_GET_IN_FOLDER: 'item:getInFolder',

  // Session
  SESSION_SAVE: 'session:save',
  SESSION_RESTORE: 'session:restore',

  // Tab
  TAB_SET_WORKSPACE: 'tab:setWorkspace',
  TAB_SET_CONTEXT_FOLDER: 'tab:setContextFolder',
  TAB_OPEN: 'tab:open',
  TAB_CLOSE: 'tab:close',
  TAB_SWITCH: 'tab:switch',
  TAB_GET_ALL: 'tab:getAll',
  TAB_GET_ACTIVE: 'tab:getActive',
  TAB_NAVIGATE: 'tab:navigate',
  TAB_GO_BACK: 'tab:goBack',
  TAB_GO_FORWARD: 'tab:goForward',
  TAB_RELOAD: 'tab:reload',
  TAB_CAN_GO_BACK: 'tab:canGoBack',
  TAB_CAN_GO_FORWARD: 'tab:canGoForward',
  TAB_EVENT: 'tab:event',

  // Autosave
  AUTOSAVE_SCHEDULE: 'autosave:schedule',
  AUTOSAVE_FLUSH: 'autosave:flush',
  AUTOSAVE_GET_PENDING_COUNT: 'autosave:getPendingCount',

  // AI Panel
  AI_SWITCH_PROVIDER: 'ai:switchProvider',
  AI_GET_CURRENT_PROVIDER: 'ai:getCurrentProvider',

  // Tag
  TAG_GET_ALL: 'tag:getAll',
  TAG_CREATE: 'tag:create',
  TAG_GET_FOR_ITEM: 'tag:getForItem',
  TAG_ADD_TO_ITEM: 'tag:addToItem',
  TAG_REMOVE_FROM_ITEM: 'tag:removeFromItem',
  TAG_GET_ITEMS: 'tag:getItems',
  TAG_DELETE: 'tag:delete',

  // Crash
  CRASH_GET_STATISTICS: 'crash:getStatistics',
  CRASH_GET_RECENT: 'crash:getRecentCrashes',

  // Markdown Assets
  MARKDOWN_COPY_ASSET: 'markdown:copyAsset',
  MARKDOWN_GET_ASSET_PATH: 'markdown:getAssetPath',
  MARKDOWN_SELECT_IMAGE: 'markdown:selectImage',
  MARKDOWN_DELETE_ASSET: 'markdown:deleteAsset'
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

// ==================== Request/Response Types ====================

/**
 * IPC Handler signatures for main process
 */
export interface IPCHandlers {
  // Workspace
  [IPC_CHANNELS.WORKSPACE_GET_ALL]: () => Workspace[];
  [IPC_CHANNELS.WORKSPACE_CREATE]: (name: string) => Workspace;
  [IPC_CHANNELS.WORKSPACE_GET]: (id: string) => Workspace | null;
  [IPC_CHANNELS.WORKSPACE_UPDATE]: (id: string, updates: UpdateWorkspaceInput) => void;
  [IPC_CHANNELS.WORKSPACE_DELETE]: (id: string) => void;
  [IPC_CHANNELS.WORKSPACE_SEARCH]: (workspaceId: string, query: string) => Item[];

  // Folder
  [IPC_CHANNELS.FOLDER_CREATE]: (workspaceId: string, name: string, parentId?: string) => Folder;
  [IPC_CHANNELS.FOLDER_GET_TREE]: (workspaceId: string) => FolderNode[];
  [IPC_CHANNELS.FOLDER_MOVE]: (folderId: string, newParentId: string | null) => void;
  [IPC_CHANNELS.FOLDER_DELETE]: (folderId: string) => void;

  // Item
  [IPC_CHANNELS.ITEM_CREATE_WEB]: (
    workspaceId: string,
    url: string,
    title: string,
    options?: Partial<CreateWebItemInput>
  ) => WebItem | { duplicate: true; existing: WebItem };
  [IPC_CHANNELS.ITEM_CREATE_NOTE]: (
    workspaceId: string,
    title: string,
    content?: string,
    options?: Partial<CreateNoteItemInput>
  ) => NoteItem;
  [IPC_CHANNELS.ITEM_GET]: (itemId: string) => Item | null;
  [IPC_CHANNELS.ITEM_UPDATE]: (itemId: string, updates: UpdateItemInput) => void;
  [IPC_CHANNELS.ITEM_MOVE]: (itemId: string, newFolderId: string | null) => void;
  [IPC_CHANNELS.ITEM_DELETE]: (itemId: string) => void;
  [IPC_CHANNELS.ITEM_GET_IN_FOLDER]: (folderId: string | null, workspaceId?: string) => Item[];

  // Session
  [IPC_CHANNELS.SESSION_SAVE]: (
    activeWorkspaceId: string | null,
    openTabs: string[],
    activeTabIndex: number,
    aiProvider: string
  ) => void;
  [IPC_CHANNELS.SESSION_RESTORE]: () => SessionState;

  // Tab
  [IPC_CHANNELS.TAB_SET_WORKSPACE]: (workspaceId: string | null) => void;
  [IPC_CHANNELS.TAB_SET_CONTEXT_FOLDER]: (folderId: string | null) => void;
  [IPC_CHANNELS.TAB_OPEN]: (itemId: string) => Tab;
  [IPC_CHANNELS.TAB_CLOSE]: (tabId: string) => void;
  [IPC_CHANNELS.TAB_SWITCH]: (tabId: string) => void;
  [IPC_CHANNELS.TAB_GET_ALL]: () => Tab[];
  [IPC_CHANNELS.TAB_GET_ACTIVE]: () => Tab | null;
  [IPC_CHANNELS.TAB_NAVIGATE]: (url: string) => void;
  [IPC_CHANNELS.TAB_GO_BACK]: () => void;
  [IPC_CHANNELS.TAB_GO_FORWARD]: () => void;
  [IPC_CHANNELS.TAB_RELOAD]: () => void;
  [IPC_CHANNELS.TAB_CAN_GO_BACK]: () => boolean;
  [IPC_CHANNELS.TAB_CAN_GO_FORWARD]: () => boolean;

  // Autosave
  [IPC_CHANNELS.AUTOSAVE_SCHEDULE]: (itemId: string, content: string) => void;
  [IPC_CHANNELS.AUTOSAVE_FLUSH]: (itemId: string) => void;
  [IPC_CHANNELS.AUTOSAVE_GET_PENDING_COUNT]: () => number;

  // AI Panel
  [IPC_CHANNELS.AI_SWITCH_PROVIDER]: (providerId: string, url: string) => void;
  [IPC_CHANNELS.AI_GET_CURRENT_PROVIDER]: () => { id: string; url: string } | null;

  // Tag
  [IPC_CHANNELS.TAG_GET_ALL]: (workspaceId: string) => Tag[];
  [IPC_CHANNELS.TAG_CREATE]: (workspaceId: string, name: string, color?: string) => Tag;
  [IPC_CHANNELS.TAG_GET_FOR_ITEM]: (itemId: string) => Tag[];
  [IPC_CHANNELS.TAG_ADD_TO_ITEM]: (itemId: string, tagIds: string[]) => void;
  [IPC_CHANNELS.TAG_REMOVE_FROM_ITEM]: (itemId: string, tagIds: string[]) => void;
  [IPC_CHANNELS.TAG_GET_ITEMS]: (workspaceId: string, tagId: string) => Item[];
  [IPC_CHANNELS.TAG_DELETE]: (tagId: string) => void;

  // Crash
  [IPC_CHANNELS.CRASH_GET_STATISTICS]: () => CrashStatistics;
  [IPC_CHANNELS.CRASH_GET_RECENT]: (limit?: number) => CrashRecord[];

  // Markdown Assets
  [IPC_CHANNELS.MARKDOWN_COPY_ASSET]: (request: CopyAssetInput) => CopyAssetResult;
  [IPC_CHANNELS.MARKDOWN_GET_ASSET_PATH]: (workspaceId: string) => string;
  [IPC_CHANNELS.MARKDOWN_SELECT_IMAGE]: () => SelectImageResult;
  [IPC_CHANNELS.MARKDOWN_DELETE_ASSET]: (request: DeleteAssetInput) => DeleteAssetResult;
}

// ==================== Helper Types ====================

/**
 * Folder node for tree display
 */
export interface FolderNode {
  folder: Folder;
  children: FolderNode[];
  items: Item[];
}

/**
 * Tab event types
 */
export type TabEventType =
  | 'tab-opened'
  | 'tab-closed'
  | 'tab-switched'
  | 'tab-title-updated'
  | 'tab-favicon-updated'
  | 'tab-loading-changed'
  | 'tab-navigation-state-changed';

export interface TabEvent {
  type: TabEventType;
  tabId: string;
  data?: Record<string, unknown>;
}

/**
 * Crash statistics
 */
export interface CrashStatistics {
  total: number;
  byType: Record<string, number>;
  lastCrash?: number;
}

/**
 * Crash record
 */
export interface CrashRecord {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: number;
}

/**
 * Asset copy result
 */
export type CopyAssetResult =
  | { success: true; assetPath: string; markdownLink: string }
  | { success: false; error: 'FILE_NOT_FOUND' | 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'COPY_FAILED'; message: string };

/**
 * Image selection result
 */
export type SelectImageResult =
  | { cancelled: true }
  | { cancelled: false; filePath: string };

/**
 * Asset deletion result
 */
export interface DeleteAssetResult {
  success: boolean;
  error?: string;
}

// ==================== Type-safe IPC Invocation ====================

/**
 * Type-safe invoke function signature
 */
export type TypedInvoke = <T extends keyof IPCHandlers>(
  channel: T,
  ...args: Parameters<IPCHandlers[T]>
) => Promise<ReturnType<IPCHandlers[T]>>;

/**
 * Type-safe on function signature for renderer events
 */
export type TypedOn = <T extends keyof RendererEvents>(
  channel: T,
  callback: (event: Electron.IpcRendererEvent, ...args: RendererEvents[T]) => void
) => void;

/**
 * Events sent from main to renderer
 */
export interface RendererEvents {
  [IPC_CHANNELS.TAB_EVENT]: [TabEvent];
  'app:unresponsive': [];
  'app:responsive': [];
}

// ==================== Validation Utility ====================

/**
 * Result type for validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues: string[] };

/**
 * Wrap an IPC handler with validation
 */
export function withValidation<T, R>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { issues: { message: string }[] } } },
  handler: (data: T) => R
): (data: unknown) => R {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error?.issues.map(i => i.message).join(', ') || 'Validation failed';
      throw new Error(`IPC Validation Error: ${issues}`);
    }
    return handler(result.data as T);
  };
}
