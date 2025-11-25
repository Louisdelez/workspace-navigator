# Cross-Platform Testing Guide

This document describes the cross-platform testing strategy for Workspace Navigator.

## Test Matrix

### Supported Platforms

| Platform | Versions | Architecture | Package Formats |
|----------|----------|--------------|-----------------|
| **Windows** | 10, 11 | x64, ia32 | NSIS installer, Portable |
| **macOS** | 12+, 13+, 14+ | x64, arm64 | DMG, ZIP |
| **Linux** | Ubuntu 20.04+, 22.04+ | x64 | AppImage, DEB |

### Test Categories

1. **Unit Tests** - Run on all platforms via CI
2. **Integration Tests** - Database, IPC, workspace engine
3. **E2E Tests** - Full application flow with Playwright
4. **Manual Tests** - Platform-specific features

## CI/CD Pipeline

The project uses GitHub Actions for automated testing:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Lint &    │     │    Unit     │     │    E2E      │
│ Type Check  │     │   Tests     │     │   Tests     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                   │
       │            ┌─────┴─────┐            │
       │            │           │            │
       ▼            ▼           ▼            ▼
┌─────────────┐ ┌─────────┐ ┌─────────┐
│ Build Linux │ │Build Win│ │Build Mac│
└─────────────┘ └─────────┘ └─────────┘
       │            │           │
       └────────────┴───────────┘
                    │
                    ▼
            ┌─────────────┐
            │   Release   │
            │  (on tag)   │
            └─────────────┘
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test -- --run

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --run tests/unit/storage/database.test.ts

# Watch mode (development)
npm test
```

### E2E Tests

```bash
# Install Playwright browsers (first time)
npx playwright install --with-deps

# Run E2E tests
npm run test:e2e

# Run with headed browser (debug)
npx playwright test --headed

# Run specific test
npx playwright test tests/e2e/app-launch.e2e.ts
```

### Manual Testing Checklist

#### All Platforms

- [ ] Application launches successfully
- [ ] Window appears and is responsive
- [ ] Create new workspace
- [ ] Create folders
- [ ] Add web items (URLs)
- [ ] Add note items
- [ ] Edit markdown content
- [ ] Switch between tabs
- [ ] Navigate web pages
- [ ] AI panel opens and switches providers
- [ ] Search functionality works
- [ ] Tag creation and assignment
- [ ] Drag and drop folders/items
- [ ] Application closes cleanly
- [ ] Data persists after restart
- [ ] Session restoration works

#### Windows-Specific

- [ ] NSIS installer runs correctly
- [ ] Per-user installation works
- [ ] Custom install directory works
- [ ] Desktop shortcut created
- [ ] Start Menu entry created
- [ ] Uninstaller works
- [ ] Portable version runs from any location
- [ ] File associations work (if enabled)

#### macOS-Specific

- [ ] DMG mounts correctly
- [ ] Drag to Applications works
- [ ] App opens from Applications
- [ ] Dark mode switches correctly
- [ ] Menu bar integration works
- [ ] Dock icon appears
- [ ] Notarization (if signed)
- [ ] Universal binary works on Intel and Apple Silicon

#### Linux-Specific

- [ ] AppImage runs without installation
- [ ] AppImage desktop integration works
- [ ] DEB package installs correctly
- [ ] Application menu entry appears
- [ ] Icons display correctly
- [ ] MIME type associations work
- [ ] Uninstall removes application
- [ ] User data preserved after uninstall

## Platform-Specific Considerations

### Windows

1. **Native modules**: `better-sqlite3` requires rebuild for Electron's Node version
2. **Anti-virus**: May flag unsigned executables
3. **UAC**: Installer requests elevation only when needed
4. **Path length**: Keep paths under 260 characters

### macOS

1. **Code signing**: Required for distribution outside App Store
2. **Notarization**: Required for macOS 10.15+
3. **Hardened runtime**: Enabled for security
4. **Gatekeeper**: May block unsigned apps
5. **Universal binary**: Both Intel and Apple Silicon supported

### Linux

1. **Sandbox**: AppImage may need `--no-sandbox` flag
2. **Dependencies**: DEB declares required system libraries
3. **Wayland/X11**: Application uses X11 by default
4. **Permissions**: SQLite database needs write access to `~/.config/`

## Known Issues

### Windows

| Issue | Workaround | Status |
|-------|------------|--------|
| SmartScreen warning | Code sign the application | Pending |

### macOS

| Issue | Workaround | Status |
|-------|------------|--------|
| "App can't be opened" | Right-click > Open | Expected (unsigned) |
| Notarization timeout | Retry build | Intermittent |

### Linux

| Issue | Workaround | Status |
|-------|------------|--------|
| AppImage sandbox fails | Use `--no-sandbox` | Known limitation |
| FUSE not installed | Install fuse2 package | User setup |

## Performance Targets

| Metric | Target | Windows | macOS | Linux |
|--------|--------|---------|-------|-------|
| Launch time | <2s | TBD | TBD | ~1.5s |
| Memory (idle) | <300MB | TBD | TBD | ~280MB |
| Memory (10 tabs) | <500MB | TBD | TBD | ~450MB |
| Tab switch | <100ms | TBD | TBD | ~50ms |

## Reporting Issues

When reporting platform-specific issues, include:

1. **Platform**: OS name and version
2. **Architecture**: x64, arm64, ia32
3. **Package type**: Installer, portable, AppImage, DMG, etc.
4. **Steps to reproduce**
5. **Expected behavior**
6. **Actual behavior**
7. **Log files** (if applicable): `~/.config/workspace-navigator/logs/`

## CI Secrets Required

For full CI/CD functionality, configure these repository secrets:

### Optional (for signed macOS builds)

- `MAC_CERTS`: Base64-encoded .p12 certificate
- `MAC_CERTS_PASSWORD`: Certificate password
- `APPLE_ID`: Apple Developer ID email
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Developer team ID

### Optional (for releases)

- `GITHUB_TOKEN`: Automatically available for releases
