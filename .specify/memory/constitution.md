<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0
Rationale: Initial constitution establishing core governance principles for Workspace Navigator

Modified Principles: N/A (initial version)

Added Sections:
- Core Principles (6 principles: Security, Performance, Code Quality, Technical Standards, User Experience, Maintainability)
- Performance Standards
- Development Workflow
- Governance

Removed Sections: N/A (initial version)

Templates Status:
- ✅ plan-template.md: Compatible - Constitution Check section will be populated with these principles
- ✅ spec-template.md: Compatible - Requirements and success criteria align with UX and performance principles
- ✅ tasks-template.md: Compatible - Task categorization supports all principle-driven task types

Follow-up TODOs:
- None - all placeholders filled

Last Updated: 2025-11-22
-->

# Workspace Navigator Constitution

## Core Principles

### I. Security & Privacy

The Workspace Navigator MUST protect user data and maintain strict isolation boundaries:

- CEF instances MUST run with sandbox enabled and isolated from each other
- Local storage MUST use SQLite with encryption at rest
- NO user data transmission to external servers (all processing local-only)
- Official AI provider pages accessed directly without data interception or modification
- Untrusted scripts MUST be blocked via CEF content security policies and sandboxing
- All third-party dependencies MUST be audited for security vulnerabilities

**Rationale**: As a desktop application handling user browsing data, notes, and workspace organization, maintaining user privacy and preventing data leaks is non-negotiable. The application processes sensitive information locally and must never become a data collection vector.

### II. Performance Standards (NON-NEGOTIABLE)

Performance targets are strictly enforced to maintain user productivity:

- Application launch MUST complete in under 2 seconds (cold start)
- New tab creation MUST complete in under 200 milliseconds
- Memory consumption MUST be optimized through webview instance reuse
- Workspace elements MUST use internal caching to minimize I/O overhead
- Cross-platform builds (Windows/macOS/Linux) MUST maintain consistent performance profiles

**Rationale**: Performance directly impacts user productivity. A sluggish IDE-style application disrupts flow state and creates friction in daily workflows. These hard limits ensure the application remains a productivity tool rather than an impediment.

### III. Code Quality & Architecture

Code organization and quality standards maintain long-term project health:

- Architecture MUST be modular with clear separation: workspace management, tab management, AI integration, storage layer, CEF engine
- Internal documentation MUST be complete for all public APIs and architectural decisions
- Code review REQUIRED for all module changes before merge
- Test coverage MUST exceed 70% (unit + integration tests combined)
- Naming standards MUST be consistent across the codebase (documented in style guide)

**Rationale**: A complex desktop application with multiple subsystems (CEF, MarkText, workspace hierarchy) requires rigorous architectural discipline to prevent technical debt accumulation and maintain contributor productivity.

### IV. Technical Standards & Compatibility

Cross-platform consistency and adherence to upstream guidelines:

- CEF integration MUST follow official CEF guidelines and multi-webview best practices
- Component architecture MUST follow patterns from modern IDE implementations (VSCode, Cursor, Zed)
- MarkText MUST be integrated as an isolated, sandboxed component without modifications to its core
- Workspace hierarchy MUST use a stable, documented schema with versioning
- Platform compatibility REQUIRED: Windows 10+, macOS 12+, Ubuntu 20.04+ (LTS distributions)

**Rationale**: Upstream compatibility with CEF and MarkText reduces maintenance burden. Cross-platform support requires architectural decisions that work consistently across operating systems. IDE patterns provide proven UX models.

### V. User Experience Principles

Interface design follows established IDE conventions for familiarity:

- Three-column layout (workspace explorer, center content, AI assistant) MUST be preserved
- AI column MUST be persistently visible and non-collapsible
- Workspace MUST support full drag-and-drop reorganization of folders and items
- Daily folders MUST be created automatically with YYYY-MM-DD naming
- Any workspace item (page, note) MUST be reopenable instantly from history
- Keyboard shortcuts and quick actions MUST be discoverable and consistent

**Rationale**: Users coming from Cursor, Zed, or VSCode expect familiar patterns. The three-column layout with persistent AI access is the core differentiator. Workspace manipulation fluidity directly correlates with user adoption.

### VI. Maintainability & Long-term Health

Design for maintainability and sustainable development velocity:

- Data layer, UI layer, and CEF engine MUST be strictly separated (no cross-layer leakage)
- Dependencies MUST be minimal and reviewed quarterly for updates/vulnerabilities
- Logging MUST capture user actions and CEF errors with structured format (JSON logs)
- Workspace files MUST be version-controlled and support migration between schema versions
- All architectural changes MUST be documented with rationale and migration plan (ADRs)
- Refactoring cycles REQUIRED quarterly to address accumulated technical debt

**Rationale**: Desktop applications have long lifecycles. CEF updates, OS changes, and dependency evolution require a maintainable foundation. Clear separation enables parallel development and reduces change risk.

## Performance Standards

### Measurement & Enforcement

Performance metrics MUST be validated in CI/CD pipeline:

- **Launch time**: Measured from process start to main window interactive (< 2s target)
- **Tab creation**: Measured from user action to webview loaded (< 200ms target)
- **Memory baseline**: Measured with 10 open tabs and 100 workspace items (document baseline in README)
- **Platform parity**: All metrics validated on Windows, macOS, and Ubuntu reference systems

Performance regressions blocking merge if targets exceeded by >20%.

### Optimization Strategies

- **Lazy loading**: Workspace tree rendered incrementally; webviews initialized on-demand
- **Resource pooling**: Reuse CEF webview instances for similar content types
- **Caching**: Workspace metadata cached in-memory; file content cached per session
- **Platform-native**: Use platform-specific optimizations where available (no compromises for uniformity)

## Development Workflow

### Code Review Requirements

All changes MUST pass review gate:

- **Modularity check**: Change isolated to single architectural component unless justified
- **Test coverage**: New code >70% covered; modified code maintains existing coverage
- **Documentation**: Public APIs documented; architectural changes include ADR
- **Security review**: Changes touching CEF integration, storage layer, or external content require security-focused review
- **Performance validation**: Changes to critical path (launch, tab creation, workspace operations) require benchmark comparison

### Testing Discipline

Tests validate behavior without over-specification:

- **Unit tests**: Component behavior in isolation (pure functions, class methods)
- **Integration tests**: Cross-component workflows (workspace → storage, CEF → tabs)
- **Contract tests**: MarkText integration, CEF API surface, workspace schema
- **Platform tests**: Critical paths validated on all supported platforms (Windows/macOS/Linux)

Tests MUST NOT require specific implementation approaches (test behavior, not internals).

### Versioning & Releases

Workspace Navigator follows semantic versioning:

- **MAJOR**: Breaking workspace schema changes, platform support removal, architecture rewrites
- **MINOR**: New features (panels, workspace capabilities, AI integrations), backward-compatible schema additions
- **PATCH**: Bug fixes, performance improvements, dependency updates

Migration tooling REQUIRED for MAJOR version workspace schema changes.

## Governance

### Amendment Process

This constitution governs all architectural and quality decisions:

1. Proposed amendments MUST include rationale and impact analysis (affected components, migration cost)
2. Amendments REQUIRE approval from project maintainers (simple majority)
3. Breaking changes (removing/weakening principles) REQUIRE migration plan and user communication
4. All amendments MUST update this document with version increment and changelog

### Compliance & Review

- All pull requests MUST verify compliance with applicable principles (checklist in PR template)
- Complexity additions MUST be justified against simpler alternatives (documented in PR or ADR)
- Quarterly constitution review to assess principle relevance and effectiveness
- Annual architecture health check against principles (identify accumulated violations)

### Relationship to Other Guidance

- Constitution principles supersede convenience and short-term velocity
- Technical decisions conflicting with principles MUST be justified and documented as exceptions
- Persistent exceptions indicate need for constitutional amendment (not continued violation)

**Version**: 1.0.0 | **Ratified**: 2025-11-22 | **Last Amended**: 2025-11-22
