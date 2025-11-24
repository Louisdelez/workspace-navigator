# CEF Browser Creation Issue - Status Report

**Date**: 2025-11-23
**Status**: BLOCKED - Requires LifeSpanHandler Implementation

## Problem Summary

Cannot create CEF browser instances due to threading model incompatibility.

## Root Cause

CEF has two threading modes, neither currently works with our Electron integration:

### Option A: `multi_threaded_message_loop = false`
- ✅ Allows `CreateBrowserSync()` (synchronous browser creation)
- ❌ Requires manual message pumping via `CefDoMessageLoopWork()`
- ❌ Manual pumping with `setInterval()` causes SIGSEGV crashes
- ❌ Incompatible with Electron's event loop

**Crash signature:**
```
CEF message loop started (16ms interval, ~60 FPS)
[sandbox_linux.cc(400)] InitializeSandbox() called with multiple threads in process gpu-process.
electron exited with signal SIGSEGV
```

### Option B: `multi_threaded_message_loop = true` (Current)
- ✅ No manual message pumping required
- ✅ Compatible with Electron's event loop
- ❌ `CreateBrowserSync()` fails (returns null)
- ❌ `CreateBrowser()` (async) requires `LifeSpanHandler::OnAfterCreated()`
- ❌ OnAfterCreated not implemented

**Error:**
```
CreateBrowserSync not supported, using async CreateBrowser...
Browser creation started (async)...
Error: Failed to create browser (browser ID is null)
electron exited with signal SIGSEGV
```

## Required Solution

Implement async browser creation properly with `LifeSpanHandler`:

### 1. Create LifeSpanHandler Class

**File**: `native/include/lifespan_handler.h`
```cpp
#ifndef LIFESPAN_HANDLER_H_
#define LIFESPAN_HANDLER_H_

#include "include/cef_life_span_handler.h"
#include <functional>

namespace workspace_navigator {

class BrowserClient;

class LifeSpanHandler : public CefLifeSpanHandler {
 public:
  explicit LifeSpanHandler(BrowserClient* client);

  // CefLifeSpanHandler methods
  void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  bool DoClose(CefRefPtr<CefBrowser> browser) override;
  void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

  using BrowserCreatedCallback = std::function<void(CefRefPtr<CefBrowser>)>;
  void SetBrowserCreatedCallback(BrowserCreatedCallback callback);

 private:
  BrowserClient* client_;
  BrowserCreatedCallback browser_created_callback_;

  IMPLEMENT_REFCOUNTING(LifeSpanHandler);
};

}  // namespace workspace_navigator

#endif  // LIFESPAN_HANDLER_H_
```

**File**: `native/src/lifespan_handler.cpp`
```cpp
#include "lifespan_handler.h"
#include <iostream>

namespace workspace_navigator {

LifeSpanHandler::LifeSpanHandler(BrowserClient* client) : client_(client) {}

void LifeSpanHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  std::cout << "Browser created successfully (ID: " << browser->GetIdentifier() << ")" << std::endl;

  if (browser_created_callback_) {
    browser_created_callback_(browser);
  }
}

bool LifeSpanHandler::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  return false;
}

void LifeSpanHandler::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();
  std::cout << "Browser closing (ID: " << browser->GetIdentifier() << ")" << std::endl;
}

void LifeSpanHandler::SetBrowserCreatedCallback(BrowserCreatedCallback callback) {
  browser_created_callback_ = callback;
}

}  // namespace workspace_navigator
```

### 2. Update BrowserClient

Add to `native/include/browser_client.h`:
```cpp
#include "lifespan_handler.h"

class BrowserClient : public CefClient {
 public:
  // ... existing code ...

  CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override;
  void SetBrowserCreatedCallback(LifeSpanHandler::BrowserCreatedCallback callback);

 private:
  // ... existing handlers ...
  CefRefPtr<LifeSpanHandler> lifespan_handler_;
};
```

Add to `native/src/browser_client.cpp`:
```cpp
BrowserClient::BrowserClient() {
  load_handler_ = new LoadHandler(this);
  request_handler_ = new RequestHandler(this);
  display_handler_ = new DisplayHandler(this);
  render_handler_ = new RenderHandler(this);
  lifespan_handler_ = new LifeSpanHandler(this);  // Add this
}

CefRefPtr<CefLifeSpanHandler> BrowserClient::GetLifeSpanHandler() {
  return lifespan_handler_;  // Return actual handler instead of nullptr
}

void BrowserClient::SetBrowserCreatedCallback(LifeSpanHandler::BrowserCreatedCallback callback) {
  lifespan_handler_->SetBrowserCreatedCallback(callback);
}
```

### 3. Update WebViewPool for Async Creation

Modify `native/src/webview_pool.cpp` to handle async browser creation:

```cpp
// Store pending browser creations
std::map<int, std::string> pending_browsers_;  // temp_id -> url
int next_temp_id_ = -1;  // Negative IDs for pending browsers

CefRefPtr<CefBrowser> WebViewPool::Acquire(const std::string& url, CefRefPtr<BrowserClient> client) {
  std::lock_guard<std::mutex> lock(mutex_);

  // Try to reuse first...
  if (!available_.empty()) {
    // ... existing reuse code ...
  }

  // Create new browser (async)
  int temp_id = next_temp_id_--;
  pending_browsers_[temp_id] = url;

  // Set callback to handle browser creation
  client->SetBrowserCreatedCallback([this, temp_id](CefRefPtr<CefBrowser> browser) {
    std::lock_guard<std::mutex> lock(mutex_);

    int browser_id = browser->GetIdentifier();
    pending_browsers_.erase(temp_id);
    in_use_[browser_id] = browser;

    std::cout << "Async browser ready (ID: " << browser_id << ")" << std::endl;

    // TODO: Notify Node.js that browser is ready
  });

  CreateBrowser(url, client);  // Start async creation

  // Return nullptr for now - browser will be ready in callback
  return nullptr;
}
```

### 4. Update N-API Bridge

Modify `native/src/node_cef_bridge.cpp` to handle async browser IDs:

```cpp
Napi::Value NodeCEFBridge::CreateBrowser(const Napi::CallbackInfo& info) {
  // ... existing setup ...

  CefRefPtr<CefBrowser> browser = WebViewPool::GetInstance().Acquire(url, client);

  if (!browser) {
    // Browser is being created asynchronously
    // Return a pending ID (-1) and emit event when ready
    std::cout << "Browser creation started (async), will notify when ready" << std::endl;
    return Napi::Number::New(env, -1);  // Temporary ID
  }

  // ... rest of existing code ...
}
```

### 5. Add Browser Ready Event

Add event emission in LifeSpanHandler callback to notify renderer when browser is ready.

## Testing Steps

After implementing the above:

1. Rebuild native addon: `npm run build:cef`
2. Rebuild TypeScript: `npm run build:main`
3. Start app: `npm run electron:dev`
4. Click "New Web" and enter "google.com"
5. Verify browser creates without errors
6. Verify paint events render to canvas

## Current Workaround

None available - browser creation is completely blocked.

## Timeline Estimate

- LifeSpanHandler implementation: 1-2 hours
- WebViewPool async handling: 1 hour
- N-API bridge updates: 30 minutes
- Testing and debugging: 1-2 hours

**Total**: 3.5-5.5 hours of work

## Alternative Approach

Could investigate using CEF's external message pump mode, but this is poorly documented and may have similar threading issues.
