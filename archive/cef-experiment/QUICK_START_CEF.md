# Quick Start Guide - CEF Integration

## Prerequisites Check

Before building, ensure you have:

```bash
# Check CMake version (need 3.19+)
cmake --version

# Check GCC version (need 9+)
gcc --version

# Check Node.js version (need 18+)
node --version

# Check npm
npm --version
```

### Install Missing Dependencies (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y cmake build-essential libx11-dev curl
```

## Build Steps

### Step 1: Install Node Dependencies

```bash
cd /home/louis/Documents/Navigateur
npm install
```

This will install:
- `node-addon-api` - N-API C++ wrapper
- `node-api-headers` - Node.js API headers
- `cmake-js` - CMake integration for Node.js
- All other project dependencies

### Step 2: Build CEF Native Addon

```bash
npm run build:cef
```

This script will:
1. Download CEF binaries (~500MB, first time only)
2. Extract CEF to `native/cef/linux64/`
3. Build CEF DLL wrapper (~5-10 minutes, first time only)
4. Build the native addon
5. Output addon to `dist/native/workspace_navigator_cef.node`

**Note**: First build takes 10-15 minutes. Subsequent builds are much faster (30-60 seconds).

### Step 3: Build TypeScript Project

```bash
npm run build:main
```

### Step 4: Verify Build

```bash
# Check that addon was created
ls -lh dist/native/workspace_navigator_cef.node

# Test loading the addon
node -e "try { const addon = require('./dist/native/workspace_navigator_cef.node'); console.log('✓ CEF addon loaded successfully'); console.log('Available methods:', Object.keys(addon)); } catch(e) { console.error('✗ Failed to load addon:', e.message); }"
```

Expected output:
```
✓ CEF addon loaded successfully
Available methods: [ 'initialize', 'shutdown', 'isInitialized', 'createBrowser', 'closeBrowser', 'getBrowser', 'loadURL', 'goBack', 'goForward', 'reload', 'stopLoad', 'canGoBack', 'canGoForward', 'isLoading', 'getURL', 'getTitle', 'setEventCallback' ]
```

## Testing CEF

### Test 1: Basic Initialization

Create `test-cef.js`:

```javascript
const path = require('path');
const os = require('os');

// Load addon
const cef = require('./dist/native/workspace_navigator_cef.node');

console.log('Testing CEF initialization...');

// Initialize CEF
const cachePath = path.join(os.tmpdir(), 'cef-test-cache');
const success = cef.initialize(cachePath);

console.log('Initialization:', success ? '✓ SUCCESS' : '✗ FAILED');
console.log('Is initialized:', cef.isInitialized());

// Shutdown
setTimeout(() => {
  console.log('Shutting down CEF...');
  cef.shutdown();
  console.log('Is initialized:', cef.isInitialized());
  process.exit(0);
}, 1000);
```

Run:
```bash
node test-cef.js
```

### Test 2: Browser Creation

Create `test-browser.js`:

```javascript
const path = require('path');
const os = require('os');

const cef = require('./dist/native/workspace_navigator_cef.node');

console.log('Testing browser creation...');

// Initialize
const cachePath = path.join(os.tmpdir(), 'cef-test-cache');
cef.initialize(cachePath);

// Set up event callbacks
cef.setEventCallback('navigation', (data) => {
  console.log('Navigation event:', data);
});

cef.setEventCallback('loadComplete', (data) => {
  console.log('Load complete:', data);
});

cef.setEventCallback('titleChange', (data) => {
  console.log('Title change:', data);
});

// Create browser
console.log('Creating browser...');
const browserId = cef.createBrowser('https://example.com');
console.log('Browser created with ID:', browserId);

// Wait for page to load
setTimeout(() => {
  const url = cef.getURL(browserId);
  const title = cef.getTitle(browserId);
  console.log('Current URL:', url);
  console.log('Current title:', title);

  // Close browser
  console.log('Closing browser...');
  cef.closeBrowser(browserId);

  // Shutdown
  setTimeout(() => {
    console.log('Shutting down...');
    cef.shutdown();
    process.exit(0);
  }, 1000);
}, 5000);
```

Run:
```bash
node test-browser.js
```

### Test 3: TypeScript Wrapper

Create `test-wrapper.ts` in `src/`:

```typescript
import { cefBrowserManager } from './core/cef/cef-browser';

async function test() {
  console.log('Testing CEF TypeScript wrapper...');

  // Initialize
  const initialized = await cefBrowserManager.initialize();
  console.log('Initialized:', initialized);

  if (!initialized) {
    console.error('Failed to initialize CEF');
    return;
  }

  // Create browser
  const browserId = cefBrowserManager.createBrowser('https://example.com');
  console.log('Browser ID:', browserId);

  // Set up event listeners
  cefBrowserManager.on('navigation', (event) => {
    console.log('Navigated to:', event.url);
  });

  cefBrowserManager.on('titleChange', (event) => {
    console.log('Title changed:', event.title);
  });

  // Wait and navigate
  setTimeout(() => {
    console.log('Navigating to Google...');
    cefBrowserManager.loadURL(browserId, 'https://google.com');

    setTimeout(() => {
      const url = cefBrowserManager.getURL(browserId);
      const title = cefBrowserManager.getTitle(browserId);
      console.log('Current state:', { url, title });

      // Clean up
      cefBrowserManager.closeBrowser(browserId);
      cefBrowserManager.shutdown();
      process.exit(0);
    }, 5000);
  }, 3000);
}

test().catch(console.error);
```

Build and run:
```bash
npm run build:main
node dist/main/test-wrapper.js
```

## Troubleshooting

### Build Errors

#### "CMake not found"
```bash
sudo apt-get install cmake
```

#### "X11/Xlib.h not found"
```bash
sudo apt-get install libx11-dev
```

#### "node-addon-api not found"
```bash
npm install --save-dev node-addon-api node-api-headers
```

### Runtime Errors

#### "Cannot find module workspace_navigator_cef.node"
The addon wasn't built. Run:
```bash
npm run build:cef
```

#### "CEF initialization failed"
Check logs in the cache directory:
```bash
cat /tmp/cef-test-cache/cef.log
```

Common causes:
- Missing CEF binaries in `native/cef/linux64/`
- Permission issues with cache directory
- X11 display not available

#### "Sandbox initialization failed"
Make sure X11 libraries are installed:
```bash
sudo apt-get install libx11-dev
```

### Performance Issues

#### "First build is very slow"
This is normal. CEF DLL wrapper compilation takes 5-10 minutes on first build.

#### "Subsequent builds still slow"
Make sure you're not cleaning the `native/build/` directory between builds.

## Development Workflow

### Making Changes to C++ Code

1. Edit files in `native/src/` or `native/include/`
2. Rebuild:
   ```bash
   cd native/build
   make -j$(nproc)
   ```
3. Test changes

### Making Changes to TypeScript Wrapper

1. Edit `src/core/cef/cef-browser.ts`
2. Rebuild:
   ```bash
   npm run build:main
   ```
3. Test changes

### Clean Build

To force a complete rebuild:
```bash
# Clean native build
rm -rf native/build dist/native

# Rebuild
npm run build:cef
```

## Remote Debugging

CEF provides Chrome DevTools for debugging web content:

1. Start application with CEF initialized
2. Open browser to `http://localhost:9222`
3. You'll see a list of all CEF browser instances
4. Click on one to open DevTools

## Next Steps

Once CEF is building and tests pass:

1. ✅ Integrate with Electron main process
2. ✅ Create CEF-aware tab manager
3. ✅ Update workspace engine to use CEF browsers
4. ✅ Update renderer WebView component
5. ✅ Add IPC handlers for browser control
6. ✅ Test with real websites
7. ✅ Performance profiling

## Support

- Build issues: Check `native/README.md`
- Runtime issues: Check CEF logs in cache directory
- CEF debugging: Use remote debugging on port 9222
- General questions: See `CEF_IMPLEMENTATION.md`

---

**Quick Command Reference**

```bash
# Install dependencies
npm install

# Build CEF addon
npm run build:cef

# Build TypeScript
npm run build:main

# Test addon loading
node -e "require('./dist/native/workspace_navigator_cef.node')"

# Clean build
rm -rf native/build dist/native
npm run build:cef
```
