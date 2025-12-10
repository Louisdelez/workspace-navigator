/**
 * Link Dialog Component (T045)
 * Modal for inserting hyperlinks
 */

import React, { useState, useCallback, useEffect } from 'react';

interface LinkDialogProps {
  isOpen: boolean;
  selectedText?: string;
  onInsert: (markdownLink: string) => void;
  onClose: () => void;
}

export function LinkDialog({
  isOpen,
  selectedText = '',
  onInsert,
  onClose
}: LinkDialogProps) {
  const [text, setText] = useState(selectedText);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setText(selectedText);
      setUrl('');
      setError(null);
    }
  }, [isOpen, selectedText]);

  const validateUrl = useCallback((urlString: string): boolean => {
    if (!urlString.trim()) {
      return false;
    }

    // Allow URLs starting with http://, https://, or protocol-relative
    if (urlString.startsWith('http://') || urlString.startsWith('https://') || urlString.startsWith('//')) {
      return true;
    }

    // Allow mailto: and tel: links
    if (urlString.startsWith('mailto:') || urlString.startsWith('tel:')) {
      return true;
    }

    // Allow relative paths
    if (urlString.startsWith('/') || urlString.startsWith('./') || urlString.startsWith('../')) {
      return true;
    }

    // Allow anchor links
    if (urlString.startsWith('#')) {
      return true;
    }

    return false;
  }, []);

  const handleInsert = useCallback(() => {
    setError(null);

    // Validate URL
    let finalUrl = url.trim();

    // Auto-prepend https:// if no protocol
    if (finalUrl && !validateUrl(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    if (!finalUrl) {
      setError('Please enter a URL');
      return;
    }

    const linkText = text.trim() || finalUrl;
    const markdownLink = `[${linkText}](${finalUrl})`;

    onInsert(markdownLink);
    handleClose();
  }, [text, url, validateUrl, onInsert]);

  const handleClose = useCallback(() => {
    setText('');
    setUrl('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInsert();
    }
  }, [handleClose, handleInsert]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose} onKeyDown={handleKeyDown} role="presentation">
      <div className="dialog-content" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="link-dialog-title">
        <div className="dialog-header">
          <h3 id="link-dialog-title">Insert Link</h3>
          <button className="dialog-close" onClick={handleClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="dialog-body">
          <div className="form-group">
            <label htmlFor="link-text">Link Text</label>
            <input
              id="link-text"
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter link text..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-url">URL</label>
            <input
              id="link-url"
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
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
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleInsert}>
            Insert Link
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

        .btn-secondary {
          background: var(--bg-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #e0e0e0);
          color: var(--text-primary, #1a1a1a);
        }

        .btn-secondary:hover {
          background: var(--bg-hover, #e8e8e8);
        }

        .btn-primary {
          background: var(--accent-color, #2196f3);
          border: 1px solid var(--accent-color, #2196f3);
          color: #ffffff;
        }

        .btn-primary:hover {
          background: var(--accent-hover, #1976d2);
          border-color: var(--accent-hover, #1976d2);
        }
      `}</style>
    </div>
  );
}

export default LinkDialog;
