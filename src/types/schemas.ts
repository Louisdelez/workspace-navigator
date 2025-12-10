/**
 * Zod validation schemas for Workspace Navigator
 * Used for IPC input validation and runtime type safety
 */

import { z } from 'zod';

// ==================== Base Schemas ====================

/**
 * UUID v4 format validation
 */
export const uuidSchema = z.string().uuid();

/**
 * Unix timestamp in milliseconds
 */
export const timestampSchema = z.number().int().positive();

/**
 * Non-empty string with trimming (rejects whitespace-only strings)
 */
export const nonEmptyStringSchema = z.string()
  .transform(s => s.trim())
  .refine(s => s.length > 0, { message: 'String cannot be empty or whitespace only' });

/**
 * Optional string that becomes undefined if empty
 */
export const optionalStringSchema = z.string().optional().transform(s => s?.trim() || undefined);

// ==================== T024: Workspace Schemas ====================

/**
 * Theme options
 */
export const themeSchema = z.enum(['light', 'dark']);

/**
 * AI Provider options
 */
export const aiProviderSchema = z.enum(['chatgpt', 'claude', 'gemini', 'none']);

/**
 * Workspace settings schema
 */
export const workspaceSettingsSchema = z.object({
  theme: themeSchema.optional(),
  defaultAIProvider: aiProviderSchema.optional(),
  autoDateFolders: z.boolean().optional().default(true),
  tabSoftLimit: z.number().int().min(1).max(100).optional().default(20),
  autosaveDebounceMs: z.number().int().min(100).max(5000).optional().default(500)
}).strict();

/**
 * Workspace creation input
 */
export const createWorkspaceSchema = z.object({
  name: nonEmptyStringSchema.pipe(z.string().min(1).max(255))
});

/**
 * Workspace update input
 */
export const updateWorkspaceSchema = z.object({
  name: nonEmptyStringSchema.pipe(z.string().min(1).max(255)).optional(),
  settings: workspaceSettingsSchema.partial().optional()
}).strict();

/**
 * Full workspace entity schema
 */
export const workspaceSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  settings: workspaceSettingsSchema,
  isDeleted: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

// ==================== T025: Folder Schemas ====================

/**
 * Folder type options
 */
export const folderTypeSchema = z.enum(['user', 'date']);

/**
 * Date folder name format (DD.MM.YYYY)
 */
export const dateFolderNameSchema = z.string().regex(
  /^\d{2}\.\d{2}\.\d{4}$/,
  'Date folder must be in DD.MM.YYYY format'
);

/**
 * Folder creation input
 */
export const createFolderSchema = z.object({
  workspaceId: uuidSchema,
  name: nonEmptyStringSchema.pipe(z.string().min(1).max(255)),
  parentId: uuidSchema.nullable().optional()
});

/**
 * Folder update input
 */
export const updateFolderSchema = z.object({
  name: nonEmptyStringSchema.pipe(z.string().min(1).max(255)).optional(),
  parentId: uuidSchema.nullable().optional()
}).strict();

/**
 * Folder move input
 */
export const moveFolderSchema = z.object({
  folderId: uuidSchema,
  newParentId: uuidSchema.nullable()
});

/**
 * Full folder entity schema
 */
export const folderSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  parentId: uuidSchema.nullable(),
  name: z.string().min(1).max(255),
  folderType: folderTypeSchema,
  isDeleted: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

// ==================== T026: Item Schemas ====================

/**
 * Item type options
 */
export const itemTypeSchema = z.enum(['web', 'note']);

/**
 * Item metadata shape (base schema for reuse)
 */
export const itemMetadataShapeSchema = z.object({
  scrollPosition: z.number().int().min(0).optional(),
  lastAccessedAt: timestampSchema.optional(),
  openCount: z.number().int().min(0).optional(),
  customIcon: z.string().max(1000).optional(),
  editorScrollPosition: z.number().int().min(0).optional(),
  previewEnabled: z.boolean().optional(),
  cursorPosition: z.number().int().min(0).optional()
}).strict();

/**
 * Item metadata schema with default
 */
export const itemMetadataSchema = itemMetadataShapeSchema.optional().default({});

/**
 * URL validation (lenient to allow various URL formats)
 */
export const urlSchema = z.string().min(1).max(2048).refine(
  (url) => {
    try {
      // Add protocol if missing for validation
      const urlWithProtocol = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
      new URL(urlWithProtocol);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid URL format' }
);

/**
 * Web item creation input
 */
export const createWebItemSchema = z.object({
  workspaceId: uuidSchema,
  url: urlSchema,
  title: nonEmptyStringSchema.pipe(z.string().min(1).max(500)),
  folderId: uuidSchema.nullable().optional(),
  favicon: z.string().max(100000).nullable().optional(), // Base64 can be large
  metadata: itemMetadataSchema.optional()
});

/**
 * Note item creation input
 */
export const createNoteItemSchema = z.object({
  workspaceId: uuidSchema,
  title: nonEmptyStringSchema.pipe(z.string().min(1).max(500)),
  content: z.string().max(10000000).optional().default(''), // 10MB max
  folderId: uuidSchema.nullable().optional(),
  metadata: itemMetadataSchema.optional()
});

/**
 * Item update input
 */
export const updateItemSchema = z.object({
  title: nonEmptyStringSchema.pipe(z.string().min(1).max(500)).optional(),
  url: urlSchema.optional(),
  content: z.string().max(10000000).optional(),
  favicon: z.string().max(100000).nullable().optional(),
  folderId: uuidSchema.nullable().optional(),
  metadata: itemMetadataShapeSchema.partial().optional()
}).strict();

/**
 * Item move input
 */
export const moveItemSchema = z.object({
  itemId: uuidSchema,
  newFolderId: uuidSchema.nullable()
});

/**
 * Base item schema
 */
export const baseItemSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  folderId: uuidSchema.nullable(),
  itemType: itemTypeSchema,
  title: z.string().min(1).max(500),
  metadata: itemMetadataSchema,
  isDeleted: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

/**
 * Web item schema
 */
export const webItemSchema = baseItemSchema.extend({
  itemType: z.literal('web'),
  url: z.string().min(1).max(2048),
  favicon: z.string().max(100000).nullable()
});

/**
 * Note item schema
 */
export const noteItemSchema = baseItemSchema.extend({
  itemType: z.literal('note'),
  content: z.string().max(10000000)
});

/**
 * Item schema (union)
 */
export const itemSchema = z.discriminatedUnion('itemType', [
  webItemSchema,
  noteItemSchema
]);

// ==================== T027: Tab Schemas ====================

/**
 * Tab state
 */
export const tabStateSchema = z.enum(['loading', 'ready', 'error', 'suspended']);

/**
 * Window state schema
 */
export const windowStateSchema = z.object({
  width: z.number().int().min(100).max(10000),
  height: z.number().int().min(100).max(10000),
  x: z.number().int(),
  y: z.number().int(),
  isMaximized: z.boolean()
}).strict();

/**
 * Session state schema
 */
export const sessionStateSchema = z.object({
  id: z.literal(1),
  activeWorkspaceId: uuidSchema.nullable(),
  openTabs: z.array(uuidSchema),
  activeTabIndex: z.number().int().min(0),
  aiProvider: aiProviderSchema,
  windowState: windowStateSchema,
  updatedAt: timestampSchema
});

/**
 * Tab open input
 */
export const openTabSchema = z.object({
  itemId: uuidSchema
});

/**
 * Tab close input
 */
export const closeTabSchema = z.object({
  tabId: uuidSchema
});

/**
 * Tab switch input
 */
export const switchTabSchema = z.object({
  tabId: uuidSchema
});

/**
 * Tab navigate input
 */
export const navigateTabSchema = z.object({
  url: urlSchema
});

/**
 * Session save input
 */
export const saveSessionSchema = z.object({
  activeWorkspaceId: uuidSchema.nullable(),
  openTabs: z.array(uuidSchema),
  activeTabIndex: z.number().int().min(0),
  aiProvider: aiProviderSchema
});

// ==================== T028: Search Schemas ====================

/**
 * Search query input
 */
export const searchQuerySchema = z.object({
  workspaceId: uuidSchema,
  query: z.string().min(1).max(500).transform(s => s.trim()),
  limit: z.number().int().min(1).max(1000).optional().default(100)
});

/**
 * Quick search input (title/URL only)
 */
export const quickSearchSchema = z.object({
  workspaceId: uuidSchema,
  query: z.string().min(1).max(100).transform(s => s.trim()),
  limit: z.number().int().min(1).max(50).optional().default(10)
});

/**
 * Search result schema
 */
export const searchResultSchema = z.object({
  item: itemSchema,
  score: z.number().min(0).max(1).optional(),
  highlights: z.array(z.object({
    field: z.enum(['title', 'url', 'content']),
    snippet: z.string()
  })).optional()
});

// ==================== Tag Schemas ====================

/**
 * Tag color validation (hex color)
 */
export const hexColorSchema = z.string().regex(
  /^#[0-9A-Fa-f]{6}$/,
  'Color must be in #RRGGBB hex format'
);

/**
 * Tag creation input
 */
export const createTagSchema = z.object({
  workspaceId: uuidSchema,
  name: nonEmptyStringSchema.pipe(z.string().min(1).max(50)),
  color: hexColorSchema.optional().default('#808080')
});

/**
 * Tag schema
 */
export const tagSchema = z.object({
  id: uuidSchema,
  workspaceId: uuidSchema,
  name: z.string().min(1).max(50),
  color: hexColorSchema,
  createdAt: timestampSchema
});

/**
 * Add tags to item input
 */
export const addItemTagsSchema = z.object({
  itemId: uuidSchema,
  tagIds: z.array(uuidSchema).min(1).max(20)
});

/**
 * Remove tags from item input
 */
export const removeItemTagsSchema = z.object({
  itemId: uuidSchema,
  tagIds: z.array(uuidSchema).min(1).max(20)
});

// ==================== AI Panel Schemas ====================

/**
 * AI provider switch input
 */
export const switchAIProviderSchema = z.object({
  providerId: z.string().min(1).max(50),
  url: urlSchema.optional()
});

// ==================== Autosave Schemas ====================

/**
 * Autosave schedule input
 */
export const scheduleAutosaveSchema = z.object({
  itemId: uuidSchema,
  content: z.string().max(10000000)
});

/**
 * Autosave flush input
 */
export const flushAutosaveSchema = z.object({
  itemId: uuidSchema
});

// ==================== Markdown Asset Schemas ====================

/**
 * Copy asset input
 */
export const copyAssetSchema = z.object({
  sourcePath: z.string().min(1).max(1024),
  workspaceId: uuidSchema,
  description: z.string().max(500).optional()
});

/**
 * Delete asset input
 */
export const deleteAssetSchema = z.object({
  assetPath: z.string().min(1).max(1024),
  workspaceId: uuidSchema
});

// ==================== Type Exports ====================

export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type WorkspaceEntity = z.infer<typeof workspaceSchema>;

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type FolderEntity = z.infer<typeof folderSchema>;

export type ItemMetadata = z.infer<typeof itemMetadataSchema>;
export type CreateWebItemInput = z.infer<typeof createWebItemSchema>;
export type CreateNoteItemInput = z.infer<typeof createNoteItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type MoveItemInput = z.infer<typeof moveItemSchema>;
export type WebItemEntity = z.infer<typeof webItemSchema>;
export type NoteItemEntity = z.infer<typeof noteItemSchema>;
export type ItemEntity = z.infer<typeof itemSchema>;

export type WindowState = z.infer<typeof windowStateSchema>;
export type SessionStateEntity = z.infer<typeof sessionStateSchema>;
export type OpenTabInput = z.infer<typeof openTabSchema>;
export type CloseTabInput = z.infer<typeof closeTabSchema>;
export type SwitchTabInput = z.infer<typeof switchTabSchema>;
export type NavigateTabInput = z.infer<typeof navigateTabSchema>;
export type SaveSessionInput = z.infer<typeof saveSessionSchema>;

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type QuickSearchInput = z.infer<typeof quickSearchSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type TagEntity = z.infer<typeof tagSchema>;
export type AddItemTagsInput = z.infer<typeof addItemTagsSchema>;
export type RemoveItemTagsInput = z.infer<typeof removeItemTagsSchema>;

export type SwitchAIProviderInput = z.infer<typeof switchAIProviderSchema>;
export type ScheduleAutosaveInput = z.infer<typeof scheduleAutosaveSchema>;
export type FlushAutosaveInput = z.infer<typeof flushAutosaveSchema>;
export type CopyAssetInput = z.infer<typeof copyAssetSchema>;
export type DeleteAssetInput = z.infer<typeof deleteAssetSchema>;
