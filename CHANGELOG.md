# Changelog

All notable changes to Workspace Navigator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-11-25

### Initial Release

First stable release of Workspace Navigator, a cross-platform desktop application combining web browsing, Markdown editing, and AI assistance.

### Added

#### Workspace Management
- Create, rename, and delete workspaces
- Multiple isolated workspaces for different projects
- Automatic workspace restoration on startup
- Workspace settings persistence

#### Folder Organization
- Hierarchical folder structure with unlimited nesting
- Automatic date-based folder creation (DD.MM.YYYY format)
- Drag-and-drop folder reorganization
- Circular reference prevention
- Folder rename and delete with confirmation

#### Web Browsing
- Multi-tab web browsing with Electron BrowserView
- Full browser navigation (back, forward, reload)
- URL bar with keyboard navigation (Ctrl+L)
- Automatic page title and favicon capture
- Tab state persistence across sessions
- Duplicate URL detection (same day, same folder)

#### Markdown Notes
- Full-featured Markdown editor with live preview
- Syntax highlighting for code blocks
- Auto-save with 500ms debounce
- Save status indicator ("Saving...", "Saved at HH:MM:SS")
- Support for GFM (GitHub Flavored Markdown)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)

#### AI Assistant Panel
- Integrated AI panel (right sidebar)
- Support for ChatGPT, Claude, Gemini
- Custom AI provider URL option
- Persistent AI session across app restarts
- Provider switching without losing authentication

#### Search and Tags
- Full-text search across titles, URLs, and content
- Debounced search (300ms) with instant results
- Smart result ranking (exact > starts-with > contains)
- Colored tag system (10 preset colors)
- Tag-based filtering and organization
- Add/remove tags with one click

#### User Interface
- Three-panel layout (workspace, content, AI)
- Resizable panels with persistent sizes
- Light and dark theme support
- System theme detection and auto-switch
- Keyboard shortcuts for common actions
- Shortcuts help dialog (F1)

#### Cross-Platform Support
- Windows 10/11 (NSIS installer + portable)
- macOS 12+ (DMG + ZIP, Intel and Apple Silicon)
- Linux (AppImage + DEB for Ubuntu/Debian)

#### Performance
- Launch time under 2 seconds
- BrowserView pooling for fast tab creation
- LRU-based memory management
- Lazy loading for non-critical components
- Optimized database with indexes

#### Security
- Content Security Policy (CSP)
- Context isolation enabled
- Sandboxed BrowserViews for web content
- IPC input validation
- No arbitrary code execution paths

#### Crash Recovery
- Automatic crash detection
- Session state backup every 30 seconds
- Automatic session restoration after crash
- Crash report logging with stack traces

### Technical Stack
- Electron 30+
- React 18 with TypeScript
- Vite for bundling
- better-sqlite3 for database
- Vitest + Playwright for testing

### Known Issues
- Main window sandbox disabled (required for native modules)
- Some websites may block embedded browser
- macOS builds require right-click > Open for unsigned versions

---

## [Unreleased]

### Planned Features
- Cloud sync across devices
- Browser extension integration
- Bulk import/export
- Multi-window support
- Plugin system
- Offline page caching

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2025-11-25 | Initial release |

---

## Upgrade Guide

### Fresh Install

Download the appropriate installer for your platform from the [Releases](https://github.com/OWNER/workspace-navigator/releases) page.

### From Pre-release Versions

If you were using a pre-release version:

1. **Backup your data** (see User Manual for data locations)
2. Uninstall the old version
3. Install v1.0.0
4. Data should migrate automatically

If you encounter issues:
1. Delete the database file
2. Restart the application
3. Restore from your backup manually

---

## Links

- [User Manual](docs/USER_MANUAL.md)
- [FAQ](docs/FAQ.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)
