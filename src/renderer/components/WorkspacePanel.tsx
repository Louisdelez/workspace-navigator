/**
 * Workspace Panel Component
 * Left sidebar showing workspace selector and folder/item tree
 */

import React, { useState, useEffect } from 'react';
import type { Workspace, Folder, Item } from '../../types/entities';
import type { FolderNode } from '../../core/workspace/workspace-engine';
import { SearchBar } from './SearchBar';

interface WorkspacePanelProps {
  activeWorkspace: Workspace | null;
  onWorkspaceChange: (workspace: Workspace | null) => void;
  onOpenItem: (item: Item) => void;
}

export function WorkspacePanel({ activeWorkspace, onWorkspaceChange, onOpenItem }: WorkspacePanelProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showWebInput, setShowWebInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [webTitle, setWebTitle] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      loadFolderTree();
    } else {
      setFolderTree([]);
    }
  }, [activeWorkspace]);

  async function loadWorkspaces() {
    try {
      // Defensive: Check if electronAPI is available
      if (!window.electronAPI?.workspace?.getAll) {
        console.warn('electronAPI.workspace.getAll not available');
        return;
      }

      const raw = await window.electronAPI.workspace.getAll();
      // Defensive: Normalize to array
      const allWorkspaces = Array.isArray(raw) ? raw : [];
      setWorkspaces(allWorkspaces);

      // Auto-select first workspace if none selected
      if (!activeWorkspace && allWorkspaces.length > 0) {
        onWorkspaceChange(allWorkspaces[0]);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  }

  async function loadFolderTree() {
    if (!activeWorkspace) return;

    try {
      // Defensive: Check if electronAPI is available
      if (!window.electronAPI?.folder?.getTree) {
        console.warn('electronAPI.folder.getTree not available');
        return;
      }

      const raw = await window.electronAPI.folder.getTree(activeWorkspace.id);
      // Defensive: Normalize to array
      const tree = Array.isArray(raw) ? raw : [];
      setFolderTree(tree);
    } catch (error) {
      console.error('Failed to load folder tree:', error);
    }
  }

  async function submitWorkspace() {
    if (!inputValue.trim()) return;

    try {
      const workspace = await window.electronAPI.workspace.create(inputValue);
      await loadWorkspaces();
      onWorkspaceChange(workspace);
      setShowWorkspaceInput(false);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
      alert('Failed to create workspace: ' + (error as Error).message);
    }
  }

  async function submitFolder() {
    if (!activeWorkspace || !inputValue.trim()) return;

    try {
      await window.electronAPI.folder.create(activeWorkspace.id, inputValue);
      await loadFolderTree();
      setShowFolderInput(false);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  }

  async function submitNote() {
    if (!activeWorkspace || !inputValue.trim()) return;

    try {
      const note = await window.electronAPI.item.createNote(activeWorkspace.id, inputValue, '# ' + inputValue);
      await loadFolderTree();
      onOpenItem(note);
      setShowNoteInput(false);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('Failed to create note');
    }
  }

  async function submitWebItem() {
    if (!activeWorkspace || !webUrl.trim()) return;

    try {
      // Add protocol if missing
      let url = webUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const result = await window.electronAPI.item.createWeb(
        activeWorkspace.id,
        url,
        webTitle.trim() || url  // Use URL as title if not provided
      );

      // Handle duplicate detection
      if ('duplicate' in result && result.duplicate) {
        const openExisting = confirm('This URL already exists in your workspace. Open it?');
        if (openExisting) {
          onOpenItem(result.existing);
        }
        setShowWebInput(false);
        setWebUrl('');
        setWebTitle('');
        return;
      }

      await loadFolderTree();
      onOpenItem(result as Item);
      setShowWebInput(false);
      setWebUrl('');
      setWebTitle('');
    } catch (error) {
      console.error('Failed to create web item:', error);
      alert('Failed to create web item: ' + (error as Error).message);
    }
  }

  function handleWorkspaceSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const workspaceId = event.target.value;
    if (workspaceId === '') {
      onWorkspaceChange(null);
      return;
    }

    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      onWorkspaceChange(workspace);
    }
  }

  async function handleDeleteWorkspace() {
    if (!activeWorkspace) return;

    // Get folder tree to count items
    const tree = await window.electronAPI.folder.getTree(activeWorkspace.id);
    const itemCount = tree.reduce((sum, node) => sum + countFolderItems(node), 0);

    const confirmed = confirm(
      `Delete workspace "${activeWorkspace.name}"?\n\n` +
      `This will permanently delete:\n` +
      `- ${tree.length} folders\n` +
      `- ${itemCount} items\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await window.electronAPI.workspace.delete(activeWorkspace.id);
      await loadWorkspaces();

      // Switch to another workspace or null
      if (workspaces.length > 1) {
        const nextWorkspace = workspaces.find(w => w.id !== activeWorkspace.id);
        onWorkspaceChange(nextWorkspace || null);
      } else {
        onWorkspaceChange(null);
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Failed to delete workspace: ' + (error as Error).message);
    }
  }

  async function handleSearchItemSelect(itemId: string) {
    try {
      const item = await window.electronAPI.item.get(itemId);
      if (item) {
        setSelectedItemId(itemId);
        onOpenItem(item);
      }
    } catch (error) {
      console.error('Failed to open search result:', error);
    }
  }

  return (
    <div className="workspace-panel">
      <div className="workspace-header">
        <h2>Workspace</h2>
        <div className="workspace-selector">
          <select value={activeWorkspace?.id || ''} onChange={handleWorkspaceSelect}>
            <option value="">Select workspace...</option>
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <button className="button" onClick={() => setShowWorkspaceInput(true)} title="New workspace">
            +
          </button>
          {activeWorkspace && (
            <button className="button button-danger" onClick={handleDeleteWorkspace} title="Delete workspace">
              🗑
            </button>
          )}
        </div>

        {showWorkspaceInput && (
          <div style={{ marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitWorkspace()}
              placeholder="Workspace name..."
              autoFocus
              style={{ width: '100%', padding: '4px', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="button" onClick={submitWorkspace} style={{ flex: 1, fontSize: '11px' }}>
                Create
              </button>
              <button className="button" onClick={() => { setShowWorkspaceInput(false); setInputValue(''); }} style={{ flex: 1, fontSize: '11px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeWorkspace && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button className="button" onClick={() => setShowFolderInput(true)} style={{ flex: '1 0 45%', fontSize: '11px' }}>
              New Folder
            </button>
            <button className="button" onClick={() => setShowNoteInput(true)} style={{ flex: '1 0 45%', fontSize: '11px' }}>
              New Note
            </button>
            <button className="button" onClick={() => setShowWebInput(true)} style={{ flex: '1 0 45%', fontSize: '11px' }}>
              New Web
            </button>
          </div>
        )}

        {showFolderInput && activeWorkspace && (
          <div style={{ marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitFolder()}
              placeholder="Folder name..."
              autoFocus
              style={{ width: '100%', padding: '4px', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="button" onClick={submitFolder} style={{ flex: 1, fontSize: '11px' }}>
                Create
              </button>
              <button className="button" onClick={() => { setShowFolderInput(false); setInputValue(''); }} style={{ flex: 1, fontSize: '11px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {showNoteInput && activeWorkspace && (
          <div style={{ marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNote()}
              placeholder="Note title..."
              autoFocus
              style={{ width: '100%', padding: '4px', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="button" onClick={submitNote} style={{ flex: 1, fontSize: '11px' }}>
                Create
              </button>
              <button className="button" onClick={() => { setShowNoteInput(false); setInputValue(''); }} style={{ flex: 1, fontSize: '11px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {showWebInput && activeWorkspace && (
          <div style={{ marginTop: '8px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
            <input
              type="url"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitWebItem()}
              placeholder="URL (e.g. example.com or https://example.com)..."
              autoFocus
              style={{ width: '100%', padding: '4px', marginBottom: '4px' }}
            />
            <input
              type="text"
              value={webTitle}
              onChange={(e) => setWebTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitWebItem()}
              placeholder="Title (optional, will use URL if empty)..."
              style={{ width: '100%', padding: '4px', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="button" onClick={submitWebItem} style={{ flex: 1, fontSize: '11px' }}>
                Create
              </button>
              <button className="button" onClick={() => { setShowWebInput(false); setWebUrl(''); setWebTitle(''); }} style={{ flex: 1, fontSize: '11px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SearchBar Component (T046) */}
      {activeWorkspace && (
        <SearchBar
          workspaceId={activeWorkspace.id}
          onItemSelect={handleSearchItemSelect}
        />
      )}

      <div className="workspace-tree">
        {activeWorkspace ? (
          folderTree.length > 0 ? (
            folderTree.map(node => (
              <FolderTreeNode
                key={node.folder.id}
                node={node}
                onOpenItem={(item) => {
                  setSelectedItemId(item.id);
                  onOpenItem(item);
                }}
                onRefresh={loadFolderTree}
                selectedItemId={selectedItemId}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>No folders yet. Create one to get started!</p>
            </div>
          )
        ) : (
          <div className="empty-state">
            <p>Select or create a workspace to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to count total items in folder tree
function countFolderItems(node: FolderNode): number {
  let count = node.items.length;
  for (const child of node.children) {
    count += countFolderItems(child);
  }
  return count;
}

interface FolderTreeNodeProps {
  node: FolderNode;
  onOpenItem: (item: Item) => void;
  onRefresh: () => void;
  selectedItemId: string | null;
}

function FolderTreeNode({ node, onOpenItem, onRefresh, selectedItemId }: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag & Drop handlers for folders (T048)
  function handleFolderDragStart(e: React.DragEvent, folderId: string) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'folder');
    e.dataTransfer.setData('folderId', folderId);
  }

  function handleItemDragStart(e: React.DragEvent, itemId: string, currentFolderId: string | null) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('type', 'item');
    e.dataTransfer.setData('itemId', itemId);
    e.dataTransfer.setData('currentFolderId', currentFolderId || 'null');
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only remove highlight if we're actually leaving this element
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }

  async function handleDrop(e: React.DragEvent, targetFolderId: string) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const type = e.dataTransfer.getData('type');

    try {
      if (type === 'item') {
        const itemId = e.dataTransfer.getData('itemId');
        const currentFolderId = e.dataTransfer.getData('currentFolderId');

        // Don't move if already in this folder
        if (currentFolderId === targetFolderId) {
          return;
        }

        await window.electronAPI.item.move(itemId, targetFolderId);
        onRefresh();
      } else if (type === 'folder') {
        const folderId = e.dataTransfer.getData('folderId');

        // Prevent dropping folder into itself
        if (folderId === targetFolderId) {
          alert('Cannot move folder into itself');
          return;
        }

        // Prevent circular reference (basic check - folder engine has more thorough validation)
        if (await wouldCreateCircular(folderId, targetFolderId)) {
          alert('Cannot create circular reference');
          return;
        }

        await window.electronAPI.folder.move(folderId, targetFolderId);
        onRefresh();
      }
    } catch (error) {
      console.error('Drop failed:', error);
      alert('Failed to move: ' + (error as Error).message);
    }
  }

  // Simple circular reference check (the backend has more thorough validation)
  async function wouldCreateCircular(folderId: string, targetFolderId: string): Promise<boolean> {
    // Check if targetFolderId is a descendant of folderId
    const checkDescendant = (searchNode: FolderNode, searchId: string): boolean => {
      if (searchNode.folder.id === searchId) return true;
      return searchNode.children.some(child => checkDescendant(child, searchId));
    };

    return checkDescendant(node, targetFolderId);
  }

  const itemCount = countFolderItems(node);

  return (
    <div className="folder-node">
      <div
        className={`folder-header ${isDragOver ? 'drag-over' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        draggable={true}
        onDragStart={(e) => handleFolderDragStart(e, node.folder.id)}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, node.folder.id)}
      >
        <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
        <span className="folder-name">{node.folder.name}</span>
        {itemCount > 0 && (
          <span className="folder-badge" style={{
            marginLeft: 'auto',
            background: '#007bff',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '10px'
          }}>
            {itemCount}
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="folder-children">
          {/* Render items */}
          {node.items.map(item => {
            const isSelected = item.id === selectedItemId;

            return (
              <div
                key={item.id}
                className="item-node"
                onClick={() => onOpenItem(item)}
                draggable={true}
                onDragStart={(e) => handleItemDragStart(e, item.id, item.folderId)}
                style={{
                  background: isSelected ? '#e3f2fd' : 'transparent',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}
              >
                <span className="item-icon">
                  {item.itemType === 'note' ? '📝' : '🌐'}
                </span>
                <span className="item-title">{item.title}</span>
              </div>
            );
          })}

          {/* Render child folders */}
          {node.children.map(childNode => (
            <FolderTreeNode
              key={childNode.folder.id}
              node={childNode}
              onOpenItem={onOpenItem}
              onRefresh={onRefresh}
              selectedItemId={selectedItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
