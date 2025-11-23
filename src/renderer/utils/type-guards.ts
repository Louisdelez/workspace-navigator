/**
 * Type guard utilities
 */

import type { Item, WebItem, NoteItem } from '../../types/entities';

export function isWebItem(item: Item): item is WebItem {
  return item.itemType === 'web';
}

export function isNoteItem(item: Item): item is NoteItem {
  return item.itemType === 'note';
}
