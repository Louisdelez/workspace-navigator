# Implementation Strategy: Workspace Navigator

**Branch**: `001-workspace-navigator` | **Date**: 2025-11-22
**Based on**: constitution.md, spec.md, clarifications, plan.md, tasks.md

## Executive Summary

This document provides a comprehensive implementation strategy for Workspace Navigator, a cross-platform desktop application combining CEF-based web browsing, MarkText Markdown editing, and AI assistance in an IDE-style workspace. The strategy covers technical architecture, module integration approaches, phased implementation, and quality assurance.

**Key Technical Decisions**:
- Hybrid Electron + Native CEF architecture
- SQLite + SQLCipher for encrypted storage
- React + TypeScript for UI layer
- C++17 for CEF integration via N-API
- Process-per-site-instance for webview isolation

**Implementation Timeline**:
- MVP: 4 weeks (core functionality)
- V1: Additional 8 weeks (complete feature set)
- V2: 6-month roadmap (advanced features)

---

## 1. Architecture Technique Finale

### 1.1. Vue d'ensemble du système

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workspace Navigator                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Renderer Process (React)               │   │
│  │                                                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│  │  │Workspace │  │   Tab    │  │MarkText │  │   AI    │ │   │
│  │  │  Panel   │  │   Area   │  │  Editor │  │  Panel  │ │   │
│  │  │ (React)  │  │ (React)  │  │ (React) │  │(React)  │ │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬────┘  └────┬────┘ │   │
│  │       │             │              │            │       │   │
│  │       └─────────────┴──────────────┴────────────┘       │   │
│  │                           │                              │   │
│  │                    IPC (ipcRenderer)                     │   │
│  └────────────────────────────┬───────────────────────────┘   │
│                                │                                │
│  ┌────────────────────────────▼───────────────────────────┐   │
│  │               Main Process (Node.js)                    │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌───────────┐  ┌──────────────────┐ │   │
│  │  │  Workspace  │  │    Tab    │  │  Event Bus       │ │   │
│  │  │   Engine    │◄─┤  Manager  │◄─┤  (EventEmitter)  │ │   │
│  │  └──────┬──────┘  └─────┬─────┘  └──────────────────┘ │   │
│  │         │               │                               │   │
│  │  ┌──────▼───────┐  ┌───▼──────┐  ┌──────────────────┐ │   │
│  │  │   Storage    │  │   CEF    │  │  MarkText        │ │   │
│  │  │    Layer     │  │  Bridge  │  │  Protocol        │ │   │
│  │  │  (SQLite)    │  │  (N-API) │  │  (app://)        │ │   │
│  │  └──────────────┘  └────┬─────┘  └──────────────────┘ │   │
│  └─────────────────────────┼────────────────────────────┘   │
│                             │                                 │
│  ┌─────────────────────────▼────────────────────────────┐   │
│  │          CEF Native Module (C++17)                    │   │
│  │                                                        │   │
│  │  ┌──────────┐  ┌────────────┐  ┌──────────────────┐ │   │
│  │  │   CEF    │  │  WebView   │  │  Browser Client  │ │   │
│  │  │ Manager  │◄─┤    Pool    │◄─┤   (Handlers)     │ │   │
│  │  └────┬─────┘  └────────────┘  └──────────────────┘ │   │
│  └───────┼────────────────────────────────────────────┘   │
│          │                                                  │
│  ┌───────▼──────────────────────────────────────────────┐ │
│  │         CEF Subprocesses (Sandboxed)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │ Renderer │  │ Renderer │  │   GPU    │           │ │
│  │  │Process #1│  │Process #2│  │ Process  │  ...      │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### 1.2. Structure des modules

#### Module 1: CEF Engine (C++17 + N-API)
**Responsabilités**:
- Gestion du runtime CEF (initialisation, shutdown)
- Pool de webviews (acquisition, release, réutilisation)
- Gestion des processus (renderer, GPU, network)
- Sécurité (sandbox, CSP, isolation)
- Pont vers Node.js via N-API

**Fichiers clés**:
```
cef-native/
├── src/
│   ├── CEFManager.cpp          # Singleton gérant le lifecycle CEF
│   ├── WebViewPool.cpp         # Pool de CefBrowser instances
│   ├── BrowserClient.cpp       # Implémentation CefClient
│   ├── LoadHandler.cpp         # Callbacks de navigation
│   ├── RequestHandler.cpp      # Sécurité, CSP, validation
│   └── NodeCEFBridge.cpp       # N-API bindings
├── include/
│   └── *.h                     # Headers publics
└── CMakeLists.txt              # Configuration build
```

#### Module 2: Workspace Engine (TypeScript)
**Responsabilités**:
- Gestion des workspaces (CRUD)
- Gestion de la hiérarchie (folders, items)
- Détection de duplication (Option B)
- Création automatique de dossiers date (Option B)
- Coordination avec Storage Layer

**Fichiers clés**:
```
src/main/workspace-engine/
├── WorkspaceManager.ts         # Gestion workspaces
├── ItemManager.ts              # Gestion items (web + notes)
├── FolderManager.ts            # Gestion folders
├── DuplicationDetector.ts      # Logique duplication URL
└── types/
    ├── Workspace.ts
    ├── Item.ts
    └── Folder.ts
```

#### Module 3: Tab Manager (TypeScript)
**Responsabilités**:
- Gestion du cycle de vie des onglets
- Synchronisation tab ↔ item
- Limite douce 20 onglets (Option C)
- Navigation (back, forward, reload)
- State persistence pour crash recovery

**Fichiers clés**:
```
src/main/tab-manager/
├── TabManager.ts               # État et opérations tabs
├── TabItemSync.ts              # Synchronisation tab-item
├── NavigationHandler.ts        # Contrôles navigation
└── types/
    └── Tab.ts
```

#### Module 4: Storage Layer (TypeScript)
**Responsabilités**:
- Persistance SQLite + SQLCipher
- Session state (JSON atomique)
- Validation d'intégrité
- Backup et recovery
- Migrations de schéma

**Fichiers clés**:
```
src/main/storage/
├── Database.ts                 # Connexion SQLite
├── SessionStore.ts             # État session (JSON)
├── IntegrityValidator.ts       # Validation post-crash
├── MigrationRunner.ts          # Migrations DB
└── schema/
    └── v1.sql                  # Schéma initial
```

#### Module 5: MarkText Integration (TypeScript)
**Responsabilités**:
- Protocol handler app://editor
- Intégration composant MarkText
- Autosave 500ms (Option B)
- Gestion fichiers .md

**Fichiers clés**:
```
src/main/marktext-integration/
├── EditorProtocol.ts           # Protocol app://editor
├── AutosaveManager.ts          # Debounce 500ms
└── NoteFileManager.ts          # I/O fichiers .md

src/renderer/components/MarkText/
├── MarkTextRenderer.tsx        # Composant React
├── EditorToolbar.tsx           # Barre d'outils
└── SaveIndicator.tsx           # "Saved at HH:MM:SS"
```

#### Module 6: AI Panel Manager (TypeScript)
**Responsabilités**:
- Sélecteur d'IA (ChatGPT, Claude, Gemini, custom)
- Webview dédiée (isolée du pool)
- Persistance de session
- Visibilité permanente

**Fichiers clés**:
```
src/main/ai-panel/
├── AIManager.ts                # Gestion provider
└── SessionPersistence.ts       # Cookies CEF

src/renderer/components/AIPanel/
├── AISelector.tsx              # Dropdown providers
└── AIWebView.tsx               # Webview React
```

#### Module 7: Event Bus (TypeScript)
**Responsabilités**:
- Communication inter-modules
- Propagation événements (workspace, item, tab)
- IPC vers renderer

**Fichiers clés**:
```
src/main/event-bus/
├── EventBus.ts                 # EventEmitter central
├── IPCBridge.ts                # IPC main ↔ renderer
└── events/
    ├── WorkspaceEvents.ts
    ├── ItemEvents.ts
    └── TabEvents.ts
```

#### Module 8: UI Layer (React + TypeScript)
**Responsabilités**:
- Layout 3 colonnes
- Composants workspace, tabs, MarkText, AI
- Drag & drop
- Themes (light/dark)
- Keyboard shortcuts

**Fichiers clés**:
```
src/renderer/
├── App.tsx                     # Root component
├── components/
│   ├── WorkspacePanel/
│   │   ├── FileTree.tsx
│   │   ├── ItemNode.tsx
│   │   └── DragDropManager.ts
│   ├── TabArea/
│   │   ├── TabBar.tsx
│   │   ├── WebTab.tsx
│   │   └── MarkdownTab.tsx
│   └── AIPanel/
│       ├── AISelector.tsx
│       └── AIWebView.tsx
├── services/
│   ├── WorkspaceService.ts     # IPC vers main
│   └── TabService.ts
└── hooks/
    ├── useWorkspace.ts
    └── useTabs.ts
```

### 1.3. Choix technologiques détaillés

**Runtime & Framework**:
- **Electron 28+**: Cross-platform windowing, IPC, auto-update
- **Node.js 20 LTS**: Runtime main process
- **TypeScript 5.3+**: Type safety, modern JS features

**UI Layer**:
- **React 18**: Component-based UI, hooks, concurrent rendering
- **React Router**: Navigation (si multi-window future)
- **Emotion / Styled Components**: CSS-in-JS pour themes

**CEF Integration**:
- **CEF 120+**: Chromium Embedded Framework
- **C++17**: Standards modernes (auto, lambdas, smart pointers)
- **N-API**: Stable ABI pour addon Node.js
- **CMake 3.19+**: Build system cross-platform

**Storage**:
- **SQLite 3.42+**: Database relationnelle
- **SQLCipher**: Encryption at rest
- **better-sqlite3 / @journeyapps/sqlcipher**: Node.js binding

**Build & Dev Tools**:
- **Webpack 5**: Bundling renderer
- **electron-builder**: Packaging multi-platform
- **ESLint + Prettier**: Linting et formatting
- **Jest**: Unit testing
- **Playwright**: E2E testing

**Autres dépendances**:
- **Winston**: Logging structuré
- **dotenv**: Configuration
- **electron-store**: Preferences utilisateur

---

## 2. Stratégie d'intégration CEF

### 2.1. Initialisation multi-webviews

**Approche**: Lazy initialization + webview pooling

**Phase 1: Initialisation CEF (au démarrage app)**:
```cpp
// CEFManager.cpp
void CEFManager::Initialize() {
  CefMainArgs main_args;
  CefSettings settings;

  // Configuration sécurité
  settings.no_sandbox = false;  // SANDBOX OBLIGATOIRE

  // Multi-process
  settings.multi_threaded_message_loop = true;

  // Cache
  CefString(&settings.cache_path).FromString(GetCachePath());

  // Logs
  CefString(&settings.log_file).FromString(GetLogPath());
  settings.log_severity = LOGSEVERITY_WARNING;

  // Init CEF
  bool success = CefInitialize(main_args, settings, app_.get(), nullptr);
  if (!success) {
    throw std::runtime_error("CEF initialization failed");
  }

  LOG(INFO) << "CEF initialized successfully";
}
```

**Phase 2: Création du pool de webviews**:
```cpp
// WebViewPool.cpp
class WebViewPool {
private:
  std::vector<CefRefPtr<CefBrowser>> available_;
  std::map<int, CefRefPtr<CefBrowser>> in_use_;
  const size_t MAX_POOL_SIZE = 20;

public:
  CefRefPtr<CefBrowser> Acquire() {
    // Si pool vide ET sous limite: créer nouveau
    if (available_.empty() && in_use_.size() < MAX_POOL_SIZE) {
      auto browser = CreateNewBrowser();
      in_use_[browser->GetIdentifier()] = browser;
      return browser;
    }

    // Si pool non vide: réutiliser
    if (!available_.empty()) {
      auto browser = available_.back();
      available_.pop_back();
      in_use_[browser->GetIdentifier()] = browser;
      return browser;
    }

    // Pool plein: créer quand même (soft limit)
    auto browser = CreateNewBrowser();
    in_use_[browser->GetIdentifier()] = browser;
    LOG(WARNING) << "WebView pool exceeded limit: " << in_use_.size();
    return browser;
  }

  void Release(CefRefPtr<CefBrowser> browser) {
    int id = browser->GetIdentifier();
    in_use_.erase(id);

    // Reset state avant retour au pool
    browser->GetMainFrame()->LoadURL("about:blank");
    browser->GetMainFrame()->ExecuteJavaScript("sessionStorage.clear();", "", 0);

    available_.push_back(browser);
  }
};
```

**Phase 3: Exposition à Node.js via N-API**:
```cpp
// NodeCEFBridge.cpp
Napi::Object CreateBrowserWrapped(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  // Acquérir webview du pool
  auto browser = g_webview_pool->Acquire();
  int browser_id = browser->GetIdentifier();

  // Retourner ID à JavaScript
  Napi::Object result = Napi::Object::New(env);
  result.Set("browserId", Napi::Number::New(env, browser_id));
  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("createBrowser", Napi::Function::New(env, CreateBrowserWrapped));
  exports.Set("loadURL", Napi::Function::New(env, LoadURLWrapped));
  exports.Set("goBack", Napi::Function::New(env, GoBackWrapped));
  exports.Set("releaseBrowser", Napi::Function::New(env, ReleaseBrowserWrapped));
  return exports;
}

NODE_API_MODULE(cef_bridge, Init)
```

### 2.2. Gestion de la sandbox

**Stratégie**: Sandbox obligatoire, validation au démarrage

**1. Forcer sandbox enabled**:
```cpp
// CEFApp.cpp
void CEFApp::OnBeforeCommandLineProcessing(
    const CefString& process_type,
    CefRefPtr<CefCommandLine> command_line) {

  // Retirer --no-sandbox si présent (erreur de config)
  if (command_line->HasSwitch("no-sandbox")) {
    command_line->RemoveSwitch("no-sandbox");
    LOG(WARNING) << "Removed --no-sandbox flag (security violation)";
  }

  // Features sécurité
  command_line->AppendSwitch("enable-features", "NetworkService");
  command_line->AppendSwitch("disable-features", "TranslateUI");

  // Désactiver features inutiles
  command_line->AppendSwitch("disable-background-networking");
  command_line->AppendSwitch("disable-sync");
}
```

**2. Validation au runtime**:
```cpp
void CEFManager::VerifySandbox() {
  // Vérifier que sandbox est actif
  if (!CefCurrentlyOn(TID_UI)) {
    LOG(ERROR) << "Not on UI thread";
    return;
  }

  // Log sandbox status
  bool sandboxed = IsSandboxed();  // OS-specific check
  if (!sandboxed) {
    LOG(FATAL) << "CEF sandbox not enabled - ABORTING for security";
    std::exit(1);
  }

  LOG(INFO) << "CEF sandbox verified active";
}
```

### 2.3. Gestion cache / cookies / sécurité

**Cache Strategy**:
- Cache par workspace (isolation)
- Cleanup automatique des anciens caches
- Limite de taille (500MB par workspace)

**Implémentation**:
```cpp
std::string GetCachePath(const std::string& workspace_id) {
  std::string base = GetUserDataPath();
  std::string cache_dir = base + "/cef-cache/" + workspace_id;

  // Créer si n'existe pas
  if (!DirectoryExists(cache_dir)) {
    CreateDirectory(cache_dir);
  }

  return cache_dir;
}
```

**Cookies**:
- Cookies activés par défaut (requis pour IA)
- Isolation par webview (via CefCookieManager)
- Persistance pour AI panel seulement

```cpp
// AI panel webview
CefRefPtr<CefCookieManager> cookie_manager =
  CefCookieManager::CreateManager(ai_cache_path, true);  // persist=true

// Webviews standard: cookies non persistés
CefRefPtr<CefCookieManager> cookie_manager =
  CefCookieManager::CreateManager("", false);  // persist=false
```

**Content Security Policy**:
```cpp
void RequestHandler::OnBeforeBrowse(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefRefPtr<CefRequest> request,
    bool user_gesture,
    bool is_redirect) {

  // Injecter CSP header
  CefRequest::HeaderMap headers;
  request->GetHeaderMap(headers);

  headers["Content-Security-Policy"] =
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: https:; "
    "connect-src 'self' https:; "
    "frame-src 'self' https:;";

  request->SetHeaderMap(headers);
}
```

### 2.4. Isolation de la webview IA

**Stratégie**: Webview dédiée, hors du pool, cache séparé

**Configuration AI webview**:
```typescript
// AIManager.ts
class AIManager {
  private aiWebview: CefBrowser | null = null;

  async createAIWebview(provider: string) {
    // Cache path spécifique pour l'IA
    const aiCachePath = path.join(app.getPath('userData'), 'ai-cache', provider);

    // Créer webview dédiée (PAS du pool)
    this.aiWebview = await cefBridge.createBrowserWithCache({
      url: this.getProviderURL(provider),
      cachePath: aiCachePath,
      persistCookies: true,  // IMPORTANT pour session IA
      isolated: true         // Ne PAS pooler cette webview
    });
  }

  private getProviderURL(provider: string): string {
    const urls = {
      'chatgpt': 'https://chat.openai.com',
      'claude': 'https://claude.ai',
      'gemini': 'https://gemini.google.com'
    };
    return urls[provider] || provider;  // custom URL si inconnu
  }
}
```

**Différence webview IA vs webviews tabs**:
| Aspect | Webview IA | Webviews Tabs |
|--------|-----------|---------------|
| Pool | Non (instance unique) | Oui (WebViewPool) |
| Cookies | Persistés | Non persistés |
| Cache | Dédié par provider | Partagé par workspace |
| Lifecycle | Permanente (app lifetime) | Éphémère (tab lifetime) |
| Isolation | Totale (process dédié si possible) | Process-per-site-instance |

### 2.5. Performance et memory management

**1. Process-per-site-instance**:
```cpp
// CEFApp.cpp
void CEFApp::OnBeforeChildProcessLaunch(
    CefRefPtr<CefCommandLine> command_line) {

  // Activer process sharing pour même origine
  command_line->AppendSwitch("process-per-site-instance");

  // Exemple: google.com tabs partagent 1 process
  // youtube.com tabs partagent 1 autre process
}
```

**2. Tab suspension (économie mémoire)**:
```typescript
// TabManager.ts
class TabManager {
  private suspendTimer: Map<string, NodeJS.Timeout> = new Map();

  scheduleTabSuspension(tabId: string) {
    // Suspendre après 30s d'inactivité
    const timer = setTimeout(() => {
      this.suspendTab(tabId);
    }, 30000);

    this.suspendTimer.set(tabId, timer);
  }

  private suspendTab(tabId: string) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || tab.id === this.activeTabId) return;

    // Suspendre rendering CEF
    cefBridge.setTabVisibility(tab.webviewId, false);

    // Marquer comme suspendu
    tab.suspended = true;

    LOG.info(`Tab ${tabId} suspended to save memory`);
  }

  resumeTab(tabId: string) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || !tab.suspended) return;

    // Reprendre rendering
    cefBridge.setTabVisibility(tab.webviewId, true);
    tab.suspended = false;

    LOG.info(`Tab ${tabId} resumed`);
  }
}
```

**3. Memory monitoring**:
```typescript
// Memory watchdog
setInterval(() => {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const rssMB = usage.rss / 1024 / 1024;

  LOG.info(`Memory: ${heapUsedMB.toFixed(0)}MB heap, ${rssMB.toFixed(0)}MB RSS`);

  // Alerte si > 2GB (cible: <500MB baseline, <1.5GB avec 10 tabs)
  if (rssMB > 2000) {
    LOG.warn(`High memory usage: ${rssMB}MB - consider closing tabs`);
    // Optionnel: afficher notification utilisateur
  }
}, 60000);  // Toutes les minutes
```

---

## 3. Stratégie d'intégration MarkText

### 3.1. Compilation/packaging du front MarkText

**Approche**: Intégration comme dépendance npm + build custom

**1. Installation MarkText**:
```json
// package.json
{
  "dependencies": {
    "marktext-core": "^0.17.0",  // Ou fork si modifications nécessaires
    "@marktext/renderer": "^0.17.0"
  }
}
```

**2. Build configuration**:
```javascript
// webpack.config.js (renderer)
module.exports = {
  entry: {
    main: './src/renderer/index.tsx',
    marktext: './src/renderer/marktext-entry.tsx'  // Entry séparé
  },
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      // MarkText nécessite traitement CSS spécifique
      {
        test: /\.css$/,
        include: /node_modules\/@marktext/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};
```

### 3.2. Exposition via app://editor

**Protocol handler**:
```typescript
// EditorProtocol.ts
import { protocol } from 'electron';
import fs from 'fs/promises';
import path from 'path';

export class EditorProtocol {
  register() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: 'app',
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          corsEnabled: false
        }
      }
    ]);
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // app://editor/<noteId>
    if (url.host === 'editor') {
      const noteId = url.pathname.substring(1);  // Remove leading /

      // Charger le contenu de la note
      const noteContent = await this.loadNoteContent(noteId);

      // Générer HTML avec MarkText
      const html = this.generateEditorHTML(noteId, noteContent);

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private async loadNoteContent(noteId: string): Promise<string> {
    const notePath = path.join(
      app.getPath('userData'),
      'notes',
      `${noteId}.md`
    );

    try {
      return await fs.readFile(notePath, 'utf-8');
    } catch (err) {
      // Note n'existe pas encore: retourner vide
      return '';
    }
  }

  private generateEditorHTML(noteId: string, content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Editor - ${noteId}</title>
  <link rel="stylesheet" href="marktext.bundle.css">
</head>
<body>
  <div id="editor-root"></div>
  <script>
    window.noteId = '${noteId}';
    window.initialContent = ${JSON.stringify(content)};
  </script>
  <script src="marktext.bundle.js"></script>
</body>
</html>
    `;
  }
}
```

### 3.3. API interne pour sauvegarde, autosave 500ms

**AutosaveManager avec debounce**:
```typescript
// AutosaveManager.ts
export class AutosaveManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 500;  // Option B clarifiée

  scheduleSave(noteId: string, content: string) {
    // Annuler timer existant
    if (this.timers.has(noteId)) {
      clearTimeout(this.timers.get(noteId)!);
    }

    // Nouveau timer: 500ms
    const timer = setTimeout(() => {
      this.saveNow(noteId, content);
      this.timers.delete(noteId);
    }, this.DEBOUNCE_MS);

    this.timers.set(noteId, timer);
  }

  private async saveNow(noteId: string, content: string) {
    try {
      // 1. Écrire fichier (atomique: temp + rename)
      await this.writeNoteAtomic(noteId, content);

      // 2. Mettre à jour DB
      await db.run(
        'UPDATE items SET updated_at = ? WHERE id = ?',
        [Date.now(), noteId]
      );

      // 3. Émettre événement saved
      eventBus.emit('note:saved', {
        noteId,
        timestamp: new Date().toLocaleTimeString()
      });

      LOG.info(`Note ${noteId} autosaved`);
    } catch (err) {
      LOG.error(`Failed to autosave note ${noteId}:`, err);
      eventBus.emit('note:save-failed', { noteId, error: err.message });
    }
  }

  private async writeNoteAtomic(noteId: string, content: string) {
    const notePath = this.getNotePath(noteId);
    const tempPath = notePath + '.tmp';

    // Écrire temp
    await fs.writeFile(tempPath, content, 'utf-8');

    // Rename atomique
    await fs.rename(tempPath, notePath);
  }

  flushAll() {
    // Forcer sauvegarde immédiate de tous les timers en cours
    // Utilisé lors de fermeture app
    for (const [noteId, timer] of this.timers.entries()) {
      clearTimeout(timer);
      // Récupérer content du cache et sauver
      // (Nécessite cache des derniers contenus)
    }
  }
}
```

**Intégration avec MarkText renderer**:
```typescript
// MarkTextRenderer.tsx
export function MarkTextRenderer({ noteId }: { noteId: string }) {
  const [content, setContent] = useState('');
  const autosaveManager = useAutosaveManager();

  useEffect(() => {
    // Charger contenu initial
    ipcRenderer.invoke('note:load', noteId).then(setContent);
  }, [noteId]);

  const handleChange = (newContent: string) => {
    setContent(newContent);

    // Déclencher autosave (debounced)
    autosaveManager.scheduleSave(noteId, newContent);
  };

  return (
    <div className="marktext-container">
      <MarkTextEditor
        value={content}
        onChange={handleChange}
      />
      <SaveIndicator noteId={noteId} />
    </div>
  );
}
```

**SaveIndicator component**:
```typescript
// SaveIndicator.tsx
export function SaveIndicator({ noteId }: { noteId: string }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const handleSaved = (event: any) => {
      if (event.noteId === noteId) {
        setStatus('saved');
        setTimestamp(event.timestamp);
      }
    };

    const handleSaveFailed = (event: any) => {
      if (event.noteId === noteId) {
        setStatus('error');
      }
    };

    ipcRenderer.on('note:saved', handleSaved);
    ipcRenderer.on('note:save-failed', handleSaveFailed);

    return () => {
      ipcRenderer.off('note:saved', handleSaved);
      ipcRenderer.off('note:save-failed', handleSaveFailed);
    };
  }, [noteId]);

  return (
    <div className="save-indicator">
      {status === 'saved' && `Saved at ${timestamp}`}
      {status === 'saving' && 'Saving...'}
      {status === 'error' && 'Save failed'}
    </div>
  );
}
```

### 3.4. Interaction entre MarkText et Workspace Engine

**Flux de création d'une note**:
```
User: Right-click folder > New Note
  ↓
UI: Affiche dialog "Note name"
  ↓
User: Entre "My Note" → OK
  ↓
WorkspaceManager.createNoteItem('My Note', folderId)
  ↓
ItemManager:
  - Génère noteId (UUID)
  - Crée fichier vide notes/<noteId>.md
  - INSERT INTO items (id, type='note', title='My Note', folder_id=...)
  - Émet event 'item:created'
  ↓
TabManager: Écoute 'item:created'
  - TabManager.openTab(noteId)
  - Type = 'note' → load app://editor/<noteId>
  ↓
EditorProtocol:
  - Charge notes/<noteId>.md (vide)
  - Génère HTML MarkText
  - Retourne à webview
  ↓
MarkTextRenderer s'affiche dans tab
User tape du contenu
  ↓
AutosaveManager (500ms après dernière frappe):
  - Sauve notes/<noteId>.md
  - UPDATE items.updated_at
  - Émet 'note:saved'
  ↓
SaveIndicator affiche "Saved at 14:32:18"
```

---

## 4. Implémentation du Workspace Engine

### 4.1. Modèle de données

**Schéma SQLite** (storage/schema/v1.sql):
```sql
-- Workspaces
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,      -- Unix timestamp
  last_opened_at INTEGER,
  settings TEXT                     -- JSON: theme, layout prefs
);

-- Folders (hiérarchie)
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id TEXT,                   -- NULL = root
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Items (web + notes)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  folder_id TEXT,                   -- NULL = workspace root
  type TEXT NOT NULL CHECK(type IN ('web', 'note')),
  title TEXT NOT NULL,
  url TEXT,                         -- NULL pour notes
  content_path TEXT,                -- Path vers .md (notes only)
  favicon TEXT,                     -- Data URL ou path (web only)
  tags TEXT,                        -- JSON array: ["tag1", "tag2"]
  created_at INTEGER NOT NULL,
  last_opened_at INTEGER,
  updated_at INTEGER,               -- Modification (notes only)
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- Indexes pour performance
CREATE INDEX idx_items_workspace ON items(workspace_id);
CREATE INDEX idx_items_folder ON items(folder_id);
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_created ON items(created_at);
CREATE INDEX idx_folders_workspace ON folders(workspace_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);

-- FTS pour search
CREATE VIRTUAL TABLE items_fts USING fts5(
  title, tags, url, content,
  content='items',
  content_rowid='rowid'
);
```

**TypeScript interfaces**:
```typescript
// types/Workspace.ts
export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  lastOpenedAt?: number;
  settings?: WorkspaceSettings;
}

export interface WorkspaceSettings {
  theme?: 'light' | 'dark';
  layout?: {
    workspacePanelWidth: number;
    aiPanelWidth: number;
  };
}

// types/Folder.ts
export interface Folder {
  id: string;
  workspaceId: string;
  parentId?: string;
  name: string;
  createdAt: number;
}

// types/Item.ts
export interface Item {
  id: string;
  workspaceId: string;
  folderId?: string;
  type: 'web' | 'note';
  title: string;
  url?: string;           // web only
  contentPath?: string;   // note only
  favicon?: string;       // web only
  tags: string[];
  createdAt: number;
  lastOpenedAt?: number;
  updatedAt?: number;     // note only
}

export interface WebItem extends Item {
  type: 'web';
  url: string;
  favicon?: string;
}

export interface NoteItem extends Item {
  type: 'note';
  contentPath: string;
}
```

### 4.2. Création automatique dossier Date du jour (Option B)

**Implémentation dans ItemManager**:
```typescript
// ItemManager.ts
export class ItemManager {
  async createWebItem(
    workspaceId: string,
    url: string,
    title: string,
    folderId?: string
  ): Promise<WebItem> {
    // Si folderId null: créer dossier date du jour
    if (!folderId) {
      folderId = await this.getOrCreateDateFolder(workspaceId);
    }

    // Créer item
    const item: WebItem = {
      id: uuid(),
      workspaceId,
      folderId,
      type: 'web',
      title,
      url,
      tags: [],
      createdAt: Date.now()
    };

    // Insérer en DB
    await db.run(`
      INSERT INTO items (id, workspace_id, folder_id, type, title, url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [item.id, item.workspaceId, item.folderId, item.type, item.title, item.url, item.createdAt]);

    // Émettre événement
    eventBus.emit('item:created', item);

    return item;
  }

  private async getOrCreateDateFolder(workspaceId: string): Promise<string> {
    // Format DD.MM.YYYY
    const today = new Date();
    const folderName = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    // Chercher dossier existant
    const existing = await db.get(`
      SELECT id FROM folders
      WHERE workspace_id = ? AND name = ? AND parent_id IS NULL
    `, [workspaceId, folderName]);

    if (existing) {
      return existing.id;
    }

    // Créer nouveau dossier
    const folderId = uuid();
    await db.run(`
      INSERT INTO folders (id, workspace_id, parent_id, name, created_at)
      VALUES (?, ?, NULL, ?, ?)
    `, [folderId, workspaceId, folderName, Date.now()]);

    LOG.info(`Created date folder: ${folderName} for workspace ${workspaceId}`);

    eventBus.emit('folder:created', { id: folderId, name: folderName });

    return folderId;
  }
}
```

**Comportement**:
- Item créé sans folderId → `getOrCreateDateFolder()` appelé
- Dossier "22.11.2025" créé si n'existe pas
- Items suivants du même jour réutilisent le même dossier
- Items manuellement placés dans dossiers (drag-drop): skip auto-creation

### 4.3. Règles de duplication URL (Option B)

**DuplicationDetector implémentation**:
```typescript
// DuplicationDetector.ts
export class DuplicationDetector {
  async checkDuplicate(
    workspaceId: string,
    url: string,
    contextFolderId?: string
  ): Promise<WebItem | null> {
    // Date du jour (début de journée)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    // Chercher items avec même URL, créés aujourd'hui
    const candidates = await db.all<WebItem[]>(`
      SELECT * FROM items
      WHERE workspace_id = ?
        AND url = ?
        AND type = 'web'
        AND created_at >= ?
    `, [workspaceId, url, todayTimestamp]);

    if (candidates.length === 0) {
      return null;  // Pas de duplicate
    }

    // Filtrer par folder context
    // contextFolderId = dossier actif dans UI ou null (root)
    const match = candidates.find(item => item.folderId === contextFolderId);

    if (match) {
      LOG.info(`Duplicate detected: ${url} in folder ${contextFolderId}, created today`);
      return match;
    }

    return null;  // Même URL mais dossier différent ou date différente
  }

  getCurrentFolderContext(workspaceId: string): string | null {
    // Récupérer dossier actif dans workspace tree
    // (Sélection UI ou dernier item ouvert)
    const activeFolder = workspaceState.get(workspaceId)?.activeFolderId;
    return activeFolder || null;  // null = root
  }
}
```

**Intégration dans navigation flow**:
```typescript
// TabItemSync.ts (dans Tab Manager)
async onNavigationCommitted(tabId: string, url: string, title: string) {
  const workspaceId = workspaceManager.getActiveWorkspaceId();
  const contextFolder = duplicationDetector.getCurrentFolderContext(workspaceId);

  // Vérifier duplication
  const duplicate = await duplicationDetector.checkDuplicate(
    workspaceId,
    url,
    contextFolder
  );

  if (duplicate) {
    // Duplicate trouvé: focus tab existant
    LOG.info(`Focusing existing tab for duplicate item ${duplicate.id}`);

    // Trouver tab lié à cet item
    const existingTab = tabManager.findTabByItemId(duplicate.id);

    if (existingTab) {
      // Tab déjà ouvert: focus
      await tabManager.switchTab(existingTab.id);
    } else {
      // Item existe mais pas de tab: ouvrir tab
      await tabManager.openTab(duplicate.id);
    }

    // Fermer tab actuel (navigation annulée)
    await tabManager.closeTab(tabId);

    return;
  }

  // Pas de duplicate: créer nouvel item
  const item = await itemManager.createWebItem(
    workspaceId,
    url,
    title,
    contextFolder  // peut être null → auto date folder
  );

  // Lier tab à nouvel item
  await tabManager.updateTab(tabId, { itemId: item.id });

  LOG.info(`Created new item ${item.id} for URL ${url}`);
}
```

### 4.4. Crash recovery complet (Option C)

**SessionStore implémentation**:
```typescript
// SessionStore.ts
export class SessionStore {
  private sessionPath: string;
  private backupPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.sessionPath = path.join(userDataPath, 'session-state.json');
    this.backupPath = path.join(userDataPath, 'session-state.backup.json');
  }

  async saveState(state: SessionState) {
    try {
      // 1. Sérialiser state
      const json = JSON.stringify(state, null, 2);

      // 2. Écrire temp
      const tempPath = this.sessionPath + '.tmp';
      await fs.writeFile(tempPath, json, 'utf-8');

      // 3. Backup ancien state (si existe)
      if (await fileExists(this.sessionPath)) {
        await fs.copyFile(this.sessionPath, this.backupPath);
      }

      // 4. Rename atomique
      await fs.rename(tempPath, this.sessionPath);

      LOG.debug('Session state saved');
    } catch (err) {
      LOG.error('Failed to save session state:', err);
      throw err;
    }
  }

  async loadState(): Promise<SessionState | null> {
    try {
      // Charger session principale
      const json = await fs.readFile(this.sessionPath, 'utf-8');
      const state = JSON.parse(json) as SessionState;

      // Valider structure
      if (!this.validateState(state)) {
        throw new Error('Invalid session state structure');
      }

      return state;
    } catch (err) {
      LOG.warn('Failed to load session state, trying backup:', err);

      // Essayer backup
      try {
        const json = await fs.readFile(this.backupPath, 'utf-8');
        const state = JSON.parse(json) as SessionState;

        if (this.validateState(state)) {
          LOG.info('Restored session from backup');
          return state;
        }
      } catch (backupErr) {
        LOG.error('Backup also failed:', backupErr);
      }

      return null;  // Impossible de restaurer
    }
  }

  private validateState(state: any): state is SessionState {
    return (
      state &&
      typeof state.workspaceId === 'string' &&
      Array.isArray(state.tabs) &&
      typeof state.activeTabIndex === 'number'
    );
  }
}

export interface SessionState {
  workspaceId: string;
  tabs: TabState[];
  activeTabIndex: number;
  windowGeometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lastSaved: number;
}

export interface TabState {
  itemId: string;
  url?: string;
  type: 'web' | 'note';
  scrollPosition?: number;
  zoomLevel?: number;
}
```

**Crash detection & recovery flow**:
```typescript
// main/index.ts (app startup)
async function initializeApp() {
  // 1. Détecter crash
  const crashFlag = path.join(app.getPath('userData'), 'running.flag');
  const wasCrashed = await fileExists(crashFlag);

  if (wasCrashed) {
    LOG.warn('Unclean shutdown detected - starting crash recovery');
  }

  // 2. Créer flag "running"
  await fs.writeFile(crashFlag, Date.now().toString());

  // 3. Valider intégrité workspace
  const sessionState = await sessionStore.loadState();

  if (sessionState) {
    const valid = await integrityValidator.validate(sessionState.workspaceId);

    if (!valid.success) {
      LOG.error('Workspace integrity check failed:', valid.errors);

      // Tenter réparation
      const repaired = await integrityValidator.repair(sessionState.workspaceId);

      if (!repaired) {
        // Impossible de réparer: demander à l'utilisateur
        const choice = await showDialog({
          type: 'warning',
          title: 'Session Recovery Failed',
          message: 'Could not restore previous session. Start with empty workspace?',
          buttons: ['Start Fresh', 'Exit']
        });

        if (choice === 1) {
          app.quit();
          return;
        }

        // Start fresh
        sessionState = null;
      }
    }
  }

  // 4. Restaurer session
  if (sessionState) {
    await restoreSession(sessionState);
  } else {
    // Pas de session: workspace vide
    await createDefaultWorkspace();
  }

  // 5. Setup continuous save
  setupSessionAutosave();

  // 6. Clean exit handler
  app.on('before-quit', async () => {
    // Flush autosaves
    await autosaveManager.flushAll();

    // Save final session state
    await saveCurrentSession();

    // Remove running flag (clean exit)
    await fs.unlink(crashFlag);
  });
}

async function restoreSession(state: SessionState) {
  // 1. Ouvrir workspace
  await workspaceManager.openWorkspace(state.workspaceId);

  // 2. Restaurer fenêtre
  mainWindow.setBounds(state.windowGeometry);

  // 3. Restaurer tabs
  for (const tabState of state.tabs) {
    try {
      await tabManager.openTab(tabState.itemId);

      // Restaurer scroll/zoom si web tab
      if (tabState.type === 'web' && tabState.scrollPosition) {
        await restoreTabScroll(tabState.itemId, tabState.scrollPosition);
      }
    } catch (err) {
      LOG.warn(`Failed to restore tab ${tabState.itemId}:`, err);
      // Continuer avec les autres tabs
    }
  }

  // 4. Activer tab
  if (state.tabs.length > 0) {
    const activeTabId = tabManager.tabs[state.activeTabIndex]?.id;
    if (activeTabId) {
      await tabManager.switchTab(activeTabId);
    }
  }

  // 5. Notifier utilisateur
  showNotification({
    title: 'Session Restored',
    body: `${state.tabs.length} tabs restored from previous session`
  });
}

function setupSessionAutosave() {
  // Sauver state à chaque changement (debounced 1s)
  let saveTimer: NodeJS.Timeout | null = null;

  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(async () => {
      await saveCurrentSession();
    }, 1000);
  };

  // Triggers
  eventBus.on('tab:opened', scheduleSave);
  eventBus.on('tab:closed', scheduleSave);
  eventBus.on('tab:switched', scheduleSave);
  eventBus.on('workspace:switched', scheduleSave);
}

async function saveCurrentSession() {
  const state: SessionState = {
    workspaceId: workspaceManager.getActiveWorkspaceId(),
    tabs: tabManager.tabs.map(tab => ({
      itemId: tab.itemId,
      url: tab.url,
      type: tab.type,
      scrollPosition: tab.scrollPosition,
      zoomLevel: tab.zoomLevel
    })),
    activeTabIndex: tabManager.activeTabIndex,
    windowGeometry: mainWindow.getBounds(),
    lastSaved: Date.now()
  };

  await sessionStore.saveState(state);
}
```

**IntegrityValidator**:
```typescript
// IntegrityValidator.ts
export class IntegrityValidator {
  async validate(workspaceId: string): Promise<ValidationResult> {
    const errors: string[] = [];

    // 1. Vérifier workspace existe
    const workspace = await db.get('SELECT * FROM workspaces WHERE id = ?', workspaceId);
    if (!workspace) {
      errors.push(`Workspace ${workspaceId} not found`);
      return { success: false, errors };
    }

    // 2. Vérifier FK constraints
    const orphanedItems = await db.all(`
      SELECT id FROM items
      WHERE workspace_id = ?
        AND folder_id IS NOT NULL
        AND folder_id NOT IN (SELECT id FROM folders)
    `, workspaceId);

    if (orphanedItems.length > 0) {
      errors.push(`Found ${orphanedItems.length} orphaned items`);
    }

    // 3. Vérifier schema version
    const version = await db.get('PRAGMA user_version');
    if (version.user_version !== CURRENT_SCHEMA_VERSION) {
      errors.push(`Schema version mismatch: ${version.user_version} vs ${CURRENT_SCHEMA_VERSION}`);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  async repair(workspaceId: string): Promise<boolean> {
    try {
      // Auto-repair: déplacer items orphelins vers root
      await db.run(`
        UPDATE items
        SET folder_id = NULL
        WHERE workspace_id = ?
          AND folder_id IS NOT NULL
          AND folder_id NOT IN (SELECT id FROM folders)
      `, workspaceId);

      LOG.info(`Repaired orphaned items for workspace ${workspaceId}`);

      return true;
    } catch (err) {
      LOG.error('Repair failed:', err);
      return false;
    }
  }
}
```

---

## 5. Implémentation du Tabs Engine

### 5.1. Création / fermeture / restauration des onglets

**TabManager core**:
```typescript
// TabManager.ts
export class TabManager {
  tabs: Tab[] = [];
  activeTabIndex: number = -1;

  async openTab(itemId: string): Promise<Tab> {
    // 1. Récupérer item
    const item = await workspaceManager.getItem(itemId);

    // 2. Vérifier si tab déjà ouvert pour cet item
    const existingTab = this.tabs.find(t => t.itemId === itemId);
    if (existingTab) {
      await this.switchTab(existingTab.id);
      return existingTab;
    }

    // 3. Créer tab
    const tab: Tab = {
      id: uuid(),
      itemId,
      type: item.type,
      title: item.title,
      url: item.type === 'web' ? item.url : `app://editor/${itemId}`,
      isLoading: true,
      webviewId: null
    };

    // 4. Acquérir webview
    if (item.type === 'web') {
      const webview = await cefBridge.createBrowser();
      tab.webviewId = webview.browserId;

      // Load URL
      await cefBridge.loadURL(tab.webviewId, tab.url!);
    } else {
      // Note: webview via protocol handler
      const webview = await cefBridge.createBrowser();
      tab.webviewId = webview.browserId;
      await cefBridge.loadURL(tab.webviewId, tab.url);
    }

    // 5. Ajouter à tabs
    this.tabs.push(tab);
    this.activeTabIndex = this.tabs.length - 1;

    // 6. Update item lastOpenedAt
    await workspaceManager.updateItemTimestamp(itemId);

    // 7. Émettre événement
    eventBus.emit('tab:opened', tab);

    LOG.info(`Opened tab ${tab.id} for item ${itemId}`);

    return tab;
  }

  async closeTab(tabId: string) {
    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tab = this.tabs[tabIndex];

    // 1. Release webview
    if (tab.webviewId) {
      await cefBridge.releaseBrowser(tab.webviewId);
    }

    // 2. Retirer du tableau
    this.tabs.splice(tabIndex, 1);

    // 3. Ajuster activeTabIndex
    if (this.activeTabIndex >= this.tabs.length) {
      this.activeTabIndex = this.tabs.length - 1;
    }

    // 4. Item reste dans workspace (PAS de suppression)

    // 5. Émettre événement
    eventBus.emit('tab:closed', { tabId });

    LOG.info(`Closed tab ${tabId}`);
  }

  async switchTab(tabId: string) {
    const tabIndex = this.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    this.activeTabIndex = tabIndex;

    // Rendre webview visible
    const tab = this.tabs[tabIndex];
    if (tab.webviewId) {
      await cefBridge.setTabVisibility(tab.webviewId, true);
    }

    // Cacher autres webviews
    for (let i = 0; i < this.tabs.length; i++) {
      if (i !== tabIndex && this.tabs[i].webviewId) {
        await cefBridge.setTabVisibility(this.tabs[i].webviewId, false);
      }
    }

    eventBus.emit('tab:switched', { tabId });
  }
}

export interface Tab {
  id: string;
  itemId: string;
  type: 'web' | 'note';
  title: string;
  url?: string;
  favicon?: string;
  webviewId: number | null;
  isLoading: boolean;
  scrollPosition?: number;
  zoomLevel?: number;
  suspended?: boolean;
}
```

### 5.2. Limite douce 20 onglets (Option C)

**Implémentation**:
```typescript
// TabManager.ts (ajout dans openTab)
async openTab(itemId: string): Promise<Tab> {
  // Vérifier limite douce
  const SOFT_LIMIT = 20;

  if (this.tabs.length >= SOFT_LIMIT) {
    // Émettre warning (ne PAS bloquer)
    eventBus.emit('tab:limit-warning', {
      currentCount: this.tabs.length,
      limit: SOFT_LIMIT,
      message: 'You have 20+ tabs open. Performance may be impacted.'
    });

    LOG.warn(`Tab count ${this.tabs.length} exceeds soft limit ${SOFT_LIMIT}`);
  }

  // Continuer création tab normalement...
  // (pas de hard block)
}
```

**UI Warning (React)**:
```typescript
// TabLimitWarning.tsx
export function TabLimitWarning() {
  const [visible, setVisible] = useState(false);
  const [tabCount, setTabCount] = useState(0);

  useEffect(() => {
    const handleWarning = (event: any) => {
      setTabCount(event.currentCount);
      setVisible(true);

      // Auto-hide après 5s
      setTimeout(() => setVisible(false), 5000);
    };

    ipcRenderer.on('tab:limit-warning', handleWarning);
    return () => {
      ipcRenderer.off('tab:limit-warning', handleWarning);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="tab-limit-warning toast">
      <span className="icon">⚠️</span>
      <span className="message">
        {tabCount}+ tabs open. Performance may be impacted.
        Consider closing unused tabs.
      </span>
      <button onClick={() => setVisible(false)}>×</button>
    </div>
  );
}
```

**CSS**:
```css
/* TabBar: yellow border si > 20 tabs */
.tab-bar.over-limit {
  border-top: 3px solid #f59e0b;
}
```

### 5.3. Gestion Web vs Markdown

**Différenciation dans UI**:
```typescript
// TabArea.tsx
export function TabArea() {
  const { tabs, activeTabIndex } = useTabs();
  const activeTab = tabs[activeTabIndex];

  return (
    <div className="tab-area">
      <TabBar tabs={tabs} activeIndex={activeTabIndex} />

      <div className="tab-content">
        {activeTab?.type === 'web' && (
          <WebTab tab={activeTab} />
        )}

        {activeTab?.type === 'note' && (
          <MarkdownTab tab={activeTab} />
        )}
      </div>
    </div>
  );
}

// WebTab.tsx
export function WebTab({ tab }: { tab: Tab }) {
  return (
    <div className="web-tab">
      <div className="web-controls">
        <button onClick={() => goBack(tab.id)}>←</button>
        <button onClick={() => goForward(tab.id)}>→</button>
        <button onClick={() => reload(tab.id)}>↻</button>
        <input
          type="text"
          value={tab.url}
          onChange={(e) => navigateTo(tab.id, e.target.value)}
          placeholder="Enter URL..."
        />
      </div>

      <div id={`webview-${tab.webviewId}`} className="webview-container" />

      {tab.isLoading && <LoadingBar />}
    </div>
  );
}

// MarkdownTab.tsx
export function MarkdownTab({ tab }: { tab: Tab }) {
  return (
    <div className="markdown-tab">
      <EditorToolbar />

      <MarkTextRenderer noteId={tab.itemId} />

      <SaveIndicator noteId={tab.itemId} />
    </div>
  );
}
```

### 5.4. Synchronisation item ↔ tab

**Flux complet**:
```
[User clicks item in workspace tree]
  ↓
WorkspacePanel: onClick(itemId)
  ↓
TabService.openItem(itemId)  [IPC]
  ↓
TabManager.openTab(itemId)
  ↓
Get item from DB
  ↓
Create Tab object
  ↓
Acquire webview from pool
  ↓
Load URL (web) ou app://editor (note)
  ↓
Update item.lastOpenedAt
  ↓
Emit 'tab:opened' event
  ↓
UI updates: new tab appears in TabBar
```

**Reverse: Navigation → item creation**:
```
[User types URL in address bar]
  ↓
WebTab: onNavigate(url)
  ↓
CEF: onBeforeNavigate → onLoadEnd
  ↓
LoadHandler.cpp: OnLoadEnd callback
  ↓
NodeCEFBridge: emit 'navigation-committed' to Node.js
  ↓
TabManager.onNavigationCommitted(tabId, url, title)
  ↓
DuplicationDetector.checkDuplicate(url)
  ↓
IF duplicate:
  - Focus existing tab
  - Close current tab
ELSE:
  - ItemManager.createWebItem(url, title)
  - TabManager.updateTab(tabId, { itemId: newItemId })
  - Workspace tree updates (new item appears)
```

---

## 6. Implémentation du panneau IA

### 6.1. Sélecteur d'IA

**AISelector component**:
```typescript
// AISelector.tsx
export function AISelector() {
  const [provider, setProvider] = useState<string>('chatgpt');
  const [customURL, setCustomURL] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const providers = [
    { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com' },
    { id: 'claude', name: 'Claude', url: 'https://claude.ai' },
    { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com' },
    { id: 'custom', name: 'Custom URL...', url: '' }
  ];

  const handleChange = async (newProvider: string) => {
    if (newProvider === 'custom') {
      setShowCustomInput(true);
      return;
    }

    setProvider(newProvider);
    setShowCustomInput(false);

    // Charger nouveau provider
    await ipcRenderer.invoke('ai:change-provider', newProvider);
  };

  const handleCustomURL = async () => {
    if (!customURL) return;

    setProvider('custom');
    setShowCustomInput(false);

    await ipcRenderer.invoke('ai:change-provider', 'custom', customURL);
  };

  return (
    <div className="ai-selector">
      <select value={provider} onChange={(e) => handleChange(e.target.value)}>
        {providers.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {showCustomInput && (
        <div className="custom-url-input">
          <input
            type="url"
            placeholder="https://..."
            value={customURL}
            onChange={(e) => setCustomURL(e.target.value)}
          />
          <button onClick={handleCustomURL}>Load</button>
        </div>
      )}
    </div>
  );
}
```

### 6.2. Webview isolée

**AIManager (main process)**:
```typescript
// AIManager.ts
export class AIManager {
  private aiWebview: number | null = null;  // CEF browser ID
  private currentProvider: string = 'chatgpt';

  async changeProvider(provider: string, customURL?: string) {
    // 1. Destroy current AI webview
    if (this.aiWebview !== null) {
      await cefBridge.destroyBrowser(this.aiWebview);
      this.aiWebview = null;
    }

    // 2. Get provider URL
    const url = customURL || this.getProviderURL(provider);

    // 3. Create new AI webview (ISOLATED, not from pool)
    const cachePath = path.join(
      app.getPath('userData'),
      'ai-cache',
      provider
    );

    const webview = await cefBridge.createBrowserWithCache({
      url,
      cachePath,
      persistCookies: true,    // IMPORTANT pour sessions
      isolated: true,          // Hors du pool
      sandbox: true            // Toujours sandboxed
    });

    this.aiWebview = webview.browserId;
    this.currentProvider = provider;

    // 4. Notifier UI
    eventBus.emit('ai:provider-changed', { provider, url });

    LOG.info(`AI provider changed to ${provider}`);
  }

  private getProviderURL(provider: string): string {
    const urls: Record<string, string> = {
      'chatgpt': 'https://chat.openai.com',
      'claude': 'https://claude.ai',
      'gemini': 'https://gemini.google.com'
    };

    return urls[provider] || 'about:blank';
  }

  getAIWebviewId(): number | null {
    return this.aiWebview;
  }
}
```

**Différence AI webview vs tab webviews**:
```typescript
// cef-bridge (N-API)
export function createBrowserWithCache(options: BrowserOptions): CefBrowser {
  // AI webview: cache + cookies persistés
  if (options.isolated) {
    const settings = {
      cache_path: options.cachePath,
      persist_session_cookies: options.persistCookies,
      // Process dédié si possible
      site_instance_group_id: "ai-panel"
    };

    return CreateBrowserWithSettings(settings);
  }

  // Tab webview: from pool, no persist
  return g_webview_pool->Acquire();
}
```

### 6.3. Gestion de session (persistante)

**Session cookies**:
- CEF gère automatiquement la persistance si `persist_session_cookies = true`
- Cookies stockés dans `{cachePath}/Cookies` (SQLite)
- Restaurés au redémarrage app

**Vérification persistence**:
```typescript
// Test session persistence
async function testAISessionPersistence() {
  // 1. Login to ChatGPT
  await aiManager.changeProvider('chatgpt');

  // User logs in via UI...
  await waitForUserLogin();

  // 2. Close app
  app.quit();

  // 3. Reopen app
  await aiManager.changeProvider('chatgpt');

  // 4. Vérifier still logged in
  const stillLoggedIn = await checkLoginState();

  assert(stillLoggedIn, 'AI session should persist across restarts');
}
```

**Fallback si session expirée**:
```cpp
// RequestHandler.cpp
bool RequestHandler::OnBeforeResourceLoad(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefRefPtr<CefRequest> request,
    CefRefPtr<CefCallback> callback) {

  // Détecter 401/403 (session expirée)
  int status = GetResponseStatus(request);

  if (status == 401 || status == 403) {
    // Notifier user
    SendEventToNode("ai:session-expired", browser->GetIdentifier());
  }

  return false;  // Continue request
}
```

**UI notification**:
```typescript
// AI session expiration handler
ipcRenderer.on('ai:session-expired', () => {
  showNotification({
    title: 'AI Session Expired',
    body: 'Please log in again to continue using the AI assistant.',
    type: 'warning'
  });
});
```

### 6.4. Communication minimale avec le reste de l'application

**Isolation principes**:
- AI panel = composant autonome
- Pas d'accès direct aux workspaces/items
- Communication unidirectionnelle: User → AI (pas AI → Workspace)
- Future (V2): Copy selected text → AI panel

**Architecture actuelle (V1)**:
```
AI Panel ────────────────────── (isolée)
           ↑
           │ User interaction only
           │ (click, type, scroll)
           ↓
         User

Workspace Engine ───────────── (pas de lien)
```

**Future (V2)**:
```
AI Panel ←──────────────────── User can send text
           ↑
           │ ipcRenderer.invoke('ai:send-text', text)
           │
Workspace / Tabs ───────────── Selected text extraction
```

**V1 implementation (no communication)**:
```typescript
// AIPanel.tsx
export function AIPanel() {
  const [provider, setProvider] = useState('chatgpt');
  const [webviewId, setWebviewId] = useState<number | null>(null);

  useEffect(() => {
    // Load initial provider
    ipcRenderer.invoke('ai:get-webview-id').then(setWebviewId);

    // Listen provider changes
    const handleProviderChanged = (event: any) => {
      setProvider(event.provider);
      setWebviewId(event.webviewId);
    };

    ipcRenderer.on('ai:provider-changed', handleProviderChanged);

    return () => {
      ipcRenderer.off('ai:provider-changed', handleProviderChanged);
    };
  }, []);

  return (
    <div className="ai-panel">
      <AISelector />

      <div className="ai-webview-container">
        {webviewId !== null && (
          <div id={`webview-${webviewId}`} className="ai-webview" />
        )}
      </div>
    </div>
  );
}
```

---

## 7. Implémentation du système de stockage

### 7.1. SQLite + fichiers JSON

**Architecture storage**:
```
userData/
├── workspace.db              # SQLite (workspaces, folders, items)
├── session-state.json        # Session active (crash recovery)
├── session-state.backup.json # Backup session
├── notes/                    # Fichiers Markdown
│   ├── {uuid-1}.md
│   ├── {uuid-2}.md
│   └── ...
├── cef-cache/                # Cache CEF (par workspace)
│   ├── {workspace-id-1}/
│   └── {workspace-id-2}/
└── ai-cache/                 # Cache IA (par provider)
    ├── chatgpt/
    ├── claude/
    └── gemini/
```

**Database initialization**:
```typescript
// Database.ts
import SQLite from 'better-sqlite3';
import SQLCipher from '@journeyapps/sqlcipher';
import { KeyManager } from './KeyManager';

export class Database {
  private db: SQLite.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'workspace.db');
    const encryptionKey = KeyManager.getKey();

    // Init SQLCipher
    this.db = new SQLCipher(dbPath);

    // Apply encryption
    this.db.pragma(`key='${encryptionKey}'`);
    this.db.pragma('cipher_page_size=4096');

    // WAL mode (concurrent reads)
    this.db.pragma('journal_mode = WAL');

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Initialize schema if needed
    this.initializeSchema();
  }

  private initializeSchema() {
    const version = this.db.pragma('user_version', { simple: true }) as number;

    if (version === 0) {
      // First time: create schema
      const schema = fs.readFileSync(
        path.join(__dirname, 'schema', 'v1.sql'),
        'utf-8'
      );

      this.db.exec(schema);
      this.db.pragma('user_version = 1');

      LOG.info('Database schema initialized (v1)');
    } else {
      // Check for migrations
      this.runMigrations(version);
    }
  }

  private runMigrations(currentVersion: number) {
    const migrationRunner = new MigrationRunner(this.db);
    migrationRunner.migrate(currentVersion, CURRENT_SCHEMA_VERSION);
  }

  // Wrapper methods
  run(sql: string, params?: any[]): void {
    this.db.prepare(sql).run(params);
  }

  get<T>(sql: string, params?: any[]): T | undefined {
    return this.db.prepare(sql).get(params) as T;
  }

  all<T>(sql: string, params?: any[]): T[] {
    return this.db.prepare(sql).all(params) as T[];
  }

  close() {
    this.db.close();
  }
}

// Singleton
export const db = new Database();
```

### 7.2. Règles d'écriture (atomicité, fiabilité)

**Atomic writes pour JSON**:
```typescript
// SessionStore.ts
async function atomicWrite(filePath: string, content: string) {
  const tempPath = filePath + '.tmp';
  const backupPath = filePath + '.backup';

  try {
    // 1. Write to temp
    await fs.writeFile(tempPath, content, 'utf-8');

    // 2. Backup old file (if exists)
    if (await fileExists(filePath)) {
      await fs.copyFile(filePath, backupPath);
    }

    // 3. Atomic rename (OS-level)
    await fs.rename(tempPath, filePath);

    // Success
  } catch (err) {
    // Cleanup temp on error
    try {
      await fs.unlink(tempPath);
    } catch {}

    throw err;
  }
}
```

**SQLite transactions**:
```typescript
// WorkspaceManager.ts
async deleteWorkspace(workspaceId: string) {
  // Use transaction for atomicity
  db.transaction(() => {
    // 1. Delete items (CASCADE handled by FK)
    db.run('DELETE FROM items WHERE workspace_id = ?', workspaceId);

    // 2. Delete folders (CASCADE)
    db.run('DELETE FROM folders WHERE workspace_id = ?', workspaceId);

    // 3. Delete workspace
    db.run('DELETE FROM workspaces WHERE id = ?', workspaceId);

  })();  // Execute transaction

  // If any step fails: full rollback (ACID)
}
```

### 7.3. Restauration post-crash

**Voir section 4.4 (Crash Recovery) pour détails complets**

**Résumé du flow**:
1. Détecter crash (flag `running.flag` toujours présent au démarrage)
2. Charger `session-state.json`
3. Valider intégrité workspace (IntegrityValidator)
4. Si corrupt: tenter restauration depuis `.backup`
5. Si OK: restaurer workspace + tabs
6. Continuous save durant session (debounced 1s)
7. Clean exit: remove flag

### 7.4. Versioning interne des workspaces

**Schema versioning**:
```sql
-- Version stored in PRAGMA user_version
PRAGMA user_version = 1;  -- v1 initial
```

**Migration example (v1 → v2)**:
```typescript
// MigrationRunner.ts
export class MigrationRunner {
  private migrations: Map<number, Migration> = new Map([
    [2, this.migrateV1ToV2.bind(this)],
    // Future migrations...
  ]);

  migrate(fromVersion: number, toVersion: number) {
    for (let v = fromVersion + 1; v <= toVersion; v++) {
      const migration = this.migrations.get(v);

      if (!migration) {
        throw new Error(`Missing migration to v${v}`);
      }

      LOG.info(`Running migration to v${v}...`);

      migration();

      this.db.pragma(`user_version = ${v}`);

      LOG.info(`Migration to v${v} complete`);
    }
  }

  private migrateV1ToV2() {
    // Example: Add "description" column to items
    this.db.exec(`
      ALTER TABLE items ADD COLUMN description TEXT;
    `);
  }
}
```

**Workspace data versioning**:
```typescript
// Workspace settings include version
interface WorkspaceSettings {
  version: string;  // "1.0.0"
  theme?: 'light' | 'dark';
  // ...
}

// On workspace creation
const workspace = {
  id: uuid(),
  name: 'My Workspace',
  settings: JSON.stringify({
    version: '1.0.0',
    theme: 'light'
  })
};
```

---

## 8. Implémentation de l'UI/UX

### 8.1. Layout 3 colonnes

**App.tsx structure**:
```typescript
// App.tsx
export function App() {
  const [workspacePanelWidth, setWorkspacePanelWidth] = useState(300);
  const [aiPanelWidth, setAIPanelWidth] = useState(400);

  return (
    <div className="app">
      <MenuBar />

      <div className="main-layout">
        {/* Left: Workspace Panel */}
        <div
          className="workspace-panel"
          style={{ width: workspacePanelWidth }}
        >
          <WorkspacePanel />
        </div>

        {/* Splitter 1 */}
        <Splitter
          onResize={(delta) => setWorkspacePanelWidth(prev => prev + delta)}
          minSize={200}
          maxSize={600}
        />

        {/* Center: Tab Area */}
        <div className="tab-area" style={{ flex: 1 }}>
          <TabArea />
        </div>

        {/* Splitter 2 */}
        <Splitter
          onResize={(delta) => setAIPanelWidth(prev => prev - delta)}
          minSize={300}
          maxSize={800}
        />

        {/* Right: AI Panel */}
        <div
          className="ai-panel"
          style={{ width: aiPanelWidth }}
        >
          <AIPanel />
        </div>
      </div>
    </div>
  );
}
```

**CSS Grid alternative** (plus moderne):
```css
.main-layout {
  display: grid;
  grid-template-columns: 300px 1fr 400px;
  height: calc(100vh - 40px);  /* Minus menu bar */
}

.workspace-panel {
  grid-column: 1;
  border-right: 1px solid var(--border-color);
}

.tab-area {
  grid-column: 2;
}

.ai-panel {
  grid-column: 3;
  border-left: 1px solid var(--border-color);
}
```

### 8.2. Composants (File Tree, Tabs, Markdown Editor, IA Pane)

**Voir section 7 du plan.md pour détails complets**

**FileTree component** (récursif):
```typescript
// FileTree.tsx
export function FileTree({ workspaceId }: { workspaceId: string }) {
  const { folders, items } = useWorkspace(workspaceId);
  const rootFolders = folders.filter(f => !f.parentId);

  return (
    <div className="file-tree">
      {rootFolders.map(folder => (
        <FolderNode key={folder.id} folder={folder} />
      ))}

      {items.filter(i => !i.folderId).map(item => (
        <ItemNode key={item.id} item={item} />
      ))}
    </div>
  );
}

// FolderNode.tsx (récursif)
export function FolderNode({ folder }: { folder: Folder }) {
  const [expanded, setExpanded] = useState(false);
  const { folders, items } = useWorkspace();

  const childFolders = folders.filter(f => f.parentId === folder.id);
  const childItems = items.filter(i => i.folderId === folder.id);

  return (
    <div className="folder-node">
      <div
        className="folder-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="icon">{expanded ? '▼' : '▶'}</span>
        <span className="folder-icon">📁</span>
        <span className="name">{folder.name}</span>
        <span className="count">({childItems.length})</span>
      </div>

      {expanded && (
        <div className="folder-children">
          {childFolders.map(f => (
            <FolderNode key={f.id} folder={f} />
          ))}

          {childItems.map(i => (
            <ItemNode key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 8.3. États (loading, error, empty)

**Loading states**:
```typescript
// WorkspacePanel.tsx
export function WorkspacePanel() {
  const { workspace, isLoading, error } = useWorkspace();

  if (isLoading) {
    return (
      <div className="workspace-panel loading">
        <Spinner />
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-panel error">
        <ErrorIcon />
        <p>Failed to load workspace</p>
        <button onClick={() => retry()}>Retry</button>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="workspace-panel empty">
        <EmptyIcon />
        <p>No workspace open</p>
        <button onClick={() => createWorkspace()}>
          Create Workspace
        </button>
      </div>
    );
  }

  return <FileTree workspaceId={workspace.id} />;
}
```

**Tab loading**:
```typescript
// WebTab.tsx
export function WebTab({ tab }: { tab: Tab }) {
  return (
    <div className="web-tab">
      {tab.isLoading && (
        <div className="loading-bar">
          <div className="progress" />
        </div>
      )}

      <div id={`webview-${tab.webviewId}`} />
    </div>
  );
}
```

### 8.4. Indicateurs visuels (autosave, restore, warning onglets)

**Autosave indicator** (déjà couvert section 3.3):
```typescript
// SaveIndicator.tsx
<div className="save-indicator">
  {status === 'saved' && `Saved at ${timestamp}`}
  {status === 'saving' && 'Saving...'}
  {status === 'error' && 'Save failed'}
</div>
```

**Restore notification**:
```typescript
// Notification on startup after crash
useEffect(() => {
  ipcRenderer.once('session:restored', (event: any) => {
    showToast({
      type: 'success',
      message: `Session restored: ${event.tabCount} tabs reopened`,
      duration: 5000
    });
  });
}, []);
```

**Tab warning** (déjà couvert section 5.2):
```typescript
// TabLimitWarning.tsx
<div className="tab-limit-warning toast">
  ⚠️ 20+ tabs open. Performance may be impacted.
</div>
```

---

## 9. Stratégie de validation et QA

### 9.1. Tests unitaires prioritaires

**Coverage targets**: 70%+ (constitution requirement)

**Priority test areas**:
1. **WorkspaceManager** (CRUD, event emission)
2. **ItemManager** (auto date folders, duplication detection)
3. **TabManager** (lifecycle, limit warnings)
4. **AutosaveManager** (debounce 500ms, flush)
5. **IntegrityValidator** (corruption detection, repair)
6. **SessionStore** (atomic writes, backup/restore)

**Example test suite**:
```typescript
// ItemManager.test.ts
describe('ItemManager', () => {
  describe('auto date folder creation', () => {
    it('should create date folder when folderId is null', async () => {
      const workspace = await createTestWorkspace();

      const item = await itemManager.createWebItem(
        workspace.id,
        'https://example.com',
        'Example',
        null  // No folderId → auto date folder
      );

      // Vérifier folder créé
      expect(item.folderId).not.toBeNull();

      const folder = await db.get('SELECT * FROM folders WHERE id = ?', item.folderId);
      expect(folder.name).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);  // DD.MM.YYYY
    });

    it('should reuse existing date folder', async () => {
      const workspace = await createTestWorkspace();

      // Create 2 items on same day
      const item1 = await itemManager.createWebItem(workspace.id, 'https://a.com', 'A', null);
      const item2 = await itemManager.createWebItem(workspace.id, 'https://b.com', 'B', null);

      // Should be in same folder
      expect(item1.folderId).toBe(item2.folderId);
    });

    it('should skip auto folder if folderId provided', async () => {
      const workspace = await createTestWorkspace();
      const folder = await folderManager.createFolder(workspace.id, 'Manual', null);

      const item = await itemManager.createWebItem(
        workspace.id,
        'https://example.com',
        'Example',
        folder.id  // Manual folderId
      );

      expect(item.folderId).toBe(folder.id);
    });
  });

  describe('duplication detection', () => {
    it('should detect duplicate URL in same folder on same day', async () => {
      const workspace = await createTestWorkspace();
      const folder = await folderManager.createFolder(workspace.id, 'Test', null);

      // Create item
      const item1 = await itemManager.createWebItem(workspace.id, 'https://example.com', 'Example', folder.id);

      // Try duplicate
      const duplicate = await duplicationDetector.checkDuplicate(workspace.id, 'https://example.com', folder.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate!.id).toBe(item1.id);
    });

    it('should not detect duplicate in different folder', async () => {
      const workspace = await createTestWorkspace();
      const folder1 = await folderManager.createFolder(workspace.id, 'Folder 1', null);
      const folder2 = await folderManager.createFolder(workspace.id, 'Folder 2', null);

      // Create item in folder1
      await itemManager.createWebItem(workspace.id, 'https://example.com', 'Example', folder1.id);

      // Check in folder2
      const duplicate = await duplicationDetector.checkDuplicate(workspace.id, 'https://example.com', folder2.id);

      expect(duplicate).toBeNull();  // Different folder
    });
  });
});
```

### 9.2. Tests d'intégration

**Focus areas**:
1. **Workspace-Tab sync**: Item creation → tab opening → persistence
2. **Crash recovery**: Kill process → restart → verify session restored
3. **CEF integration**: Multi-webview creation, navigation, events
4. **MarkText integration**: Note creation, editing, autosave

**Example integration test**:
```typescript
// workspace-tab-sync.integration.test.ts
describe('Workspace-Tab Synchronization', () => {
  it('should create item when navigating to new URL', async () => {
    const app = await launchElectronApp();

    // Create workspace
    const workspace = await app.invoke('workspace:create', 'Test');

    // Open tab and navigate
    const tab = await app.invoke('tab:open-blank');
    await app.invoke('tab:navigate', tab.id, 'https://example.com');

    // Wait for load
    await app.waitForEvent('tab:load-complete');

    // Verify item created
    const items = await app.invoke('workspace:get-items', workspace.id);
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe('https://example.com');
    expect(items[0].type).toBe('web');
  });

  it('should restore tabs after crash', async () => {
    const app = await launchElectronApp();

    // Setup: create workspace with 3 tabs
    const workspace = await app.invoke('workspace:create', 'Test');
    await app.invoke('tab:open-url', 'https://a.com');
    await app.invoke('tab:open-url', 'https://b.com');
    await app.invoke('tab:open-url', 'https://c.com');

    // Verify 3 tabs
    const tabs = await app.invoke('tab:get-all');
    expect(tabs).toHaveLength(3);

    // Force crash (kill process)
    await app.kill();

    // Relaunch
    const app2 = await launchElectronApp();

    // Wait for restoration
    await app2.waitForEvent('session:restored');

    // Verify tabs restored
    const restoredTabs = await app2.invoke('tab:get-all');
    expect(restoredTabs).toHaveLength(3);
    expect(restoredTabs.map(t => t.url)).toEqual([
      'https://a.com',
      'https://b.com',
      'https://c.com'
    ]);
  });
});
```

### 9.3. Tests UI automatisés

**Playwright E2E tests**:
```typescript
// e2e/workspace-creation.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test('should create workspace and add items', async () => {
  // Launch app
  const app = await electron.launch({ args: ['main.js'] });
  const window = await app.firstWindow();

  // Create workspace
  await window.click('text=File');
  await window.click('text=New Workspace');
  await window.fill('[placeholder="Workspace name"]', 'My Project');
  await window.click('text=Create');

  // Verify workspace created
  await expect(window.locator('.workspace-name')).toHaveText('My Project');

  // Create folder
  await window.click('[title="New Folder"]');
  await window.fill('[placeholder="Folder name"]', 'Chapter 1');
  await window.press('[placeholder="Folder name"]', 'Enter');

  // Verify folder appears in tree
  await expect(window.locator('.folder-node', { hasText: 'Chapter 1' })).toBeVisible();

  // Create note
  await window.click('text=Chapter 1');
  await window.click('[title="New Note"]');
  await window.fill('[placeholder="Note name"]', 'Introduction');
  await window.press('[placeholder="Note name"]', 'Enter');

  // Verify note tab opens
  await expect(window.locator('.tab', { hasText: 'Introduction' })).toBeVisible();

  // Type in note
  await window.locator('.markdown-editor').fill('# Hello World\n\nThis is my note.');

  // Wait for autosave (500ms)
  await window.waitForTimeout(600);

  // Verify saved indicator
  await expect(window.locator('.save-indicator')).toContainText('Saved at');
});
```

### 9.4. Tests multi-plateformes

**Strategy**: Matrix CI/CD (Win, Mac, Linux)

**Platform-specific tests**:
```typescript
// platform-specific.test.ts
describe('Platform-specific behavior', () => {
  it('should use correct data directory', () => {
    const userDataPath = app.getPath('userData');

    if (process.platform === 'win32') {
      expect(userDataPath).toContain('AppData\\Roaming');
    } else if (process.platform === 'darwin') {
      expect(userDataPath).toContain('Library/Application Support');
    } else {
      expect(userDataPath).toContain('.config');
    }
  });

  it('should handle file paths with platform separators', () => {
    const notePath = getNoteFilePath('test-note-id');

    if (process.platform === 'win32') {
      expect(notePath).toContain('\\');
    } else {
      expect(notePath).toContain('/');
    }
  });
});
```

**GitHub Actions matrix**:
```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

### 9.5. Tests crash recovery

**Specific test suite**:
```typescript
// crash-recovery.test.ts
describe('Crash Recovery', () => {
  it('should detect unclean shutdown', async () => {
    const app = await launchElectronApp();

    // Create running flag
    const flagPath = path.join(app.getPath('userData'), 'running.flag');
    expect(await fileExists(flagPath)).toBe(true);

    // Force crash (kill -9)
    await app.kill(9);

    // Relaunch
    const app2 = await launchElectronApp();

    // Verify crash detected
    const logs = await app2.getLogs();
    expect(logs).toContain('Unclean shutdown detected');
  });

  it('should restore session state after crash', async () => {
    // Already covered in integration tests
  });

  it('should repair orphaned items', async () => {
    const app = await launchElectronApp();

    // Create corrupted state
    await app.invoke('db:execute', `
      INSERT INTO items (id, workspace_id, folder_id, type, title, created_at)
      VALUES ('orphan-item', 'workspace-1', 'nonexistent-folder', 'web', 'Orphan', ${Date.now()})
    `);

    // Restart app (integrity check)
    await app.restart();

    // Verify item moved to root
    const item = await app.invoke('item:get', 'orphan-item');
    expect(item.folderId).toBeNull();  // Moved to root
  });
});
```

---

## 10. Stratégie DevOps / Build

### 10.1. CI/CD multi-plateforme

**GitHub Actions workflow** (déjà dans plan.md section 10):
```yaml
# .github/workflows/build.yml
name: Build & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [20]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        run: npm run test:integration

      - name: E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build CEF native addon
        run: npm run build:cef

      - name: Build Electron app
        run: npm run build

      - name: Package app
        run: npm run package
        env:
          # Code signing
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: workspace-navigator-${{ matrix.os }}
          path: dist/*.{exe,dmg,AppImage,deb,zip}
```

### 10.2. Builds reproductibles

**Lock dependencies**:
```bash
# Use exact versions
npm install --save-exact

# Commit lock files
git add package-lock.json
git commit -m "Lock dependencies"
```

**Docker build environment** (optional, for reproducibility):
```dockerfile
# Dockerfile.build
FROM node:20-bullseye

# Install CEF build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    g++ \
    libgtk-3-dev \
    libnotify-dev \
    libnss3-dev \
    libxss1 \
    libxtst-dev \
    xvfb

WORKDIR /app

# Copy deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build:cef
RUN npm run build
RUN npm run package

# Output to /app/dist
```

**Usage**:
```bash
docker build -f Dockerfile.build -t workspace-navigator-builder .
docker run --rm -v $(pwd)/dist:/app/dist workspace-navigator-builder
```

### 10.3. Packaging / distribution

**electron-builder config**:
```json
// electron-builder.json
{
  "appId": "com.workspacenav.app",
  "productName": "Workspace Navigator",
  "copyright": "Copyright © 2025",

  "directories": {
    "output": "dist",
    "buildResources": "build"
  },

  "files": [
    "dist-electron/**/*",
    "dist-renderer/**/*",
    "node_modules/**/*",
    "!node_modules/**/test/**",
    "!node_modules/**/.bin"
  ],

  "extraResources": [
    {
      "from": "cef-native/build/Release",
      "to": "cef-binary",
      "filter": ["*.dll", "*.so", "*.dylib", "*.pak", "*.bin", "locales/**/*"]
    }
  ],

  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico",
    "sign": "./scripts/sign-windows.js"
  },

  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },

  "mac": {
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "category": "public.app-category.productivity",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist"
  },

  "dmg": {
    "contents": [
      { "x": 130, "y": 220 },
      { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
    ]
  },

  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icon.png",
    "category": "Utility",
    "synopsis": "AI-powered workspace navigator"
  },

  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "workspace-navigator"
  }
}
```

### 10.4. Gestion des dépendances CEF

**Download CEF binaries** (automated):
```bash
# scripts/download-cef.sh
#!/bin/bash

CEF_VERSION="120.1.10"
PLATFORM=$(uname -s)

if [ "$PLATFORM" == "Linux" ]; then
  CEF_URL="https://cef-builds.spotifycdn.com/cef_binary_${CEF_VERSION}+g3ce3184+chromium-120.0.6099.129_linux64.tar.bz2"
elif [ "$PLATFORM" == "Darwin" ]; then
  CEF_URL="https://cef-builds.spotifycdn.com/cef_binary_${CEF_VERSION}+g3ce3184+chromium-120.0.6099.129_macosx64.tar.bz2"
else
  # Windows
  CEF_URL="https://cef-builds.spotifycdn.com/cef_binary_${CEF_VERSION}+g3ce3184+chromium-120.0.6099.129_windows64.tar.bz2"
fi

echo "Downloading CEF ${CEF_VERSION} for ${PLATFORM}..."
curl -L "$CEF_URL" -o cef.tar.bz2

echo "Extracting..."
tar -xjf cef.tar.bz2

echo "CEF downloaded to cef-native/cef"
```

**package.json scripts**:
```json
{
  "scripts": {
    "install:cef": "bash scripts/download-cef.sh",
    "build:cef": "cmake cef-native && cmake --build cef-native/build --config Release",
    "build": "webpack --config webpack.config.js",
    "package": "electron-builder",
    "dev": "electron ."
  }
}
```

---

## 11. Stratégie de sécurité

### 11.1. Confinement js → native

**Principe**: Isolation stricte entre renderer (untrusted) et main (trusted)

**contextIsolation enabled**:
```typescript
// main/index.ts
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,  // OBLIGATOIRE
    nodeIntegration: false,  // OBLIGATOIRE
    sandbox: true,           // Sandbox renderer
    preload: path.join(__dirname, 'preload.js')
  }
});
```

**Preload script** (bridge sécurisé):
```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose SEULEMENT méthodes whitelistées
contextBridge.exposeInMainWorld('api', {
  // Workspace
  workspace: {
    create: (name: string) => ipcRenderer.invoke('workspace:create', name),
    open: (id: string) => ipcRenderer.invoke('workspace:open', id),
    getItems: (workspaceId: string) => ipcRenderer.invoke('workspace:get-items', workspaceId)
  },

  // Tabs
  tabs: {
    open: (itemId: string) => ipcRenderer.invoke('tab:open', itemId),
    close: (tabId: string) => ipcRenderer.invoke('tab:close', tabId)
  },

  // Events (unidirectional)
  on: (channel: string, callback: Function) => {
    const validChannels = ['tab:opened', 'tab:closed', 'item:created'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
});

// Renderer ne peut PAS accéder directement à:
// - require()
// - process
// - fs
// - child_process
// - etc.
```

**Renderer usage**:
```typescript
// renderer/services/WorkspaceService.ts
export class WorkspaceService {
  async createWorkspace(name: string): Promise<Workspace> {
    // Via bridge sécurisé uniquement
    return window.api.workspace.create(name);
  }
}

// PAS d'accès direct à require, fs, etc.
```

### 11.2. CEF sandbox

**Déjà couvert section 2.2**

**Résumé**:
- Sandbox TOUJOURS enabled (`no_sandbox = false`)
- Validation au démarrage (fail-fast si sandbox impossible)
- Process isolation (renderer, GPU, network subprocesses)

### 11.3. Validation intégrité workspace

**Déjà couvert section 4.4**

**Checklist validation**:
- [ ] Workspace exists in DB
- [ ] All FKs valid (no orphaned items/folders)
- [ ] Schema version matches current
- [ ] No NULL violations in NOT NULL columns
- [ ] JSON fields parseable (tags, settings)
- [ ] Note files exist for all note items

### 11.4. Isolation IA / web externe

**Principe**: AI webview complètement isolée

**Isolation levels**:
1. **Process isolation**: AI webview dans process séparé (si possible)
2. **Cache isolation**: Cache path dédié par provider
3. **Cookie isolation**: Cookies AI != cookies tabs
4. **Code isolation**: Pas d'accès au Workspace Engine depuis AI webview
5. **Network isolation**: AI webview ne peut PAS faire requêtes vers localhost (future CSP)

**Future CSP pour AI panel**:
```typescript
// V2: Restreindre AI webview
const aiCSP = [
  "default-src 'self' https://chat.openai.com https://claude.ai https://gemini.google.com",
  "connect-src 'self' https://*.openai.com https://*.anthropic.com https://*.google.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Requis pour apps IA
  "frame-src 'none'",
  "object-src 'none'"
].join('; ');
```

---

## 12. Plan d'implémentation en phases

### 12.1. MVP (4 semaines, 2 développeurs)

**Objectif**: Valider proposition de valeur core

**Modules MVP**:
- ✅ Foundation (project setup, build system)
- ✅ CEF Engine (basic integration, single webview)
- ✅ Storage Layer (SQLite, basic CRUD)
- ✅ Workspace Engine (single workspace, folders, items)
- ✅ Tab Manager (basic tabs, open/close)
- ✅ MarkText Integration (basic editor, no autosave)
- ✅ AI Panel (ChatGPT only, fixed)
- ✅ UI (3 columns, basic components)

**Features MVP**:
- Créer 1 workspace
- Naviguer web (pages ouvertes → items auto-créés)
- Créer notes Markdown
- Organiser en folders (manual)
- Tabs (ouvrir, fermer, switch)
- AI panel (ChatGPT fixe)
- Persistance basic (workspace + items saved)

**Exclusions MVP**:
- Multi-workspace switching
- Auto date folders
- URL duplication detection
- Autosave debounced
- Crash recovery
- Tab limit warnings
- Themes, search, tags, drag-drop

**Timeline MVP**:
- Week 1: Foundation + CEF basic
- Week 2: Storage + Workspace Engine
- Week 3: Tabs + MarkText + AI panel
- Week 4: UI + Integration + Tests

### 12.2. V1 (12 semaines total = MVP + 8 semaines)

**Objectif**: Version complète selon spec.md

**Features ajoutées post-MVP**:
- ✅ Multi-workspace management
- ✅ Auto date folders (Option B)
- ✅ URL duplication (Option B)
- ✅ Autosave 500ms (Option B)
- ✅ Crash recovery complet (Option C)
- ✅ Tab limit warning 20 (Option C)
- ✅ CEF webview pooling
- ✅ Advanced organization (tags, search, rename, drag-drop)
- ✅ AI provider selector (ChatGPT, Claude, Gemini, custom)
- ✅ Themes (light/dark)
- ✅ Keyboard shortcuts
- ✅ Cross-platform builds (Win, Mac, Linux)
- ✅ Full test suite (70%+ coverage)

**Timeline V1** (8 semaines post-MVP):
- Week 5-6: Multi-workspace + Auto features (date folders, duplication)
- Week 7-8: Crash recovery + Autosave + Tab limits
- Week 9-10: Advanced org (search, tags, drag-drop) + Polish UI
- Week 11: Cross-platform builds + DevOps
- Week 12: QA, docs, release prep

### 12.3. V2 (6 mois post-V1)

**Features futures**:
- ☁️ Cloud sync (optional, opt-in)
- 👥 Collaborative workspaces
- 📤 Export/import (JSON, HTML, Markdown)
- 🔌 Plugin system
- 📱 Mobile companion app (view-only)
- 🔍 Advanced search (filters, saved searches)
- 🤖 AI context sharing (send selected text to AI)
- 📊 Workspace statistics
- 🌐 Offline mode enhancements (cache pages locally)
- ✨ Advanced Markdown (diagrams, math)

**Prioritization V2**:
1. Cloud sync (most requested)
2. Export/import (compatibility)
3. AI context sharing (UX improvement)
4. Plugin system (extensibility)

---

## Conclusion

Cette stratégie d'implémentation fournit un plan détaillé, actionnable et aligné sur tous les documents du projet (constitution, spec, clarifications, plan, tasks).

**Points clés**:
- Architecture hybride Electron + CEF native optimisée pour performance
- Toutes les clarifications (Options B et C) intégrées dans la stratégie
- Sécurité prioritaire (sandbox CEF, encryption, isolation)
- Crash recovery robuste (Option C: full session restore)
- Phased approach: MVP → V1 → V2 avec dates claires
- Tests exhaustifs (70%+ coverage) + CI/CD multi-plateforme

**Prêt pour implémentation**: Une équipe peut commencer immédiatement avec:
1. Tasks.md (liste exhaustive des tâches)
2. Ce document (stratégie technique)
3. Plan.md (architecture détaillée)
4. Spec.md (requirements)

**Next steps**:
1. Setup repository + CI/CD
2. Begin MVP Sprint 1 (Foundation + CEF)
3. Follow tasks.md séquence
4. Iterate avec feedback utilisateur
