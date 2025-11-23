# Feature Specification: Workspace Navigator

**Feature Branch**: `001-workspace-navigator`
**Created**: 2025-11-22
**Status**: Draft
**Input**: User description: "Create Workspace Navigator - cross-platform desktop app combining web browser, Markdown editor, and AI assistant in IDE-style workspace"

## Clarifications

### Session 2025-11-22

- Q: When a user navigates to a URL that already exists as an item in the current workspace, what should happen? → A: Check if URL exists: if opened today in same folder, focus existing tab; otherwise create new item
- Q: When exactly should the automatic date folder be created, and what happens when users manually organize some items but not others? → A: Create date folder for each new item that is added to workspace root (not in any folder); skip if user drags item to a folder
- Q: Should there be a hard limit on the number of simultaneously open tabs, and how should the system handle exceeding that limit? → A: Soft limit of 20 tabs; show warning when exceeded but allow opening more (items always accessible from workspace)
- Q: How frequently should Markdown notes be auto-saved, and should users receive any indication that saving has occurred? → A: Debounced save after 500ms of inactivity; show subtle "Saved at HH:MM:SS" timestamp
- Q: When the application crashes or is forcibly closed, what should happen to open tabs and unsaved workspace state upon restart? → A: Full session restore: reopen last active workspace with all previously open tabs in same state; validate workspace integrity first

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Workspace with Web Navigation (Priority: P1)

As a user, I want to create a workspace where every web page I visit is automatically saved as an item in a hierarchical structure, so I can maintain a persistent, organized browsing history that never loses information.

**Why this priority**: This is the foundational value proposition - transforming ephemeral web browsing into persistent, organized knowledge management. Without this, the application has no differentiation from existing tools.

**Independent Test**: Can be fully tested by creating a workspace, opening multiple web pages, organizing them into folders, closing the application, reopening it, and verifying all pages are preserved and can be reopened instantly.

**Acceptance Scenarios**:

1. **Given** no workspace exists, **When** user creates a new workspace named "Research Project", **Then** an empty workspace with that name is created and displayed in the left panel
2. **Given** an active workspace, **When** user opens a web page (e.g., google.com), **Then** a web item with URL, title, and favicon is automatically created in the workspace
3. **Given** multiple web items in a workspace, **When** user creates a folder named "Chapter 1" and drags 5 web items into it, **Then** those items are organized under that folder
4. **Given** a workspace with no folders, **When** user opens a web page on 2025-11-22, **Then** a folder named "22.11.2025" is automatically created at workspace root and the new item is placed there
5. **Given** a workspace with 30 saved web items, **When** user clicks on any saved item in the left panel, **Then** that page opens immediately in a new tab in the center area
6. **Given** an open workspace with saved items, **When** user closes and reopens the application, **Then** all workspace structure, folders, and items are preserved exactly as before

---

### User Story 2 - Markdown Note Creation and Management (Priority: P2)

As a student, I want to create Markdown notes directly in the application and organize them alongside my web research in the same workspace hierarchy, so I can keep related content together.

**Why this priority**: Note-taking complements web research and enables the "replace Chrome + Notion" value proposition. This is independent of web navigation but builds on the workspace foundation.

**Independent Test**: Can be tested independently by creating a workspace, adding multiple Markdown notes with content, organizing them in folders, and verifying they persist and can be edited across sessions.

**Acceptance Scenarios**:

1. **Given** an active workspace, **When** user creates a new Markdown note, **Then** a note item is added to the workspace and opens in an editor tab in the center area
2. **Given** an open Markdown note, **When** user types Markdown content and sees live preview, **Then** content is automatically saved to the workspace
3. **Given** saved notes and web items, **When** user organizes them in the same folder structure, **Then** both types coexist in the hierarchy
4. **Given** a Markdown note item in the workspace, **When** user clicks it, **Then** the note opens in an editable tab with previously saved content intact
5. **Given** a workspace with notes in folders, **When** user renames, moves, or tags notes, **Then** organizational changes persist across sessions

---

### User Story 3 - Persistent AI Assistant Panel (Priority: P3)

As a user, I want a permanently visible AI assistant (ChatGPT, Claude, or Gemini) in the right panel using my existing accounts, so I can get help understanding content or refining ideas without switching applications.

**Why this priority**: The always-visible AI differentiates from browser extensions and aligns with the IDE-inspired layout. However, core workspace and content management must work first.

**Independent Test**: Can be tested independently by selecting an AI provider from a dropdown, verifying the AI web interface loads in the right panel, confirming it persists across workspace changes, and validating user can interact with their existing AI accounts.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** user selects "ChatGPT" from the AI provider selector, **Then** chat.openai.com loads in the right panel and remains visible
2. **Given** an AI provider is loaded, **When** user switches between different center tabs (web or notes), **Then** the AI panel remains visible and does not reload
3. **Given** the AI panel is visible, **When** user logs into their ChatGPT/Claude/Gemini account, **Then** their session persists across application restarts
4. **Given** the application is open, **When** user changes AI provider from ChatGPT to Claude, **Then** the right panel loads the new AI interface
5. **Given** the AI panel is active, **When** user interacts with the AI interface, **Then** all standard AI features work as they would in a browser (no data interception)

---

### User Story 4 - Advanced Workspace Organization (Priority: P4)

As a researcher, I want to organize workspace items with tags, search through them, move items between folders via drag-and-drop, and rename items, so I can maintain complex organizational schemes.

**Why this priority**: Enhances the core workspace management with power-user features. These are valuable but not essential for initial viable product.

**Independent Test**: Can be tested by creating a workspace with 50+ items, applying various tags, using search to filter items, performing drag-and-drop reorganization, and verifying all organizational features work correctly.

**Acceptance Scenarios**:

1. **Given** a workspace item, **When** user adds tags "important" and "chapter-3", **Then** those tags are saved and visible on the item
2. **Given** a workspace with tagged items, **When** user searches for "chapter-3", **Then** only items with that tag or containing that text are shown
3. **Given** items in different folders, **When** user drags an item from folder A to folder B, **Then** the item moves and the change persists
4. **Given** a web item with auto-generated title, **When** user renames it to "Key Research Paper", **Then** the custom name is saved and displayed
5. **Given** a large workspace, **When** user performs full-text search across all items, **Then** results are returned quickly highlighting matches

---

### User Story 5 - Tab Management (Priority: P5)

As a user, I want to open multiple web pages and notes as tabs in the center area, close tabs without deleting workspace items, and navigate web content with standard browser controls (back, forward, refresh, address bar).

**Why this priority**: Essential for daily workflow but builds on the foundational workspace and content capabilities. Tab management is familiar to users and enhances usability.

**Independent Test**: Can be tested by opening 10+ tabs (mix of web and notes), navigating within web tabs using browser controls, closing tabs, and verifying workspace items remain intact.

**Acceptance Scenarios**:

1. **Given** a workspace with saved items, **When** user opens 5 different items, **Then** 5 tabs appear in the center area
2. **Given** an open web tab, **When** user clicks back/forward buttons or refreshes, **Then** browser navigation works as expected
3. **Given** multiple open tabs, **When** user closes 3 tabs, **Then** those tabs close but the items remain in the workspace hierarchy
4. **Given** a web tab is active, **When** user types a new URL in the address bar and presses Enter, **Then** the page loads and a new workspace item is created
5. **Given** multiple tabs are open, **When** user switches between tabs, **Then** each tab retains its state (scroll position, form data, etc.)

---

### User Story 6 - Multi-Workspace Management (Priority: P6)

As a user, I want to create multiple separate workspaces (e.g., "Work", "Personal", "Course A", "Course B"), switch between them, and delete workspaces I no longer need, so I can maintain separate contexts.

**Why this priority**: Powerful organizational feature for advanced users managing multiple projects. Not required for MVP but important for scalability.

**Independent Test**: Can be tested by creating 3 workspaces with different names, populating each with unique items, switching between them, verifying isolation, and deleting one workspace.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** user creates workspaces named "Work" and "Personal", **Then** both appear in a workspace switcher
2. **Given** multiple workspaces exist, **When** user switches from "Work" to "Personal", **Then** the left panel shows only "Personal" workspace items
3. **Given** an active workspace, **When** user deletes it, **Then** the workspace and all its items are removed (with confirmation dialog)
4. **Given** multiple workspaces, **When** user opens different items in each workspace, **Then** each workspace maintains its own independent state
5. **Given** a workspace with items, **When** user reopens the application, **Then** the last active workspace is restored

---

### Edge Cases

- What happens when a user opens 100+ tabs simultaneously? (Soft limit of 20 tabs with warning shown when exceeded; users can continue opening tabs but are notified of performance implications; all items remain accessible from workspace)
- How does the system handle web pages that fail to load or return errors? (Display error state, allow retry, preserve item in workspace)
- What happens when a user tries to delete a folder containing items? (Confirmation dialog, option to delete items or move them)
- How does the system handle very long page titles or URLs? (Truncate display with tooltip showing full text)
- What happens when offline? (Workspace operations work, web navigation shows offline state, AI panel unavailable)
- How does the system handle duplicate items (same URL opened multiple times)? (If URL exists and was opened today in same folder, focus existing tab; otherwise create new item to preserve temporal context)
- What happens when a Markdown note has unsaved changes and user closes the tab? (500ms debounced auto-save prevents data loss; maximum 500ms of recent typing could be lost if tab closed immediately)
- How does the system handle workspace files being corrupted or deleted externally? (Detect corruption, attempt recovery, notify user)
- What happens when the application crashes or is forcibly terminated? (On restart: validate workspace integrity, restore last active workspace, reopen all previously open tabs in same state)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create, open, and delete workspaces with user-defined names
- **FR-002**: System MUST automatically create a workspace item (web or note type) whenever a tab is opened
- **FR-002a**: System MUST check for duplicate URLs before creating web items: if the same URL exists in the current workspace and was created today in the same folder, focus the existing tab instead of creating a new item; otherwise create a new item
- **FR-003**: System MUST persist all workspace items, folder structure, and organization across application restarts
- **FR-003a**: System MUST save session state (active workspace, open tabs, tab order) continuously during operation
- **FR-003b**: System MUST validate workspace file integrity on startup before restoring session; if corrupted, attempt recovery and notify user
- **FR-003c**: System MUST restore previous session on startup: reopen last active workspace with all previously open tabs in their original state and order
- **FR-004**: System MUST support two item types: Web Items (URL, title, favicon) and Note Items (Markdown content)
- **FR-005**: System MUST automatically create a date-based folder (DD.MM.YYYY format) for each new item added to workspace root; items manually placed in folders skip auto-organization
- **FR-006**: System MUST allow users to create, rename, and delete folders within a workspace
- **FR-007**: System MUST support drag-and-drop movement of items between folders
- **FR-008**: System MUST allow users to rename workspace items with custom titles
- **FR-009**: System MUST support adding multiple tags to each workspace item
- **FR-010**: System MUST provide search functionality across workspace items (titles, tags, content)
- **FR-011**: System MUST open workspace items in tabs in the center area when clicked
- **FR-012**: System MUST allow closing tabs without deleting corresponding workspace items
- **FR-012a**: System MUST display a performance warning when user opens more than 20 tabs simultaneously, but allow continued tab opening without hard limit
- **FR-013**: System MUST provide web navigation controls (back, forward, refresh, address bar) for web tabs
- **FR-014**: System MUST render Markdown content with live preview in note tabs
- **FR-015**: System MUST auto-save Markdown note content with 500ms debounce after user stops typing, and display a "Saved at HH:MM:SS" timestamp indicator
- **FR-016**: System MUST display an AI provider selector with options for ChatGPT, Claude, and Gemini
- **FR-017**: System MUST load selected AI provider's web interface in the right panel
- **FR-018**: System MUST keep AI panel visible and persistent across tab and workspace changes
- **FR-019**: System MUST support standard web browsing (Google, YouTube, articles, PDFs, Google Docs)
- **FR-020**: System MUST implement three-column layout: workspace (left), tabs (center), AI (right)
- **FR-021**: System MUST support light and dark color themes
- **FR-022**: System MUST run on Windows 10+, macOS 12+, and Ubuntu 20.04+
- **FR-023**: System MUST store all data locally with no cloud synchronization
- **FR-024**: System MUST never transmit user workspace data to external servers
- **FR-025**: System MUST maintain application responsiveness with hundreds of workspace items

### Key Entities

- **Workspace**: A container for organized items representing a project or context; has a name, creation date, and hierarchical folder structure
- **Folder**: Organizational unit within a workspace; has a name, parent folder (or root), and contains items or subfolders
- **Item**: Core content unit, either Web Item or Note Item; has title, creation date, parent folder, and optional tags
- **Web Item**: Item type storing URL, page title, favicon, and visit timestamp; represents a saved web page
- **Note Item**: Item type storing Markdown content; represents a user-created note
- **Tag**: Label that can be applied to items for categorization; enables filtering and organization
- **Tab**: Transient UI element in center area displaying content of a web or note item; can be closed without affecting item

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a workspace, add 20 web pages, organize them into folders, close the app, reopen it, and find all content intact in under 30 seconds total
- **SC-002**: Users can open a saved workspace item from the left panel and see it rendered in the center area in under 200 milliseconds
- **SC-003**: Application launches from cold start to usable state in under 2 seconds
- **SC-004**: Users can manage workspaces containing 500+ items without perceiving lag in navigation or search (sub-second response)
- **SC-005**: 90% of target users (students, researchers, content creators) successfully understand the workspace concept and begin organizing content within first 5 minutes of use
- **SC-006**: Users can create a Markdown note, write content, close the tab, and reopen it to find content preserved without manual save action
- **SC-007**: Users can switch between AI providers (ChatGPT, Claude, Gemini) and have the interface load in under 3 seconds
- **SC-008**: System functions identically on Windows, macOS, and Linux with no platform-specific feature gaps
- **SC-009**: Users report the application successfully replaces their workflow of using separate browser + note-taking app + AI chat (measured via user feedback)
- **SC-010**: Zero data loss events - all workspace modifications (item creation, folder moves, renames) persist reliably across sessions

## Assumptions

- Users have active internet connection for web browsing and AI features (offline mode is out of scope for V1)
- Users have existing accounts with AI providers (ChatGPT, Claude, or Gemini)
- Users are familiar with basic IDE or file explorer concepts (folders, hierarchies)
- Web pages will be rendered as-is without reader modes or simplified views in V1
- Markdown editor will use MarkText component with its standard feature set
- Browser engine will use CEF (Chromium Embedded Framework) with standard web compatibility
- Users will primarily use keyboard and mouse (touch/stylus support out of scope for V1)
- Application will store data in user's local application data directory following OS conventions
- Users accept that workspace data is local-only with no cloud backup in V1

## Out of Scope (V1)

The following features are explicitly excluded from the first version:

- API integration with OpenAI, Anthropic, or Google (AI accessed via web interfaces only)
- Cloud synchronization or backup of workspaces
- Collaborative features or workspace sharing between users
- Plugin system or third-party extensions
- Advanced development features (code execution, debugging, terminal)
- Embedded AI models or local AI processing
- Reader mode or article extraction for web pages
- Browser extensions or add-ons
- Mobile applications (iOS/Android)
- Web-based version of the application
- Import/export of workspaces to external formats
- Automation or scripting capabilities
- Integration with external services (Notion, Evernote, etc.)
