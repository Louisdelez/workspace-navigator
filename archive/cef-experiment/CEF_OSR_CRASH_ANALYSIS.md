# CEF Off-Screen Rendering (OSR) Crash Analysis

## Test Results Summary

### ✅ Confirmed: OnPaint is NOT the crash source
With OnPaint completely disabled (early return at function start), the SIGSEGV crash **still occurs**.

### Timeline of Events
```
1. ✅ CEF initialized successfully
2. ✅ Browser created successfully (ID: 1)
3. ✅ Browser ready event emitted
4. ✅ Event forwarded to renderer
5. 💥 SIGSEGV crash occurs
```

The crash happens **after** browser creation but **during** CEF's internal OSR renderer initialization, before our OnPaint callback is ever invoked.

## Root Cause Analysis

### Eliminated Causes
- ❌ Our OnPaint callback implementation
- ❌ Paint callback registration
- ❌ React component paint listener
- ❌ State polling useEffect
- ❌ Buffer size calculations
- ❌ JavaScript/TypeScript code

### Probable Causes

The crash is occurring in CEF's **internal OSR initialization**, likely in one of these areas:

#### 1. **Thread Safety Issue** (Most Likely)
- CEF's renderer process tries to access RenderHandler from wrong thread
- OSR initialization happens on CEF's UI thread but our handler might not be thread-safe
- Missing thread synchronization in GetViewRect or handler registration

**Evidence:** CEF uses multi-threaded message loop (`settings.multi_threaded_message_loop = true`)

#### 2. **Missing RenderHandler Methods**
We only implement 2 of the 5+ required OSR methods:
- ✅ `GetViewRect()` - implemented
- ✅ `OnPaint()` - implemented
- ❌ `GetScreenInfo()` - **missing**
- ❌ `GetScreenPoint()` - **missing**
- ❌ `OnPopupShow()` - **missing**
- ❌ `OnPopupSize()` - **missing**
- ❌ `OnAcceleratedPaint()` - **missing**

**Evidence:** CEF might be calling these methods and crashing on null pointers

#### 3. **CefWindowInfo Configuration Issue**
Current implementation:
```cpp
CefWindowInfo window_info;
window_info.SetAsWindowless(0);  // Parent window = 0 (null)
```

**Problem:** Passing `0` as parent window might cause issues with CEF's internal window management

#### 4. **GPU/Rendering Context Issue**
- OSR requires GPU context initialization
- We have `--disable-gpu` and `--use-gl=swiftshader` flags
- SwiftShader software renderer might have initialization issues
- Shared memory/texture creation might fail

## Configuration Review

### Current OSR Settings
```cpp
// In cef_manager.cpp
settings.windowless_rendering_enabled = true;
settings.multi_threaded_message_loop = true;

// In webview_pool.cpp
window_info.SetAsWindowless(0);
browser_settings.windowless_frame_rate = 60;
```

### Potential Issues
1. **High frame rate (60 FPS)** might be aggressive for OSR
2. **Null parent window** might need proper X11 window handle
3. **Multi-threaded mode** requires careful thread synchronization
4. **Software rendering** (SwiftShader) might not be fully compatible

## Recommended Solutions

### Solution 1: Add Missing RenderHandler Methods (Quick Fix)
Implement all required OSR methods with safe defaults:

```cpp
// In render_handler.cpp
bool RenderHandler::GetScreenInfo(CefRefPtr<CefBrowser> browser,
                                  CefScreenInfo& screen_info) {
  screen_info.device_scale_factor = 1.0;
  screen_info.depth = 24;
  screen_info.depth_per_component = 8;
  screen_info.is_monochrome = false;
  screen_info.rect = CefRect(0, 0, view_width_, view_height_);
  screen_info.available_rect = screen_info.rect;
  return true;
}

bool RenderHandler::GetScreenPoint(CefRefPtr<CefBrowser> browser,
                                   int viewX, int viewY,
                                   int& screenX, int& screenY) {
  screenX = viewX;
  screenY = viewY;
  return true;
}

void RenderHandler::OnPopupShow(CefRefPtr<CefBrowser> browser, bool show) {
  // No-op for now
}

void RenderHandler::OnPopupSize(CefRefPtr<CefBrowser> browser,
                               const CefRect& rect) {
  // No-op for now
}
```

### Solution 2: Fix Thread Safety (Recommended)
Ensure GetViewRect is called on correct thread:

```cpp
void RenderHandler::GetViewRect(CefRefPtr<CefBrowser> browser, CefRect& rect) {
  // CRITICAL: This must be thread-safe
  // CEF might call this from UI thread before browser is fully created

  rect.x = 0;
  rect.y = 0;
  rect.width = view_width_;
  rect.height = view_height_;
}
```

Add thread synchronization when setting view size:
```cpp
void RenderHandler::SetViewSize(int width, int height) {
  // TODO: Add mutex lock if accessed from multiple threads
  view_width_ = width;
  view_height_ = height;
}
```

### Solution 3: Lower Frame Rate (Quick Test)
Reduce OSR frame rate to see if it's a performance issue:

```cpp
browser_settings.windowless_frame_rate = 30;  // Or even 15 for testing
```

### Solution 4: Add Proper Parent Window (Linux-Specific)
Create a real X11 window for OSR:

```cpp
#include <X11/Xlib.h>

Display* display = XOpenDisplay(nullptr);
Window root = DefaultRootWindow(display);
Window parent = XCreateSimpleWindow(display, root, 0, 0, 1, 1, 0, 0, 0);

window_info.SetAsWindowless(parent);  // Use real window handle
```

### Solution 5: Switch to Windowed Mode (Last Resort)
Temporarily disable OSR to confirm it's the issue:

```cpp
// In webview_pool.cpp
window_info.SetAsChild(parent_window, CefRect(0, 0, 800, 600));
// Remove: window_info.SetAsWindowless(0);
```

## Next Steps

### Immediate Actions (In Order)

1. **Add missing RenderHandler methods** (GetScreenInfo, GetScreenPoint)
   - Quick fix, likely to resolve the crash
   - Low risk, follows CEF best practices

2. **Lower frame rate to 30 FPS**
   - Quick test to rule out performance issues
   - Can revert if no improvement

3. **Add thread synchronization**
   - Add mutex locks to view_width_/view_height_ access
   - Ensure GetViewRect is thread-safe

4. **Test with hardware rendering**
   - Remove `--disable-gpu` and `--use-gl=swiftshader`
   - See if native GPU rendering works better

5. **Create proper parent window** (if above fails)
   - Linux-specific X11 window creation
   - More invasive but might be necessary

## Testing Strategy

For each solution:
1. Implement change
2. Rebuild native module: `npm run build:cef`
3. Test with: `timeout 30 npm run electron:dev`
4. Check if crash is eliminated
5. If crash persists, try next solution

## Expected Outcome

Most likely: **Adding GetScreenInfo and GetScreenPoint will fix the crash**

These methods are called by CEF's renderer during OSR initialization, and the crash might be due to pure virtual function calls when these methods are missing.
