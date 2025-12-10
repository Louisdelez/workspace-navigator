# IPC API Contracts: Éditeur Markdown Avancé

**Feature**: 001-markdown
**Date**: 2025-12-09
**Status**: Complete

## Overview

Ce document définit les contrats IPC (Inter-Process Communication) pour l'Éditeur Markdown Avancé. L'architecture Electron utilise des channels IPC pour la communication entre le processus renderer (React) et le processus main (Node.js).

---

## 1. Channels Existants Réutilisés

### 1.1 Autosave Channel

**Channel**: `autosave:schedule`

```typescript
// Preload (existant)
window.electronAPI.autosave.schedule(itemId: string, content: string): void

// Main handler (existant dans ipc-handlers.ts)
ipcMain.on('autosave:schedule', (event, itemId: string, content: string) => {
  autosaveManager.scheduleSave(itemId, content);
});
```

### 1.2 Workspace Channels

**Channels existants utilisés**:

```typescript
// Lecture d'item
window.electronAPI.workspace.getItem(itemId: string): Promise<Item | null>

// Mise à jour d'item
window.electronAPI.workspace.updateItem(itemId: string, updates: Partial<Item>): Promise<void>

// Création de note
window.electronAPI.workspace.createNoteItem(
  workspaceId: string,
  title: string,
  content: string,
  options?: { folderId?: string }
): Promise<NoteItem>
```

---

## 2. Nouveaux Channels pour Assets

### 2.1 Copy Asset

**Channel**: `markdown:copyAsset`

**Purpose**: Copier un fichier image dans le dossier assets du workspace.

**Request**:
```typescript
interface CopyAssetRequest {
  sourcePath: string;      // Chemin absolu du fichier source
  workspaceId: string;     // ID du workspace cible
  description?: string;    // Description optionnelle pour le alt text
}
```

**Response**:
```typescript
interface CopyAssetResponse {
  success: true;
  assetPath: string;       // Chemin relatif dans le workspace (e.g., "assets/images/...")
  markdownLink: string;    // Lien markdown complet: ![description](path)
}
| {
  success: false;
  error: 'FILE_NOT_FOUND' | 'INVALID_FORMAT' | 'FILE_TOO_LARGE' | 'COPY_FAILED';
  message: string;
}
```

**Preload Definition**:
```typescript
// src/preload/index.ts
markdown: {
  copyAsset: (request: CopyAssetRequest): Promise<CopyAssetResponse>
}

// Usage in renderer
const result = await window.electronAPI.markdown.copyAsset({
  sourcePath: '/path/to/image.png',
  workspaceId: 'uuid-xxx',
  description: 'Screenshot'
});
// Returns: { success: true, assetPath: 'assets/images/1702134567890-image.png', markdownLink: '![Screenshot](assets/images/1702134567890-image.png)' }
```

**Main Handler**:
```typescript
// src/main/ipc-handlers.ts
ipcMain.handle('markdown:copyAsset', async (event, request: CopyAssetRequest) => {
  try {
    // Validate file exists
    if (!fs.existsSync(request.sourcePath)) {
      return { success: false, error: 'FILE_NOT_FOUND', message: 'Source file not found' };
    }

    // Validate format
    const mimeType = getMimeType(request.sourcePath);
    if (!SUPPORTED_IMAGE_FORMATS.includes(mimeType)) {
      return { success: false, error: 'INVALID_FORMAT', message: `Unsupported format: ${mimeType}` };
    }

    // Validate size
    const stats = fs.statSync(request.sourcePath);
    if (stats.size > MAX_IMAGE_SIZE) {
      return { success: false, error: 'FILE_TOO_LARGE', message: 'Image exceeds 10MB limit' };
    }

    // Copy file
    const assetPath = await assetManager.copyAsset(request.sourcePath, request.workspaceId);
    const markdownLink = `![${request.description || 'image'}](${assetPath})`;

    return { success: true, assetPath, markdownLink };
  } catch (error) {
    return { success: false, error: 'COPY_FAILED', message: error.message };
  }
});
```

---

### 2.2 Get Asset Path

**Channel**: `markdown:getAssetPath`

**Purpose**: Obtenir le chemin absolu du dossier assets d'un workspace.

**Request**:
```typescript
interface GetAssetPathRequest {
  workspaceId: string;
}
```

**Response**:
```typescript
interface GetAssetPathResponse {
  path: string;  // Chemin absolu du dossier assets
}
```

**Preload Definition**:
```typescript
markdown: {
  getAssetPath: (workspaceId: string): Promise<string>
}

// Usage
const assetsPath = await window.electronAPI.markdown.getAssetPath('uuid-xxx');
// Returns: '/Users/name/Documents/Workspaces/MyWorkspace/assets/images'
```

---

### 2.3 Select Image File (Dialog)

**Channel**: `markdown:selectImage`

**Purpose**: Ouvrir un dialog natif pour sélectionner une image.

**Request**: None (no parameters)

**Response**:
```typescript
interface SelectImageResponse {
  cancelled: boolean;
  filePath?: string;  // Chemin absolu du fichier sélectionné (si non annulé)
}
```

**Preload Definition**:
```typescript
markdown: {
  selectImage: (): Promise<SelectImageResponse>
}

// Usage
const result = await window.electronAPI.markdown.selectImage();
if (!result.cancelled && result.filePath) {
  // User selected a file
}
```

**Main Handler**:
```typescript
ipcMain.handle('markdown:selectImage', async (event) => {
  const result = await dialog.showOpenDialog({
    title: 'Select Image',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { cancelled: true };
  }

  return { cancelled: false, filePath: result.filePaths[0] };
});
```

---

### 2.4 Delete Asset

**Channel**: `markdown:deleteAsset`

**Purpose**: Supprimer un fichier asset du workspace.

**Request**:
```typescript
interface DeleteAssetRequest {
  assetPath: string;     // Chemin relatif (e.g., "assets/images/xxx.png")
  workspaceId: string;
}
```

**Response**:
```typescript
interface DeleteAssetResponse {
  success: boolean;
  error?: string;
}
```

**Preload Definition**:
```typescript
markdown: {
  deleteAsset: (request: DeleteAssetRequest): Promise<DeleteAssetResponse>
}
```

---

## 3. Event Channels (Renderer ← Main)

### 3.1 Save Events (Existants)

```typescript
// Emis par AutosaveManager, écouté dans MarkdownEditor
window.electronAPI.on('note:saved', (data: { itemId: string; timestamp: string }) => {
  // Update save indicator
});

window.electronAPI.on('note:save-failed', (data: { itemId: string; error: string }) => {
  // Show error notification
});
```

---

## 4. Type Guards & Validation

### 4.1 Supported Image Formats

```typescript
const SUPPORTED_IMAGE_FORMATS = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
] as const;

type SupportedImageFormat = typeof SUPPORTED_IMAGE_FORMATS[number];

function isSupportedImageFormat(mimeType: string): mimeType is SupportedImageFormat {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType as SupportedImageFormat);
}
```

### 4.2 Asset Path Validation

```typescript
function isValidAssetPath(path: string): boolean {
  // Must start with 'assets/'
  // No path traversal (..)
  // Valid filename characters only
  return /^assets\/images\/[\w\-\.]+\.(png|jpg|jpeg|gif|webp)$/i.test(path);
}
```

---

## 5. Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `FILE_NOT_FOUND` | Source file doesn't exist | Check path, retry |
| `INVALID_FORMAT` | Unsupported image format | Use PNG/JPG/GIF/WebP |
| `FILE_TOO_LARGE` | Image > 10MB | Compress or use smaller image |
| `COPY_FAILED` | File system error | Check permissions, disk space |
| `WORKSPACE_NOT_FOUND` | Invalid workspace ID | Verify workspace exists |

---

## 6. Security Considerations

### 6.1 Path Validation

- All paths must be validated to prevent path traversal attacks
- `sourcePath` must be an absolute path to an existing file
- `assetPath` must be within the workspace directory

### 6.2 File Type Validation

- MIME type validated from file header (not just extension)
- Only whitelisted formats accepted
- Size limit enforced (10MB)

### 6.3 Sandbox Compliance

- All file operations through IPC (renderer cannot access filesystem directly)
- Dialog operations handled by main process
- No arbitrary file execution

---

## 7. Preload API Surface

```typescript
// Complete markdown API exposed to renderer
interface MarkdownAPI {
  copyAsset: (request: CopyAssetRequest) => Promise<CopyAssetResponse>;
  getAssetPath: (workspaceId: string) => Promise<string>;
  selectImage: () => Promise<SelectImageResponse>;
  deleteAsset: (request: DeleteAssetRequest) => Promise<DeleteAssetResponse>;
}

// In contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing APIs
  markdown: {
    copyAsset: (request) => ipcRenderer.invoke('markdown:copyAsset', request),
    getAssetPath: (workspaceId) => ipcRenderer.invoke('markdown:getAssetPath', workspaceId),
    selectImage: () => ipcRenderer.invoke('markdown:selectImage'),
    deleteAsset: (request) => ipcRenderer.invoke('markdown:deleteAsset', request),
  }
});
```

---

## 8. Usage Examples

### 8.1 Drag & Drop Image

```typescript
// In ImageDropZone.tsx
async function handleDrop(event: DragEvent) {
  const file = event.dataTransfer.files[0];
  if (!file) return;

  // Get file path (Electron provides path for dropped files)
  const filePath = (file as any).path;

  const result = await window.electronAPI.markdown.copyAsset({
    sourcePath: filePath,
    workspaceId: currentWorkspaceId,
    description: file.name.replace(/\.[^/.]+$/, '') // Filename without extension
  });

  if (result.success) {
    insertAtCursor(result.markdownLink);
  } else {
    showError(`Failed to insert image: ${result.message}`);
  }
}
```

### 8.2 Image Dialog Button

```typescript
// In MarkdownToolbar.tsx
async function handleInsertImage() {
  const selection = await window.electronAPI.markdown.selectImage();
  if (selection.cancelled) return;

  const result = await window.electronAPI.markdown.copyAsset({
    sourcePath: selection.filePath!,
    workspaceId: currentWorkspaceId,
  });

  if (result.success) {
    insertAtCursor(result.markdownLink);
  }
}
```

---

## Summary

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `autosave:schedule` | Renderer → Main | Schedule debounced save (existing) |
| `markdown:copyAsset` | Renderer → Main | Copy image to workspace |
| `markdown:getAssetPath` | Renderer → Main | Get assets directory path |
| `markdown:selectImage` | Renderer → Main | Open file selection dialog |
| `markdown:deleteAsset` | Renderer → Main | Delete an asset file |
| `note:saved` | Main → Renderer | Save completion notification (existing) |
| `note:save-failed` | Main → Renderer | Save error notification (existing) |
