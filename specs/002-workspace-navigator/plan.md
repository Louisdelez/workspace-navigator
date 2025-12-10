# Implementation Plan: Éditeur Markdown Avancé

**Branch**: `001-markdown` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-markdown/spec.md`

## Summary

Améliorer l'éditeur Markdown existant (`MarkdownEditor.tsx`) en un éditeur avancé avec rendu live, barre d'outils complète, numérotation des lignes, gestion d'images par drag & drop, support LaTeX, prévisualisation synchronisée et intégration complète avec le système d'onglets de Workspace Navigator. L'architecture s'appuie sur **Milkdown** (déjà en dépendance) comme moteur d'édition avec support de plugins pour étendre les fonctionnalités.

## Technical Context

**Language/Version**: TypeScript 5.3+ / React 18.2+
**Primary Dependencies**:
- Milkdown 7.17 (déjà installé: @milkdown/core, @milkdown/react, @milkdown/preset-commonmark, @milkdown/preset-gfm)
- KaTeX (à ajouter pour LaTeX)
- @milkdown/plugin-math (à ajouter pour intégration LaTeX)
**Storage**: SQLite via better-sqlite3 (existant) - table `items` avec champ `content`
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Windows 10+, macOS 12+, Ubuntu 20.04+ (Electron 30)
**Project Type**: Electron desktop app avec architecture main/renderer
**Performance Goals**:
- Rendu < 50ms par frappe
- Ouverture < 200ms
- 60 fps sur notes de 10 000 lignes
**Constraints**:
- Fonctionnement offline complet
- Aucune perte de données
- Autosave 500ms (existant via AutosaveManager)
**Scale/Scope**: Notes jusqu'à 10 000 lignes, images jusqu'à 10MB

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security & Privacy | PASS | Fonctionnement local-only, images copiées dans workspace, pas de transmission externe |
| II. Performance Standards | PASS | Tab creation < 200ms ciblé, rendu optimisé via virtualisation si nécessaire |
| III. Code Quality & Architecture | PASS | Architecture modulaire dans `src/renderer/components/MarkdownEditor/`, hooks séparés, tests requis |
| IV. Technical Standards | PASS | Utilisation de Milkdown (déjà en dépendance), patterns existants réutilisés |
| V. User Experience | PASS | Intégration onglets existants, toolbar familière type Word/Google Docs |
| VI. Maintainability | PASS | Séparation claire Data/UI/Logic, documentation API interne |

**Gate Result**: PASS - Aucune violation de la Constitution.

## Project Structure

### Documentation (this feature)

```text
specs/001-markdown/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ipc-api.md       # IPC channel specifications
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── renderer/
│   ├── components/
│   │   ├── MarkdownEditor/              # NEW: Restructured editor module
│   │   │   ├── index.tsx                # Main component (enhanced)
│   │   │   ├── MarkdownToolbar.tsx      # Toolbar component
│   │   │   ├── MarkdownPreview.tsx      # Preview pane component
│   │   │   ├── LineNumbers.tsx          # Line numbering component
│   │   │   ├── ImageDropZone.tsx        # Drag & drop image handler
│   │   │   ├── LinkDialog.tsx           # Link insertion dialog
│   │   │   ├── ImageDialog.tsx          # Image insertion dialog
│   │   │   └── styles.css               # Editor-specific styles
│   │   ├── TabsContainer.tsx            # MODIFY: Add enhanced markdown handling
│   │   └── MarkdownEditor.tsx           # DEPRECATED: Keep for migration
│   ├── hooks/
│   │   ├── useMarkdownEditor.ts         # NEW: Editor state management hook
│   │   ├── useMarkdownTransformations.ts # NEW: Text transformation utilities
│   │   └── useScrollSync.ts             # NEW: Editor/Preview scroll sync
│   └── utils/
│       └── markdown-transformers.ts     # NEW: Markdown transformation functions
├── main/
│   └── ipc-handlers.ts                  # MODIFY: Add asset management handlers
├── core/
│   ├── workspace/
│   │   ├── workspace-engine.ts          # MODIFY: Add asset folder management
│   │   └── autosave-manager.ts          # EXISTING: Reuse for markdown
│   └── assets/
│       └── asset-manager.ts             # NEW: Image asset management
├── preload/
│   └── index.ts                         # MODIFY: Expose asset APIs
└── types/
    └── entities.ts                      # MODIFY: Extend ItemMetadata

tests/
├── unit/
│   ├── markdown-transformers.test.ts
│   └── use-markdown-editor.test.ts
├── integration/
│   └── markdown-editor.test.ts
└── e2e/
    └── markdown-workflow.spec.ts
```

**Structure Decision**: Extension de l'architecture Electron existante avec un nouveau module `MarkdownEditor/` remplaçant le composant monolithique actuel. L'AssetManager sera un nouveau module dans `core/assets/` pour la gestion des images.

## Complexity Tracking

> No violations requiring justification - architecture follows existing patterns.

---

## 1. Vision & Positionnement de la Feature

### Rôle dans le Produit

L'Éditeur Markdown Avancé transforme Workspace Navigator d'un simple navigateur avec notes basiques en un **environnement de productivité intégré** où :
- **Recherche web** et **prise de notes** coexistent dans le même workflow
- Les utilisateurs peuvent documenter leurs recherches instantanément
- L'assistant IA peut interagir avec les notes (futur)

### Renforcement de l'Expérience Utilisateur

| Avant | Après |
|-------|-------|
| Notes basiques avec preview simple | Éditeur riche type Typora/MarkText |
| Pas de toolbar | Barre d'outils complète |
| Pas de gestion d'images | Drag & drop + copie automatique |
| Pas de numérotation | Numéros de ligne synchronisés |
| Preview séparé | Preview synchronisé avec scroll |

### Priorité Produit

- **P1**: Écriture markdown avec rendu live (core value)
- **P2**: Barre d'outils, autosave, intégration onglets
- **P3**: Images, numérotation, preview, liens
- **P4**: Formules LaTeX

---

## 2. Architecture Fonctionnelle

### 2.1 Composant MarkdownEditor

**Responsabilité**: Orchestrer tous les sous-composants de l'éditeur.

```
┌─────────────────────────────────────────────────────────┐
│                    MarkdownEditor                        │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │                 MarkdownToolbar                      │ │
│ │ [B] [I] [U] | [H1-H6] | [• ≡] | [" ] [</>] | [...] │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌──────────┬──────────────────────┬──────────────────┐ │
│ │  Line    │                      │                  │ │
│ │  Numbers │    Editor Pane       │  Preview Pane    │ │
│ │  ────    │    (Milkdown)        │  (Optional)      │ │
│ │  1       │                      │                  │ │
│ │  2       │                      │                  │ │
│ │  3       │                      │                  │ │
│ └──────────┴──────────────────────┴──────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Status: Saved at 14:32:05                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Toolbar

**Actions disponibles**:

| Groupe | Actions | Raccourci |
|--------|---------|-----------|
| Texte | Gras, Italique, Souligné, Barré | Ctrl+B, Ctrl+I, Ctrl+U |
| Titres | H1, H2, H3, H4, H5, H6 | Ctrl+1-6 |
| Listes | Puces, Numérotée | Ctrl+Shift+8, Ctrl+Shift+7 |
| Blocs | Citation, Code inline, Code block | Ctrl+Q, Ctrl+`, Ctrl+Shift+` |
| Insertions | Lien, Image, Math | Ctrl+K, Ctrl+Shift+I, Ctrl+M |
| Vue | Toggle Preview | Ctrl+P |

### 2.3 Preview avec Scroll Sync

- **Mode**: Split view (50/50) ou editor-only
- **Synchronisation**: Basée sur les positions de ligne (line mapping)
- **Rendu**: Milkdown renderer avec support GFM + Math

### 2.4 Gestion des Sélections

**Comportements**:
1. **Texte sélectionné** → Le formatage encapsule la sélection
2. **Curseur seul** → Les balises sont insérées à la position
3. **Multi-lignes** → Pour listes/citations, chaque ligne est préfixée

### 2.5 Gestion des Images

**Flux**:
1. Drag & drop / Bouton → Détection du fichier
2. Validation format (PNG, JPG, GIF, WebP) + taille (<10MB)
3. Copie vers `workspace/assets/images/{timestamp}-{filename}`
4. Insertion du lien markdown `![alt](assets/images/...)`
5. Gestion des collisions (suffixe numérique)

### 2.6 Autosave (Existant)

- **Debounce**: 500ms via `AutosaveManager`
- **Indicateur**: "Saved at HH:MM:SS"
- **Flush**: Avant fermeture onglet/app

### 2.7 Intégration Onglets

- Le type `'note'` existant est réutilisé
- `TabsContainer` route vers le nouveau `MarkdownEditor`
- Session restore préserve les onglets markdown
- Titre de l'onglet = premier H1 ou titre de l'item

### 2.8 Numérotation des Lignes

- Colonne fixe à gauche (width: 48px)
- Synchronisée avec le scroll de l'éditeur
- Lignes logiques (pas visuelles si wrap)

### 2.9 Support LaTeX

- **Inline**: `$...$` → KaTeX rendu inline
- **Block**: `$$...$$` → KaTeX rendu centré
- **Plugin Milkdown**: @milkdown/plugin-math

---

## 3. Architecture Technique

### 3.1 Structure des Composants

```typescript
// src/renderer/components/MarkdownEditor/index.tsx
interface MarkdownEditorProps {
  item: NoteItem;
  onUpdate: (content: string) => void;
  onTitleChange?: (title: string) => void;
}

// Hook principal
// src/renderer/hooks/useMarkdownEditor.ts
interface UseMarkdownEditorReturn {
  content: string;
  setContent: (content: string) => void;
  selection: Selection | null;
  applyTransformation: (type: TransformationType) => void;
  insertAtCursor: (text: string) => void;
  lastSaved: string | null;
  isDirty: boolean;
}
```

### 3.2 Intégration Milkdown

```typescript
// Configuration Milkdown avec plugins
import { Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { math } from '@milkdown/plugin-math'; // À ajouter

const editor = Editor.make()
  .config(ctx => {
    ctx.set(rootCtx, document.getElementById('editor'));
    ctx.set(listenerCtx, {
      markdown: [(getMarkdown) => {
        // Handle content changes
      }]
    });
  })
  .use(commonmark)
  .use(gfm)
  .use(math)
  .use(listener);
```

### 3.3 Transformateurs Markdown

```typescript
// src/renderer/utils/markdown-transformers.ts
type TransformationType =
  | 'bold' | 'italic' | 'underline' | 'strikethrough'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bulletList' | 'numberedList'
  | 'quote' | 'codeInline' | 'codeBlock'
  | 'link' | 'image' | 'math';

function applyTransformation(
  content: string,
  selection: { start: number; end: number },
  type: TransformationType
): { content: string; newSelection: { start: number; end: number } };
```

### 3.4 Nouveaux IPC Channels

```typescript
// Channels pour la gestion des assets
'markdown:copyAsset': (sourcePath: string, workspaceId: string) => Promise<string>
'markdown:getAssetPath': (workspaceId: string) => string
'markdown:deleteAsset': (assetPath: string) => Promise<void>
```

### 3.5 Interaction SQLite

**Table existante utilisée**:
```sql
-- items table, column: content (TEXT)
-- Le contenu markdown est stocké directement
-- updated_at est mis à jour automatiquement par trigger
```

**Extension ItemMetadata**:
```typescript
interface ItemMetadata {
  // Existants
  scrollPosition?: number;
  lastAccessedAt?: number;
  openCount?: number;
  customIcon?: string;
  // Nouveaux pour markdown
  editorScrollPosition?: number;
  previewEnabled?: boolean;
  cursorPosition?: number;
}
```

### 3.6 Événements TabManager

**Événements émis**:
- `'note:content-changed'` → Trigger autosave
- `'note:title-updated'` → Update tab title
- `'note:saved'` → Update save indicator (existant)
- `'note:save-failed'` → Show error (existant)

### 3.7 Crash Recovery

**Stratégie**:
1. Autosave fréquent (500ms debounce) garantit recovery
2. `AutosaveManager.flushAll()` appelé dans `app.on('before-quit')`
3. Contenu jamais perdu > 500ms après dernière frappe

---

## 4. Flux de Données (Data Flow)

### 4.1 Ouverture d'une Note Markdown

```
User double-click item
       │
       ▼
TabManager.openTab(itemId)
       │
       ├─► WorkspaceEngine.getItem(itemId)
       │         │
       │         ▼
       │   SQLite SELECT FROM items WHERE id = ?
       │         │
       │         ▼
       │   Return NoteItem { id, content, title, ... }
       │
       ▼
Create Tab { id, itemId, type: 'note', title }
       │
       ▼
Emit 'tab-event' { type: 'opened' }
       │
       ▼
TabsContainer receives event
       │
       ├─► isNoteItem(activeItem) ?
       │         │
       │         ▼
       │   Render <MarkdownEditor item={item} />
       │
       ▼
Milkdown initializes with item.content
```

### 4.2 Saisie et Transformation

```
User types / clicks toolbar
       │
       ▼
useMarkdownEditor.applyTransformation(type)
       │
       ▼
markdownTransformers.apply(content, selection, type)
       │
       ▼
Update local state
       │
       ├─► Milkdown re-renders (< 50ms)
       │
       ▼
Trigger autosave via electronAPI.autosave.schedule(itemId, content)
```

### 4.3 Autosave

```
Content changed
       │
       ▼
AutosaveManager.scheduleSave(itemId, content)
       │
       ▼
Debounce 500ms
       │
       ▼
AutosaveManager.executeSave()
       │
       ▼
WorkspaceEngine.updateItem(itemId, { content })
       │
       ▼
SQLite UPDATE items SET content = ?, updated_at = NOW()
       │
       ▼
Emit 'note:saved' { itemId, timestamp }
       │
       ▼
MarkdownEditor shows "Saved at HH:MM:SS"
```

### 4.4 Fermeture d'Onglet

```
User clicks close tab
       │
       ▼
AutosaveManager.flushSave(itemId)
       │
       ▼
TabManager.closeTab(tabId)
       │
       ▼
Emit 'tab-event' { type: 'closed' }
       │
       ▼
SessionManager.saveSession() (debounced)
```

### 4.5 Restauration au Lancement

```
App starts
       │
       ▼
SessionManager.restoreSession()
       │
       ▼
Get session_state from SQLite
       │
       ▼
For each itemId in open_tabs:
       │
       ├─► WorkspaceEngine.getItem(itemId)
       │
       ▼
TabManager.openTab(itemId)
       │
       ▼
Tabs restored with content
```

---

## 5. Interactions avec les Autres Modules

### 5.1 WorkspaceEngine

| Méthode | Usage |
|---------|-------|
| `getItem(id)` | Récupérer le contenu note |
| `updateItem(id, { content })` | Sauvegarder le contenu |
| `createNoteItem(workspaceId, title, content)` | Créer nouvelle note |

**Extension requise**:
```typescript
// Nouveau: Gestion du dossier assets
getAssetFolder(workspaceId: string): string
```

### 5.2 TabManager

| Interaction | Description |
|-------------|-------------|
| `openTab(itemId)` | Ouvre note dans nouvel onglet |
| `closeTab(tabId)` | Ferme onglet (flush autosave avant) |
| `switchTab(tabId)` | Change d'onglet actif |
| Tab title update | Via event 'note:title-updated' |

### 5.3 SessionState

| Champ | Usage |
|-------|-------|
| `open_tabs[]` | Liste des itemIds ouverts (notes incluses) |
| `active_tab_index` | Onglet actif à restaurer |

### 5.4 Event Bus (EventEmitter)

| Event | Emitter | Listener |
|-------|---------|----------|
| `note:saved` | AutosaveManager | MarkdownEditor (indicator) |
| `note:save-failed` | AutosaveManager | MarkdownEditor (error) |
| `tab-event` | TabManager | App, SessionManager |

### 5.5 Storage Layer

| Opération | Table | Colonnes |
|-----------|-------|----------|
| Read note | items | content |
| Write note | items | content, updated_at |
| Session | session_state | open_tabs |

---

## 6. Contraintes & Non-Fonctionnel

### 6.1 Performance

| Métrique | Cible | Méthode de validation |
|----------|-------|----------------------|
| Ouverture | < 200ms | Performance.now() dans test |
| Rendu/frappe | < 50ms | RequestAnimationFrame measurement |
| Scroll | 60 fps | Chrome DevTools Performance |
| Notes longues | 10k lignes fluide | Virtualisation si nécessaire |

### 6.2 Sécurité

- **Images**: Copiées dans workspace, pas de liens externes
- **Offline**: 100% fonctionnel sans réseau
- **Sanitization**: Le rendu HTML est géré par Milkdown (sécurisé)

### 6.3 Stabilité

- **Zero data loss**: Autosave + flush on close
- **Crash recovery**: Content persisted every 500ms
- **Graceful degradation**: Si Milkdown fail, fallback textarea

### 6.4 Cohérence UI

- Toolbar style cohérent avec l'app (même palette)
- Dark/Light mode support
- Transitions fluides (CSS)

### 6.5 Maintenabilité

- Composants découplés (toolbar, preview, editor)
- Hooks réutilisables
- Tests unitaires pour transformers
- Documentation inline (JSDoc)

---

## 7. Risques & Points d'Attention

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Notes très longues (>10k lignes) | Moyen | Performance | Virtualisation, lazy rendering |
| Images corrompues | Faible | Données | Validation à l'import, checksum |
| Crash entre deux autosaves | Faible | Perte 500ms | Acceptable, documenter |
| Scroll sync désynchronisé | Moyen | UX | Line mapping robuste, fallback |
| Chemins fichiers Windows vs Unix | Moyen | Cross-platform | path.normalize(), relative paths |
| Milkdown breaking changes | Faible | Maintenance | Version pinned, tests e2e |

---

## 8. Livrables Finals

### 8.1 Composants

- [ ] `MarkdownEditor/index.tsx` - Composant principal
- [ ] `MarkdownEditor/MarkdownToolbar.tsx` - Barre d'outils
- [ ] `MarkdownEditor/MarkdownPreview.tsx` - Preview pane
- [ ] `MarkdownEditor/LineNumbers.tsx` - Numérotation
- [ ] `MarkdownEditor/ImageDropZone.tsx` - Drag & drop
- [ ] `MarkdownEditor/LinkDialog.tsx` - Dialog lien
- [ ] `MarkdownEditor/ImageDialog.tsx` - Dialog image
- [ ] `MarkdownEditor/styles.css` - Styles dédiés

### 8.2 Hooks

- [ ] `useMarkdownEditor.ts` - State management
- [ ] `useMarkdownTransformations.ts` - Transformations
- [ ] `useScrollSync.ts` - Synchronisation scroll

### 8.3 Utilitaires

- [ ] `markdown-transformers.ts` - Fonctions de transformation
- [ ] `asset-manager.ts` - Gestion des images

### 8.4 IPC

- [ ] Handlers pour `markdown:copyAsset`, `markdown:getAssetPath`
- [ ] Preload API extensions

### 8.5 Tests

- [ ] Tests unitaires transformers (>80% coverage)
- [ ] Tests hooks (>70% coverage)
- [ ] Tests intégration editor
- [ ] Tests e2e workflow complet

### 8.6 Documentation

- [ ] JSDoc sur tous les exports publics
- [ ] README dans `MarkdownEditor/`
- [ ] Quickstart guide

---

## 9. Critères de Validation

### 9.1 Fonctionnels

| Critère | Test |
|---------|------|
| Tous les boutons toolbar fonctionnent | Test manuel + e2e |
| Sélection + formatage correct | Tests unitaires |
| Images drag & drop | Test e2e |
| Links clickables en preview | Test e2e |
| LaTeX rendu correct | Tests unitaires |
| Autosave indicator visible | Test e2e |

### 9.2 Non-Fonctionnels

| Critère | Test |
|---------|------|
| Aucune perte de données (crash) | Test de stress |
| Ouverture < 200ms | Performance test |
| 60 fps scroll sur 10k lignes | Chrome DevTools |
| Cross-platform (Win/Mac/Linux) | CI matrix |

### 9.3 UX

| Critère | Validation |
|---------|------------|
| Proche de MarkText/Typora | Review design |
| Intégration fluide onglets | Test utilisateur |
| Raccourcis clavier intuitifs | Documentation + test |

---

## Dependencies to Install

```bash
npm install katex @milkdown/plugin-math
npm install -D @types/katex
```

---

## Next Steps

1. **Phase 0**: Générer `research.md` avec décisions techniques
2. **Phase 1**: Générer `data-model.md`, `contracts/`, `quickstart.md`
3. **Phase 2**: Exécuter `/speckit.tasks` pour générer les tâches
