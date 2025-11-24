# Workspace Navigator

A cross-platform desktop application combining web browser, Markdown editor, and AI assistant in an IDE-style workspace.

## 🎯 Overview

Workspace Navigator uses Electron BrowserView API to provide native Chromium rendering for web content, React for the UI, and SQLite for local data persistence. The application organizes web pages and Markdown notes in hierarchical workspaces with automatic session restoration.

### ✨ Features

1. **Workspace Management**
   - Create and switch between multiple workspaces
   - Automatic workspace persistence
   - Session restore on application restart

2. **Hierarchical Organization**
   - Folder creation and nesting
   - Automatic date-based folders (YYYY-MM-DD format)
   - Drag-and-drop support for reorganization

3. **Content Types**
   - **Web Items**: Save and browse web pages with Electron BrowserView
   - **Note Items**: Markdown editing with live autosave (500ms debounce)

4. **Three-Column Layout**
   - Left: Workspace tree (folders + items)
   - Center: Tabbed content area
   - Right: AI assistant panel (ChatGPT/Claude/Gemini)

5. **Data Persistence**
   - SQLite database (better-sqlite3) with ACID guarantees
   - Automatic schema initialization and migrations
   - Session state persistence (tabs, workspace, window state)

6. **Business Logic**
   - Duplicate URL detection (same URL, same day, same folder)
   - Auto date folder creation
   - Autosave with 500ms debounce + timestamp indicator

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ WorkspaceEngine  →  Database Layer  →  SQLite          │ │
│  │ (Business Logic)    (better-sqlite3)    (workspace.db) │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕ IPC                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Renderer Process (React)                   │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
│  │  │Workspace │  │ Tabs         │  │ AI Panel         │ │ │
│  │  │Panel     │  │ (Markdown/   │  │ (iframe to AI    │ │ │
│  │  │(Tree)    │  │  Web iframes)│  │  providers)      │ │ │
│  │  └──────────┘  └──────────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 🚧 Implementation Status

**Phase 1: Project Setup (COMPLETE)** ✅
- CEF removed in favor of Electron BrowserView
- Build system configured
- Testing infrastructure set up
- Documentation complete

**Phase 2-9: In Progress**
- Core infrastructure implementation
- BrowserView integration
- Workspace features
- Advanced features (search, tags, themes)

## 🚀 Quick Start

For detailed setup instructions, see [Development Quickstart Guide](specs/001-workspace-navigator/quickstart.md).

### Prerequisites

- Node.js 20.x LTS
- npm 10.x+
- Git 2.40+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Navigateur

# Install dependencies
npm install

# Rebuild native modules (if needed)
npx electron-rebuild
```

### Running

#### Development Mode

```bash
npm run electron:dev
```

This starts:
1. Vite dev server (http://localhost:5173)
2. TypeScript compilation
3. Electron with DevTools

#### Production Build

```bash
npm run build            # Build application
npm run electron:build   # Package for distribution
```

Output: `release/` directory with platform-specific installers

## 📁 Project Structure

```
workspace-navigator/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Entry point
│   │   ├── browser-view-manager.ts  # BrowserView lifecycle
│   │   ├── window-manager.ts        # Window state
│   │   ├── ipc-handlers.ts          # IPC handlers
│   │   └── menu.ts                  # Application menus
│   │
│   ├── preload/                 # Preload scripts
│   │   └── index.ts             # Electron API bridge
│   │
│   ├── renderer/                # React UI
│   │   ├── App.tsx              # Root component
│   │   ├── components/          # UI components
│   │   │   ├── WorkspacePanel.tsx
│   │   │   ├── TabsContainer.tsx
│   │   │   ├── MarkdownEditor.tsx
│   │   │   ├── WebView.tsx
│   │   │   └── AIPanel.tsx
│   │   ├── styles/
│   │   │   └── index.css        # Global styles
│   │   └── index.tsx            # Renderer entry
│   │
│   ├── core/                    # Business logic
│   │   ├── workspace/
│   │   │   └── workspace-engine.ts  # Core workspace logic
│   │   └── storage/
│   │       ├── database.ts      # SQLite wrapper
│   │       └── schema.sql       # Database schema
│   │
│   └── types/                   # TypeScript types
│       ├── entities.ts          # Data models
│       └── electron.d.ts        # Window API types
│
├── specs/                       # Feature specifications
│   └── 001-workspace-navigator/
│       ├── spec.md              # Requirements
│       ├── plan.md              # Architecture
│       ├── tasks.md             # Implementation tasks
│       ├── data-model.md        # Database design
│       ├── research.md          # Technology decisions
│       └── quickstart.md        # Development guide
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md                    # This file
```

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm test                  # Watch mode
npm test -- --run         # Run once
npm run test:ui           # Visual UI
npm run test:coverage     # With coverage

# E2E tests (Playwright)
npm run test:e2e

# Code quality
npm run lint              # Check linting
npm run format            # Auto-format
```

## 🔧 Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run electron:dev` | Start Electron in development mode |
| `npm run build` | Build production bundle |
| `npm run electron:build` | Package application |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |

### Database Location

```
# macOS
~/Library/Application Support/workspace-navigator/workspace.db

# Windows
%APPDATA%\workspace-navigator\workspace.db

# Linux
~/.config/workspace-navigator/workspace.db
```

You can inspect the database using [DB Browser for SQLite](https://sqlitebrowser.org/).

## ✨ Key Features Demonstration

### 1. Workspace Creation & Management

```typescript
// Automatically handled through UI
// Click "+" button → Enter name → Workspace created
// All workspaces persisted in SQLite
```

### 2. Automatic Date Folders (FR-005)

```typescript
// When creating a web item or note:
// - If no folder specified
// - System creates "22.11.2025" folder automatically
// - Item placed in that folder
// - Same folder reused for all items created today
```

### 3. Duplicate Detection (FR-002a)

```typescript
// When navigating to a URL:
// 1. Check if same URL exists
// 2. Check if created today
// 3. Check if in same folder
// → If all true: focus existing tab
// → Otherwise: create new item
```

### 4. Autosave (FR-015)

```typescript
// Markdown editor:
// - 500ms debounce after typing stops
// - Automatic save to database
// - "Saved at HH:MM:SS" timestamp displayed
```

### 5. Session Persistence (FR-003c)

```typescript
// On app close:
// - Active workspace ID saved
// - All open tab IDs saved
// - Active tab index saved
// - AI provider selection saved
// - Window position/size saved

// On app restart:
// - All state restored
// - Tabs reopened
// - Same workspace activated
```

## 📊 Database Schema

See `src/core/storage/schema.sql` for complete schema.

**Key tables:**
- `workspaces` - Workspace metadata
- `folders` - Folder hierarchy (with self-referential parent_id)
- `items` - Web and note items (polymorphic via item_type)
- `tags` - Tags (not yet connected in UI)
- `item_tags` - Many-to-many relationship
- `session_state` - Singleton for session persistence

## 🎨 UI Customization

### Theme Support

The CSS uses CSS variables for theming. To enable dark mode:

```javascript
// Add to workspace settings
document.documentElement.setAttribute('data-theme', 'dark');
```

### Customizing Layout

```css
/* In src/renderer/styles/index.css */
:root {
  --sidebar-width: 280px;  /* Adjust workspace panel width */
  --ai-panel-width: 400px;  /* Adjust AI panel width */
}
```

## 🗺️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ BrowserViewManager  →  WorkspaceEngine  →  Database    │ │
│  │ (BrowserView pool)     (Business Logic)    (SQLite)    │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕ IPC                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Renderer Process (React)                   │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐ │ │
│  │  │Workspace │  │ Tabs         │  │ AI Panel         │ │ │
│  │  │Panel     │  │ (BrowserView/│  │ (AI provider     │ │ │
│  │  │(Tree)    │  │  Markdown)   │  │  iframe)         │ │ │
│  │  └──────────┘  └──────────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Electron 30+**: BrowserView API for native Chromium rendering
- **React 18**: UI framework with hooks
- **TypeScript 5.3**: Type-safe development
- **SQLite (better-sqlite3)**: Local database
- **Vite**: Dev server and bundler
- **Vitest + Playwright**: Testing stack

## 📚 Documentation

- **[Quickstart Guide](specs/001-workspace-navigator/quickstart.md)** - Development setup
- **[Specification](specs/001-workspace-navigator/spec.md)** - Feature requirements
- **[Implementation Plan](specs/001-workspace-navigator/plan.md)** - Architecture details
- **[Tasks](specs/001-workspace-navigator/tasks.md)** - Development roadmap
- **[Data Model](specs/001-workspace-navigator/data-model.md)** - Database schema

## 🛣️ Roadmap

See [tasks.md](specs/001-workspace-navigator/tasks.md) for detailed implementation phases:

1. **Phase 1**: Project Setup (COMPLETE) ✅
2. **Phase 2**: Core Infrastructure
3. **Phase 3**: Workspace Management
4. **Phase 4**: BrowserView Integration & Tabs
5. **Phase 5**: Markdown Editor
6. **Phase 6**: AI Assistant Panel
7. **Phase 7**: Advanced Features
8. **Phase 8**: Performance & Security
9. **Phase 9**: Documentation & Release

## 📚 Documentation

- **Specification**: `specs/001-workspace-navigator/spec.md`
- **Architecture**: `specs/001-workspace-navigator/plan.md`
- **Tasks**: `specs/001-workspace-navigator/tasks.md`
- **Data Model**: `specs/001-workspace-navigator/data-model.md`
- **Technology Decisions**: `specs/001-workspace-navigator/research.md`
- **Development Guide**: `specs/001-workspace-navigator/quickstart.md`

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

1. **Read the docs**: Start with [quickstart.md](specs/001-workspace-navigator/quickstart.md)
2. **Pick a task**: Check [tasks.md](specs/001-workspace-navigator/tasks.md) for open tasks
3. **Follow conventions**:
   - TypeScript strict mode
   - ESLint + Prettier for code style
   - Write tests for new features
   - Document public APIs with TSDoc
4. **Test before committing**:
   ```bash
   npm run lint
   npm test -- --run
   npm run build
   ```
5. **Create PR**: Follow existing patterns and architecture

## 📝 License

MIT

## 🙏 Built With

- [Electron 30+](https://www.electronjs.org/) - Cross-platform desktop framework
- [React 18](https://react.dev/) - UI framework
- [TypeScript 5.3](https://www.typescriptlang.org/) - Type-safe JavaScript
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Synchronous SQLite
- [Vite](https://vite.dev/) - Build tool and dev server
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing

---

**Status**: Phase 1 Complete - Ready for feature implementation

For questions, issues, or detailed documentation, see `specs/001-workspace-navigator/`.
