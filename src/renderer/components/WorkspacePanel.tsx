/**
 * Workspace Panel Component
 * Left sidebar showing workspace selector and folder/item tree
 */

import React, { useState, useEffect } from 'react';
import type { Workspace, Folder, Item } from '../../types/entities';
import type { FolderNode } from '../../core/workspace/workspace-engine';

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
  const [inputValue, setInputValue] = useState('');

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
      const allWorkspaces = await window.electronAPI.workspace.getAll();
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
      const tree = await window.electronAPI.folder.getTree(activeWorkspace.id);
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
          <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
            <button className="button" onClick={() => setShowFolderInput(true)} style={{ flex: 1, fontSize: '11px' }}>
              New Folder
            </button>
            <button className="button" onClick={() => setShowNoteInput(true)} style={{ flex: 1, fontSize: '11px' }}>
              New Note
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
      </div>

      <div className="workspace-tree">
        {activeWorkspace ? (
          folderTree.length > 0 ? (
            folderTree.map(node => (
              <FolderTreeNode
                key={node.folder.id}
                node={node}
                onOpenItem={onOpenItem}
                onRefresh={loadFolderTree}
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

interface FolderTreeNodeProps {
  node: FolderNode;
  onOpenItem: (item: Item) => void;
  onRefresh: () => void;
}

function FolderTreeNode({ node, onOpenItem, onRefresh }: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="folder-node">
      <div className="folder-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
        <span className="folder-name">{node.folder.name}</span>
      </div>

      {isExpanded && (
        <div className="folder-children">
          {/* Render items */}
          {node.items.map(item => (
            <div
              key={item.id}
              className="item-node"
              onClick={() => onOpenItem(item)}
            >
              <span className="item-icon">
                {item.itemType === 'note' ? '📝' : '🌐'}
              </span>
              <span className="item-title">{item.title}</span>
            </div>
          ))}

          {/* Render child folders */}
          {node.children.map(childNode => (
            <FolderTreeNode
              key={childNode.folder.id}
              node={childNode}
              onOpenItem={onOpenItem}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
