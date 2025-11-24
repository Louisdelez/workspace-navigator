# CEF SIGSEGV Crash - Diagnostic Results

**Date**: 2025-11-23
**Status**: Crash isolated to React component interaction

## Diagnostic Tests Completed

### ✅ Test 1: HTTP URL (No SSL)
**Result**: Crash still occurs with `http://example.com`
**Conclusion**: NOT an SSL-specific issue

### ✅ Test 2: CEF Resources
**Result**: All resources present and correct:
- cef_helper ✓
- libcef.so ✓
- icudtl.dat ✓
- locales/ (populated) ✓
- chrome-sandbox ✓

**Conclusion**: NOT a missing resources issue

### ✅ Test 3: Verbose Logging
**Result**: CEF log stops abruptly at crash - no errors logged
**Observation**: Hard crash (SIGSEGV) prevents error logging

**Conclusion**: Crash happens too fast/hard for CEF to log

### ✅ Test 4: Software Rendering + Disable Background Networking
**Changes Made**:
```cpp
"--disable-gpu",
"--disable-gpu-compositing",
"--use-gl=swiftshader",
"--disable-software-rasterizer",
"--disable-background-networking",  // NEW
"--disable-component-update",        // NEW
"--disable-default-apps",            // NEW
"--no-proxy-server"                  // NEW
```

**Result**: SSL error eliminated! But crash still occurs
**Conclusion**: Background services were causing SSL errors, but not the SIGSEGV

## Current Crash Pattern

```
Browser created successfully (ID: 1)
Browser ready event emitted (ID: 1, URL: http://example.com)
Browser ready event received: { browserId: '1', url: 'http://example.com' }
Forwarding browserReady to renderer: { browserId: 1, url: 'http://example.com' }
Browser ready event forwarded successfully
/home/louis/Documents/Navigateur/node_modules/electron/dist/electron exited with signal SIGSEGV
```

**Timing**: Crash happens **immediately** after browserReady forwarded, **before** 500ms polling delay

## Root Cause Analysis

### What Works:
1. ✅ CEF initialization
2. ✅ Async browser creation
3. ✅ OnAfterCreated callback
4. ✅ Browser added to pool
5. ✅ browserReady event emission (C++)
6. ✅ Event forwarding to main process
7. ✅ Event forwarding to renderer
8. ✅ React component receives event

### Where Crash Occurs:
**Location**: React component (`CEFWebView.tsx`)
**Trigger**: When `browserId` state updates from `-1` to `1`

**Two useEffects activate simultaneously**:

1. **State Polling Effect** (line 103-114):
   - Dependency: `[browserId]`
   - Action: Starts `startStatePolling(browserId)` after 500ms delay
   - **Unlikely culprit**: 500ms delay not elapsed yet

2. **Paint Event Listener Effect** (line 158-196):
   - Dependency: `[cefAvailable, browserId]`
   - Action: Registers `onPaint` listener **immediately**
   - **Likely culprit**: Activates immediately when browserId changes

### Hypothesis:
The `onPaint` event listener is causing the crash. Possible reasons:
1. CEF paint callback fires before React component is ready
2. ArrayBuffer transfer from native to renderer causing memory corruption
3. Canvas operations triggering before canvas is properly initialized
4. Race condition between paint events and browser initialization

## Next Steps

### Option 1: Disable Paint Events Temporarily
Comment out the paint event listener to confirm it's the cause:
```typescript
// DIAGNOSTIC: Disable paint events
// useEffect(() => {
//   if (!cefAvailable || browserId === null || browserId === -1) return;
//   const cleanup = window.electronAPI.cef.onPaint((_, paintData) => { ... });
//   return cleanup;
// }, [cefAvailable, browserId]);
```

### Option 2: Add Initialization Delay
Add delay before registering paint listener:
```typescript
useEffect(() => {
  if (!cefAvailable || browserId === null || browserId === -1) return;

  // Wait for browser to fully initialize before listening for paint events
  const initDelay = setTimeout(() => {
    const cleanup = window.electronAPI.cef.onPaint((_, paintData) => { ... });
    return () => {
      clearTimeout(initDelay);
      cleanup();
    };
  }, 1000);  // 1 second delay
}, [cefAvailable, browserId]);
```

### Option 3: Check Canvas Initialization
Ensure canvas is ready before registering paint listener:
```typescript
useEffect(() => {
  if (!cefAvailable || browserId === null || browserId === -1 || !canvasRef.current) return;
  // ... rest of paint listener code
}, [cefAvailable, browserId, canvasRef.current]);
```

### Option 4: Investigate Native Paint Callback
Check if RenderHandler is causing issues in native code:
- Review `render_handler.cpp` OnPaint implementation
- Check ArrayBuffer creation and transfer
- Verify thread safety of paint callback

## Files to Investigate

1. `src/renderer/components/CEFWebView.tsx:158-196` - Paint event listener
2. `native/src/render_handler.cpp` - OnPaint callback
3. `src/main/index.ts:121-136` - Paint event forwarding
4. `src/main/preload.ts:73-81` - onPaint API

## Summary

The SIGSEGV crash is **NOT** caused by:
- SSL/TLS handshake failures (those were separate background service errors)
- Missing CEF resources
- GPU/rendering configuration issues

The crash **IS** caused by:
- Something in the React component when browserId state updates
- Most likely the paint event listener activating immediately
- Possibly a race condition or memory corruption in paint data transfer

**Recommendation**: Start with Option 1 (disable paint events) to confirm the hypothesis.
