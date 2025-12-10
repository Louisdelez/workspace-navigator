# Data Model: Éditeur Markdown Avancé

**Feature**: 001-markdown
**Date**: 2025-12-09
**Status**: Complete

## Overview

L'Éditeur Markdown Avancé réutilise le modèle de données existant de Workspace Navigator. Aucun changement de schéma SQLite n'est requis. Ce document détaille les entités utilisées et les extensions mineures au niveau TypeScript.

---

## 1. Entités Existantes Utilisées

### 1.1 NoteItem (Existant)

Le type `NoteItem` existant est parfaitement adapté pour les notes markdown avancées.

```typescript
// src/types/entities.ts (EXISTANT - PAS DE MODIFICATION)
interface NoteItem extends Item {
  itemType: 'note';
  content: string; // Contenu Markdown stocké directement
}
```

**Stockage SQLite**:
```sql
-- Table items (existante)
-- Le contenu markdown est dans la colonne 'content'
-- Contrainte: item_type = 'note' AND content IS NOT NULL
```

### 1.2 ItemMetadata (Extension TypeScript)

Extension des métadonnées pour stocker les préférences de l'éditeur.

```typescript
// src/types/entities.ts (À MODIFIER)
interface ItemMetadata {
  // Existants
  scrollPosition?: number;
  lastAccessedAt?: number;
  openCount?: number;
  customIcon?: string;

  // NOUVEAUX pour l'éditeur markdown
  editorScrollPosition?: number;  // Position scroll de l'éditeur
  previewEnabled?: boolean;       // État du panneau preview (true/false)
  cursorPosition?: number;        // Position du curseur à restaurer
}
```

**Note**: Les métadonnées sont stockées en JSON dans la colonne `metadata` de la table `items`.

### 1.3 Tab (Existant)

Le type `Tab` existant supporte déjà les notes.

```typescript
// src/main/tab-manager.ts (EXISTANT - PAS DE MODIFICATION)
interface Tab {
  id: string;
  itemId: string;
  type: 'web' | 'note'; // 'note' utilisé pour markdown
  url?: string;
  title: string;
  favicon?: string | null;
  isLoading: boolean;
}
```

### 1.4 SessionState (Existant)

La session stocke déjà les onglets de notes.

```typescript
// src/types/entities.ts (EXISTANT - PAS DE MODIFICATION)
interface SessionState {
  id: 1;
  activeWorkspaceId: string | null;
  openTabs: string[]; // Array d'item IDs (notes incluses)
  activeTabIndex: number;
  aiProvider: 'chatgpt' | 'claude' | 'gemini' | 'none';
  windowState: WindowState;
  updatedAt: number;
}
```

---

## 2. Nouvelles Structures (Runtime Only)

Ces structures existent uniquement en mémoire, pas en base de données.

### 2.1 EditorState

État interne de l'éditeur markdown.

```typescript
// src/renderer/hooks/useMarkdownEditor.ts
interface EditorState {
  content: string;              // Contenu markdown actuel
  originalContent: string;      // Contenu au chargement (pour dirty check)
  selection: Selection | null;  // Sélection actuelle
  cursorPosition: number;       // Position du curseur
  isDirty: boolean;             // Modifications non sauvegardées
  lastSaved: string | null;     // Timestamp "HH:MM:SS" de dernière sauvegarde
  previewEnabled: boolean;      // Panneau preview visible
  editorScrollTop: number;      // Position scroll de l'éditeur
  previewScrollTop: number;     // Position scroll du preview
}

interface Selection {
  start: number;  // Index de début
  end: number;    // Index de fin
  text: string;   // Texte sélectionné
}
```

### 2.2 TransformationResult

Résultat d'une transformation markdown.

```typescript
// src/renderer/utils/markdown-transformers.ts
interface TransformationResult {
  content: string;              // Nouveau contenu après transformation
  newSelection: {
    start: number;
    end: number;
  };
}

type TransformationType =
  | 'bold'           // **text**
  | 'italic'         // *text*
  | 'underline'      // <u>text</u> (HTML)
  | 'strikethrough'  // ~~text~~
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'  // # to ######
  | 'bulletList'     // - item
  | 'numberedList'   // 1. item
  | 'quote'          // > text
  | 'codeInline'     // `code`
  | 'codeBlock'      // ```\ncode\n```
  | 'link'           // [text](url)
  | 'image'          // ![alt](path)
  | 'math';          // $formula$ or $$formula$$
```

### 2.3 LineMapping (Scroll Sync)

Mapping pour la synchronisation du scroll.

```typescript
// src/renderer/hooks/useScrollSync.ts
interface LineMapping {
  sourceLine: number;      // Numéro de ligne dans le source
  previewSelector: string; // Sélecteur CSS de l'élément preview correspondant
  offsetTop: number;       // Position Y dans le preview
}

interface ScrollSyncState {
  mappings: LineMapping[];
  isScrollingEditor: boolean;  // Flag pour éviter les boucles
  isScrollingPreview: boolean;
}
```

### 2.4 AssetInfo

Information sur un fichier image importé.

```typescript
// src/core/assets/asset-manager.ts
interface AssetInfo {
  originalPath: string;     // Chemin source (avant copie)
  workspacePath: string;    // Chemin relatif dans le workspace
  absolutePath: string;     // Chemin absolu après copie
  filename: string;         // Nom du fichier
  mimeType: string;         // image/png, image/jpeg, etc.
  size: number;             // Taille en bytes
  createdAt: number;        // Timestamp de création
}

// Formats supportés
const SUPPORTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
```

---

## 3. Relations entre Entités

```
┌─────────────────┐
│   Workspace     │
│    (existant)   │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐      ┌─────────────────┐
│     Folder      │◄─────│   NoteItem      │
│   (existant)    │ N:1  │   (existant)    │
└─────────────────┘      │                 │
                         │  content: string│ ← Markdown stocké ici
                         │  metadata: JSON │ ← Préférences éditeur
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  assets/images/ │  (fichiers système)
                         │   - image1.png  │
                         │   - image2.jpg  │
                         └─────────────────┘
```

---

## 4. Schéma SQLite (Existant - Pas de Modification)

```sql
-- Table items (extraite de schema.sql)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY NOT NULL CHECK(length(id) = 36),
  workspace_id TEXT NOT NULL,
  folder_id TEXT DEFAULT NULL,
  item_type TEXT NOT NULL CHECK(item_type IN ('web', 'note')), -- 'note' pour markdown
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  updated_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
  url TEXT DEFAULT NULL,
  favicon TEXT DEFAULT NULL,
  content TEXT DEFAULT NULL, -- Contenu Markdown ici
  metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)), -- Préférences JSON
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1)),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Contrainte existante pour les notes
CHECK(
  (item_type = 'note' AND content IS NOT NULL)
  OR (item_type = 'web' AND content IS NULL)
)
```

---

## 5. Validation Rules

### 5.1 NoteItem

| Field | Rule |
|-------|------|
| `content` | NOT NULL, peut être chaîne vide "" |
| `title` | NOT NULL, non vide après trim |
| `metadata` | JSON valide |

### 5.2 ItemMetadata (nouveaux champs)

| Field | Rule |
|-------|------|
| `editorScrollPosition` | number >= 0, optionnel |
| `previewEnabled` | boolean, défaut: true |
| `cursorPosition` | number >= 0, optionnel |

### 5.3 Assets

| Field | Rule |
|-------|------|
| `mimeType` | Un de: image/png, image/jpeg, image/gif, image/webp |
| `size` | <= 10MB (10485760 bytes) |
| `filename` | Sanitized (pas de caractères spéciaux OS) |

---

## 6. État Transitions

### 6.1 Note Lifecycle

```
┌──────────┐   createNoteItem()   ┌──────────┐
│  (none)  │ ──────────────────► │  Created │
└──────────┘                      └────┬─────┘
                                       │
                                       │ openTab()
                                       ▼
                                 ┌──────────┐
                              ┌──│  Opened  │──┐
                              │  └────┬─────┘  │
                        edit  │       │        │ close
                              ▼       │        ▼
                         ┌────────┐   │   ┌─────────┐
                         │  Dirty │   │   │ Closed  │
                         └───┬────┘   │   └─────────┘
                             │        │
                      save   │        │
                      (500ms)│        │
                             ▼        │
                         ┌────────┐   │
                         │  Saved │◄──┘
                         └────────┘
```

### 6.2 Editor State

```
┌─────────────┐
│ Initializing│
└──────┬──────┘
       │ content loaded
       ▼
┌─────────────┐   user types   ┌─────────────┐
│    Clean    │ ─────────────► │    Dirty    │
└──────▲──────┘                └──────┬──────┘
       │                              │
       │ autosave complete            │ 500ms debounce
       │                              │
       │         ┌─────────────┐      │
       └─────────│   Saving    │◄─────┘
                 └─────────────┘
```

---

## 7. Migration Notes

### 7.1 Aucune Migration SQL Requise

Le schéma existant supporte déjà tout ce dont nous avons besoin:
- `item_type = 'note'` existe
- `content TEXT` stocke le markdown
- `metadata JSON` stocke les préférences

### 7.2 Migration TypeScript

Seul changement: étendre l'interface `ItemMetadata` avec les nouveaux champs optionnels.

```typescript
// Avant
interface ItemMetadata {
  scrollPosition?: number;
  lastAccessedAt?: number;
  openCount?: number;
  customIcon?: string;
}

// Après
interface ItemMetadata {
  scrollPosition?: number;
  lastAccessedAt?: number;
  openCount?: number;
  customIcon?: string;
  // Nouveaux
  editorScrollPosition?: number;
  previewEnabled?: boolean;
  cursorPosition?: number;
}
```

Cette modification est **backward compatible** car tous les nouveaux champs sont optionnels.

---

## 8. Files Structure (Assets)

```
workspace/
└── assets/
    └── images/
        ├── 1702134567890-diagram.png
        ├── 1702134568123-screenshot.jpg
        └── 1702134569456-photo-1.webp
```

**Naming Convention**: `{timestamp}-{sanitized-original-name}.{ext}`

**Sanitization**:
- Remplacer espaces par `-`
- Supprimer caractères non-alphanumériques (sauf `-` et `.`)
- Convertir en minuscules
- Tronquer si > 200 caractères

---

## Summary

| Aspect | Decision |
|--------|----------|
| Schema changes | Aucun |
| New tables | Aucune |
| TypeScript changes | Extension de ItemMetadata (3 champs optionnels) |
| File storage | `workspace/assets/images/` pour les images |
| Backward compatibility | 100% compatible |
