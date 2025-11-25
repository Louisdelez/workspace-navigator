# Workspace Navigator

A powerful cross-platform desktop application combining web browsing, Markdown editing, and AI assistance in an organized workspace environment.

## 🎯 Overview

Workspace Navigator is an Electron-based application that helps you organize web research, notes, and AI interactions in structured workspaces. Built with React, TypeScript, and SQLite for a fast, native desktop experience.

### ✨ Key Features

#### 🗂️ **Workspace Management**
- Create multiple isolated workspaces (Work, Personal, Research, etc.)
- Switch between workspaces with full tab isolation
- Delete workspaces with confirmation and item count
- Automatic session persistence and restoration

#### 📁 **Hierarchical Organization**
- Create folders and nested subfolders
- Automatic date-based folder creation (YYYY-MM-DD)
- Drag & drop items and folders for easy reorganization
- Circular reference prevention for folder moves

#### 🔍 **Advanced Search**
- Full-text search across titles, URLs, and content
- 300ms debounced search with instant results
- Keyboard navigation (↑↓ arrows, Enter, Escape)
- Smart ranking: exact match > starts-with > contains

#### 🏷️ **Tag System**
- Create colored tags for items (10 preset colors)
- Add/remove tags with one click
- Tag-based filtering and organization
- Tags persist per workspace

#### 📝 **Content Types**
- **Web Items**: Native Chromium rendering via Electron BrowserView
- **Note Items**: Markdown editor with live preview and syntax highlighting
- Automatic duplicate URL detection (same URL + same day + same folder)
- Auto-save with 500ms debounce

#### 🎨 **Theming & UI**
- Light and dark theme support
- Automatic system theme detection
- Theme persistence in localStorage
- Toggle with one click (🌙/☀️ button)

#### ⌨️ **Keyboard Shortcuts**
- `Ctrl/Cmd+W`: Close active tab
- `Ctrl/Cmd+R`: Reload active tab
- `Alt+←`: Go back
- `Alt+→`: Go forward
- `F1`: Show keyboard shortcuts help
- `Escape`: Close dialogs

#### 🤖 **AI Assistant Integration**
- Side panel for ChatGPT, Claude, or Gemini
- Custom AI provider URL support
- Persistent AI provider selection
- Isolated iframe rendering

#### 🗄️ **Data Management**
- SQLite database with full ACID guarantees
- Automatic schema initialization and migrations
- Session state persistence (tabs, workspace, window state)
- Optimized with comprehensive database indexes

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x LTS or higher
- **npm** 10.x or higher
- **Git** 2.40 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Louisdelez/workspace-navigator.git
cd workspace-navigator

# Install dependencies
npm install

# Rebuild native modules (if needed)
npx electron-rebuild
```

### Running the Application

#### Development Mode

```bash
npm run electron:dev
```

This starts:
1. Vite dev server (http://localhost:5173)
2. TypeScript compilation in watch mode
3. Electron application
4. DevTools can be opened with `Ctrl+Shift+I`

#### Production Build

```bash
# Build all components
npm run build

# Package for distribution
npm run electron:build
```

Output: `release/` directory with platform-specific installers

## 📁 Project Structure

```
workspace-navigator/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # Application entry point
│   │   ├── browser-view-manager.ts    # BrowserView lifecycle
│   │   ├── window-manager.ts          # Window state management
│   │   ├── tab-manager.ts             # Tab operations
│   │   ├── session-manager.ts         # Session persistence
│   │   ├── ipc-handlers.ts            # IPC communication
│   │   └── menu.ts                    # Application menus
│   │
│   ├── preload/                       # Preload scripts
│   │   └── index.ts                   # Secure API bridge
│   │
│   ├── renderer/                      # React UI
│   │   ├── App.tsx                    # Root component
│   │   ├── components/                # UI components
│   │   │   ├── WorkspacePanel.tsx     # Left sidebar
│   │   │   ├── TabsContainer.tsx      # Center area
│   │   │   ├── TabBar.tsx             # Tab management
│   │   │   ├── NavigationBar.tsx      # Web navigation
│   │   │   ├── MarkdownEditor.tsx     # Markdown editing
│   │   │   ├── AIPanel.tsx            # AI assistant
│   │   │   ├── SearchBar.tsx          # Search component
│   │   │   ├── TagEditor.tsx          # Tag management
│   │   │   ├── ThemeSwitcher.tsx      # Theme toggle
│   │   │   └── ShortcutsHelp.tsx      # Keyboard shortcuts dialog
│   │   ├── hooks/
│   │   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts hook
│   │   ├── styles/
│   │   │   └── index.css              # Global styles
│   │   └── index.tsx                  # Renderer entry
│   │
│   ├── core/                          # Business logic
│   │   ├── workspace/
│   │   │   ├── workspace-engine.ts    # Core workspace operations
│   │   │   ├── autosave-manager.ts    # Autosave logic
│   │   │   ├── duplication-detector.ts # Duplicate URL detection
│   │   │   ├── folder-manager.ts      # Folder operations
│   │   │   └── item-manager.ts        # Item operations
│   │   ├── storage/
│   │   │   ├── database.ts            # SQLite wrapper
│   │   │   ├── schema.sql             # Database schema
│   │   │   └── cache.ts               # In-memory cache
│   │   └── logging/
│   │       ├── logger.ts              # Logging utilities
│   │       └── error-handler.ts       # Error handling
│   │
│   └── types/                         # TypeScript definitions
│       ├── entities.ts                # Data models
│       ├── contracts.ts               # Service interfaces
│       └── electron.d.ts              # Window API types
│
├── tests/                             # Test suite
│   ├── e2e/                           # End-to-end tests
│   ├── unit/                          # Unit tests
│   └── fixtures/                      # Test fixtures
│
├── specs/                             # Documentation
│   └── 001-workspace-navigator/
│       ├── spec.md                    # Requirements
│       ├── plan.md                    # Architecture
│       ├── tasks.md                   # Implementation roadmap
│       ├── data-model.md              # Database design
│       ├── research.md                # Technology decisions
│       └── quickstart.md              # Development guide
│
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript config
├── vite.config.ts                     # Vite config
├── vitest.config.ts                   # Vitest config
├── playwright.config.ts               # Playwright config
└── README.md                          # This file
```

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm test                     # Watch mode
npm test -- --run            # Run once
npm run test:ui              # Visual UI
npm run test:coverage        # With coverage

# E2E tests (Playwright)
npm run test:e2e

# Code quality
npm run lint                 # Check linting
npm run format               # Auto-format with Prettier
```

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run electron:dev` | Start Electron in development mode |
| `npm run build` | Build production bundle |
| `npm run build:main` | Build main process only |
| `npm run build:renderer` | Build renderer only |
| `npm run electron:build` | Package application for distribution |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests in watch mode |
| `npm run test:e2e` | Run E2E tests |

### Database Location

The SQLite database is stored in the appropriate user data directory:

```
# macOS
~/Library/Application Support/workspace-navigator/workspace.db

# Windows
%APPDATA%\workspace-navigator\workspace.db

# Linux
~/.config/workspace-navigator/workspace.db
```

Inspect the database using [DB Browser for SQLite](https://sqlitebrowser.org/).

### Hot Reload

The application supports hot reload in development:
- **Renderer changes**: Instant hot reload via Vite
- **Main process changes**: Requires restart (stop and run `npm run electron:dev` again)

## 📊 Database Schema

The application uses SQLite with the following tables:

- **`workspaces`** - Workspace metadata with settings
- **`folders`** - Hierarchical folder structure (self-referential)
- **`items`** - Web pages and notes (polymorphic via `item_type`)
- **`tags`** - Colored tags for organization
- **`item_tags`** - Many-to-many relationship between items and tags
- **`session_state`** - Singleton table for session persistence

All tables include:
- Primary key UUIDs
- Created/updated timestamps
- Soft delete support (`is_deleted` flag)
- Foreign key constraints with CASCADE

See `src/core/storage/schema.sql` for complete schema.

## 🎨 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Electron Main Process                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WindowManager  →  BrowserViewManager  →  TabManager │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WorkspaceEngine  →  Database  →  SQLite            │   │
│  │  (Business Logic)     (Wrapper)    (workspace.db)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│                          ↕ IPC                                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Renderer Process (React)                 │   │
│  │                                                        │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │   │
│  │  │Workspace │  │ Tabs         │  │ AI Panel       │ │   │
│  │  │Panel     │  │ - BrowserView│  │ (ChatGPT/      │ │   │
│  │  │- Folders │  │ - Markdown   │  │  Claude/       │ │   │
│  │  │- Search  │  │ - Navigation │  │  Gemini)       │ │   │
│  │  │- Tags    │  │ - TabBar     │  │                │ │   │
│  │  └──────────┘  └──────────────┘  └────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

- **IPC Communication**: Secure preload script exposes limited API
- **Business Logic Isolation**: Core workspace logic separate from UI
- **Tab Management**: Centralized TabManager handles all tab operations
- **Session Persistence**: Automatic save/restore on app close/open
- **Optimistic UI**: Immediate UI updates with background sync

## 🗺️ Implementation Status

### ✅ Phase 1: Project Setup (COMPLETE)
- Build system configured
- Testing infrastructure (Vitest + Playwright)
- TypeScript configuration
- Documentation structure

### ✅ Phase 2-3: Core Infrastructure (COMPLETE)
- Database layer with SQLite
- Workspace engine with business logic
- Folder management
- Item management

### ✅ Phase 4: Browser & Tabs (COMPLETE)
- BrowserView integration
- Tab management system
- Navigation controls (back, forward, reload)
- Session restoration

### ✅ Phase 5: Markdown Editor (COMPLETE)
- Markdown editing with syntax highlighting
- Live preview
- Autosave with 500ms debounce
- Timestamp indicator

### ✅ Phase 6: AI Assistant (COMPLETE)
- AI panel with provider selection
- ChatGPT, Claude, Gemini support
- Custom URL support
- Iframe isolation

### ✅ Phase 7: Advanced Features (COMPLETE)
- ✅ Search functionality (T046)
- ✅ Tagging system (T047)
- ✅ Drag & drop (T048)
- ✅ Multi-workspace switching (T049)
- ✅ Light/dark theme (T050)
- ✅ Keyboard shortcuts (T051)
- ✅ Validation complete (T052)

### ✅ Phase 8: Performance & Security (COMPLETE)
- ✅ Performance optimization (T053) - Launch <2s, lazy loading
- ✅ Memory management (T054) - BrowserView pooling, LRU eviction
- ✅ Security hardening (T055) - CSP, IPC validation, sandbox
- ✅ Crash recovery (T056) - Detection, auto-restore, reports
- ✅ Windows packaging (T057) - NSIS + Portable
- ✅ macOS packaging (T058) - DMG + ZIP, notarization ready
- ✅ Linux packaging (T059) - AppImage + DEB
- ✅ Cross-platform testing (T060) - CI/CD pipeline
- ✅ Validation complete (T061)

### ✅ Phase 9: Documentation & Release (COMPLETE)
- ✅ User documentation (T062)
- ✅ Developer documentation (T063)
- ✅ Release preparation (T064)
- ✅ Final validation (T065)

See [tasks.md](specs/001-workspace-navigator/tasks.md) for detailed roadmap.

## 🎯 User Stories Validation

### ✅ User Story 4: Advanced Workspace Organization
- ✓ Add colored tags to items
- ✓ Search with full-text and tag filtering
- ✓ Drag & drop items between folders
- ✓ Rename items with custom titles
- ✓ Fast search with result highlighting

### ✅ User Story 6: Multi-Workspace Management
- ✓ Create multiple workspaces
- ✓ Switch between workspaces with isolation
- ✓ Delete workspace with confirmation
- ✓ Independent workspace state
- ✓ Last workspace restored on app open

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. **Read the documentation**:
   - [Quickstart Guide](specs/001-workspace-navigator/quickstart.md)
   - [Architecture Plan](specs/001-workspace-navigator/plan.md)
   - [Implementation Tasks](specs/001-workspace-navigator/tasks.md)

2. **Pick a task**: Check [tasks.md](specs/001-workspace-navigator/tasks.md) for open tasks

3. **Follow conventions**:
   - TypeScript strict mode enabled
   - ESLint + Prettier for code style
   - Write tests for new features
   - Document public APIs with TSDoc comments

4. **Test before committing**:
   ```bash
   npm run lint
   npm test -- --run
   npm run build
   ```

5. **Create a pull request**: Follow existing patterns and architecture

### Code Style

- Use functional components with hooks
- Prefer async/await over promises
- Use descriptive variable names
- Keep functions small and focused
- Write self-documenting code

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Built With

- [Electron 30+](https://www.electronjs.org/) - Cross-platform desktop framework
- [React 18](https://react.dev/) - UI framework with hooks
- [TypeScript 5.3](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vite.dev/) - Lightning-fast build tool
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Synchronous SQLite wrapper
- [Vitest](https://vitest.dev/) - Unit testing framework
- [Playwright](https://playwright.dev/) - E2E testing framework
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [Highlight.js](https://highlightjs.org/) - Syntax highlighting

## 📚 Documentation

### User Documentation
- **[User Manual](docs/USER_MANUAL.md)** - Complete guide for end users
- **[FAQ](docs/FAQ.md)** - Frequently asked questions

### Developer Documentation
- **[Specification](specs/001-workspace-navigator/spec.md)** - Feature requirements and user stories
- **[Implementation Plan](specs/001-workspace-navigator/plan.md)** - Architecture and design decisions
- **[Tasks](specs/001-workspace-navigator/tasks.md)** - Development roadmap with phases
- **[Data Model](specs/001-workspace-navigator/data-model.md)** - Database schema and relationships
- **[Technology Research](specs/001-workspace-navigator/research.md)** - Technology evaluation
- **[Development Guide](specs/001-workspace-navigator/quickstart.md)** - Setup and development workflow

### Technical Documentation
- **[Cross-Platform Testing](docs/CROSS_PLATFORM_TESTING.md)** - CI/CD and platform testing
- **[Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md)** - Performance improvements
- **[Memory Management](docs/MEMORY_MANAGEMENT.md)** - Memory optimization strategies
- **[Phase 8 Validation](docs/PHASE_8_VALIDATION_REPORT.md)** - Performance and security validation

## 🐛 Known Issues

- BrowserView requires native module rebuild on Electron updates
- SQLite better-sqlite3 may need manual rebuild on some platforms
- Dev tools disabled by default (use `Ctrl+Shift+I` to open manually)

## 💡 Tips & Tricks

### Opening Dev Tools

Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS) to open developer tools.

### Inspecting the Database

Use [DB Browser for SQLite](https://sqlitebrowser.org/) to inspect the database file directly.

### Clearing All Data

Delete the database file (see Database Location above) and restart the application.

### Custom AI Provider

Select "Custom URL" in the AI panel and enter your provider's URL.

---

**Status**: v1.0.0 Release Ready

For questions, issues, or detailed documentation, see `specs/001-workspace-navigator/`.
