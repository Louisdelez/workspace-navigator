# Contributing to Workspace Navigator

Thank you for your interest in contributing to Workspace Navigator! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

---

## Getting Started

### Prerequisites

- **Node.js** 20.x LTS or higher
- **npm** 10.x or higher
- **Git** 2.40 or higher

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/workspace-navigator.git
   cd workspace-navigator
   ```
3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/workspace-navigator.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Rebuild Native Modules

```bash
npx electron-rebuild
```

### Start Development Server

```bash
npm run electron:dev
```

This starts:
- Vite dev server with hot reload
- TypeScript compilation in watch mode
- Electron application

### Verify Setup

```bash
npm run build
npm test -- --run
```

---

## Making Changes

### Branch Naming

Create a branch for your changes:

```bash
git checkout -b type/description
```

Branch types:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

Examples:
- `feature/export-workspace`
- `fix/tab-close-crash`
- `docs/api-reference`

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

Examples:
```
feat(workspace): add export functionality

- Add export to JSON option
- Support folder structure export
- Include item metadata

Closes #123
```

```
fix(tabs): prevent crash when closing last tab

The app crashed when closing the last tab because
activeTabId wasn't being reset. Added null check.

Fixes #456
```

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use explicit return types for functions
- Use interfaces over type aliases for objects
- Document public APIs with TSDoc comments

```typescript
/**
 * Creates a new workspace with the given name.
 * @param name - Workspace name (1-100 characters)
 * @returns The created workspace
 * @throws Error if name is invalid
 */
async function createWorkspace(name: string): Promise<Workspace> {
  // Implementation
}
```

### React

- Use functional components with hooks
- Keep components focused and small
- Use meaningful component and prop names
- Memoize expensive computations

```typescript
interface TabProps {
  tab: Tab;
  isActive: boolean;
  onClose: (id: string) => void;
  onSelect: (id: string) => void;
}

const Tab: React.FC<TabProps> = ({ tab, isActive, onClose, onSelect }) => {
  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  }, [tab.id, onClose]);

  return (
    <div
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(tab.id)}
    >
      <span className="tab-title">{tab.title}</span>
      <button className="tab-close" onClick={handleClose}>×</button>
    </div>
  );
};
```

### CSS

- Use CSS modules or scoped styles
- Follow BEM naming convention
- Use CSS custom properties for theming
- Keep specificity low

```css
/* Component styles */
.tab {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
}

.tab--active {
  background: var(--bg-primary);
}

.tab__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab__close {
  opacity: 0;
  transition: opacity 0.2s;
}

.tab:hover .tab__close {
  opacity: 1;
}
```

### Formatting

Run before committing:

```bash
npm run lint
npm run format
```

ESLint and Prettier are configured to enforce consistent style.

---

## Testing

### Running Tests

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run)
npm test -- --run

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Writing Tests

#### Unit Tests (Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceEngine } from '../workspace-engine';

describe('WorkspaceEngine', () => {
  let engine: WorkspaceEngine;
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = {
      createWorkspace: vi.fn(),
      getAllWorkspaces: vi.fn().mockReturnValue([]),
    };
    engine = new WorkspaceEngine(mockDatabase);
  });

  describe('createWorkspace', () => {
    it('should create workspace with valid name', async () => {
      const workspace = await engine.createWorkspace('Test');

      expect(mockDatabase.createWorkspace).toHaveBeenCalled();
      expect(workspace.name).toBe('Test');
    });

    it('should throw error for empty name', async () => {
      await expect(engine.createWorkspace('')).rejects.toThrow();
    });
  });
});
```

#### E2E Tests (Playwright)

```typescript
import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Workspace Management', () => {
  test('should create new workspace', async () => {
    const app = await electron.launch({ args: ['.'] });
    const window = await app.firstWindow();

    // Click new workspace button
    await window.click('[data-testid="new-workspace-btn"]');

    // Enter name
    await window.fill('[data-testid="workspace-name-input"]', 'Test Workspace');

    // Submit
    await window.click('[data-testid="create-workspace-btn"]');

    // Verify workspace appears
    await expect(window.locator('[data-testid="workspace-selector"]'))
      .toContainText('Test Workspace');

    await app.close();
  });
});
```

### Test Coverage

Aim for:
- **80%+** coverage for business logic (`src/core/`)
- **70%+** coverage for UI components
- **100%** coverage for utility functions

---

## Submitting Changes

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm test -- --run
   npm run build
   ```

3. **Update documentation** if needed

### Pull Request Process

1. Push your branch:
   ```bash
   git push origin feature/your-feature
   ```

2. Create Pull Request on GitHub

3. Fill out the PR template:
   - Description of changes
   - Related issues
   - Screenshots (for UI changes)
   - Testing performed

4. Request review from maintainers

5. Address feedback and update PR

6. Once approved, squash and merge

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Commits follow conventional format
- [ ] No console.log or debug code
- [ ] No hardcoded values that should be configurable
- [ ] Accessibility considered (for UI changes)

---

## Issue Guidelines

### Reporting Bugs

Include:
1. **Environment**: OS, Node.js version, app version
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots/logs**: If applicable
6. **Workarounds**: If you found any

### Requesting Features

Include:
1. **Problem statement**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Use cases**: Who benefits and how?

### Labels

Issues are labeled for organization:
- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority:high` - Critical issues
- `wontfix` - Won't be addressed

---

## Architecture Overview

Before contributing, familiarize yourself with:

- [Architecture Guide](docs/ARCHITECTURE.md) - System design
- [API Reference](docs/API_REFERENCE.md) - Internal APIs
- [Development Guide](specs/001-workspace-navigator/quickstart.md) - Setup details

### Key Directories

```
src/
├── main/          # Electron main process
├── renderer/      # React UI
├── core/          # Business logic
├── preload/       # Preload scripts
└── types/         # TypeScript types
```

### Key Files

- `src/main/index.ts` - Application entry point
- `src/renderer/App.tsx` - React root component
- `src/core/workspace/workspace-engine.ts` - Core business logic
- `src/core/storage/database.ts` - Database operations

---

## Questions?

- Check existing issues and discussions
- Read the documentation
- Open a discussion for general questions
- Open an issue for bugs/features

Thank you for contributing!
