# Development Guide - Workspace Navigator POC

## Quick Start

### Prerequisites Check

```bash
# Verify Node.js version (should be 20.x)
node --version

# Verify npm version (should be 10.x+)
npm --version
```

### Initial Setup

```bash
# 1. Install all dependencies
npm install

# Expected output:
# - Should complete without errors
# - better-sqlite3 will compile native modules (this may take a minute)
```

### Running the POC

```bash
# Option 1: Development mode with hot reload (recommended)
npm run electron:dev

# This will:
# 1. Start Vite dev server on http://localhost:5173
# 2. Compile main process TypeScript
# 3. Launch Electron
# 4. Open DevTools automatically

# Option 2: Build then run
npm run build
npm run electron:build
```

## Testing the POC

### Test Scenario 1: Workspace Creation & Basic Navigation

1. **Launch the application**
   ```bash
   npm run electron:dev
   ```

2. **Create first workspace**
   - Click the **"+"** button next to the workspace selector
   - Enter name: "Test Workspace"
   - Press OK

3. **Verify workspace persistence**
   - Close the application
   - Relaunch with `npm run electron:dev`
   - Workspace should still be selected

**Expected**: Workspace persists across restarts ✅

---

### Test Scenario 2: Folder & Note Creation

1. **Create a folder**
   - Click **"New Folder"** button
   - Enter name: "Chapter 1"
   - Press OK
   - Folder appears in tree with 📁 icon

2. **Create a note**
   - Click **"New Note"** button
   - Enter title: "Meeting Notes"
   - Press OK
   - Note appears in tree with 📝 icon
   - Note opens in center area

3. **Verify note structure**
   - Should open in a tab with title "Meeting Notes"
   - Editor should show "# Meeting Notes" (auto-generated)

**Expected**: Folder and note created successfully ✅

---

### Test Scenario 3: Autosave Functionality (FR-015)

1. **Edit a note**
   - Open a note from the tree
   - Start typing: "This is a test of autosave..."

2. **Wait for autosave**
   - Stop typing
   - After 500ms, you should see: "Saved at HH:MM:SS" in the toolbar

3. **Verify persistence**
   - Close the tab (click ×)
   - Click the note again in the tree
   - Content should be preserved

**Expected**: Autosave works with 500ms debounce ✅

---

### Test Scenario 4: Auto Date Folders (FR-005)

1. **Create note without folder selection**
   - Ensure no folder is selected in the tree
   - Click **"New Note"**
   - Enter title: "Quick Note"

2. **Verify date folder creation**
   - A folder named "22.11.2025" (today's date) should appear
   - Note should be inside this folder
   - Folder should have 📁 icon

3. **Create another note today**
   - Click **"New Note"** again
   - Enter title: "Another Note"
   - Should be placed in the same date folder (not a new one)

**Expected**: Date folders auto-created and reused ✅

---

### Test Scenario 5: Multiple Workspaces

1. **Create second workspace**
   - Click **"+"** button
   - Enter name: "Work Projects"

2. **Add content to second workspace**
   - Create a folder: "Project A"
   - Create a note: "TODO List"

3. **Switch between workspaces**
   - Use the dropdown to switch to "Test Workspace"
   - Verify different content appears
   - Switch back to "Work Projects"
   - Content should match

**Expected**: Workspaces are isolated ✅

---

### Test Scenario 6: Tabs Management

1. **Open multiple items**
   - Create 3 notes: "Note 1", "Note 2", "Note 3"
   - Click each in the tree
   - 3 tabs should appear in the tabs bar

2. **Switch between tabs**
   - Click different tabs
   - Content should update in the center area

3. **Close tabs**
   - Click × on "Note 2" tab
   - Tab closes but note remains in tree
   - Click note in tree again to reopen

**Expected**: Tabs work independently from workspace tree ✅

---

### Test Scenario 7: Session Persistence (FR-003c)

1. **Setup session state**
   - Open workspace "Test Workspace"
   - Open 2-3 notes as tabs
   - Make sure one tab is active

2. **Force quit application**
   - Close window completely

3. **Restart and verify**
   - Run `npm run electron:dev` again
   - Same workspace should be active
   - Same tabs should be open
   - Same tab should be active

**Expected**: Full session restored ✅

---

### Test Scenario 8: AI Panel Integration

1. **Select AI provider**
   - In right panel, select "ChatGPT" from dropdown

2. **Verify iframe loads**
   - https://chat.openai.com should load in iframe
   - May show login page (expected)

3. **Try different providers**
   - Switch to "Claude"
   - Switch to "Gemini"
   - Switch to "None"

**Expected**: AI provider selection persists and loads ✅

**Note**: Some AI providers may block iframe embedding. This is a known limitation of the POC.

---

### Test Scenario 9: Web Items (Limited Functionality)

⚠️ **Important**: Web items use iframes which have CORS restrictions. Many sites will not load.

1. **Test with iframe-friendly site**
   - You can manually create a web item by modifying the database (not exposed in UI)
   - Or use the developer console:
     ```javascript
     window.electronAPI.item.createWeb(
       '<workspace-id>',
       'https://example.com',
       'Example Site'
     )
     ```

2. **Verify web item creation**
   - Item appears in tree with 🌐 icon
   - Clicking opens in iframe

**Expected**: Basic web viewing works for compatible sites ✅

---

## Database Inspection

### View Database Contents

```bash
# Install DB Browser for SQLite (if not installed)
# macOS: brew install --cask db-browser-for-sqlite
# Windows: Download from https://sqlitebrowser.org
# Linux: apt install sqlitebrowser

# Open database
# macOS
sqlitebrowser ~/Library/Application\ Support/workspace-navigator/workspace.db

# Linux
sqlitebrowser ~/.config/workspace-navigator/workspace.db

# Windows
# %APPDATA%\workspace-navigator\workspace.db
```

### SQL Queries for Testing

```sql
-- View all workspaces
SELECT * FROM workspaces;

-- View folder hierarchy
SELECT id, name, folder_type, parent_id FROM folders;

-- View all items
SELECT id, title, item_type, folder_id FROM items;

-- View session state
SELECT * FROM session_state;

-- Check auto-date folders
SELECT * FROM folders WHERE folder_type = 'date';

-- Find items in today's date folder
SELECT i.* FROM items i
JOIN folders f ON i.folder_id = f.id
WHERE f.folder_type = 'date'
AND f.name = '22.11.2025';  -- Update to current date
```

## Debugging

### Enable Debug Logging

Add to `src/main/index.ts`:

```typescript
// At the top of the file
process.env.DEBUG = 'workspace-navigator:*';

// Add logging to operations
console.log('Creating workspace:', name);
console.log('Session state:', sessionState);
```

### DevTools

Development mode automatically opens DevTools. Use:

- **Console**: View React component logs
- **Application > Local Storage**: View any client-side state (none in this POC)
- **Network**: Monitor any network requests (iframes)

### Common Issues

#### Issue 1: "Cannot find module 'better-sqlite3'"

**Solution**:
```bash
npm rebuild better-sqlite3
```

#### Issue 2: Window doesn't appear

**Solution**:
```bash
# Clear Electron cache
rm -rf ~/Library/Application\ Support/workspace-navigator/  # macOS
rm -rf ~/.config/workspace-navigator/  # Linux

# Restart
npm run electron:dev
```

#### Issue 3: TypeScript compilation errors

**Solution**:
```bash
# Clean build
rm -rf dist/
npm run build
```

#### Issue 4: Vite dev server won't start

**Solution**:
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9  # macOS/Linux

# Restart
npm run dev
```

## Performance Testing

### Database Performance

```javascript
// Add to main process for benchmarking
console.time('getWorkspaces');
const workspaces = engine.getAllWorkspaces();
console.timeEnd('getWorkspaces');

// Expected: < 10ms for 100 workspaces
```

### Autosave Debounce Verification

```javascript
// In MarkdownEditor.tsx, add logging:
useEffect(() => {
  console.log('Debounce started...');
  timeoutRef.current = setTimeout(() => {
    console.log('Saving after 500ms');
    // ... save logic
  }, 500);
}, [content]);

// Watch console to verify 500ms delay
```

## Code Quality

### Run Linting

```bash
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Format Code

```bash
npm run format
```

### Type Checking

```bash
# Check main process
npx tsc --project tsconfig.main.json --noEmit

# Check renderer (happens during build)
npm run build:renderer
```

## Next Development Steps

After validating the POC, here are recommended next steps:

1. **Add Search Functionality**
   - Database layer already has FTS5 support
   - Need UI component for search input
   - Filter tree based on search query

2. **Implement Drag-and-Drop**
   - React DnD library recommended
   - Handlers in WorkspacePanel.tsx
   - Call engine.moveItem() and engine.moveFolder()

3. **Add Tags Support**
   - Database schema ready
   - Need tag UI components
   - Tag filtering in tree

4. **Improve Markdown Editor**
   - Integrate CodeMirror or Monaco
   - Add preview mode
   - Syntax highlighting

5. **Browser Controls for Web Items**
   - Add back/forward/refresh buttons
   - Address bar input
   - Navigation history

6. **Testing**
   - Vitest for unit tests
   - Playwright for E2E tests
   - Test coverage >80%

## Files Created

Here's a complete list of files created for the POC:

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tsconfig.main.json` - Main process TypeScript config
- `vite.config.ts` - Vite build configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting
- `.gitignore` - Git ignore patterns

### Source Code - Main Process
- `src/main/index.ts` - Electron main process entry
- `src/main/preload.ts` - Context bridge API

### Source Code - Core Logic
- `src/core/workspace/workspace-engine.ts` - Business logic
- `src/core/storage/database.ts` - SQLite wrapper
- `src/core/storage/schema.sql` - Database schema

### Source Code - Renderer (React)
- `src/renderer/index.tsx` - Renderer entry point
- `src/renderer/App.tsx` - Root component
- `src/renderer/components/WorkspacePanel.tsx` - Left sidebar
- `src/renderer/components/TabsContainer.tsx` - Center tabs area
- `src/renderer/components/MarkdownEditor.tsx` - Note editor
- `src/renderer/components/WebView.tsx` - Web content display
- `src/renderer/components/AIPanel.tsx` - AI assistant panel
- `src/renderer/styles/index.css` - Global styles

### Type Definitions
- `src/types/entities.ts` - Data models
- `src/types/electron.d.ts` - Window API types

### HTML
- `index.html` - Application entry HTML

### Documentation
- `README.md` - Main documentation
- `DEVELOPMENT.md` - This file

## Conclusion

This POC demonstrates all core concepts of Workspace Navigator:

✅ Workspace management
✅ Hierarchical organization
✅ Multiple item types
✅ Autosave functionality
✅ Session persistence
✅ Three-column layout
✅ AI panel integration

The architecture is solid and ready for enhancement with native CEF integration, advanced markdown editing, and full feature implementation.

For questions, refer to:
- README.md - General overview
- specs/001-workspace-navigator/ - Complete specifications
