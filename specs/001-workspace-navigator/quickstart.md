# Development Quickstart: Workspace Navigator

**Feature**: Workspace Navigator
**Updated**: 2025-11-24
**Status**: Electron-only (CEF removed)
**Purpose**: Complete setup guide for developers to start implementing the project

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Development Mode](#3-development-mode)
4. [Building](#4-building)
5. [Testing](#5-testing)
6. [Project Structure](#6-project-structure)
7. [Troubleshooting](#7-troubleshooting)
8. [Development Workflow](#8-development-workflow)

---

## 1. Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20.x LTS | Runtime environment |
| **npm** | 10.x+ | Package manager |
| **Git** | 2.40+ | Version control |

**Installation Links**:
- Node.js: https://nodejs.org/ (LTS version recommended)
- Git: https://git-scm.com/

### System Requirements

- **Windows**: Windows 10 or higher
- **macOS**: macOS 12 (Monterey) or higher
- **Linux**: Ubuntu 20.04+ or equivalent

### Verify Installation

```bash
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
git --version   # Should be 2.x.x
```

---

## 2. Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd Navigateur
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Electron 30+
- React 18
- TypeScript 5.3
- Vite (dev server and bundler)
- Vitest + Playwright (testing)
- better-sqlite3 (database)

### Step 3: Rebuild Native Modules (if needed)

```bash
npx electron-rebuild
```

This ensures better-sqlite3 is compiled for your Electron version.

### Step 4: Verify Setup

```bash
npm run build
```

If this succeeds, your environment is ready!

---

## 3. Development Mode

### Start Development Server

```bash
npm run electron:dev
```

This command:
1. Starts Vite dev server on http://localhost:5173
2. Compiles main process TypeScript
3. Launches Electron with DevTools open

### Hot Reload

- **Renderer process** (React): Auto-reloads on save
- **Main process** (Electron): Requires app restart

To restart, close Electron window and run `npm run electron:dev` again.

---

## 4. Building

### Development Build

```bash
npm run build
```

This compiles:
- Main process → `dist/main/`
- Renderer process → `dist/renderer/`

### Production Build

```bash
npm run electron:build
```

This creates distributable packages in `release/`:
- Windows: `.exe` installer
- macOS: `.dmg` image
- Linux: `.AppImage` and `.deb` packages

---

## 5. Testing

### Unit Tests (Vitest)

```bash
npm test              # Watch mode
npm test -- --run     # Run once
npm run test:ui       # Visual UI
npm run test:coverage # With coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

### Linting & Formatting

```bash
npm run lint   # Check code style
npm run format # Auto-format with Prettier
```

---

## 6. Project Structure

```
Navigateur/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App entry point
│   │   ├── browser-view-manager.ts  # BrowserView lifecycle
│   │   ├── window-manager.ts        # Window state
│   │   ├── ipc-handlers.ts          # IPC handlers
│   │   └── menu.ts                  # App menus
│   │
│   ├── preload/           # Preload scripts
│   │   └── index.ts       # Electron API bridge
│   │
│   ├── core/              # Business logic (shared)
│   │   ├── workspace/     # Workspace management
│   │   ├── storage/       # Database & caching
│   │   └── types/         # Type definitions
│   │
│   ├── renderer/          # React UI
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # State management
│   │   ├── App.tsx        # Root component
│   │   └── index.tsx      # Entry point
│   │
│   └── types/             # Global TypeScript types
│
├── tests/
│   ├── unit/              # Vitest unit tests
│   ├── e2e/               # Playwright E2E tests
│   ├── fixtures/          # Test data
│   └── utils/             # Test utilities
│
├── specs/                 # Feature specifications
│   └── 001-workspace-navigator/
│       ├── spec.md        # Feature spec
│       ├── plan.md        # Implementation plan
│       ├── tasks.md       # Development tasks
│       └── quickstart.md  # This file
│
├── dist/                  # Build output
├── release/               # Packaged apps
└── package.json           # Dependencies & scripts
```

---

## 7. Troubleshooting

### Issue: "Cannot find module 'electron'"

**Cause**: Missing dependencies
**Solution**:
```bash
npm install
```

### Issue: "better-sqlite3 was compiled against a different Node.js version"

**Cause**: Native module needs rebuilding for Electron
**Solution**:
```bash
npx electron-rebuild
```

### Issue: "Port 5173 already in use"

**Cause**: Vite dev server already running
**Solution**:
```bash
# Kill process on port 5173
# Linux/macOS:
lsof -ti:5173 | xargs kill

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: TypeScript errors during build

**Causes & Solutions**:
1. **Outdated TypeScript**: Update to 5.3+
   ```bash
   npm install --save-dev typescript@latest
   ```

2. **Stale node_modules**: Reinstall
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Configuration issues**: Check `tsconfig.json`, `tsconfig.main.json`, `tsconfig.renderer.json`

### Issue: Electron window doesn't appear

**Causes & Solutions**:
1. **Main process error**: Check terminal for error messages
2. **Build failed**: Run `npm run build:main` and check for errors
3. **Port issue**: Ensure Vite dev server started successfully

### Issue: "Cannot read properties of undefined" in tests

**Cause**: Missing Electron API mocks
**Solution**: Check `tests/setup.ts` - Electron API must be mocked for renderer tests

### Issue: Database errors on first run

**Cause**: SQLite database not initialized
**Solution**: Delete existing database and restart
```bash
# Database locations:
# Windows: %APPDATA%/workspace-navigator/workspace.db
# macOS: ~/Library/Application Support/workspace-navigator/workspace.db
# Linux: ~/.config/workspace-navigator/workspace.db
```

---

## 8. Development Workflow

### Daily Workflow

1. **Pull latest changes**
   ```bash
   git pull origin main
   npm install  # If package.json changed
   ```

2. **Start development**
   ```bash
   npm run electron:dev
   ```

3. **Make changes** to source files
   - Renderer changes auto-reload
   - Main process changes require restart

4. **Run tests**
   ```bash
   npm test -- --run
   ```

5. **Check code quality**
   ```bash
   npm run lint
   ```

6. **Commit changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Feature Development

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement feature** following tasks.md

3. **Write tests** for new functionality

4. **Verify build**
   ```bash
   npm run build
   npm run test -- --run
   ```

5. **Create pull request**

### Key Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server only |
| `npm run build:main` | Compile main process |
| `npm run build:renderer` | Build renderer |
| `npm run build` | Build both |
| `npm run electron:dev` | Run app in dev mode |
| `npm run electron:build` | Package for distribution |
| `npm test` | Run unit tests (watch) |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Check linting |
| `npm run format` | Format code |

---

## Database

The application uses SQLite with better-sqlite3. Database location:

- **Windows**: `%APPDATA%/workspace-navigator/workspace.db`
- **macOS**: `~/Library/Application Support/workspace-navigator/workspace.db`
- **Linux**: `~/.config/workspace-navigator/workspace.db`

To reset the database, delete this file and restart the app.

---

## Getting Help

- **Architecture**: See [main README](../../README.md)
- **Feature Spec**: See [spec.md](./spec.md)
- **Implementation Plan**: See [plan.md](./plan.md)
- **Tasks**: See [tasks.md](./tasks.md)
- **Issues**: Check GitHub issues

---

## Next Steps

1. Review the [architecture overview](../../README.md#architecture)
2. Read [spec.md](./spec.md) to understand features
3. Check [tasks.md](./tasks.md) for current development tasks
4. Explore the codebase:
   - Start with `src/main/index.ts` (entry point)
   - Then `src/renderer/App.tsx` (UI root)
   - Review `src/core/workspace/workspace-engine.ts` (business logic)

Welcome to Workspace Navigator development! 🚀
