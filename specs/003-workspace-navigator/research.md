# Research Document: Workspace Navigator

**Feature Branch**: `003-workspace-navigator`
**Date**: 2025-12-09
**Plan**: [plan.md](./plan.md)

## Executive Summary

This document consolidates research decisions for the Workspace Navigator implementation. All technical choices have been evaluated against the project constitution, performance requirements, and cross-platform compatibility constraints.

---

## 1. Electron Webview Strategy

### Decision: Use WebContentsView (Electron 28+) instead of BrowserView

**Rationale**:
- `BrowserView` is deprecated in Electron 28+ in favor of `WebContentsView`
- `WebContentsView` provides better integration with Chromium's view hierarchy
- More consistent behavior across platforms
- Better memory management and lifecycle control

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| BrowserView | Familiar API, legacy support | Deprecated, inconsistent rendering | REJECTED |
| WebContentsView | Modern API, better performance | Requires Electron 28+ | SELECTED |
| iframe + webview tag | Simpler embedding | Security concerns, limited API | REJECTED |

**Implementation Notes**:
- Pool of WebContentsView instances for tab reuse
- Suspend inactive views to reduce memory (< 200MB per suspended view)
- Use `webContents.setBackgroundThrottling(true)` for inactive tabs
- Implement view recycling for similar content types

---

## 2. SQLite Encryption Strategy

### Decision: Use better-sqlite3 with SQLCipher community edition

**Rationale**:
- `better-sqlite3` is the fastest SQLite binding for Node.js (synchronous API)
- SQLCipher provides transparent encryption at the database level
- No need for custom encryption layer (reduces complexity)
- Community edition is free and sufficient for local storage

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| better-sqlite3 + SQLCipher | Native encryption, transparent | Requires native compilation | SELECTED |
| sql.js (WASM) + custom encryption | No native deps | Slower, complex encryption | REJECTED |
| Filesystem encryption only | OS-level security | No defense in depth | REJECTED |
| better-sqlite3 + AES wrapper | Pure JS encryption | Performance overhead, complexity | REJECTED |

**Implementation Notes**:
- Use `@parity/better-sqlite3-sqlcipher` or `better-sqlite3-multiple-ciphers`
- Key derivation from master password or OS keychain
- Encryption key stored in OS credential manager (Keytar)
- Fallback: OS filesystem encryption if SQLCipher unavailable

---

## 3. Markdown Editor Choice

### Decision: Use Lexical (Meta's editor framework)

**Rationale**:
- Lexical is actively maintained by Meta with strong React integration
- Extensible plugin architecture for markdown support
- Better TypeScript support than alternatives
- Smaller bundle size than ProseMirror/TipTap
- Direct markdown parsing/serialization available

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Lexical | Modern, extensible, React-native | Newer, smaller community | SELECTED |
| CodeMirror 6 | Proven, powerful | More complex API, code-focused | BACKUP |
| TipTap | Beautiful API | Larger bundle, ProseMirror overhead | REJECTED |
| Monaco Editor | VSCode parity | Overkill for markdown, heavy | REJECTED |
| MarkText integration | Feature-complete | Separate process, complex integration | REJECTED |

**Implementation Notes**:
- Use `@lexical/react` with `@lexical/markdown` plugin
- Custom theme matching dark mode design system
- Implement debounced autosave (500ms) via Lexical's update listener
- Export as plain markdown for database storage

---

## 4. State Management

### Decision: Use Zustand for React state management

**Rationale**:
- Minimal boilerplate compared to Redux
- Built-in DevTools support
- Easy persistence middleware
- TypeScript-first design
- Perfect for small-to-medium state needs

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Zustand | Simple, performant, TypeScript | Less structured for large apps | SELECTED |
| Redux Toolkit | Industry standard, predictable | Boilerplate heavy | REJECTED |
| Jotai | Atomic, minimal | Different mental model | REJECTED |
| React Context + useReducer | No dependencies | Performance issues at scale | REJECTED |

**Implementation Notes**:
- Separate stores: workspaceStore, tabsStore, settingsStore
- Persist settings to SQLite via custom middleware
- Use `subscribeWithSelector` for granular subscriptions
- Sync with main process via IPC for critical state

---

## 5. IPC Communication Pattern

### Decision: Type-safe IPC with Zod validation

**Rationale**:
- Electron IPC is stringly-typed by default
- Zod provides runtime validation matching TypeScript types
- Centralized error handling
- Automatic serialization/deserialization

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Zod + custom wrapper | Type-safe, runtime validation | Setup overhead | SELECTED |
| electron-trpc | Full tRPC integration | Overkill for local app | REJECTED |
| Raw IPC + manual types | Simple | Error-prone, no validation | REJECTED |
| postMessage-style | Web-compatible | Not Electron-idiomatic | REJECTED |

**Implementation Notes**:
```typescript
// Pattern: Typed IPC channels
const channelSchemas = {
  'workspace:list': { input: z.void(), output: z.array(WorkspaceSchema) },
  'item:create': { input: CreateItemSchema, output: ItemSchema },
  // ...
};
```
- Preload script exposes typed API via contextBridge
- Main process validates all inputs before processing
- Errors serialized with error codes for renderer handling

---

## 6. Tree View Virtualization

### Decision: Use react-window with custom tree implementation

**Rationale**:
- react-window is the most performant virtualization library
- Need custom tree logic for expand/collapse behavior
- 10k+ items require virtualization for 60fps scrolling

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| react-window + custom | Proven, flexible | More implementation work | SELECTED |
| react-virtualized | Full-featured | Larger bundle, older API | REJECTED |
| @tanstack/virtual | Modern, headless | Less tree-specific features | BACKUP |
| Native scrolling | Simple | Won't scale to 10k items | REJECTED |

**Implementation Notes**:
- Flatten tree to array for virtualization
- Track expanded state in separate map
- Lazy-load children on expand
- Measure row heights dynamically (for variable content)

---

## 7. Drag and Drop

### Decision: Use @dnd-kit for drag-and-drop operations

**Rationale**:
- Modern, accessible, and performant
- Better tree support than react-dnd
- Keyboard navigation built-in
- Smooth animations

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| @dnd-kit | Modern, accessible, tree-friendly | Newer library | SELECTED |
| react-dnd | Established, flexible | More boilerplate, older | REJECTED |
| react-beautiful-dnd | Beautiful animations | Unmaintained, list-focused | REJECTED |
| Native HTML5 DnD | No dependencies | Inconsistent, not accessible | REJECTED |

**Implementation Notes**:
- Use sortable preset for reordering
- Custom collision detection for nested drops
- Optimistic UI updates with rollback on failure
- Animate drop transitions (120ms)

---

## 8. Session Persistence Strategy

### Decision: Periodic autosave + crash recovery via WAL mode

**Rationale**:
- SQLite WAL (Write-Ahead Logging) survives process crashes
- Periodic saves reduce write frequency
- Full state serialization ensures consistent restore

**Implementation Notes**:
- Enable WAL mode: `PRAGMA journal_mode=WAL;`
- Autosave session state every 30 seconds
- Save on significant state changes (tab open/close, navigation)
- On startup: check for incomplete transactions, recover if needed
- Store: open tabs, scroll positions, panel sizes, active tab

---

## 9. AI Panel Integration

### Decision: Dedicated partition for each AI provider

**Rationale**:
- Each AI provider (ChatGPT, Claude, Gemini) needs isolated cookies/storage
- Partition ensures sessions don't interfere
- Persistent partitions survive app restarts

**Implementation Notes**:
```typescript
// Partition per provider
const partitionMap = {
  'chatgpt': 'persist:ai-chatgpt',
  'claude': 'persist:ai-claude',
  'gemini': 'persist:ai-gemini',
};
```
- Use `partition` option in WebContentsView
- Store last-used provider in settings
- Preload provider on app start for faster access
- Handle provider URLs: chat.openai.com, claude.ai, gemini.google.com

---

## 10. Build and Packaging

### Decision: electron-builder with platform-specific configurations

**Rationale**:
- electron-builder is the standard for Electron packaging
- Supports all target platforms (Windows, macOS, Linux)
- Code signing and notarization support
- Auto-update capabilities (future feature)

**Alternatives Considered**:

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| electron-builder | Feature-complete, standard | Config complexity | SELECTED |
| electron-forge | Official, modern | Less mature for complex builds | REJECTED |
| electron-packager | Simple | Missing features | REJECTED |

**Implementation Notes**:
- Windows: NSIS installer (.exe)
- macOS: DMG with code signing (future: notarization)
- Linux: AppImage (universal), .deb (Debian/Ubuntu)
- Native deps rebuilt per platform via electron-rebuild

---

## 11. Logging Strategy

### Decision: Use electron-log with structured JSON format

**Rationale**:
- electron-log works in both main and renderer processes
- File rotation prevents disk bloat
- JSON format enables log analysis
- Console output in development, file in production

**Implementation Notes**:
- Log levels: error, warn, info, debug
- Include: timestamp, process, component, message, data
- File location: `{app.getPath('userData')}/logs/`
- Rotate logs > 10MB, keep 5 rotations
- Ship crash logs with error reports (opt-in)

---

## 12. Performance Monitoring

### Decision: Built-in performance metrics with threshold alerts

**Rationale**:
- Constitution requires performance targets enforcement
- Need to detect regressions during development
- Metrics inform optimization priorities

**Implementation Notes**:
```typescript
// Key metrics to track
const metrics = {
  appLaunchTime: 'time from process start to window interactive',
  tabOpenTime: 'time from click to webview loaded',
  searchResponseTime: 'time from keystroke to results rendered',
  memoryUsage: 'process memory at idle and under load',
};
```
- Use `performance.now()` for timing
- Log metrics on significant events
- CI pipeline validates against thresholds
- Dashboard in dev tools (development only)

---

## Summary of Key Decisions

| Category | Decision | Confidence |
|----------|----------|------------|
| Webview | WebContentsView (Electron 28+) | HIGH |
| Database | better-sqlite3 + SQLCipher | HIGH |
| Markdown | Lexical | MEDIUM-HIGH |
| State | Zustand | HIGH |
| IPC | Zod-validated typed channels | HIGH |
| Tree View | react-window + custom | HIGH |
| Drag & Drop | @dnd-kit | HIGH |
| Session | WAL mode + periodic autosave | HIGH |
| AI Panel | Partitioned WebContentsView | HIGH |
| Build | electron-builder | HIGH |
| Logging | electron-log (JSON) | HIGH |

All decisions pass Constitution Check and align with performance requirements.
