# Workspace Navigator v1.0.0 Release Notes

**Release Date**: November 25, 2025

---

## Introducing Workspace Navigator

Workspace Navigator is an all-in-one productivity application that combines web browsing, Markdown note editing, and AI assistance in a unified workspace environment.

### Why Workspace Navigator?

- **Stop context switching** between browser, notes app, and AI chat
- **Organize research** with automatic date folders and tags
- **Persist your work** with automatic session restoration
- **Work anywhere** with cross-platform support

---

## Key Features

### Unified Workspace

Organize all your work in one place:
- Create dedicated workspaces for different projects
- Automatic organization by date
- Hierarchical folder structure
- Tag items for easy retrieval

### Integrated Web Browser

Full-featured browsing without leaving the app:
- Multiple tabs with session persistence
- Back, forward, reload navigation
- Automatic page saving to workspace
- Duplicate URL detection

### Markdown Notes

Create and edit notes alongside your research:
- Live preview as you type
- Auto-save (never lose your work)
- Syntax highlighting
- Full GFM support

### AI Assistant Panel

Access your favorite AI directly:
- ChatGPT, Claude, Gemini built-in
- Custom AI provider support
- Persistent login sessions
- Always visible while you work

---

## Downloads

### Windows

| File | Description |
|------|-------------|
| `Workspace Navigator Setup 1.0.0.exe` | Installer (recommended) |
| `Workspace Navigator-1.0.0-portable.exe` | Portable version (no install) |

**Requirements**: Windows 10 or Windows 11

### macOS

| File | Description |
|------|-------------|
| `Workspace Navigator-1.0.0-arm64.dmg` | Apple Silicon (M1/M2/M3) |
| `Workspace Navigator-1.0.0-x64.dmg` | Intel Mac |

**Requirements**: macOS 12 (Monterey) or later

**Note**: For unsigned builds, right-click the app and select "Open" to bypass Gatekeeper.

### Linux

| File | Description |
|------|-------------|
| `Workspace Navigator-1.0.0-x86_64.AppImage` | Universal (all distros) |
| `workspace-navigator_1.0.0_amd64.deb` | Debian/Ubuntu package |

**Requirements**: Ubuntu 20.04+ or equivalent

**AppImage Usage**:
```bash
chmod +x Workspace-Navigator-1.0.0-x86_64.AppImage
./Workspace-Navigator-1.0.0-x86_64.AppImage
```

---

## Getting Started

### First Launch

1. Download and install the appropriate version for your platform
2. Launch Workspace Navigator
3. A default workspace is created automatically
4. Start browsing, creating notes, or using AI!

### Quick Tips

- **Ctrl+L**: Focus URL bar
- **Ctrl+T**: New tab
- **Ctrl+W**: Close tab
- **F1**: Show all keyboard shortcuts
- **Drag items** between folders to organize
- **Right-click** for context menu options

---

## System Requirements

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| **Windows** | Windows 10, 4GB RAM | Windows 11, 8GB RAM |
| **macOS** | macOS 12, 4GB RAM | macOS 14, 8GB RAM |
| **Linux** | Ubuntu 20.04, 4GB RAM | Ubuntu 22.04, 8GB RAM |

**Disk Space**: ~200MB installed

---

## Known Issues

1. **macOS Gatekeeper**: Unsigned builds require right-click > Open
2. **Linux AppImage sandbox**: May need `--no-sandbox` flag on some systems
3. **Some websites**: May block embedded browsers (rare)

---

## Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete user guide
- [FAQ](docs/FAQ.md) - Common questions answered
- [Keyboard Shortcuts](docs/USER_MANUAL.md#9-keyboard-shortcuts) - All shortcuts

---

## Feedback and Support

- **Issues**: [GitHub Issues](https://github.com/OWNER/workspace-navigator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/OWNER/workspace-navigator/discussions)
- **Documentation**: [docs/](docs/)

---

## What's Next?

Planned for future releases:
- Cloud sync
- Browser extension
- Bulk import/export
- Multi-window support
- Plugin system

---

## Acknowledgments

Built with:
- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Vite](https://vitejs.dev/)

---

Thank you for trying Workspace Navigator!

If you find it useful, please star the repository and share with others.
