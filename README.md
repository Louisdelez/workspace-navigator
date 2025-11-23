# Workspace Navigator - Proof of Concept

A cross-platform desktop application combining web browser, Markdown editor, and AI assistant in an IDE-style workspace.

## 🎯 POC Overview

This is a simplified proof-of-concept implementation that demonstrates the core architecture and features of Workspace Navigator without the complexity of native CEF integration.

### What's Included ✅

#### Core Features Implemented

1. **Workspace Management**
   - Create/select multiple workspaces
   - Automatic workspace persistence
   - Session restore on application restart

2. **Hierarchical Organization**
   - Folder creation and nesting
   - Automatic date-based folders (DD.MM.YYYY format)
   - Drag-and-drop support (UI ready)

3. **Item Types**
   - **Web Items**: Save and open web pages (using iframe)
   - **Note Items**: Markdown editing with live autosave (500ms debounce)

4. **Three-Column Layout**
   - Left: Workspace tree (folders + items)
   - Center: Tabbed content area
   - Right: AI assistant panel (ChatGPT/Claude/Gemini)

5. **Data Persistence**
   - SQLite database with full ACID guarantees
   - Automatic schema initialization
   - Session state persistence (open tabs, active workspace, window state)

6. **Key Business Logic**
   - FR-002a: Duplicate URL detection (same URL, same day, same folder)
   - FR-005: Auto date folder creation
   - FR-015: Autosave with 500ms debounce + timestamp indicator

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

### What's Simplified (vs. Full Spec) ⚠️

1. **No Native CEF Integration**
   - Uses Electron's BrowserView/iframe instead of native CEF
   - No WebView pooling (full spec requires C++ implementation)
   - No process-per-site-instance isolation

2. **Simplified Web Browsing**
   - iframes instead of full browser engine
   - Limited to iframe-friendly sites
   - No browser controls (back/forward/refresh)

3. **Basic Markdown Editor**
   - Plain textarea (not WYSIWYG like MarkText)
   - No preview mode
   - Autosave works as specified

4. **No Advanced Features**
   - No search functionality
   - No tags
   - No drag-and-drop (UI ready, handlers needed)
   - No theme switcher (CSS variables ready)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- npm 10.x+

### Installation

```bash
# Install dependencies
npm install

# This will install:
# - Electron, React, TypeScript
# - better-sqlite3 (SQLite database)
# - Vite (build tool)
# - All development tools
```

### Running the Application

#### Development Mode (Recommended)

```bash
# Start Vite dev server + Electron
npm run electron:dev

# This will:
# 1. Start Vite dev server on http://localhost:5173
# 2. Launch Electron with DevTools open
# 3. Enable hot reload for instant updates
```

#### Production Build

```bash
# Build TypeScript + React
npm run build

# Package for your platform
npm run electron:build

# Output: release/ directory with installer
```

### First Run

1. Launch the application
2. Click **"+"** to create your first workspace (e.g., "Personal")
3. Click **"New Note"** to create a Markdown note
4. Start typing - autosave will save after 500ms of inactivity
5. Try selecting an AI provider (ChatGPT/Claude/Gemini) in the right panel

## 📁 Project Structure

```
workspace-navigator/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Entry point + IPC handlers
│   │   └── preload.ts           # Context bridge API
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
# Run unit tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
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

## 🚧 Known Limitations

1. **Web browsing**: iframes don't work for all sites (CORS restrictions)
2. **No browser controls**: Can't navigate back/forward in web items
3. **Basic Markdown**: Just a textarea, no preview or syntax highlighting
4. **No search**: Full-text search implemented in database but not exposed in UI
5. **No drag-and-drop**: Tree structure supports it, but handlers not implemented

## 🔮 Next Steps to Full Implementation

To evolve this POC into the full specification:

1. **Replace iframes with native CEF integration** (see `specs/001-workspace-navigator/plan.md`)
   - Implement C++ CEF bridge
   - Add WebView pooling
   - Enable process-per-site-instance

2. **Integrate MarkText** for WYSIWYG Markdown editing
3. **Add search functionality** (database layer ready, UI needed)
4. **Implement drag-and-drop** for reorganization
5. **Add tags UI** (database schema ready)
6. **Implement browser controls** for web items
7. **Add comprehensive test suite** (Vitest + Playwright)

## 📚 Documentation

- **Specification**: `specs/001-workspace-navigator/spec.md`
- **Architecture**: `specs/001-workspace-navigator/plan.md`
- **Tasks**: `specs/001-workspace-navigator/tasks.md`
- **Data Model**: `specs/001-workspace-navigator/data-model.md`
- **Technology Decisions**: `specs/001-workspace-navigator/research.md`
- **Development Guide**: `specs/001-workspace-navigator/quickstart.md`

## 🤝 Contributing

This is a proof-of-concept. Contributions welcome!

1. Check `specs/001-workspace-navigator/tasks.md` for implementation tasks
2. Follow the established architecture patterns
3. Run `npm run lint` and `npm run format` before committing
4. Add tests for new features

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- Electron 28
- React 18
- TypeScript 5.3
- better-sqlite3
- Vite

---

**POC Status**: ✅ Core features implemented and functional

For questions or issues, please refer to the specification documents in `specs/001-workspace-navigator/`.
