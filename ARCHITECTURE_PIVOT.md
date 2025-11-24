# Architecture Pivot: CEF → Electron Native

**Date:** 2024-11-24
**Decision:** Drop CEF, use Electron's built-in Chromium (BrowserView/webContentsView)

## Why Pivot

### CEF Issues Encountered
1. **OSR Crash:** SIGSEGV crash in Off-Screen Rendering initialization
2. **Windowed Complexity:** Separate windows, complex X11 integration
3. **Build Complexity:** Native C++ compilation, platform-specific code
4. **Maintenance:** Additional dependency to maintain and update
5. **No Clear Benefit:** Electron's Chromium is sufficient for V1

### Electron Native Advantages
1. ✅ **Zero crashes** - Battle-tested, stable
2. ✅ **Built-in** - No external dependencies
3. ✅ **Simple API** - BrowserView/webContentsView
4. ✅ **Full integration** - Native to Electron
5. ✅ **Fast development** - No C++ compilation
6. ✅ **Cross-platform** - Works everywhere

## New Architecture

### Browser Engine: Electron BrowserView

```typescript
// Create browser view for each tab
const browserView = new BrowserView({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true
  }
});

// Add to window
mainWindow.addBrowserView(browserView);

// Position and load
browserView.setBounds({ x: 200, y: 50, width: 800, height: 600 });
browserView.webContents.loadURL('https://google.com');
```

### Component Structure (Unchanged)

```
┌─────────────────────────────────────────────────┐
│  Workspace Navigator (Electron Window)          │
├──────────┬──────────────────────┬───────────────┤
│          │                      │               │
│ Workspace│   Tabbed Center      │  AI Assistant │
│ Tree     │   Panel              │  (Fixed)      │
│ (200px)  │   (Flex)             │  (300px)      │
│          │                      │               │
│ - Work 1 │  ┌─Tab1─┬─Tab2─┐    │  Claude       │
│ - Work 2 │  │ BrowserView  │    │  Sidebar      │
│   - Fold │  │  (Chromium)  │    │               │
│     Web1 │  │              │    │               │
│     Web2 │  └──────────────┘    │               │
│          │                      │               │
└──────────┴──────────────────────┴───────────────┘
```

## Implementation Plan

### Phase 1: Remove CEF ✅
- [x] Stop CEF processes
- [x] Document pivot decision
- [ ] Remove CEF native code
- [ ] Remove CEF dependencies from package.json
- [ ] Archive CEF documentation

### Phase 2: Implement Electron BrowserView
- [ ] Create BrowserViewManager class
- [ ] Handle tab creation/destruction
- [ ] Position BrowserViews correctly
- [ ] Handle tab switching (show/hide views)
- [ ] Navigation controls (back/forward/reload)

### Phase 3: Update React Components
- [ ] Replace CEFWebView with ElectronBrowserView component
- [ ] Update tab management
- [ ] Update navigation controls
- [ ] Remove OSR/paint event code

### Phase 4: Polish & Test
- [ ] Multi-tab support
- [ ] Proper sizing/positioning
- [ ] State persistence
- [ ] Testing

## Files to Remove/Archive

### Native Code (Remove)
```
native/
├── src/
│   ├── cef_manager.cpp
│   ├── webview_pool.cpp
│   ├── browser_client.cpp
│   ├── render_handler.cpp
│   ├── node_cef_bridge.cpp
│   └── ...
├── include/
└── build-cef-linux.sh
```

### Documentation (Archive)
```
CEF_*.md files → archive/cef-experiment/
```

## New Code Structure

```
src/
├── main/
│   ├── browser-manager.ts        # BrowserView management
│   ├── tab-manager.ts             # Tab lifecycle
│   └── index.ts                   # Main process
├── renderer/
│   └── components/
       ├── BrowserTab.tsx          # Electron BrowserView wrapper
       └── TabsContainer.tsx       # Tab management UI
```

## Key APIs to Use

### BrowserView (Electron ≥ 1.7)
```typescript
const { BrowserView } = require('electron');

const view = new BrowserView();
mainWindow.setBrowserView(view);
view.setBounds({ x: 0, y: 0, width: 300, height: 300 });
view.webContents.loadURL('https://electronjs.org');
```

### Alternative: WebContentsView (Electron ≥ 30)
```typescript
const { WebContentsView } = require('electron');

const view = new WebContentsView();
mainWindow.contentView.addChildView(view);
view.setBounds({ x: 0, y: 0, width: 300, height: 300 });
view.webContents.loadURL('https://electronjs.org');
```

## Migration Strategy

1. **Keep:** All workspace logic, sidebar, tree structure
2. **Replace:** CEF browser → Electron BrowserView
3. **Simplify:** Remove all native C++ code
4. **Test:** Verify same functionality with less complexity

## Success Criteria

- ✅ Multiple web tabs work
- ✅ Navigation controls work
- ✅ No crashes
- ✅ Fast performance
- ✅ Simple codebase
- ✅ Easy to maintain

## Next Actions

1. Remove CEF dependencies
2. Implement BrowserViewManager
3. Update TabsContainer to use BrowserView
4. Test with google.com
5. Ship V1 🚀
