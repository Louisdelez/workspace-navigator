# Implementation Plan: Workspace Navigator

**Branch**: `003-workspace-navigator` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-workspace-navigator/spec.md`

## Summary

Workspace Navigator est une application desktop moderne combinant un navigateur web multi-onglets, un éditeur Markdown, et un panneau IA dans une interface unifiée style IDE. L'application utilise Electron avec React pour le renderer, SQLite pour le stockage local chiffré, et un système de webviews pour la navigation web et l'intégration IA. L'architecture suit un pattern modulaire avec séparation stricte entre main process, renderer, et core storage layer.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Framework**: Electron 28+ / React 18.2+ / Vite 5+
**Primary Dependencies**:
- Electron (desktop runtime avec BrowserView/WebContentsView)
- React 18.2+ (UI renderer)
- Vite (build tool)
- better-sqlite3 (SQLite binding natif)
- @lexical/react ou CodeMirror 6 (éditeur Markdown)

**Storage**: SQLite avec chiffrement at-rest (better-sqlite3 + sqlcipher ou encryption layer custom)
**Testing**: Vitest (unit), Playwright (E2E), couverture cible >70%
**Target Platform**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
**Project Type**: Desktop Electron (main/renderer/preload architecture)

**Performance Goals**:
- Lancement application: < 2 secondes (cold start)
- Ouverture onglet: < 200ms
- Recherche instantanée: < 100ms (10 000 items)
- Rendu UI: 60fps constant

**Constraints**:
- Offline-first (données locales uniquement)
- Pas de télémétrie
- Base de données chiffrée
- Sandbox webviews obligatoire

**Scale/Scope**:
- 10 000+ items dans le workspace
- 20+ onglets simultanés
- 3 panneaux redimensionnables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Security & Privacy

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| CEF/Webview instances with sandbox | PASS | Electron webContents avec sandbox: true |
| SQLite with encryption at rest | PASS | better-sqlite3 + encryption layer |
| No external data transmission | PASS | Offline-first, pas de télémétrie |
| AI providers via direct web access | PASS | Webview vers sites officiels (chat.openai.com, claude.ai) |
| Untrusted scripts blocked | PASS | CSP policies sur webviews |
| Dependencies audited | PASS | npm audit + quarterly review |

### II. Performance Standards (NON-NEGOTIABLE)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Launch < 2 seconds | TARGET | Lazy loading, code splitting |
| Tab creation < 200ms | TARGET | WebContentsView pool, deferred loading |
| Memory optimization via reuse | PASS | Webview pool pattern |
| Workspace caching | PASS | In-memory cache + indexed queries |
| Cross-platform performance parity | TARGET | Platform-specific builds, CI validation |

### III. Code Quality & Architecture

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Modular architecture | PASS | main/renderer/core/preload separation |
| Internal documentation | PASS | TSDoc + ADRs |
| Code review required | PASS | PR workflow |
| Test coverage >70% | TARGET | Vitest + Playwright |
| Naming standards | PASS | ESLint + Prettier |

### IV. Technical Standards & Compatibility

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Follow official CEF/Electron guidelines | PASS | Electron best practices |
| IDE patterns (VSCode, Cursor, Zed) | PASS | 3-column layout, tree view |
| MarkText isolated integration | N/A | Using Lexical/CodeMirror instead (sandboxed component) |
| Stable workspace schema with versioning | PASS | Migration system |
| Platform compatibility | PASS | Windows 10+, macOS 10.15+, Ubuntu 20.04+ |

### V. User Experience Principles

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Three-column layout preserved | PASS | Sidebar / Workspace / AI Panel |
| AI column persistently visible | PASS | Non-collapsible right panel |
| Full drag-and-drop support | PASS | React DnD |
| Daily folders YYYY-MM-DD | PASS | Auto-creation on navigation |
| Instant item reopening | PASS | Tab ↔ Item mapping |
| Keyboard shortcuts | PASS | Discoverable shortcuts |

### VI. Maintainability & Long-term Health

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Strict layer separation | PASS | Data/UI/Engine isolation |
| Minimal dependencies | PASS | Core deps only |
| Structured logging | PASS | JSON logs (pino/electron-log) |
| Schema versioning | PASS | Migration system |
| ADRs for architecture changes | PASS | docs/adr/ |
| Quarterly refactoring | PROCESS | Technical debt tracking |

**Constitution Check Result: PASS** - All gates satisfied, no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-workspace-navigator/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (IPC API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── main/                    # Electron main process
│   ├── index.ts             # Application entry point
│   ├── window-manager.ts    # Window lifecycle
│   ├── ipc-handlers.ts      # IPC API handlers
│   ├── webview-manager.ts   # WebContentsView pool & management
│   └── database/
│       ├── connection.ts    # SQLite connection (encrypted)
│       ├── migrations/      # Versioned schema migrations
│       └── repositories/    # Data access layer
│
├── preload/                 # Preload scripts (context bridge)
│   ├── index.ts             # Main preload
│   └── api.ts               # Exposed API definitions
│
├── renderer/                # React application
│   ├── App.tsx              # Root component
│   ├── components/
│   │   ├── Sidebar/         # Workspace tree
│   │   ├── TabsContainer/   # Tab bar + content area
│   │   ├── MarkdownEditor/  # Lexical/CodeMirror editor
│   │   ├── AIPanel/         # AI webview panel
│   │   └── ui/              # Shared UI components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management (Zustand)
│   ├── services/            # IPC client wrappers
│   └── styles/              # CSS/Theme tokens
│
├── core/                    # Shared business logic
│   ├── entities/            # Entity types (Folder, Item, Tab)
│   ├── events/              # Event bus
│   └── utils/               # Shared utilities
│
└── types/                   # TypeScript type definitions
    ├── ipc.ts               # IPC message types
    └── entities.ts          # Entity interfaces

tests/
├── unit/                    # Vitest unit tests
├── integration/             # Integration tests
└── e2e/                     # Playwright E2E tests
```

**Structure Decision**: Architecture Electron standard avec séparation main/renderer/preload. Le dossier `core/` contient la logique métier partagée entre processes. Cette structure suit les patterns établis par VSCode et Cursor.

## Implementation Phases

### Phase 0: Foundation & Environment

**Objectif**: Projet opérationnel, compilable et lançable

1. **Initialisation projet**
   - Architecture Electron + React + Vite
   - TypeScript strict mode
   - Structure dossiers: main / renderer / core / preload
   - Système de logs (electron-log)

2. **Setup technique**
   - SQLite (better-sqlite3)
   - Système de migrations DB
   - IPC sécurisé (contextBridge)
   - ESLint, Prettier, Husky

3. **UX Foundation**
   - Layout 3 panneaux (Sidebar / Workspace / AI Panel)
   - Typographies (Inter)
   - Theme system (dark-first)

**Livrables**: Projet compilable, documentation quickstart

### Phase 1: Infrastructure & Architecture

**Objectif**: Workspace engine fonctionnel avec DB stable

1. **Base de données & modèles**
   - Tables: workspaces, folders, items, session_state
   - Migrations versionnées
   - CASCADE deletes, contraintes intégrité
   - CRUD via Core Storage Layer

2. **Workspace Engine**
   - Gestion workspaces: création, switch, rename
   - Gestion arborescence: dossiers, items
   - Auto-organisation: dossiers par date
   - Détection doublons URL
   - Cache in-memory

3. **IPC API**
   - Contrats: workspaceAPI, itemAPI, tabAPI
   - Validation entrée/sortie (Zod)
   - Gestion erreurs standardisée

**Livrables**: Workspace engine, DB + IPC stables, tests unitaires (60%)

### Phase 2: Navigateur Web & Tabs

**Objectif**: Navigation web complète avec session restore

1. **Infrastructure tabs**
   - Création/fermeture/gestion onglets
   - Reconnexion item ↔ tab
   - Soft limit 20 onglets (warning UX)

2. **Intégration WebContentsView**
   - Navigation (back/forward/reload)
   - Barre URL minimaliste
   - Extraction: titre, favicon, URL
   - Détection changement page → update item

3. **Session Restore**
   - Sauvegarde automatique onglets ouverts
   - Récupération après crash
   - Validation état corrompu

**Livrables**: Navigation web complète, tabs < 200ms, session restore stable

### Phase 3: Éditeur Markdown

**Objectif**: Notes markdown persistantes et éditables

1. **Intégration éditeur**
   - Composant React (Lexical ou CodeMirror 6)
   - Mode plein panneau dans onglet

2. **Autosave**
   - Sauvegarde 500ms debounce
   - Indicateur "Saved at HH:MM:SS"
   - Stockage contenu dans DB

3. **UI/UX**
   - Toolbar moderne minimaliste
   - Rendu markdown épuré

**Livrables**: Notes persistantes, UX premium

### Phase 4: Panneau IA

**Objectif**: Panel IA stable multi-providers

1. **AI Webview Panel**
   - Webview isolée dédiée IA
   - Providers: ChatGPT, Claude, Gemini
   - Switch horizontal (pill buttons)

2. **Session persistence**
   - Cookies/sessions par provider
   - Recharge auto à l'ouverture

3. **UX Panel**
   - Animation open/close
   - Largeur fixée (360-400px)
   - Accessible depuis topbar

**Livrables**: Panel IA stable, intégration multi-providers

### Phase 5: UI/UX Moderne

**Objectif**: Interface premium dark mode

1. **Direction visuelle**
   - Neo-Minimal Dark OS
   - Glassmorphism subtil
   - Glow léger éléments actifs
   - Grilles & espacements constants

2. **Composants UI**
   - Sidebar (Workspace Tree)
   - Tabs + TabBar
   - Browser Container
   - Markdown UI
   - AI Panel
   - Settings modal

3. **Animations**
   - Expand/collapse folders (120-150ms)
   - Tab change (80-120ms)
   - Hover micro-interactions (40ms)

4. **Accessibilité**
   - Contrastes AA
   - Navigation clavier

**Livrables**: UI finale, design system + tokens

### Phase 6: Tests, Optimisation, Release

**Objectif**: Version 1.0 stable

1. **Tests**
   - Unitaires (70%+)
   - E2E Playwright
   - Tests performance

2. **Optimisations**
   - Lazy loading ressources
   - Réduction mémoire WebContentsView
   - Virtualisation arborescence

3. **Packaging**
   - Windows (.exe)
   - macOS (.dmg)
   - Linux (AppImage / deb)

**Livrables**: Release candidate, Version 1.0 stable

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance webviews (BrowserView) | High | Medium | Pooling, cleanup agressif, suspension webcontents inactifs |
| Taille workspace (10k+ items) | Medium | High | Virtualized list (react-window), lazy loading, indexed queries |
| Synchronisation onglet ↔ item | Medium | Medium | Event bus interne, mapping strict bidirectionnel |
| UX complexe (3 panneaux) | Low | Low | Design system cohérent, variations responsives |
| SQLite encryption performance | Medium | Low | Benchmark early, fallback to filesystem encryption |

## Complexity Tracking

> No constitution violations requiring justification. Architecture follows established patterns.
