# Development Quickstart: Workspace Navigator

**Feature**: Workspace Navigator
**Created**: 2025-11-22
**Status**: Ready for Development
**Purpose**: Complete setup guide for developers to start implementing the project

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Project Structure](#3-project-structure)
4. [Building the Application](#4-building-the-application)
5. [Running in Development Mode](#5-running-in-development-mode)
6. [Testing](#6-testing)
7. [Troubleshooting](#7-troubleshooting)
8. [Development Workflow](#8-development-workflow)

---

## 1. Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Node.js** | 20.x LTS | Runtime environment | [nodejs.org](https://nodejs.org/) |
| **npm** | 10.x+ | Package manager | Bundled with Node.js |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com/) |
| **Python** | 3.8-3.11 | node-gyp dependency | [python.org](https://www.python.org/) |

### Platform-Specific Requirements

#### Windows 10/11
```powershell
# Install Windows Build Tools (run as Administrator)
npm install --global windows-build-tools

# Install Visual Studio Build Tools 2019 or later
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++" workload
```

#### macOS 12+
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p
# Should output: /Library/Developer/CommandLineTools
```

#### Ubuntu 20.04/22.04
```bash
# Install build essentials
sudo apt-get update
sudo apt-get install -y build-essential git python3 python3-pip

# Install additional dependencies for CEF
sudo apt-get install -y \
  libgtk-3-dev \
  libx11-dev \
  libxss-dev \
  libnss3-dev \
  libasound2-dev

# Verify GCC version (should be 9.x or later)
gcc --version
```

### Hardware Requirements

**Minimum** (for development):
- CPU: 4 cores, 2.0 GHz
- RAM: 8 GB
- Storage: 10 GB free space (CEF binaries are large)

**Recommended**:
- CPU: 8 cores, 3.0 GHz
- RAM: 16 GB
- Storage: 20 GB free space (SSD preferred)

---

## 2. Development Environment Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url> workspace-navigator
cd workspace-navigator

# Create feature branch
git checkout -b 001-workspace-navigator
```

### Step 2: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# This will install:
# - Electron 28.x
# - React 18.x
# - TypeScript 5.3.x
# - Vite (build tool)
# - better-sqlite3 (database)
# - All other dependencies from package.json
```

**Expected output** (last few lines):
```
added 1247 packages in 2m 14s
✓ Native modules compiled successfully
```

### Step 3: Download CEF Binaries

CEF binaries are large (~500MB) and platform-specific. They are downloaded on first build.

```bash
# Download CEF for your platform
npm run download-cef

# This will:
# - Detect your platform (Windows/macOS/Linux)
# - Download CEF 120+ distribution
# - Extract to: ./native/cef/
# - Verify checksums
```

**Platform-specific CEF URLs**:
- Windows: `https://cef-builds.spotifycdn.com/cef_binary_120.x_windows64.tar.bz2`
- macOS: `https://cef-builds.spotifycdn.com/cef_binary_120.x_macosx64.tar.bz2`
- Linux: `https://cef-builds.spotifycdn.com/cef_binary_120.x_linux64.tar.bz2`

### Step 4: Build Native CEF Bridge

```bash
# Build C++ bridge (N-API module)
npm run build:native

# This will:
# - Configure node-gyp with CEF paths
# - Compile src/native/cef-bridge.cc
# - Link against CEF libraries
# - Output: ./build/Release/cef-bridge.node
```

**Expected output**:
```
> node-gyp rebuild

  CC(target) Release/obj.target/cef-bridge/src/native/cef-bridge.o
  SOLINK_MODULE(target) Release/cef-bridge.node
✓ Build completed in 18.4s
```

### Step 5: Initialize Database Schema

```bash
# Run database migrations
npm run db:migrate

# This will:
# - Create ./data/workspace.db (SQLite file)
# - Apply migrations from src/core/storage/migrations/
# - Verify schema integrity
```

**Expected output**:
```
Applying migration 1: initial schema
✓ Database initialized successfully
```

### Step 6: Verify Setup

```bash
# Run verification script
npm run verify-setup

# This will check:
# - Node.js version
# - CEF binaries exist
# - Native module built correctly
# - Database schema valid
# - All dependencies installed
```

**Expected output**:
```
✓ Node.js version: 20.10.0
✓ npm version: 10.2.3
✓ CEF binaries found: ./native/cef/Release/
✓ Native module: ./build/Release/cef-bridge.node
✓ Database schema: 1 migration applied
✓ Dependencies: 1247 packages installed

All checks passed! Ready to develop.
```

---

## 3. Project Structure

```
workspace-navigator/
├── .specify/                   # SpecKit governance
│   └── memory/
│       └── constitution.md     # Project principles
│
├── specs/                      # Feature specifications
│   └── 001-workspace-navigator/
│       ├── spec.md             # Feature requirements
│       ├── plan.md             # Implementation plan
│       ├── tasks.md            # Task breakdown
│       ├── implementation-strategy.md
│       ├── research.md         # Technology decisions
│       ├── data-model.md       # Database schema
│       └── quickstart.md       # This file
│
├── src/                        # Source code
│   ├── main/                   # Electron main process
│   │   ├── index.ts            # Entry point
│   │   ├── window-manager.ts  # Window lifecycle
│   │   └── ipc-handlers.ts    # IPC communication
│   │
│   ├── renderer/               # React UI
│   │   ├── App.tsx             # Root component
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React hooks
│   │   └── styles/             # CSS/Tailwind
│   │
│   ├── core/                   # Business logic
│   │   ├── workspace/          # Workspace engine
│   │   ├── storage/            # Database layer
│   │   ├── tabs/               # Tab management
│   │   └── validation/         # Input validation
│   │
│   ├── native/                 # C++ CEF bridge
│   │   ├── cef-bridge.cc       # N-API module
│   │   ├── cef-manager.cc      # CEF lifecycle
│   │   └── webview-pool.cc    # WebView pooling
│   │
│   └── types/                  # TypeScript types
│       ├── entities.ts         # Data models
│       └── guards.ts           # Type guards
│
├── tests/                      # Test files
│   ├── unit/                   # Unit tests (Vitest)
│   ├── integration/            # Integration tests (Playwright)
│   └── e2e/                    # End-to-end tests (Playwright)
│
├── native/                     # Native dependencies
│   └── cef/                    # CEF binaries (downloaded)
│       ├── Release/
│       ├── Resources/
│       └── include/
│
├── data/                       # Application data
│   ├── workspace.db            # SQLite database
│   └── cache/                  # CEF cache
│
├── build/                      # Build output
│   └── Release/
│       └── cef-bridge.node     # Compiled native module
│
├── dist/                       # Distribution packages
│   ├── win/                    # Windows installer
│   ├── mac/                    # macOS DMG
│   └── linux/                  # Linux AppImage/DEB
│
├── .github/                    # GitHub workflows
│   └── workflows/
│       ├── build.yml           # CI build
│       └── test.yml            # CI tests
│
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── electron-builder.yml        # Packaging config
└── binding.gyp                 # node-gyp config
```

---

## 4. Building the Application

### Development Build

```bash
# Build TypeScript + React (no minification)
npm run build:dev

# This will:
# - Compile src/main/** to dist/main/
# - Compile src/renderer/** to dist/renderer/
# - Copy assets to dist/
# - Generate source maps
```

**Output**: `./dist/` directory

### Production Build

```bash
# Build optimized production bundle
npm run build

# This will:
# - Compile with optimizations (minification, tree-shaking)
# - Remove source maps
# - Bundle for distribution
```

### Platform-Specific Packaging

```bash
# Package for current platform
npm run package

# Platform-specific commands:
npm run package:win    # Windows NSIS installer
npm run package:mac    # macOS DMG
npm run package:linux  # Linux AppImage + DEB
```

**Output**: `./dist/` directory with installers

---

## 5. Running in Development Mode

### Method 1: Vite Dev Server (Recommended)

```bash
# Start development server with hot reload
npm run dev

# This will:
# - Start Vite dev server on http://localhost:5173
# - Launch Electron with devtools open
# - Enable hot module replacement (HMR)
# - Watch for file changes
```

**Expected output**:
```
vite v5.0.0 dev server running at:
  ➜ Local:   http://localhost:5173/
  ➜ Network: use --host to expose

Electron starting...
✓ Main process ready
✓ Renderer attached
```

**Features enabled in dev mode**:
- React DevTools
- Chrome DevTools (auto-open)
- Source maps
- HMR for instant updates
- Verbose logging

### Method 2: Manual Launch

```bash
# Terminal 1: Build and watch
npm run build:dev -- --watch

# Terminal 2: Launch Electron
npm run start
```

### Debugging

#### VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "runtimeArgs": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    },
    {
      "name": "Electron: Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9223,
      "webRoot": "${workspaceFolder}/src/renderer",
      "timeout": 30000
    }
  ],
  "compounds": [
    {
      "name": "Electron: All",
      "configurations": ["Electron: Main", "Electron: Renderer"]
    }
  ]
}
```

**Usage**:
1. Run `npm run dev`
2. Press F5 in VS Code
3. Select "Electron: All"

#### Chrome DevTools

```bash
# Enable remote debugging
npm run dev -- --remote-debugging-port=9223

# Open in Chrome:
# chrome://inspect/#devices
```

---

## 6. Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/core/workspace/duplication-detector.test.ts

# Watch mode (re-run on file change)
npm run test:watch
```

**Coverage targets**:
- Business logic: 90%
- Utilities: 80%
- UI components: 60%

### Integration Tests (Playwright)

```bash
# Run integration tests
npm run test:integration

# Run headless
npm run test:integration -- --headless

# Run specific test
npm run test:integration -- tests/integration/workspace-crud.spec.ts
```

**What's tested**:
- Workspace CRUD operations
- Item creation and persistence
- Autosave flow
- Session restore
- Multi-workspace switching

### E2E Tests (Playwright)

```bash
# Run end-to-end tests
npm run test:e2e

# Run on specific platform
npm run test:e2e:win
npm run test:e2e:mac
npm run test:e2e:linux
```

**What's tested**:
- Complete user journeys (spec.md user stories)
- Cross-platform compatibility
- Performance benchmarks (SC-002, SC-003)

### Manual Testing Checklist

Use this checklist for manual testing before releases:

- [ ] Create workspace and add 20 web pages
- [ ] Organize items into folders via drag-and-drop
- [ ] Create Markdown note and verify autosave (500ms)
- [ ] Open 20+ tabs and verify performance warning
- [ ] Switch AI providers (ChatGPT → Claude → Gemini)
- [ ] Force quit and verify session restore
- [ ] Search across 100+ items
- [ ] Apply tags and filter by tag
- [ ] Rename workspace and folders
- [ ] Delete workspace (with confirmation)

---

## 7. Troubleshooting

### Common Issues

#### Issue 1: CEF Download Fails

**Symptoms**:
```
Error downloading CEF: ECONNRESET
```

**Solutions**:
1. Check internet connection
2. Manually download CEF:
   ```bash
   # Windows
   wget https://cef-builds.spotifycdn.com/cef_binary_120.x_windows64.tar.bz2
   tar -xjf cef_binary_120.x_windows64.tar.bz2 -C native/cef/
   ```

3. Use alternative mirror (see `scripts/download-cef.js`)

#### Issue 2: Native Module Build Fails

**Symptoms**:
```
gyp ERR! find Python
gyp ERR! find Python Python is not set from command line or npm configuration
```

**Solutions**:
```bash
# Set Python path manually
npm config set python /usr/bin/python3

# Verify Python version (3.8-3.11 required)
python3 --version

# Rebuild
npm run build:native
```

#### Issue 3: SQLite Database Locked

**Symptoms**:
```
Error: SQLITE_BUSY: database is locked
```

**Solutions**:
1. Close all Electron instances
2. Delete lock file:
   ```bash
   rm data/workspace.db-wal
   rm data/workspace.db-shm
   ```
3. Restart application

#### Issue 4: Electron Window Won't Open

**Symptoms**:
- Process starts but no window appears
- "GPU process exited unexpectedly" in logs

**Solutions**:
```bash
# Disable GPU acceleration (temporary fix)
npm run dev -- --disable-gpu

# Clear Electron cache
rm -rf ~/.config/workspace-navigator/
```

#### Issue 5: TypeScript Errors After Git Pull

**Symptoms**:
```
error TS2307: Cannot find module '@/types/entities'
```

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build:dev
```

### Debug Logs

Enable verbose logging:

```bash
# Set environment variable
export DEBUG=workspace-navigator:*

# Run with debug output
npm run dev

# Logs will show:
# workspace-navigator:main Starting application
# workspace-navigator:cef Initializing CEF
# workspace-navigator:storage Opening database
```

**Log locations**:
- Development: Console output
- Production:
  - Windows: `%APPDATA%\workspace-navigator\logs\`
  - macOS: `~/Library/Logs/workspace-navigator/`
  - Linux: `~/.config/workspace-navigator/logs/`

---

## 8. Development Workflow

### Daily Workflow

```bash
# 1. Start day: pull latest changes
git pull origin 001-workspace-navigator

# 2. Create task branch (from tasks.md)
git checkout -b task/1.1.1-cef-manager

# 3. Start development server
npm run dev

# 4. Make changes, test incrementally
# (Edit files in src/, tests update automatically)

# 5. Run tests
npm run test

# 6. Commit changes
git add .
git commit -m "Implement CEF Manager initialization (Task 1.1.1)"

# 7. Push to remote
git push origin task/1.1.1-cef-manager

# 8. Create pull request (if ready for review)
```

### Code Style

**Enforced by ESLint + Prettier**:

```bash
# Auto-format code
npm run format

# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

**Key conventions**:
- Use TypeScript strict mode (`strict: true`)
- Prefer functional components (React)
- Use `async/await` over `.then()` chains
- Always validate external inputs (Constitution I.2)
- No `any` types (use `unknown` and type guards)

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add WebView pooling with acquire/release pattern (Task 1.2.1)
fix: prevent circular folder hierarchy (Task 4.1.3)
docs: update data-model.md with migration strategy
test: add E2E test for crash recovery (SC-010)
refactor: extract duplication detector to separate module
perf: optimize FTS5 search queries (Task 5.2.2)
```

### Pull Request Checklist

Before creating PR:

- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Manual testing completed (see checklist in section 6)
- [ ] Documentation updated (if API changed)
- [ ] CHANGELOG.md updated
- [ ] Task marked complete in tasks.md

**PR Template**:

```markdown
## Task
Closes: Task X.Y.Z - [Task name]

## Changes
- Implemented feature A
- Fixed bug B
- Added tests for C

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if UI changes)
[Attach screenshots]

## Notes
[Any additional context]
```

### Release Process

```bash
# 1. Update version
npm version minor  # or major/patch

# 2. Build production bundles
npm run build

# 3. Package for all platforms (requires CI)
npm run package:all

# 4. Run E2E tests on all platforms
npm run test:e2e:all

# 5. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 6. Upload to GitHub Releases (automated via CI)
```

---

## Quick Reference

### Most Used Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run test` | Run unit tests |
| `npm run build` | Build production bundle |
| `npm run package` | Package for current platform |
| `npm run lint` | Check code style |
| `npm run format` | Auto-format code |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug logs | `""` (disabled) |
| `NODE_ENV` | Environment | `"development"` |
| `ELECTRON_ENABLE_LOGGING` | Electron logs | `false` |
| `CEF_SANDBOX` | Enable CEF sandbox | `true` |
| `DB_PATH` | Database location | `"./data/workspace.db"` |

### Key Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Build configuration |
| `electron-builder.yml` | Packaging configuration |
| `binding.gyp` | Native module build config |

---

## Next Steps

1. **Read Core Documentation**:
   - [constitution.md](../.specify/memory/constitution.md) - Project principles
   - [spec.md](spec.md) - Feature requirements
   - [plan.md](plan.md) - Implementation plan
   - [tasks.md](tasks.md) - Task breakdown

2. **Explore Codebase**:
   - Start with `src/main/index.ts` (entry point)
   - Read `src/core/workspace/` (business logic)
   - Review `src/types/entities.ts` (data models)

3. **Pick First Task**:
   - See [tasks.md](tasks.md)
   - Recommended starting point: **Task 1.1 - CEF Core Integration** (MVP)

4. **Join Communication Channels**:
   - GitHub Discussions: Q&A and design decisions
   - GitHub Issues: Bug reports and feature requests

---

## Additional Resources

### Official Documentation
- [Electron Docs](https://www.electronjs.org/docs/latest)
- [CEF Project](https://bitbucket.org/chromiumembedded/cef)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

### Tutorials
- [Electron + CEF Integration Guide](https://github.com/examples/electron-cef)
- [N-API C++ Addons](https://nodejs.org/api/n-api.html)
- [React + TypeScript Patterns](https://react-typescript-cheatsheet.netlify.app/)

### Tools
- [Electron Fiddle](https://www.electronjs.org/fiddle) - Experiment with Electron
- [DB Browser for SQLite](https://sqlitebrowser.org/) - Inspect database
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debug React

---

**Document Status**: Ready for Development
**Last Updated**: 2025-11-22
**Maintainers**: Development Team

For questions or issues with setup, please open a GitHub issue with the `setup` label.
