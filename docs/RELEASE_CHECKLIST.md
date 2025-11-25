# Release Checklist

Use this checklist before each release to ensure everything is ready.

---

## Pre-Release Checks

### Code Quality

- [ ] All tests pass: `npm test -- --run`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No console.log statements in production code
- [ ] No hardcoded debug values

### Security

- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] All dependencies up to date
- [ ] CSP headers configured correctly
- [ ] No sensitive data in codebase
- [ ] IPC handlers validate all inputs

### Documentation

- [ ] README.md is current
- [ ] CHANGELOG.md updated with new version
- [ ] RELEASE_NOTES.md created/updated
- [ ] User documentation complete
- [ ] API documentation current

### Version Numbers

- [ ] package.json version updated
- [ ] CHANGELOG.md version header added
- [ ] RELEASE_NOTES.md version updated

---

## Build Process

### Linux Build

```bash
npm run electron:build:linux
```

- [ ] AppImage created in `release/`
- [ ] DEB package created in `release/`
- [ ] AppImage launches correctly
- [ ] DEB installs correctly
- [ ] All features work

### Windows Build (on Windows)

```bash
npm run electron:build:win
```

- [ ] NSIS installer created
- [ ] Portable exe created
- [ ] Installer runs correctly
- [ ] App launches after install
- [ ] All features work

### macOS Build (on macOS)

```bash
npm run electron:build:mac
```

- [ ] DMG created (x64 and arm64)
- [ ] ZIP created
- [ ] DMG mounts correctly
- [ ] App launches
- [ ] All features work
- [ ] (Optional) Code signed
- [ ] (Optional) Notarized

---

## Testing Matrix

### Functionality Tests (All Platforms)

- [ ] App launches
- [ ] Create workspace
- [ ] Create folder
- [ ] Create web item (navigate to URL)
- [ ] Create note item
- [ ] Edit markdown with autosave
- [ ] Switch tabs
- [ ] Use navigation (back/forward/reload)
- [ ] Search items
- [ ] Add tags
- [ ] Drag and drop items
- [ ] Switch workspaces
- [ ] Delete items/folders/workspaces
- [ ] AI panel loads provider
- [ ] Switch AI providers
- [ ] Theme toggle (light/dark)
- [ ] Keyboard shortcuts work
- [ ] Session restores after restart

### Platform-Specific Tests

#### Windows
- [ ] Works on Windows 10
- [ ] Works on Windows 11
- [ ] Installer creates shortcuts
- [ ] Uninstaller works

#### macOS
- [ ] Works on Intel Mac
- [ ] Works on Apple Silicon
- [ ] DMG drag-to-install works
- [ ] Dock icon appears

#### Linux
- [ ] Works on Ubuntu 20.04
- [ ] Works on Ubuntu 22.04
- [ ] AppImage desktop integration
- [ ] DEB menu entry appears

---

## Release Process

### Git Operations

1. Ensure all changes committed:
   ```bash
   git status
   ```

2. Create version tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   ```

3. Push tag:
   ```bash
   git push origin v1.0.0
   ```

### GitHub Release

1. Go to Releases page
2. Click "Draft a new release"
3. Select the version tag
4. Title: `Workspace Navigator v1.0.0`
5. Description: Copy from RELEASE_NOTES.md
6. Upload artifacts:
   - [ ] Linux AppImage
   - [ ] Linux DEB
   - [ ] Windows installer
   - [ ] Windows portable
   - [ ] macOS DMG (x64)
   - [ ] macOS DMG (arm64)
   - [ ] macOS ZIP (x64)
   - [ ] macOS ZIP (arm64)
7. Check "Set as latest release"
8. Publish release

---

## Post-Release

- [ ] Verify all download links work
- [ ] Download and test each artifact
- [ ] Update website/docs with new version
- [ ] Announce release (if applicable)
- [ ] Monitor for issue reports
- [ ] Respond to user feedback

---

## Rollback Plan

If critical issues found after release:

1. Create hotfix branch:
   ```bash
   git checkout -b hotfix/v1.0.1 v1.0.0
   ```

2. Fix the issue

3. Test thoroughly

4. Release new version

5. Document the issue and fix in CHANGELOG

---

## Artifact Checklist

### Required Files

| Artifact | Platform | Required |
|----------|----------|----------|
| `Workspace Navigator Setup X.X.X.exe` | Windows | Yes |
| `Workspace Navigator-X.X.X-portable.exe` | Windows | Yes |
| `Workspace Navigator-X.X.X-arm64.dmg` | macOS | Yes |
| `Workspace Navigator-X.X.X-x64.dmg` | macOS | Yes |
| `Workspace Navigator-X.X.X-x86_64.AppImage` | Linux | Yes |
| `workspace-navigator_X.X.X_amd64.deb` | Linux | Yes |

### Optional Files

| Artifact | Platform | Required |
|----------|----------|----------|
| `Workspace Navigator-X.X.X-arm64-mac.zip` | macOS | Optional |
| `Workspace Navigator-X.X.X-mac.zip` | macOS | Optional |
| `SHASUMS.txt` | All | Recommended |

---

## Version Naming

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Examples:
- 1.0.0 → Initial release
- 1.0.1 → Bug fix
- 1.1.0 → New feature
- 2.0.0 → Breaking change
