# Quickstart Guide: Workspace Navigator

**Feature Branch**: `003-workspace-navigator`
**Date**: 2025-12-09

## Prerequisites

- **Node.js**: 20.x LTS or higher
- **npm**: 10.x or higher
- **Git**: 2.x or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

### Platform-Specific Requirements

**Windows**:
- Visual Studio Build Tools 2019 or higher (for native modules)
- Python 3.x (for node-gyp)

**macOS**:
- Xcode Command Line Tools (`xcode-select --install`)

**Linux**:
- Build essentials: `sudo apt install build-essential`
- Additional libs: `sudo apt install libsecret-1-dev libsqlcipher-dev`

---

## Quick Setup

```bash
# Clone and enter project
git clone <repository-url>
cd navigateur

# Install dependencies
npm install

# Start development mode
npm run dev
```

The application will launch in development mode with hot reload enabled.

---

## Project Structure

```
navigateur/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts (context bridge)
│   ├── renderer/       # React application
│   ├── core/           # Shared business logic
│   └── types/          # TypeScript definitions
├── tests/
│   ├── unit/           # Vitest unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # Playwright E2E tests
├── specs/              # Feature specifications
└── docs/               # Documentation
```

---

## Available Commands

### Development

```bash
# Start development with hot reload
npm run dev

# Start with debug logging
DEBUG=* npm run dev

# Start main process only (for debugging)
npm run dev:main
```

### Building

```bash
# Production build (all platforms)
npm run build

# Platform-specific builds
npm run build:win      # Windows (.exe)
npm run build:mac      # macOS (.dmg)
npm run build:linux    # Linux (AppImage, deb)
```

### Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# E2E tests
npm run test:e2e

# With coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Type check
npm run typecheck

# Format code
npm run format
```

---

## Development Workflow

### 1. Database Migrations

Migrations run automatically on startup. To create a new migration:

```bash
# Create migration file
npm run migration:create -- <migration-name>

# Example
npm run migration:create -- add-tags-to-items
```

This creates `src/main/database/migrations/XXX_add_tags_to_items.ts`.

### 2. IPC Development

When adding new IPC channels:

1. Define the schema in `specs/003-workspace-navigator/contracts/ipc-api.ts`
2. Add handler in `src/main/ipc-handlers.ts`
3. Expose in preload `src/preload/api.ts`
4. Use in renderer via `window.api`

Example:

```typescript
// 1. Define in contracts/ipc-api.ts
export const myAPI = {
  'myDomain:action': {
    input: z.object({ id: z.string() }),
    output: z.object({ success: z.boolean() }),
  },
};

// 2. Handler in main process
ipcMain.handle('myDomain:action', async (event, input) => {
  const validated = myAPI['myDomain:action'].input.parse(input);
  // ... implementation
  return { success: true };
});

// 3. Expose in preload
myDomain: {
  action: (id: string) => ipcRenderer.invoke('myDomain:action', { id }),
}

// 4. Use in renderer
const result = await window.api.myDomain.action('123');
```

### 3. Component Development

UI components follow this structure:

```
src/renderer/components/MyComponent/
├── index.ts           # Public exports
├── MyComponent.tsx    # Main component
├── MyComponent.css    # Styles
└── MyComponent.test.tsx # Tests
```

### 4. Store Development

State management with Zustand:

```typescript
// src/renderer/stores/myStore.ts
import { create } from 'zustand';

interface MyState {
  data: string[];
  addItem: (item: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  addItem: (item) => set((state) => ({ data: [...state.data, item] })),
}));
```

---

## Key Patterns

### WebContentsView Management

```typescript
// Create pooled webview
const webContentsView = webviewManager.acquire({
  partition: 'persist:main',
  sandbox: true,
});

// Navigate
webContentsView.webContents.loadURL(url);

// Release back to pool
webviewManager.release(webContentsView);
```

### Event Bus Usage

```typescript
// Emit from main
eventBus.emit('item:created', item);

// Subscribe in renderer (via preload)
const unsubscribe = window.api.on.itemCreated((item) => {
  console.log('New item:', item);
});

// Cleanup
unsubscribe();
```

### Search with FTS

```typescript
// Full-text search
const results = await window.api.search.query('react hooks', {
  workspaceId: currentWorkspace.id,
  type: 'web',
  limit: 50,
});

// Quick search (title/URL only)
const quickResults = await window.api.search.quick('github', 10);
```

---

## Configuration

### Environment Variables

Create `.env.local` for local overrides:

```bash
# Database location (default: userData)
NAVIGATEUR_DB_PATH=/custom/path/navigateur.db

# Log level (default: info)
LOG_LEVEL=debug

# Disable animations (for testing)
DISABLE_ANIMATIONS=true
```

### SQLite Encryption

The database password is stored in the OS keychain. To reset:

```bash
# macOS
security delete-generic-password -s "navigateur-db"

# Windows (PowerShell)
Remove-StoredCredential -Target "navigateur-db"

# Linux
secret-tool clear service navigateur-db
```

---

## Debugging

### Main Process

```bash
# VSCode: Use "Attach to Main Process" launch config
# Or start with inspector:
npm run dev -- --inspect
```

### Renderer Process

1. Open DevTools: `Cmd/Ctrl + Shift + I`
2. Or programmatically: `mainWindow.webContents.openDevTools()`

### Database

```bash
# Open database in SQLite CLI (unencrypted dev mode)
sqlite3 ~/.config/navigateur/navigateur.db

# Useful queries
.tables                          # List tables
.schema items                    # Show schema
SELECT * FROM items LIMIT 10;   # View data
```

### Logging

```typescript
// In main process
import log from 'electron-log';
log.info('Message', { data: 'value' });

// In renderer
console.log('Message'); // Also captured by electron-log
```

Logs location:
- **Windows**: `%USERPROFILE%\AppData\Roaming\navigateur\logs`
- **macOS**: `~/Library/Logs/navigateur`
- **Linux**: `~/.config/navigateur/logs`

---

## Troubleshooting

### Native Module Build Errors

```bash
# Rebuild native modules for current Electron
npm run postinstall
# or
npx electron-rebuild
```

### SQLCipher Issues

```bash
# Ensure development headers installed
# macOS
brew install sqlcipher

# Ubuntu
sudo apt install libsqlcipher-dev

# Windows: Use pre-built binaries
```

### Hot Reload Not Working

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Tests Failing on CI

```bash
# Ensure Playwright browsers installed
npx playwright install chromium
```

---

## Performance Benchmarks

Before submitting PRs, verify performance targets:

```bash
# Run performance tests
npm run test:perf

# Expected results:
# - App launch: < 2000ms
# - Tab open: < 200ms
# - Search (10k items): < 100ms
```

---

## Next Steps

1. Review [spec.md](./spec.md) for feature requirements
2. Check [data-model.md](./data-model.md) for database schema
3. See [contracts/ipc-api.ts](./contracts/ipc-api.ts) for API definitions
4. Read [research.md](./research.md) for technical decisions

For task breakdown, run:
```bash
/speckit.tasks
```
