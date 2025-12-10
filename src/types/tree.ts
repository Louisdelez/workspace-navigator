/**
 * Tree types for UI components (T023)
 * Used by TreeView, WorkspacePanel, and related components
 */

import type { Folder, Item } from './entities';

/**
 * Base tree node interface
 */
export interface BaseTreeNode {
  id: string;
  type: 'folder' | 'item';
  depth: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

/**
 * Folder tree node
 */
export interface FolderTreeNode extends BaseTreeNode {
  type: 'folder';
  folder: Folder;
  children: FolderTreeNode[];
  items: Item[];
  itemCount: number; // Total items including nested
}

/**
 * Item tree node
 */
export interface ItemTreeNode extends BaseTreeNode {
  type: 'item';
  item: Item;
}

/**
 * Union type for all tree nodes
 */
export type TreeNode = FolderTreeNode | ItemTreeNode;

/**
 * Type guard for folder nodes
 */
export function isFolderNode(node: TreeNode): node is FolderTreeNode {
  return node.type === 'folder';
}

/**
 * Type guard for item nodes
 */
export function isItemNode(node: TreeNode): node is ItemTreeNode {
  return node.type === 'item';
}

/**
 * Flattened tree node for virtualized rendering
 */
export interface FlatTreeNode {
  id: string;
  type: 'folder' | 'item';
  depth: number;
  data: Folder | Item;
  isExpanded: boolean;
  hasChildren: boolean;
  parentId: string | null;
}

/**
 * Tree state for managing expanded/collapsed folders
 */
export interface TreeState {
  expandedIds: Set<string>;
  selectedId: string | null;
  focusedId: string | null;
}

/**
 * Tree actions
 */
export type TreeAction =
  | { type: 'TOGGLE_EXPAND'; id: string }
  | { type: 'EXPAND'; id: string }
  | { type: 'COLLAPSE'; id: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'SELECT'; id: string | null }
  | { type: 'FOCUS'; id: string | null };

/**
 * Tree reducer for state management
 */
export function treeReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case 'TOGGLE_EXPAND': {
      const newExpanded = new Set(state.expandedIds);
      if (newExpanded.has(action.id)) {
        newExpanded.delete(action.id);
      } else {
        newExpanded.add(action.id);
      }
      return { ...state, expandedIds: newExpanded };
    }
    case 'EXPAND':
      return {
        ...state,
        expandedIds: new Set([...state.expandedIds, action.id])
      };
    case 'COLLAPSE': {
      const newExpanded = new Set(state.expandedIds);
      newExpanded.delete(action.id);
      return { ...state, expandedIds: newExpanded };
    }
    case 'EXPAND_ALL':
      // This would need the full tree to implement properly
      return state;
    case 'COLLAPSE_ALL':
      return { ...state, expandedIds: new Set() };
    case 'SELECT':
      return { ...state, selectedId: action.id };
    case 'FOCUS':
      return { ...state, focusedId: action.id };
    default:
      return state;
  }
}

/**
 * Initial tree state
 */
export function createInitialTreeState(): TreeState {
  return {
    expandedIds: new Set(),
    selectedId: null,
    focusedId: null
  };
}

/**
 * Flatten tree for virtualized rendering
 */
export function flattenTree(
  nodes: FolderTreeNode[],
  expandedIds: Set<string>,
  depth: number = 0,
  parentId: string | null = null
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  for (const node of nodes) {
    const isExpanded = expandedIds.has(node.folder.id);

    // Add folder node
    result.push({
      id: node.folder.id,
      type: 'folder',
      depth,
      data: node.folder,
      isExpanded,
      hasChildren: node.children.length > 0 || node.items.length > 0,
      parentId
    });

    // If expanded, add children
    if (isExpanded) {
      // Add items first
      for (const item of node.items) {
        result.push({
          id: item.id,
          type: 'item',
          depth: depth + 1,
          data: item,
          isExpanded: false,
          hasChildren: false,
          parentId: node.folder.id
        });
      }

      // Then add nested folders
      result.push(
        ...flattenTree(node.children, expandedIds, depth + 1, node.folder.id)
      );
    }
  }

  return result;
}

/**
 * Count total items in a folder tree (recursive)
 */
export function countTreeItems(node: FolderTreeNode): number {
  let count = node.items.length;
  for (const child of node.children) {
    count += countTreeItems(child);
  }
  return count;
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(
  nodes: FolderTreeNode[],
  id: string
): TreeNode | null {
  for (const node of nodes) {
    if (node.folder.id === id) {
      return node;
    }

    // Check items
    const item = node.items.find(i => i.id === id);
    if (item) {
      return {
        id: item.id,
        type: 'item',
        depth: 0, // Would need context for accurate depth
        item
      };
    }

    // Recurse into children
    const found = findNodeById(node.children, id);
    if (found) return found;
  }

  return null;
}

/**
 * Get path from root to a node
 */
export function getNodePath(
  nodes: FolderTreeNode[],
  targetId: string,
  currentPath: string[] = []
): string[] | null {
  for (const node of nodes) {
    const newPath = [...currentPath, node.folder.id];

    if (node.folder.id === targetId) {
      return newPath;
    }

    // Check items
    if (node.items.some(i => i.id === targetId)) {
      return [...newPath, targetId];
    }

    // Recurse into children
    const found = getNodePath(node.children, targetId, newPath);
    if (found) return found;
  }

  return null;
}

/**
 * Drag & Drop types
 */
export interface DragItem {
  id: string;
  type: 'folder' | 'item';
  sourceParentId: string | null;
}

export interface DropResult {
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

/**
 * Validate if a drop is allowed
 */
export function isValidDrop(
  dragItem: DragItem,
  targetId: string,
  nodes: FolderTreeNode[]
): boolean {
  // Can't drop on self
  if (dragItem.id === targetId) return false;

  // If dragging a folder, can't drop into descendant
  if (dragItem.type === 'folder') {
    const path = getNodePath(nodes, targetId);
    if (path && path.includes(dragItem.id)) {
      return false;
    }
  }

  return true;
}
