/**
 * TagEditor Component - T047
 * Manages tags for items: display, add, and remove tags
 */

import React, { useState, useEffect } from 'react';
import type { Tag } from '../../types/entities';

interface TagEditorProps {
  itemId: string;
  workspaceId: string;
  onTagsChange?: () => void;
}

const TAG_COLORS = [
  '#808080', // Gray (default)
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#45b7d1', // Blue
  '#f9ca24', // Yellow
  '#6c5ce7', // Purple
  '#a8e6cf', // Mint
  '#ff8b94', // Pink
  '#ffa502', // Orange
  '#95afc0', // Steel
];

export function TagEditor({ itemId, workspaceId, onTagsChange }: TagEditorProps) {
  const [itemTags, setItemTags] = useState<Tag[]>([]);
  const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]);

  useEffect(() => {
    loadTags();
  }, [itemId, workspaceId]);

  async function loadTags() {
    try {
      const [itemTagsData, workspaceTagsData] = await Promise.all([
        window.electronAPI.tag.getForItem(itemId),
        window.electronAPI.tag.getAll(workspaceId)
      ]);
      setItemTags(itemTagsData);
      setWorkspaceTags(workspaceTagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return;

    try {
      // Check if tag already exists
      let tag = workspaceTags.find(t => t.name.toLowerCase() === newTagName.toLowerCase());

      // Create tag if it doesn't exist
      if (!tag) {
        tag = await window.electronAPI.tag.create(workspaceId, newTagName, selectedColor);
        setWorkspaceTags([...workspaceTags, tag]);
      }

      // Add tag to item if not already added
      if (!itemTags.find(t => t.id === tag!.id)) {
        await window.electronAPI.tag.addToItem(itemId, [tag!.id]);
        setItemTags([...itemTags, tag!]);
        onTagsChange?.();
      }

      setNewTagName('');
      setSelectedColor(TAG_COLORS[0]);
      setShowInput(false);
    } catch (error) {
      console.error('Failed to add tag:', error);
      alert('Failed to add tag: ' + (error as Error).message);
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      await window.electronAPI.tag.removeFromItem(itemId, [tagId]);
      setItemTags(itemTags.filter(t => t.id !== tagId));
      onTagsChange?.();
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  }

  return (
    <div className="tag-editor">
      <div className="tag-editor-header">
        <h4>Tags</h4>
        <button
          className="tag-add-button"
          onClick={() => setShowInput(!showInput)}
          title="Add tag"
        >
          {showInput ? '✕' : '+'}
        </button>
      </div>

      {/* Tag Chips */}
      <div className="tag-chips">
        {itemTags.length > 0 ? (
          itemTags.map(tag => (
            <div
              key={tag.id}
              className="tag-chip"
              style={{ backgroundColor: tag.color }}
              onClick={() => handleRemoveTag(tag.id)}
              title="Click to remove"
            >
              {tag.name}
            </div>
          ))
        ) : (
          <p className="tag-empty-message">No tags yet</p>
        )}
      </div>

      {/* Add Tag Input */}
      {showInput && (
        <div className="tag-input-container">
          <input
            type="text"
            className="tag-input"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTag();
              } else if (e.key === 'Escape') {
                setShowInput(false);
                setNewTagName('');
              }
            }}
            placeholder="Tag name..."
            autoFocus
          />

          {/* Color Picker */}
          <div className="tag-color-picker">
            {TAG_COLORS.map(color => (
              <div
                key={color}
                className={`tag-color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
          </div>

          <div className="tag-input-actions">
            <button className="tag-button-primary" onClick={handleAddTag}>
              Add
            </button>
            <button
              className="tag-button-secondary"
              onClick={() => {
                setShowInput(false);
                setNewTagName('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
