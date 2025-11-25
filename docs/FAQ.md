# Workspace Navigator - Frequently Asked Questions

**Version**: 1.0.0
**Last Updated**: 2025-11-25

---

## General Questions

### What is Workspace Navigator?

Workspace Navigator is an all-in-one productivity application that combines a web browser, Markdown note editor, and AI assistant panel. It helps you organize your research, notes, and AI interactions in one place.

### What platforms are supported?

- **Windows**: Windows 10 and Windows 11 (64-bit and 32-bit)
- **macOS**: macOS 12 (Monterey) and later (Intel and Apple Silicon)
- **Linux**: Ubuntu 20.04+ and compatible distributions (64-bit)

### Is Workspace Navigator free?

Yes, Workspace Navigator is open-source software released under the MIT license.

### Do I need an internet connection?

- **Web browsing**: Yes, requires internet
- **AI assistant**: Yes, requires internet
- **Note editing**: No, works offline
- **Workspace organization**: No, works offline

---

## Installation

### How do I install on Windows?

1. Download the `.exe` installer from the releases page
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

**Portable version**: Download the portable `.exe` and run directly (no installation required).

### How do I install on macOS?

1. Download the `.dmg` file
2. Open the DMG
3. Drag "Workspace Navigator" to the Applications folder
4. Launch from Applications

**Note**: You may see a security warning for unsigned apps. Right-click and select "Open" to bypass.

### How do I install on Linux?

**AppImage**:
```bash
chmod +x Workspace-Navigator-*.AppImage
./Workspace-Navigator-*.AppImage
```

**DEB package**:
```bash
sudo apt install ./workspace-navigator_*.deb
```

### How do I uninstall?

**Windows**: Use "Add or Remove Programs" or run the uninstaller

**macOS**: Move the app from Applications to Trash

**Linux (DEB)**: `sudo apt remove workspace-navigator`

**Linux (AppImage)**: Delete the AppImage file

---

## Workspaces

### What is a workspace?

A workspace is a container for organizing related content - web pages, notes, and folders. Think of it as a project or topic area.

### How many workspaces can I create?

There is no hard limit. Create as many as you need.

### Can I share workspaces between devices?

Not currently. Data is stored locally. Cloud sync is planned for a future version.

### What happens if I delete a workspace?

All folders, items, and notes in that workspace are permanently deleted. This action cannot be undone.

---

## Web Browsing

### Why are my web pages automatically saved?

Workspace Navigator automatically saves every page you visit to help you build a research collection. Pages are organized by date or placed in your selected folder.

### How do I prevent duplicate saves?

The app automatically detects duplicates. If you visit the same URL on the same day in the same folder, the existing item is focused instead of creating a new one.

### Can I delete saved web items?

Yes. Right-click the item and select "Delete".

### Do web pages store offline copies?

No. Only the URL, title, and favicon are saved. The actual web content loads from the internet when you open the item.

### Why can't I load certain websites?

Some websites may block embedded browsers or require specific authentication. Try:
1. Checking your internet connection
2. Verifying the URL is correct
3. Testing in a regular browser

---

## Notes

### Where are my notes stored?

Notes are stored as `.md` files in:
- Windows: `%APPDATA%\workspace-navigator\notes\`
- macOS: `~/Library/Application Support/workspace-navigator/notes/`
- Linux: `~/.config/workspace-navigator/notes/`

### How does autosave work?

Notes save automatically 500ms after you stop typing. The save indicator shows:
- "Saving..." - save in progress
- "Saved at HH:MM:SS" - successfully saved
- "Save failed" - error occurred (click to retry)

### Can I import existing Markdown files?

Not directly through the UI. You can:
1. Create a new note
2. Copy content from your existing file
3. Paste into the editor

Bulk import is planned for a future version.

### Can I export my notes?

Notes are already standard Markdown files. Copy them from the `notes/` folder.

### What Markdown features are supported?

- Headings (H1-H6)
- Bold, italic, strikethrough
- Ordered and unordered lists
- Links and images
- Code blocks and inline code
- Blockquotes
- Tables (GFM)
- Task lists

---

## AI Assistant

### Which AI providers are supported?

- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Gemini (gemini.google.com)
- Custom URL (any web-based AI)

### Do I need accounts for AI providers?

Yes. You need to have accounts with the respective AI services. Workspace Navigator provides a panel to access them, not the AI service itself.

### Is my AI conversation private?

Yes. Workspace Navigator does not intercept, store, or analyze your AI conversations. You communicate directly with the AI provider's website.

### Why does the AI panel reload when I switch providers?

Each provider has its own session and URL. Switching providers loads the new provider's website.

### Can I use a local AI?

Yes. Use the "Custom URL" option and enter your local AI service URL (e.g., `http://localhost:8080`).

---

## Performance

### How many tabs can I open?

There's no hard limit, but:
- 20+ tabs may impact performance
- A warning appears at 20 tabs
- Consider closing unused tabs

### Why is the app slow?

Try:
1. Closing unused tabs
2. Restarting the application
3. Checking system resources
4. Updating to the latest version

### How much memory does it use?

Typical usage:
- Idle: ~280MB
- 10 tabs: ~450MB
- 20+ tabs: ~600MB+

---

## Data & Privacy

### Where is my data stored?

| Platform | Location |
|----------|----------|
| Windows | `%APPDATA%\workspace-navigator\` |
| macOS | `~/Library/Application Support/workspace-navigator/` |
| Linux | `~/.config/workspace-navigator/` |

### What data is stored?

- `workspace.db` - SQLite database (workspaces, folders, items)
- `notes/` - Markdown files for your notes
- `logs/` - Application logs
- `Cache/` - Web content cache

### Is my data encrypted?

The database and notes are not encrypted by default. Use full-disk encryption (BitLocker, FileVault, LUKS) for sensitive data.

### Does the app send data anywhere?

No. All data stays on your device. The only network traffic is:
- Web pages you browse
- AI provider websites you use

### How do I backup my data?

Copy the entire data folder to a backup location. Recommended: backup regularly.

### How do I restore from backup?

1. Close the application
2. Copy backup files to the data folder
3. Restart the application

---

## Troubleshooting

### The app won't start

1. Try restarting your computer
2. Check if another instance is running
3. Delete the `Cache` folder in data location
4. Reinstall the application

### My tabs disappeared

Tabs should restore automatically. If they don't:
1. Check `logs/` for error messages
2. The session file may be corrupted
3. Restart the app - it will start fresh

### Database error on startup

1. Check disk space
2. Check file permissions
3. If persistent, delete `workspace.db` (warning: loses all data)

### Web pages show blank

1. Check internet connection
2. Try reloading (Ctrl+R)
3. Check if the site works in a regular browser
4. Clear cache folder

### Notes won't save

1. Check disk space
2. Check write permissions on notes folder
3. Check the save indicator for errors

### Crash on startup

1. Check `logs/crash-*.log` for details
2. Try deleting settings/cache
3. Reinstall the application
4. Report the issue with log files

---

## Feature Requests

### How do I request a feature?

Open an issue on GitHub with:
- Clear description of the feature
- Use case / why it's useful
- Any mockups or examples

### Planned features

- Cloud sync
- Bulk import/export
- Browser extensions
- Multi-window support
- Plugin system

---

## Getting Help

### Where can I get support?

1. Check this FAQ
2. Read the [User Manual](./USER_MANUAL.md)
3. Search GitHub issues
4. Open a new issue

### How do I report a bug?

Open a GitHub issue with:
- Operating system and version
- App version
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs
- Screenshots if applicable

---

*Last updated: 2025-11-25*
