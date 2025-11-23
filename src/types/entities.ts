/**
 * Core entity type definitions for Workspace Navigator
 * Based on data-model.md specifications
 */

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string; // UUIDv4
  createdAt: number; // Unix timestamp (milliseconds)
  updatedAt: number; // Unix timestamp (milliseconds)
}

/**
 * Workspace entity
 */
export interface Workspace extends BaseEntity {
  name: string;
  settings: WorkspaceSettings;
  isDeleted: boolean;
}

export interface WorkspaceSettings {
  theme?: 'light' | 'dark';
  defaultAIProvider?: 'chatgpt' | 'claude' | 'gemini' | 'none';
  autoDateFolders?: boolean; // Default: true
  tabSoftLimit?: number; // Default: 20
  autosaveDebounceMs?: number; // Default: 500
}

/**
 * Folder entity
 */
export interface Folder extends BaseEntity {
  workspaceId: string;
  parentId: string | null; // NULL = root folder
  name: string;
  folderType: 'user' | 'date'; // 'date' for auto-generated DD.MM.YYYY folders
  isDeleted: boolean;
}

/**
 * Item base interface (polymorphic)
 */
export interface Item extends BaseEntity {
  workspaceId: string;
  folderId: string | null; // NULL = workspace root
  itemType: 'web' | 'note';
  title: string;
  metadata: ItemMetadata;
  isDeleted: boolean;
}

/**
 * Web item
 */
export interface WebItem extends Item {
  itemType: 'web';
  url: string;
  favicon: string | null; // Base64 data URL or remote URL
}

/**
 * Note item
 */
export interface NoteItem extends Item {
  itemType: 'note';
  content: string; // Markdown content
}

/**
 * Item metadata (extensible)
 */
export interface ItemMetadata {
  scrollPosition?: number;
  lastAccessedAt?: number;
  openCount?: number;
  customIcon?: string;
}

/**
 * Tag entity
 */
export interface Tag extends BaseEntity {
  workspaceId: string;
  name: string;
  color: string; // Hex color code
}

/**
 * Session state
 */
export interface SessionState {
  id: 1; // Singleton
  activeWorkspaceId: string | null;
  openTabs: string[]; // Array of item IDs
  activeTabIndex: number;
  aiProvider: 'chatgpt' | 'claude' | 'gemini' | 'none';
  windowState: WindowState;
  updatedAt: number;
}

export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
}

/**
 * Type guards
 */
export function isWebItem(item: Item): item is WebItem {
  return item.itemType === 'web';
}

export function isNoteItem(item: Item): item is NoteItem {
  return item.itemType === 'note';
}

export function isDateFolder(folder: Folder): boolean {
  return folder.folderType === 'date';
}

export function isRootFolder(folder: Folder): boolean {
  return folder.parentId === null;
}

/**
 * Generate date folder name for a given date (DD.MM.YYYY)
 */
export function generateDateFolderName(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Validate date folder name format
 */
export function isValidDateFolderName(name: string): boolean {
  const regex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!regex.test(name)) return false;

  const parts = name.split('.').map(Number);
  if (parts.length !== 3) return false;

  const [day, month, year] = parts;
  if (!day || !month || !year) return false;

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
