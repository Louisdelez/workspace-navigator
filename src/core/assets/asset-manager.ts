/**
 * Asset Manager (T009)
 * Handles image asset management for markdown notes
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_IMAGE_FORMATS = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
] as const;

export const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Types
// ============================================================================

export interface AssetInfo {
  originalPath: string;
  workspacePath: string;
  absolutePath: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: number;
}

export type CopyAssetResult = {
  success: true;
  assetPath: string;
  markdownLink: string;
} | {
  success: false;
  error: 'FILE_NOT_FOUND' | 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'COPY_FAILED';
  message: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Sanitize filename for safe filesystem use
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  let sanitized = filename
    .replace(/[/\\:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .trim();

  // Truncate if too long (max 200 chars without extension)
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);

  if (name.length > 200) {
    sanitized = name.slice(0, 200) + ext;
  }

  return sanitized;
}

/**
 * Generate unique filename with timestamp
 */
function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalFilename);
  return `${timestamp}-${sanitized}`;
}

// ============================================================================
// Asset Manager Class
// ============================================================================

export class AssetManager {
  private baseDataPath: string;

  constructor() {
    // Use Electron's userData path as base for workspaces
    this.baseDataPath = app.getPath('userData');
  }

  /**
   * Get the assets directory path for a workspace
   */
  getAssetPath(workspaceId: string): string {
    return path.join(this.baseDataPath, 'workspaces', workspaceId, 'assets', 'images');
  }

  /**
   * Ensure the assets directory exists
   */
  private ensureAssetDirectory(workspaceId: string): string {
    const assetDir = this.getAssetPath(workspaceId);
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }
    return assetDir;
  }

  /**
   * Validate an image file
   */
  private validateImage(sourcePath: string): { valid: true } | { valid: false; error: CopyAssetResult } {
    // Check file exists
    if (!fs.existsSync(sourcePath)) {
      return {
        valid: false,
        error: { success: false, error: 'FILE_NOT_FOUND', message: 'Source file not found' }
      };
    }

    // Check file extension/format
    const ext = path.extname(sourcePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: {
          success: false,
          error: 'INVALID_FORMAT',
          message: `Unsupported format: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`
        }
      };
    }

    // Check file size
    const stats = fs.statSync(sourcePath);
    if (stats.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: {
          success: false,
          error: 'FILE_TOO_LARGE',
          message: `Image size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds limit of 10MB`
        }
      };
    }

    return { valid: true };
  }

  /**
   * Copy an image asset to the workspace
   */
  async copyAsset(sourcePath: string, workspaceId: string, description?: string): Promise<CopyAssetResult> {
    // Validate the image
    const validation = this.validateImage(sourcePath);
    if (!validation.valid) {
      return validation.error;
    }

    try {
      // Ensure asset directory exists
      const assetDir = this.ensureAssetDirectory(workspaceId);

      // Generate unique filename
      const originalFilename = path.basename(sourcePath);
      let targetFilename = generateUniqueFilename(originalFilename);
      let targetPath = path.join(assetDir, targetFilename);

      // Handle collision (unlikely with timestamp, but just in case)
      let counter = 1;
      while (fs.existsSync(targetPath)) {
        const ext = path.extname(targetFilename);
        const name = path.basename(targetFilename, ext);
        targetFilename = `${name}-${counter}${ext}`;
        targetPath = path.join(assetDir, targetFilename);
        counter++;
      }

      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);

      // Generate relative path for markdown
      const relativePath = `assets/images/${targetFilename}`;
      const altText = description || path.basename(originalFilename, path.extname(originalFilename));
      const markdownLink = `![${altText}](${relativePath})`;

      return {
        success: true,
        assetPath: relativePath,
        markdownLink
      };
    } catch (error) {
      return {
        success: false,
        error: 'COPY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error copying file'
      };
    }
  }

  /**
   * Delete an asset from the workspace
   */
  async deleteAsset(assetPath: string, workspaceId: string): Promise<{ success: boolean; error?: string }> {
    // Security: Validate the path to prevent directory traversal
    if (assetPath.includes('..') || !assetPath.startsWith('assets/images/')) {
      return { success: false, error: 'Invalid asset path' };
    }

    const absolutePath = path.join(
      this.baseDataPath,
      'workspaces',
      workspaceId,
      assetPath
    );

    // Verify the file is within the workspace directory
    const workspaceDir = path.join(this.baseDataPath, 'workspaces', workspaceId);
    if (!absolutePath.startsWith(workspaceDir)) {
      return { success: false, error: 'Path traversal detected' };
    }

    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete asset'
      };
    }
  }

  /**
   * Get asset info for a file
   */
  getAssetInfo(assetPath: string, workspaceId: string): AssetInfo | null {
    const absolutePath = path.join(
      this.baseDataPath,
      'workspaces',
      workspaceId,
      assetPath
    );

    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    const stats = fs.statSync(absolutePath);
    const filename = path.basename(absolutePath);

    return {
      originalPath: assetPath,
      workspacePath: assetPath,
      absolutePath,
      filename,
      mimeType: getMimeType(absolutePath),
      size: stats.size,
      createdAt: stats.birthtimeMs
    };
  }

  /**
   * List all assets in a workspace
   */
  listAssets(workspaceId: string): string[] {
    const assetDir = this.getAssetPath(workspaceId);

    if (!fs.existsSync(assetDir)) {
      return [];
    }

    return fs.readdirSync(assetDir)
      .filter(file => SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()))
      .map(file => `assets/images/${file}`);
  }
}

// Export singleton instance
export const assetManager = new AssetManager();
