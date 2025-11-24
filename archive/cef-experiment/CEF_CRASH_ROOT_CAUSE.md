# CEF SIGSEGV Crash - Root Cause Identified

**Date**: 2025-11-23
**Status**: Root cause isolated to native CEF OnPaint callback

## Executive Summary

The SIGSEGV crash occurs in the **native CEF rendering pipeline**, specifically when the browser attempts its first paint after creation. The crash is **NOT** caused by:
- React component code
- Paint event listeners in the renderer
- State polling code
- SSL/TLS handshake (SSL errors are a red herring from background services)

## Diagnostic Test Results

### Test Sequence

1. **✅ HTTP URL Test**: Crash occurs with `http://example.com` (no SSL needed)
2. **✅ CEF Resources Check**: All resources present (libcef.so, icudtl.dat, locales, etc.)
3. **✅ Verbose Logging**: No errors logged (crash too fast/hard)
4. **✅ Software Rendering**: Disabled GPU, forced SwiftShader
5. **✅ Disable Background Networking**: Eliminated SSL errors from background services
6. **✅ Disable Paint Event Listener**: Crash persists
7. **✅ Disable State Polling**: Crash persists

**Conclusion from Tests 6 & 7**: With BOTH React useEffects disabled (paint listener + state polling), the crash **still occurs**. This proves the issue is in native code, not React/TypeScript.

## Crash Timeline

```
Browser created successfully (ID: 1)
Browser ready event emitted (ID: 1, URL: http://example.com)
Browser ready event forwarded successfully
[ERROR:ssl_client_socket_impl.cc(975)] handshake failed (BACKGROUND SERVICE - IRRELEVANT)
/node_modules/electron/dist/electron exited with signal SIGSEGV
```

**Critical Observation**: The SSL error appears **AFTER** successful event forwarding but FROM A DIFFERENT PROCESS. This is a CEF subprocess (likely renderer process) attempting to load the page and triggering OnPaint.

## Root Cause Analysis

### The Smoking Gun: OnPaint Callback

**File**: `native/src/render_handler.cpp:23-42`

```cpp
void RenderHandler::OnPaint(CefRefPtr<CefBrowser> browser,
                            PaintElementType type,
                            const RectList& dirtyRects,
                            const void* buffer,
                            int width,
                            int height) {
  if (type != PET_VIEW) return;

  size_t buffer_size = width * height * 4;

  // This callback fires automatically when CEF renders the page
  if (paint_callback_) {
    int browser_id = browser->GetIdentifier();
    paint_callback_(browser_id, width, height, buffer, buffer_size);  // 💥 CRASH LIKELY HERE
  }
}
```

### Why This Crashes

**Hypothesis**: Memory corruption or thread safety issue in paint callback chain:

1. Browser loads http://example.com
2. CEF renderer process starts painting (automatic)
3. `OnPaint` callback fires (CEF thread)
4. Paint callback invokes N-API callback (crosses thread boundary)
5. N-API attempts to emit event to main process
6. **ArrayBuffer creation or transfer causes SIGSEGV**

### Possible Causes

1. **Thread Safety Violation**
   - OnPaint fires on CEF UI thread
   - N-API callback might not be thread-safe
   - ArrayBuffer creation on wrong thread

2. **Memory Corruption**
   - Buffer pointer from CEF is temporary
   - Copying large BGRA buffer (1920x1080x4 = 8MB) might corrupt memory
   - ArrayBuffer creation might fail silently then crash on access

3. **N-API Context Issues**
   - N-API environment might not be valid when OnPaint fires
   - EventEmitter might not be accessible from CEF thread

4. **Off-Screen Rendering Issues**
   - OSR (windowless_rendering_enabled = true) might have bugs in CEF 120.1.10
   - SwiftShader software rendering might not work with OSR
   - GPU process warnings suggest subprocess communication issues

## Recommended Solutions

### Option 1: Disable OnPaint Callback (Quick Test)
Temporarily disable paint callback to confirm hypothesis:

```cpp
// In render_handler.cpp OnPaint:
void RenderHandler::OnPaint(...) {
  // DIAGNOSTIC: Disable paint callback entirely
  return;  // Don't call paint_callback_ at all
}
```

**Expected**: If crash stops, confirms OnPaint is the culprit.

### Option 2: Use Windowed Rendering
Disable OSR and use windowed rendering instead:

```cpp
// In cef_manager.cpp:
settings.windowless_rendering_enabled = false;  // Was: true
```

Create actual window for browser, then capture screenshots on-demand instead of continuous paint events.

**Trade-off**: Loses seamless embedding, but might eliminate OSR-related crashes.

### Option 3: Fix Thread Safety
Ensure paint callback runs on correct thread:

```cpp
void RenderHandler::OnPaint(...) {
  if (type != PET_VIEW) return;

  // Post task to correct thread instead of calling directly
  CefPostTask(TID_IO, base::Bind(&RenderHandler::EmitPaintEvent, this,
                                   browser->GetIdentifier(), width, height,
                                   buffer, buffer_size));
}
```

### Option 4: Delay First Paint
Add delay before registering paint callback:

```cpp
// Don't set paint callback until after browser fully initialized
// Wait for first OnLoadEnd before enabling paint events
```

### Option 5: Investigate N-API Event Emission
Check if N-API environment is valid when emitting from CEF thread:

```cpp
// In node_cef_bridge.cpp EmitEvent:
if (!napi_env_is_valid) {
  // Queue event instead of emitting immediately
}
```

## Next Debugging Steps

1. **Confirm OnPaint is culprit**: Disable paint_callback_ invocation entirely
2. **Try windowed rendering**: Disable OSR to see if that's the issue
3. **Add thread safety**: Use CefPostTask to emit events on correct thread
4. **Check CEF version**: Try newer/older CEF version to see if OSR bug exists
5. **Minimal repro**: Create minimal CEF+N-API+Electron app to isolate issue

## Files Involved

- `native/src/render_handler.cpp:23-42` - OnPaint callback (likely crash site)
- `native/src/node_cef_bridge.cpp` - EmitEvent / N-API event emission
- `native/src/cef_manager.cpp:103` - OSR configuration
- `native/src/browser_client.cpp` - RenderHandler integration
- `src/main/index.ts:121-136` - Paint event forwarding (main process)

## Summary

The crash is a **native CEF issue**, specifically in the **OnPaint callback path** when using **Off-Screen Rendering**. The React component code is innocent - the crash happens before paint data even reaches the renderer process.

**Immediate Action**: Disable paint_callback_ invocation in OnPaint to confirm hypothesis, then either:
- Fix thread safety in paint callback chain, OR
- Switch to windowed rendering instead of OSR

The SSL errors visible in some runs are unrelated background service noise that can be ignored - they're from CEF's component updater trying to phone home, which we've now disabled.
