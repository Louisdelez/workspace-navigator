/**
 * Image Dialog Component (T035)
 * Modal for selecting and inserting images
 */

import React, { useState, useCallback } from 'react';

interface ImageDialogProps {
  isOpen: boolean;
  workspaceId: string;
  onInsert: (markdownLink: string) => void;
  onClose: () => void;
}

export function ImageDialog({
  isOpen,
  workspaceId,
  onInsert,
  onClose
}: ImageDialogProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectImage = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Open file selection dialog
      const selection = await window.electronAPI.markdown.selectImage();

      if (selection.cancelled) {
        setIsLoading(false);
        return;
      }

      // Copy to workspace
      const result = await window.electronAPI.markdown.copyAsset({
        sourcePath: selection.filePath,
        workspaceId,
        description: description || undefined
      });

      if (result.success) {
        onInsert(result.markdownLink);
        handleClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to insert image');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, description, onInsert]);

  const handleClose = useCallback(() => {
    setDescription('');
    setError(null);
    setIsLoading(false);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter') {
      handleSelectImage();
    }
  }, [handleClose, handleSelectImage]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose} onKeyDown={handleKeyDown} role="presentation">
      <div className="dialog-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="image-dialog-title">
        <div className="dialog-header">
          <h3 id="image-dialog-title">Insert Image</h3>
          <button className="dialog-close" onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="dialog-body">
          <div className="form-group">
            <label htmlFor="image-description">Description (alt text)</label>
            <input
              id="image-description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter image description..."
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSelectImage}
            disabled={isLoading}
          >
            {isLoading ? 'Selecting...' : 'Select Image'}
          </button>
        </div>
      </div>

      <style>{`
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .dialog-content {
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 400px;
          margin: 16px;
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .dialog-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .dialog-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--text-secondary, #666666);
          padding: 0;
          line-height: 1;
        }

        .dialog-close:hover {
          color: var(--text-primary, #1a1a1a);
        }

        .dialog-body {
          padding: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #666666);
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          font-size: 14px;
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #1a1a1a);
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-color, #2196f3);
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }

        .error-message {
          padding: 10px 12px;
          background: var(--bg-error, #ffebee);
          color: var(--text-error, #c62828);
          border-radius: 4px;
          font-size: 14px;
        }

        .dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .btn {
          padding: 10px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #e0e0e0);
          color: var(--text-primary, #1a1a1a);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-hover, #e8e8e8);
        }

        .btn-primary {
          background: var(--accent-color, #2196f3);
          border: 1px solid var(--accent-color, #2196f3);
          color: #ffffff;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--accent-hover, #1976d2);
          border-color: var(--accent-hover, #1976d2);
        }
      `}</style>
    </div>
  );
}

export default ImageDialog;
