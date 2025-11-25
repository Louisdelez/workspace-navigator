# Workspace Navigator User Manual

**Version**: 1.0.0
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Workspaces](#3-workspaces)
4. [Folders and Items](#4-folders-and-items)
5. [Web Browsing](#5-web-browsing)
6. [Markdown Notes](#6-markdown-notes)
7. [AI Assistant](#7-ai-assistant)
8. [Search and Tags](#8-search-and-tags)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Settings and Preferences](#10-settings-and-preferences)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Introduction

### What is Workspace Navigator?

Workspace Navigator is an all-in-one productivity application that combines:

- **Web Browser**: Browse the internet with multi-tab support
- **Markdown Editor**: Create and edit notes with live preview
- **AI Assistant**: Access ChatGPT, Claude, Gemini, or custom AI providers

All your work is organized in **workspaces** - collections of web pages, notes, and folders that persist across sessions.

### Key Features

- Organize web research and notes in one place
- Automatic date-based folder organization
- Session persistence (your tabs restore on restart)
- Multiple AI providers in a dedicated panel
- Cross-platform (Windows, macOS, Linux)

---

## 2. Getting Started

### First Launch

When you first launch Workspace Navigator:

1. A default workspace is created automatically
2. The main window opens with three panels:
   - **Left**: Workspace panel (folders and items)
   - **Center**: Tab area (web pages and notes)
   - **Right**: AI assistant panel

### Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace Navigator                                      ─ □ ✕ │
├──────────────┬────────────────────────────────┬─────────────────┤
│              │  Tab Bar                        │  AI Provider ▼  │
│  Workspaces  ├────────────────────────────────┤─────────────────┤
│  ─────────── │                                │                 │
│  📁 Folders  │     Web Page / Note Editor     │   AI Assistant  │
│  📄 Items    │                                │     Panel       │
│              │                                │                 │
│  [Search]    │     Navigation Bar             │                 │
│              │     ← → ⟳  [URL Bar]           │                 │
└──────────────┴────────────────────────────────┴─────────────────┘
```

---

## 3. Workspaces

### What is a Workspace?

A workspace is a container for your research project, topic, or area of work. Each workspace has its own:

- Folder structure
- Saved web items
- Markdown notes
- Open tabs (restored on switch)

### Creating a Workspace

1. Click the workspace dropdown at the top of the left panel
2. Select **"New Workspace"**
3. Enter a name for your workspace
4. Click **Create**

### Switching Workspaces

1. Click the workspace dropdown
2. Select the workspace you want to switch to
3. Your current tabs will be saved automatically
4. The new workspace's content and tabs will load

### Deleting a Workspace

1. Click the workspace dropdown
2. Click the **delete icon** next to the workspace name
3. Confirm the deletion

**Warning**: Deleting a workspace removes all its folders, items, and notes permanently.

---

## 4. Folders and Items

### Understanding the Structure

- **Folders**: Organize your items into categories
- **Web Items**: Saved web pages (URL, title, favicon)
- **Note Items**: Markdown documents

### Auto Date Folders

When you save a web page without selecting a folder, Workspace Navigator automatically creates a date folder (e.g., "25.11.2025") and places the item there.

### Creating Folders

**Method 1: Button**
1. Click the **"New Folder"** button in the workspace panel
2. Enter a folder name
3. Press Enter or click Create

**Method 2: Context Menu**
1. Right-click in the workspace panel
2. Select **"New Folder"**
3. Enter a folder name

### Creating Notes

1. Click the **"New Note"** button, or
2. Right-click a folder and select **"New Note"**
3. The note opens in a new tab for editing

### Moving Items

**Drag and Drop**:
1. Click and hold an item
2. Drag it to the target folder
3. Release to drop

**Context Menu**:
1. Right-click the item
2. Select **"Move to..."**
3. Choose the destination folder

### Renaming Items

1. Right-click the item or folder
2. Select **"Rename"**
3. Enter the new name
4. Press Enter

### Deleting Items

1. Right-click the item or folder
2. Select **"Delete"**
3. Confirm the deletion

**Note**: Deleting a folder will also delete all items inside it.

---

## 5. Web Browsing

### Opening Web Pages

**From URL Bar**:
1. Click the URL bar (or press `Ctrl+L`)
2. Type or paste a URL
3. Press Enter

**From Workspace**:
1. Click any web item in the workspace panel
2. It opens in a new tab

### Navigation

| Button | Action | Shortcut |
|--------|--------|----------|
| ← | Go back | `Alt+←` |
| → | Go forward | `Alt+→` |
| ⟳ | Reload page | `Ctrl+R` |

### Managing Tabs

- **New Tab**: Click the `+` button or press `Ctrl+T`
- **Close Tab**: Click the `×` on the tab or press `Ctrl+W`
- **Switch Tabs**: Click a tab or use `Ctrl+Tab` / `Ctrl+Shift+Tab`
- **Reorder Tabs**: Drag and drop tabs to rearrange

### Automatic Saving

When you navigate to a web page:
1. The page is automatically saved to your workspace
2. Title and favicon are captured
3. The item appears in the appropriate date folder

### Duplicate Detection

If you visit the same URL twice on the same day in the same folder:
- The existing item is focused instead of creating a duplicate
- This keeps your workspace organized

---

## 6. Markdown Notes

### Creating Notes

1. Click **"New Note"** in the workspace panel
2. A new note opens in the editor

### Editor Interface

The Markdown editor features:
- **Left pane**: Write your Markdown
- **Right pane**: Live preview
- **Toolbar**: Formatting buttons

### Formatting

| Style | Markdown | Shortcut |
|-------|----------|----------|
| Bold | `**text**` | `Ctrl+B` |
| Italic | `*text*` | `Ctrl+I` |
| Heading 1 | `# Heading` | - |
| Heading 2 | `## Heading` | - |
| Link | `[text](url)` | `Ctrl+K` |
| Code | `` `code` `` | - |
| List | `- item` | - |

### Autosave

Your notes are saved automatically:
- Saves 500ms after you stop typing
- Status indicator shows: "Saving..." → "Saved at HH:MM:SS"
- No manual save needed

### Closing Notes

When you close a note tab:
- Any pending changes are saved immediately
- Your content is never lost

---

## 7. AI Assistant

### Supported Providers

| Provider | URL |
|----------|-----|
| ChatGPT | chat.openai.com |
| Claude | claude.ai |
| Gemini | gemini.google.com |
| Custom | Any URL you specify |

### Switching Providers

1. Click the provider dropdown at the top of the AI panel
2. Select your preferred provider
3. The new provider loads in the panel

### Logging In

1. Select your AI provider
2. Log in with your account credentials
3. Your session persists across app restarts

### Using AI While Working

The AI panel stays visible while you:
- Browse web pages
- Edit notes
- Switch between tabs

This allows you to:
- Ask questions about content you're viewing
- Get help with your writing
- Research topics while taking notes

### Custom AI Provider

To use a custom AI service:
1. Select **"Custom URL"** from the dropdown
2. Enter the URL of your AI service
3. Press Enter to load

---

## 8. Search and Tags

### Searching

1. Click the search bar in the workspace panel (or press `Ctrl+F`)
2. Type your search query
3. Results appear as you type

Search finds items by:
- Title
- URL (for web items)
- Content (for notes)

### Tags

#### Adding Tags

1. Right-click an item
2. Select **"Add Tag"**
3. Enter a tag name (or select existing)
4. Press Enter

#### Viewing Tags

Tags appear as colored badges on items in the workspace panel.

#### Filtering by Tag

1. Click a tag badge, or
2. Search for the tag name
3. Only items with that tag are shown

#### Removing Tags

1. Right-click the item
2. Select **"Remove Tag"**
3. Choose the tag to remove

---

## 9. Keyboard Shortcuts

### General

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| New Tab | `Ctrl+T` | `Cmd+T` |
| Close Tab | `Ctrl+W` | `Cmd+W` |
| Next Tab | `Ctrl+Tab` | `Cmd+Tab` |
| Previous Tab | `Ctrl+Shift+Tab` | `Cmd+Shift+Tab` |
| Focus Search | `Ctrl+F` | `Cmd+F` |
| New Note | `Ctrl+N` | `Cmd+N` |
| New Folder | `Ctrl+Shift+N` | `Cmd+Shift+N` |

### Web Browsing

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Focus URL Bar | `Ctrl+L` | `Cmd+L` |
| Reload | `Ctrl+R` | `Cmd+R` |
| Go Back | `Alt+←` | `Cmd+←` |
| Go Forward | `Alt+→` | `Cmd+→` |

### Markdown Editing

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Bold | `Ctrl+B` | `Cmd+B` |
| Italic | `Ctrl+I` | `Cmd+I` |
| Insert Link | `Ctrl+K` | `Cmd+K` |

### View Shortcuts Help

Press `Ctrl+?` (or `Cmd+?` on macOS) to open the keyboard shortcuts dialog.

---

## 10. Settings and Preferences

### Theme

Switch between light and dark themes:
1. Go to **View** menu
2. Select **Theme**
3. Choose **Light** or **Dark**

The theme preference is saved and restored on restart.

### Panel Sizes

All panels are resizable:
1. Hover over the border between panels
2. Drag to resize
3. Sizes are saved automatically

### Data Location

Your data is stored in:

| Platform | Location |
|----------|----------|
| Windows | `%APPDATA%\workspace-navigator\` |
| macOS | `~/Library/Application Support/workspace-navigator/` |
| Linux | `~/.config/workspace-navigator/` |

Contents:
- `workspace.db` - Database with workspaces, folders, items
- `notes/` - Markdown note files
- `logs/` - Application logs

---

## 11. Troubleshooting

### App Won't Start

1. **Check system requirements**: Ensure your OS is supported
2. **Reinstall**: Download and install the latest version
3. **Check logs**: Look in the logs folder for error messages

### Database Errors

If you see database errors:
1. Close the application
2. Delete `workspace.db` in the data folder
3. Restart the app (a new database will be created)

**Warning**: This will delete all your workspaces and items.

### Web Pages Won't Load

1. Check your internet connection
2. Try the URL in a regular browser
3. Clear the app cache: Delete the `Cache` folder in data location

### Notes Not Saving

1. Check the save indicator - it should show "Saved at..."
2. Ensure you have write permissions to the data folder
3. Check available disk space

### AI Panel Not Loading

1. Verify internet connection
2. Try switching to a different provider
3. Clear session: Delete provider cache in data folder

### Performance Issues

If the app is slow:
1. Close unused tabs (20+ tabs may impact performance)
2. Restart the application
3. Check system resources (CPU, memory)

### Crash Recovery

If the app crashes:
1. Reopen the application
2. Your session will be automatically restored
3. Check the crash report in `logs/crash-*.log`

### Getting Help

If you can't resolve an issue:
1. Check the FAQ (see next section)
2. Search existing issues on GitHub
3. Report a new issue with:
   - Operating system and version
   - Steps to reproduce
   - Error messages or logs

---

## Frequently Asked Questions

### Q: How do I backup my data?

Copy the entire data folder to a safe location:
- Windows: `%APPDATA%\workspace-navigator\`
- macOS: `~/Library/Application Support/workspace-navigator/`
- Linux: `~/.config/workspace-navigator/`

### Q: Can I sync across devices?

Currently, Workspace Navigator stores data locally. Cloud sync is planned for a future version.

### Q: How do I import bookmarks?

You can add web items manually by:
1. Copying a URL
2. Pasting it in the URL bar
3. The page will be saved to your workspace

Bulk import is planned for a future version.

### Q: Is my AI conversation private?

Workspace Navigator does not intercept or store your AI conversations. You're communicating directly with the AI provider through their web interface.

### Q: How do I export my notes?

Notes are stored as `.md` files in the `notes/` folder. You can copy these files directly.

### Q: Can I use multiple windows?

Currently, Workspace Navigator supports a single window. Multi-window support may be added in a future version.

### Q: How do I reset the app?

To completely reset:
1. Close the application
2. Delete the entire data folder
3. Restart the app

---

## Version History

### Version 1.0.0 (2025-11-25)

Initial release with:
- Workspace management
- Web browsing with tabs
- Markdown note editing
- AI assistant panel
- Search and tagging
- Cross-platform support

---

*Thank you for using Workspace Navigator!*
