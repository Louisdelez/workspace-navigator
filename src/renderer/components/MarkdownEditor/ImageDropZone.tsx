/**
 * Image Drop Zone Component (T034)
 * Handles drag & drop image insertion
 */

import React, { useState, useCallback, type DragEvent, type ReactNode } from 'react';

interface ImageDropZoneProps {
  children: ReactNode;
  workspaceId: string;
  onImageInserted: (markdownLink: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const MAX_SIZE_MB = 10;

export function ImageDropZone({
  children,
  workspaceId,
  onImageInserted,
  onError,
  disabled = false
}: ImageDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported format: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`
      };
    }

    // Check size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return {
        valid: false,
        error: `Image too large (${sizeMB.toFixed(1)}MB). Maximum: ${MAX_SIZE_MB}MB`
      };
    }

    return { valid: true };
  }, []);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    // Get file path from Electron's extended File object
    const filePath = (file as any).path;
    if (!filePath) {
      onError?.('Could not determine file path');
      return;
    }

    try {
      // Copy to workspace assets
      const result = await window.electronAPI.markdown.copyAsset({
        sourcePath: filePath,
        workspaceId,
        description: file.name.replace(/\.[^/.]+$/, '') // Filename without extension
      });

      if (result.success) {
        onImageInserted(result.markdownLink);
      } else {
        onError?.(result.message);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to insert image');
    }
  }, [disabled, workspaceId, onImageInserted, onError, validateFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    // Check if dragging files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, [disabled]);

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnter={handleDragEnter}
    >
      {children}
    </div>
  );
}

export default ImageDropZone;
