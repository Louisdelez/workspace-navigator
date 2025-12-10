/**
 * TitleBar Component (T043)
 * Custom window title bar with minimize, maximize, and close controls
 * Supports both frameless and native window styles
 */

import React, { useState, useEffect } from 'react';
import './TitleBar.css';

interface TitleBarProps {
  /** Application title */
  title?: string;
  /** Whether to show the title */
  showTitle?: boolean;
  /** Whether window is maximized (for toggle icon) */
  isMaximized?: boolean;
  /** Platform for control styling */
  platform?: 'win32' | 'darwin' | 'linux';
  /** Callback for minimize */
  onMinimize?: () => void;
  /** Callback for maximize/restore */
  onMaximize?: () => void;
  /** Callback for close */
  onClose?: () => void;
  /** Additional content to render in the title bar */
  children?: React.ReactNode;
  /** CSS class name */
  className?: string;
}

export function TitleBar({
  title = 'Workspace Navigator',
  showTitle = true,
  isMaximized = false,
  platform = detectPlatform(),
  onMinimize,
  onMaximize,
  onClose,
  children,
  className = ''
}: TitleBarProps) {
  const [internalMaximized, setInternalMaximized] = useState(isMaximized);

  // Update internal state when prop changes
  useEffect(() => {
    setInternalMaximized(isMaximized);
  }, [isMaximized]);

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      // Default Electron minimize
      window.electronAPI?.window?.minimize?.();
    }
  };

  const handleMaximize = () => {
    if (onMaximize) {
      onMaximize();
    } else {
      // Default Electron maximize/restore
      if (internalMaximized) {
        window.electronAPI?.window?.unmaximize?.();
      } else {
        window.electronAPI?.window?.maximize?.();
      }
      setInternalMaximized(!internalMaximized);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default Electron close
      window.electronAPI?.window?.close?.();
    }
  };

  // macOS style: controls on left
  if (platform === 'darwin') {
    return (
      <div className={`title-bar title-bar-darwin ${className}`}>
        <div className="title-bar-controls">
          <button
            className="title-bar-button title-bar-close"
            onClick={handleClose}
            aria-label="Close"
            title="Close"
          >
            <span className="title-bar-icon" />
          </button>
          <button
            className="title-bar-button title-bar-minimize"
            onClick={handleMinimize}
            aria-label="Minimize"
            title="Minimize"
          >
            <span className="title-bar-icon" />
          </button>
          <button
            className="title-bar-button title-bar-maximize"
            onClick={handleMaximize}
            aria-label={internalMaximized ? 'Restore' : 'Maximize'}
            title={internalMaximized ? 'Restore' : 'Maximize'}
          >
            <span className="title-bar-icon" />
          </button>
        </div>

        {showTitle && <div className="title-bar-title">{title}</div>}

        <div className="title-bar-content">
          {children}
        </div>
      </div>
    );
  }

  // Windows/Linux style: controls on right
  return (
    <div className={`title-bar title-bar-windows ${className}`}>
      <div className="title-bar-drag-region">
        {showTitle && <div className="title-bar-title">{title}</div>}
      </div>

      <div className="title-bar-content">
        {children}
      </div>

      <div className="title-bar-controls">
        <button
          className="title-bar-button title-bar-minimize"
          onClick={handleMinimize}
          aria-label="Minimize"
          title="Minimize"
        >
          <MinimizeIcon />
        </button>
        <button
          className="title-bar-button title-bar-maximize"
          onClick={handleMaximize}
          aria-label={internalMaximized ? 'Restore' : 'Maximize'}
          title={internalMaximized ? 'Restore' : 'Maximize'}
        >
          {internalMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          className="title-bar-button title-bar-close"
          onClick={handleClose}
          aria-label="Close"
          title="Close"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

// Icon components for Windows/Linux style
function MinimizeIcon() {
  return (
    <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
      <rect width="10" height="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="2.5" y="0.5" width="7" height="7" />
      <path d="M0.5 2.5V9.5H7.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M1 0L0 1L4 5L0 9L1 10L5 6L9 10L10 9L6 5L10 1L9 0L5 4L1 0Z" />
    </svg>
  );
}

// Detect platform
function detectPlatform(): 'win32' | 'darwin' | 'linux' {
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'darwin';
    if (platform.includes('win')) return 'win32';
  }
  return 'linux';
}

export default TitleBar;
