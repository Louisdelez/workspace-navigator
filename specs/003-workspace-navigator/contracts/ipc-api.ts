/**
 * IPC API Contracts for Workspace Navigator
 *
 * This file defines the typed IPC channels between main and renderer processes.
 * All channels are validated with Zod schemas at runtime.
 *
 * Feature Branch: 003-workspace-navigator
 * Date: 2025-12-09
 */

import { z } from 'zod';

// ============================================================================
// Base Types
// ============================================================================

export const ItemTypeSchema = z.enum(['web', 'note']);
export const AIProviderSchema = z.enum(['chatgpt', 'claude', 'gemini']);

// Error response schema
export const IPCErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type IPCError = z.infer<typeof IPCErrorSchema>;

// Generic result wrapper
export const IPCResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), error: IPCErrorSchema }),
  ]);

// ============================================================================
// Workspace API
// ============================================================================

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

export const workspaceAPI = {
  // List all workspaces
  'workspace:list': {
    input: z.void(),
    output: z.array(WorkspaceSchema),
  },

  // Get current/default workspace
  'workspace:getCurrent': {
    input: z.void(),
    output: WorkspaceSchema,
  },

  // Create new workspace
  'workspace:create': {
    input: z.object({
      name: z.string().min(1).max(255),
    }),
    output: WorkspaceSchema,
  },

  // Rename workspace
  'workspace:rename': {
    input: z.object({
      id: z.string(),
      name: z.string().min(1).max(255),
    }),
    output: WorkspaceSchema,
  },

  // Switch to workspace
  'workspace:switch': {
    input: z.object({
      id: z.string(),
    }),
    output: WorkspaceSchema,
  },

  // Delete workspace
  'workspace:delete': {
    input: z.object({
      id: z.string(),
    }),
    output: z.object({ deleted: z.boolean() }),
  },
} as const;

// ============================================================================
// Folder API
// ============================================================================

export const FolderSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  parentId: z.string().nullable(),
  name: z.string(),
  displayOrder: z.number(),
  isDateFolder: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Folder = z.infer<typeof FolderSchema>;

export const FolderTreeNodeSchema: z.ZodType<FolderTreeNode> = z.lazy(() =>
  FolderSchema.extend({
    children: z.array(FolderTreeNodeSchema),
    items: z.array(ItemSchema),
  })
);

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
  items: Item[];
}

export const folderAPI = {
  // Get folder tree for workspace
  'folder:getTree': {
    input: z.object({
      workspaceId: z.string(),
    }),
    output: z.array(FolderTreeNodeSchema),
  },

  // Create folder
  'folder:create': {
    input: z.object({
      workspaceId: z.string(),
      parentId: z.string().nullable(),
      name: z.string().min(1).max(255),
    }),
    output: FolderSchema,
  },

  // Create or get today's date folder
  'folder:getOrCreateDateFolder': {
    input: z.object({
      workspaceId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    }),
    output: FolderSchema,
  },

  // Rename folder
  'folder:rename': {
    input: z.object({
      id: z.string(),
      name: z.string().min(1).max(255),
    }),
    output: FolderSchema,
  },

  // Move folder (reparent or reorder)
  'folder:move': {
    input: z.object({
      id: z.string(),
      newParentId: z.string().nullable(),
      newPosition: z.number().int().min(0),
    }),
    output: FolderSchema,
  },

  // Delete folder (cascades to children and items)
  'folder:delete': {
    input: z.object({
      id: z.string(),
    }),
    output: z.object({ deleted: z.boolean() }),
  },

  // Expand/collapse folder (UI state, persisted)
  'folder:setExpanded': {
    input: z.object({
      id: z.string(),
      expanded: z.boolean(),
    }),
    output: z.void(),
  },
} as const;

// ============================================================================
// Item API
// ============================================================================

export const ItemSchema = z.object({
  id: z.string(),
  folderId: z.string(),
  type: ItemTypeSchema,
  title: z.string(),
  url: z.string().nullable(),
  content: z.string().nullable(),
  favicon: z.string().nullable(),
  displayOrder: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastAccessedAt: z.string().datetime().nullable(),
});

export type Item = z.infer<typeof ItemSchema>;

export const itemAPI = {
  // Get item by ID
  'item:get': {
    input: z.object({
      id: z.string(),
    }),
    output: ItemSchema,
  },

  // Get items in folder
  'item:listByFolder': {
    input: z.object({
      folderId: z.string(),
    }),
    output: z.array(ItemSchema),
  },

  // Create web item (from navigation)
  'item:createWeb': {
    input: z.object({
      folderId: z.string(),
      url: z.string().url(),
      title: z.string().min(1).max(500).optional(),
      favicon: z.string().optional(),
    }),
    output: ItemSchema,
  },

  // Create note item
  'item:createNote': {
    input: z.object({
      folderId: z.string(),
      title: z.string().min(1).max(500),
      content: z.string().optional(),
    }),
    output: ItemSchema,
  },

  // Update item metadata (title, url for web items)
  'item:update': {
    input: z.object({
      id: z.string(),
      title: z.string().min(1).max(500).optional(),
      url: z.string().url().optional(),
      favicon: z.string().optional(),
    }),
    output: ItemSchema,
  },

  // Update note content (autosave)
  'item:updateContent': {
    input: z.object({
      id: z.string(),
      content: z.string(),
    }),
    output: ItemSchema,
  },

  // Move item to another folder
  'item:move': {
    input: z.object({
      id: z.string(),
      newFolderId: z.string(),
      newPosition: z.number().int().min(0),
    }),
    output: ItemSchema,
  },

  // Delete item
  'item:delete': {
    input: z.object({
      id: z.string(),
    }),
    output: z.object({ deleted: z.boolean() }),
  },

  // Check if URL exists (for duplicate detection)
  'item:findByUrl': {
    input: z.object({
      url: z.string().url(),
      workspaceId: z.string().optional(),
    }),
    output: ItemSchema.nullable(),
  },

  // Touch last accessed timestamp
  'item:touch': {
    input: z.object({
      id: z.string(),
    }),
    output: z.void(),
  },
} as const;

// ============================================================================
// Tab API
// ============================================================================

export const NavigationStateSchema = z.object({
  history: z.array(z.string()),
  currentIndex: z.number(),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
});

export const TabSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  position: z.number(),
  isActive: z.boolean(),
  scrollPosition: z.number(),
  navigationState: NavigationStateSchema.nullable(),
  createdAt: z.string().datetime(),
  lastAccessedAt: z.string().datetime(),
});

export type Tab = z.infer<typeof TabSchema>;

export const TabWithItemSchema = TabSchema.extend({
  item: ItemSchema,
});

export type TabWithItem = z.infer<typeof TabWithItemSchema>;

export const tabAPI = {
  // Get all open tabs
  'tab:list': {
    input: z.void(),
    output: z.array(TabWithItemSchema),
  },

  // Get active tab
  'tab:getActive': {
    input: z.void(),
    output: TabWithItemSchema.nullable(),
  },

  // Open item in new tab (or focus existing)
  'tab:open': {
    input: z.object({
      itemId: z.string(),
    }),
    output: TabWithItemSchema,
  },

  // Open URL in new tab (creates item if needed)
  'tab:openUrl': {
    input: z.object({
      url: z.string().url(),
    }),
    output: TabWithItemSchema,
  },

  // Set active tab
  'tab:setActive': {
    input: z.object({
      id: z.string(),
    }),
    output: TabWithItemSchema,
  },

  // Close tab
  'tab:close': {
    input: z.object({
      id: z.string(),
    }),
    output: z.object({ closed: z.boolean() }),
  },

  // Reorder tabs
  'tab:reorder': {
    input: z.object({
      tabIds: z.array(z.string()),
    }),
    output: z.array(TabSchema),
  },

  // Update navigation state
  'tab:updateNavigation': {
    input: z.object({
      id: z.string(),
      url: z.string().url(),
      title: z.string().optional(),
      canGoBack: z.boolean(),
      canGoForward: z.boolean(),
    }),
    output: TabSchema,
  },

  // Update scroll position
  'tab:updateScroll': {
    input: z.object({
      id: z.string(),
      scrollPosition: z.number().int().min(0),
    }),
    output: z.void(),
  },

  // Get tab count (for soft limit warning)
  'tab:count': {
    input: z.void(),
    output: z.object({
      count: z.number(),
      softLimit: z.number(),
      isOverLimit: z.boolean(),
    }),
  },
} as const;

// ============================================================================
// Search API
// ============================================================================

export const SearchResultSchema = z.object({
  item: ItemSchema,
  matchType: z.enum(['title', 'url', 'content']),
  snippet: z.string().optional(),
  score: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const searchAPI = {
  // Full-text search
  'search:query': {
    input: z.object({
      query: z.string().min(1).max(200),
      workspaceId: z.string().optional(),
      type: ItemTypeSchema.optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
    output: z.array(SearchResultSchema),
  },

  // Quick search (title/url only, faster)
  'search:quick': {
    input: z.object({
      query: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(20).default(10),
    }),
    output: z.array(SearchResultSchema),
  },
} as const;

// ============================================================================
// AI Panel API
// ============================================================================

export const AIProviderInfoSchema = z.object({
  id: AIProviderSchema,
  name: z.string(),
  url: z.string().url(),
  isEnabled: z.boolean(),
  lastUsedAt: z.string().datetime().nullable(),
});

export type AIProviderInfo = z.infer<typeof AIProviderInfoSchema>;

export const aiPanelAPI = {
  // Get available providers
  'ai:listProviders': {
    input: z.void(),
    output: z.array(AIProviderInfoSchema),
  },

  // Get current provider
  'ai:getCurrentProvider': {
    input: z.void(),
    output: AIProviderInfoSchema.nullable(),
  },

  // Switch provider
  'ai:switchProvider': {
    input: z.object({
      providerId: AIProviderSchema,
    }),
    output: AIProviderInfoSchema,
  },

  // Toggle provider enabled state
  'ai:toggleProvider': {
    input: z.object({
      providerId: AIProviderSchema,
      enabled: z.boolean(),
    }),
    output: AIProviderInfoSchema,
  },
} as const;

// ============================================================================
// Session API
// ============================================================================

export const sessionAPI = {
  // Save session state
  'session:save': {
    input: z.void(),
    output: z.object({ saved: z.boolean() }),
  },

  // Restore session (called on startup)
  'session:restore': {
    input: z.void(),
    output: z.object({
      tabs: z.array(TabWithItemSchema),
      activeTabId: z.string().nullable(),
      panelSizes: z.object({
        sidebar: z.number(),
        aiPanel: z.number(),
      }),
      aiProvider: AIProviderSchema.nullable(),
    }),
  },

  // Clear session
  'session:clear': {
    input: z.void(),
    output: z.object({ cleared: z.boolean() }),
  },
} as const;

// ============================================================================
// Settings API
// ============================================================================

export const AppSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
  sidebarWidth: z.number().min(200).max(600).default(280),
  aiPanelWidth: z.number().min(300).max(800).default(400),
  tabSoftLimit: z.number().min(5).max(100).default(20),
  autosaveInterval: z.number().min(100).max(5000).default(500),
  enableAnimations: z.boolean().default(true),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

export const settingsAPI = {
  // Get all settings
  'settings:get': {
    input: z.void(),
    output: AppSettingsSchema,
  },

  // Update settings
  'settings:update': {
    input: AppSettingsSchema.partial(),
    output: AppSettingsSchema,
  },

  // Reset to defaults
  'settings:reset': {
    input: z.void(),
    output: AppSettingsSchema,
  },
} as const;

// ============================================================================
// Window API
// ============================================================================

export const windowAPI = {
  // Minimize window
  'window:minimize': {
    input: z.void(),
    output: z.void(),
  },

  // Maximize/restore window
  'window:maximize': {
    input: z.void(),
    output: z.object({ isMaximized: z.boolean() }),
  },

  // Close window
  'window:close': {
    input: z.void(),
    output: z.void(),
  },

  // Get window state
  'window:getState': {
    input: z.void(),
    output: z.object({
      isMaximized: z.boolean(),
      isFullScreen: z.boolean(),
      bounds: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    }),
  },
} as const;

// ============================================================================
// All APIs Combined
// ============================================================================

export const allAPIs = {
  ...workspaceAPI,
  ...folderAPI,
  ...itemAPI,
  ...tabAPI,
  ...searchAPI,
  ...aiPanelAPI,
  ...sessionAPI,
  ...settingsAPI,
  ...windowAPI,
} as const;

export type APIChannels = keyof typeof allAPIs;

// Type helper to extract input/output types
export type APIInput<T extends APIChannels> = z.infer<(typeof allAPIs)[T]['input']>;
export type APIOutput<T extends APIChannels> = z.infer<(typeof allAPIs)[T]['output']>;

// ============================================================================
// IPC Events (Main → Renderer)
// ============================================================================

export const ipcEvents = {
  // Tab events
  'event:tab:opened': TabWithItemSchema,
  'event:tab:closed': z.object({ tabId: z.string() }),
  'event:tab:activated': z.object({ tabId: z.string() }),
  'event:tab:updated': TabSchema,

  // Item events
  'event:item:created': ItemSchema,
  'event:item:updated': ItemSchema,
  'event:item:deleted': z.object({ itemId: z.string() }),

  // Folder events
  'event:folder:created': FolderSchema,
  'event:folder:updated': FolderSchema,
  'event:folder:deleted': z.object({ folderId: z.string() }),

  // Navigation events
  'event:navigation:started': z.object({ tabId: z.string(), url: z.string() }),
  'event:navigation:completed': z.object({
    tabId: z.string(),
    url: z.string(),
    title: z.string(),
    favicon: z.string().nullable(),
  }),
  'event:navigation:failed': z.object({
    tabId: z.string(),
    url: z.string(),
    errorCode: z.number(),
    errorDescription: z.string(),
  }),

  // WebContentsView events
  'event:webview:ready': z.object({ tabId: z.string() }),
  'event:webview:title-updated': z.object({ tabId: z.string(), title: z.string() }),
  'event:webview:favicon-updated': z.object({ tabId: z.string(), favicon: z.string() }),

  // Session events
  'event:session:restoring': z.void(),
  'event:session:restored': z.void(),
  'event:session:saved': z.void(),

  // Tab limit warning
  'event:tabs:limit-warning': z.object({
    count: z.number(),
    limit: z.number(),
  }),
} as const;

export type IPCEventName = keyof typeof ipcEvents;
export type IPCEventPayload<T extends IPCEventName> = z.infer<(typeof ipcEvents)[T]>;
