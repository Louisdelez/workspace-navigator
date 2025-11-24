# CEF Off-Screen Rendering - Testing Guide

## ✅ System Status

**CEF Initialization:** SUCCESS
```
CEF initialized successfully
Cache path: /home/louis/.config/Electron/cef-cache
Remote debugging: http://localhost:9222
WebView pool initialized with max size: 20
Paint event forwarding set up
```

## Quick Test

### 1. Start the Application
```bash
cd /home/louis/Documents/Navigateur
npm run electron:dev
```

### 2. Using the CEFWebView Component

The `CEFWebView` component is now ready to use with full OSR rendering:

```tsx
import { CEFWebView } from './components/CEFWebView';

// Example usage
function App() {
  const webItem = {
    id: '1',
    workspaceId: 'workspace-1',
    folderId: null,
    itemType: 'web',
    title: 'Example Site',
    url: 'https://example.com',
    favicon: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: { lastAccessedAt: Date.now(), openCount: 0 },
    isDeleted: false
  };

  return <CEFWebView item={webItem} />;
}
```

### 3. What You Should See

**Navigation Bar:**
- Back/Forward buttons (enabled based on history)
- Reload/Stop button (toggles during loading)
- URL input bar
- Browser ID badge

**Browser Canvas:**
- Actual web page content rendered via Canvas
- Smooth updates as page loads
- Loading indicator at top

**Console Output:**
```
Paint event forwarding set up
Rendering browser 1: 1280x720
Paint events flowing...
```

## Verification Checklist

### ✅ CEF Initialization
- [x] CEF helper executable found
- [x] CEF context initialized
- [x] WebView pool ready
- [x] Paint event forwarding active
- [x] DevTools available at localhost:9222

### ⏳ Visual Rendering (To Test)
- [ ] Canvas displays actual web page
- [ ] Page updates when navigating
- [ ] Loading animations work
- [ ] Back/Forward navigation updates display
- [ ] URL bar reflects current page

### ⏳ Next Phase: Input Events
- [ ] Mouse clicks (not yet implemented)
- [ ] Mouse movements (not yet implemented)
- [ ] Keyboard input (not yet implemented)
- [ ] Scroll events (not yet implemented)

## Expected Paint Event Flow

When a browser instance is created and loads a URL:

1. **CEF renders page** → Generates pixel buffer (BGRA format)
2. **RenderHandler::OnPaint()** → Receives pixel buffer
3. **Paint callback** → Copies to std::vector
4. **N-API ThreadSafeFunction** → Wraps in ArrayBuffer
5. **Main process** → Receives paint event
6. **IPC forward** → Sends to renderer via `webContents.send()`
7. **React component** → Receives via `onPaint()` listener
8. **Canvas rendering** → Converts BGRA→RGBA, draws via `putImageData()`

## Common Issues

### Issue: "Cannot find module .node"
**Cause:** Incorrect addon path resolution
**Fix:** Path is now corrected to `../../../native/workspace_navigator_cef.node`
**Status:** ✅ FIXED

### Issue: "GPU process launch failed"
**Cause:** CEF trying to use Node.js as helper
**Fix:** Created dedicated `cef_helper` executable
**Status:** ✅ FIXED

### Issue: "Paint events not firing"
**Possible Causes:**
1. Paint callback not registered → Check console for "Paint event forwarding set up"
2. Browser not created → Check browser ID badge appears
3. Canvas not mounted → Check React dev tools

**Debug Steps:**
```javascript
// In React component, add logging
useEffect(() => {
  const cleanup = window.electronAPI.cef.onPaint((_, paintData) => {
    console.log('Paint event received:', paintData.browserId, paintData.width, paintData.height);
    // ... existing code
  });
  return cleanup;
}, [cefAvailable, browserId]);
```

## Advanced Testing

### 1. Multiple Browser Instances
Create multiple `CEFWebView` components with different URLs:
```tsx
<CEFWebView item={{ ...webItem1, url: 'https://example.com' }} />
<CEFWebView item={{ ...webItem2, url: 'https://wikipedia.org' }} />
```

Each should render independently with correct browser ID filtering.

### 2. Navigation Testing
- Load initial URL → Canvas should display page
- Enter new URL → Canvas updates
- Click Back → Canvas shows previous page
- Click Forward → Canvas shows next page
- Click Reload → Page refreshes

### 3. DevTools Inspection
Open http://localhost:9222 in regular browser:
- Click on browser instance
- Inspect DOM, console, network
- Verify page is actually loading in CEF

### 4. Performance Monitoring
Check paint event frequency:
```javascript
let paintCount = 0;
let lastCheck = Date.now();

window.electronAPI.cef.onPaint((_, paintData) => {
  paintCount++;
  const now = Date.now();
  if (now - lastCheck > 1000) {
    console.log(`Paint FPS: ${paintCount}`);
    paintCount = 0;
    lastCheck = now;
  }
  // ... render to canvas
});
```

Expected: ~60 FPS during animation, ~0 when idle

## Integration with Tabs System

The CEFWebView component is ready to integrate with the tabs manager. Here's the approach:

### 1. Find Tabs Manager
```bash
# Search for tabs manager component
grep -r "TabsContainer\|TabManager" src/renderer/
```

### 2. Replace WebView with CEFWebView
```tsx
// Before
import { WebView } from './components/WebView';

// After
import { CEFWebView } from './components/CEFWebView';
```

### 3. Conditional Rendering
```tsx
{item.itemType === 'web' ? (
  <CEFWebView item={item} />
) : (
  <NoteEditor item={item} />
)}
```

### 4. Tab Switching
When tabs switch, ensure:
- Old browser pauses rendering (paint events ignored)
- New browser resumes rendering
- Canvas refs properly cleaned up

## Performance Tips

### Memory Management
- CEF browsers use ~100-200MB each
- WebView pool max: 20 instances
- Inactive tabs can release browsers
- Use `closeBrowser()` when tab closed permanently

### Canvas Optimization
- Canvas uses hardware acceleration
- BGRA→RGBA conversion is CPU-bound
- Consider WebAssembly for pixel conversion if needed
- Use `requestAnimationFrame` for smoother updates

### Paint Event Throttling
Currently paint events fire as fast as CEF generates them. To throttle:

```typescript
let lastPaint = 0;
const minInterval = 16; // ~60 FPS

window.electronAPI.cef.onPaint((_, paintData) => {
  const now = Date.now();
  if (now - lastPaint < minInterval) return;
  lastPaint = now;

  // ... render to canvas
});
```

## Next Steps

### Phase 1: Input Events (High Priority)
**Why:** Users can't interact with pages yet
**Implementation:**
1. Add mouse event listeners to canvas
2. Convert to CEF coordinates
3. Forward via IPC to main process
4. Call CEF input APIs

**Estimated Effort:** 2-4 hours

### Phase 2: Responsive View Size
**Why:** Canvas is fixed 1280x720
**Implementation:**
1. Add ResizeObserver to canvas container
2. Update canvas size
3. Call native `setViewSize()`
4. Trigger browser repaint

**Estimated Effort:** 1-2 hours

### Phase 3: Tabs Manager Integration
**Why:** Need to test with real app UI
**Implementation:**
1. Locate tabs container component
2. Replace iframe-based WebView with CEFWebView
3. Handle tab switching
4. Test with multiple tabs

**Estimated Effort:** 2-3 hours

## Files Reference

### Native Code
- `native/src/render_handler.cpp` - OSR paint callbacks
- `native/src/browser_client.cpp` - Render handler integration
- `native/src/node_cef_bridge.cpp` - Paint event forwarding

### TypeScript
- `src/core/cef/cef-browser.ts` - CEF manager
- `src/main/index.ts` - IPC forwarding
- `src/main/preload.ts` - API exposure

### React
- `src/renderer/components/CEFWebView.tsx` - Canvas rendering

### Documentation
- `OSR_RENDERING_COMPLETE.md` - Implementation details
- `OSR_TESTING_GUIDE.md` - This file
- `WEBVIEW_COMPONENT_READY.md` - Previous milestone

## Support

**CEF Version:** 120.1.10
**Chromium:** 120.0.6099.129
**Platform:** Linux x64
**DevTools:** http://localhost:9222

---

**Status:** ✅ OSR RENDERING IMPLEMENTED
**Next:** Implement input event forwarding
**Generated:** 2025-11-23
