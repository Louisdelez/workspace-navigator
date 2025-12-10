/**
 * IPC Validation Tests (T040)
 * Tests Zod schema validation for all IPC inputs
 */

import { describe, it, expect } from 'vitest';
import {
  // Workspace schemas
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceSettingsSchema,

  // Folder schemas
  createFolderSchema,
  moveFolderSchema,

  // Item schemas
  createWebItemSchema,
  createNoteItemSchema,
  updateItemSchema,
  moveItemSchema,
  urlSchema,

  // Tab schemas
  openTabSchema,
  closeTabSchema,
  switchTabSchema,
  navigateTabSchema,
  saveSessionSchema,

  // Search schemas
  searchQuerySchema,
  quickSearchSchema,

  // Tag schemas
  createTagSchema,
  addItemTagsSchema,
  removeItemTagsSchema,
  hexColorSchema,

  // AI schemas
  switchAIProviderSchema,

  // Autosave schemas
  scheduleAutosaveSchema,
  flushAutosaveSchema,

  // Asset schemas
  copyAssetSchema,
  deleteAssetSchema,

  // Base schemas
  uuidSchema,
  timestampSchema,
  nonEmptyStringSchema
} from '../../../src/types/schemas';

// ==================== Base Schema Tests ====================

describe('Base Schemas', () => {
  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(uuidSchema.safeParse(validUuid).success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
      expect(uuidSchema.safeParse('').success).toBe(false);
      expect(uuidSchema.safeParse(123).success).toBe(false);
    });
  });

  describe('timestampSchema', () => {
    it('should accept valid timestamps', () => {
      expect(timestampSchema.safeParse(Date.now()).success).toBe(true);
      expect(timestampSchema.safeParse(1700000000000).success).toBe(true);
    });

    it('should reject invalid timestamps', () => {
      expect(timestampSchema.safeParse(-1).success).toBe(false);
      expect(timestampSchema.safeParse(0).success).toBe(false);
      expect(timestampSchema.safeParse('timestamp').success).toBe(false);
    });
  });

  describe('nonEmptyStringSchema', () => {
    it('should accept non-empty strings and trim them', () => {
      const result = nonEmptyStringSchema.safeParse('  hello  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });

    it('should reject empty strings', () => {
      expect(nonEmptyStringSchema.safeParse('').success).toBe(false);
      expect(nonEmptyStringSchema.safeParse('   ').success).toBe(false);
    });
  });
});

// ==================== Workspace Schema Tests ====================

describe('Workspace Schemas', () => {
  describe('createWorkspaceSchema', () => {
    it('should accept valid workspace creation input', () => {
      const result = createWorkspaceSchema.safeParse({ name: 'My Workspace' });
      expect(result.success).toBe(true);
    });

    it('should trim workspace name', () => {
      const result = createWorkspaceSchema.safeParse({ name: '  My Workspace  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Workspace');
      }
    });

    it('should reject empty name', () => {
      expect(createWorkspaceSchema.safeParse({ name: '' }).success).toBe(false);
      expect(createWorkspaceSchema.safeParse({ name: '   ' }).success).toBe(false);
    });

    it('should reject name exceeding max length', () => {
      const longName = 'a'.repeat(256);
      expect(createWorkspaceSchema.safeParse({ name: longName }).success).toBe(false);
    });
  });

  describe('workspaceSettingsSchema', () => {
    it('should accept valid settings', () => {
      const settings = {
        theme: 'dark',
        defaultAIProvider: 'claude',
        autoDateFolders: true,
        tabSoftLimit: 30,
        autosaveDebounceMs: 1000
      };
      expect(workspaceSettingsSchema.safeParse(settings).success).toBe(true);
    });

    it('should apply defaults for missing values', () => {
      const result = workspaceSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoDateFolders).toBe(true);
        expect(result.data.tabSoftLimit).toBe(20);
        expect(result.data.autosaveDebounceMs).toBe(500);
      }
    });

    it('should reject invalid theme', () => {
      expect(workspaceSettingsSchema.safeParse({ theme: 'invalid' }).success).toBe(false);
    });

    it('should reject invalid AI provider', () => {
      expect(workspaceSettingsSchema.safeParse({ defaultAIProvider: 'invalid' }).success).toBe(false);
    });

    it('should reject tabSoftLimit out of range', () => {
      expect(workspaceSettingsSchema.safeParse({ tabSoftLimit: 0 }).success).toBe(false);
      expect(workspaceSettingsSchema.safeParse({ tabSoftLimit: 101 }).success).toBe(false);
    });
  });
});

// ==================== Folder Schema Tests ====================

describe('Folder Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('createFolderSchema', () => {
    it('should accept valid folder creation input', () => {
      const result = createFolderSchema.safeParse({
        workspaceId: validUuid,
        name: 'My Folder'
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional parentId', () => {
      const result = createFolderSchema.safeParse({
        workspaceId: validUuid,
        name: 'Nested Folder',
        parentId: validUuid
      });
      expect(result.success).toBe(true);
    });

    it('should accept null parentId', () => {
      const result = createFolderSchema.safeParse({
        workspaceId: validUuid,
        name: 'Root Folder',
        parentId: null
      });
      expect(result.success).toBe(true);
    });
  });

  describe('moveFolderSchema', () => {
    it('should accept valid folder move input', () => {
      expect(moveFolderSchema.safeParse({
        folderId: validUuid,
        newParentId: validUuid
      }).success).toBe(true);
    });

    it('should accept null newParentId (move to root)', () => {
      expect(moveFolderSchema.safeParse({
        folderId: validUuid,
        newParentId: null
      }).success).toBe(true);
    });
  });
});

// ==================== Item Schema Tests ====================

describe('Item Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('urlSchema', () => {
    it('should accept valid URLs', () => {
      expect(urlSchema.safeParse('https://example.com').success).toBe(true);
      expect(urlSchema.safeParse('http://localhost:3000').success).toBe(true);
      expect(urlSchema.safeParse('example.com').success).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(urlSchema.safeParse('').success).toBe(false);
      expect(urlSchema.safeParse('not a url at all !!!').success).toBe(false);
    });
  });

  describe('createWebItemSchema', () => {
    it('should accept valid web item creation input', () => {
      const result = createWebItemSchema.safeParse({
        workspaceId: validUuid,
        url: 'https://example.com',
        title: 'Example Page'
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional folderId', () => {
      const result = createWebItemSchema.safeParse({
        workspaceId: validUuid,
        url: 'https://example.com',
        title: 'Example',
        folderId: validUuid
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional favicon', () => {
      const result = createWebItemSchema.safeParse({
        workspaceId: validUuid,
        url: 'https://example.com',
        title: 'Example',
        favicon: 'data:image/png;base64,abc123'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createNoteItemSchema', () => {
    it('should accept valid note creation input', () => {
      const result = createNoteItemSchema.safeParse({
        workspaceId: validUuid,
        title: 'My Note'
      });
      expect(result.success).toBe(true);
    });

    it('should apply default empty content', () => {
      const result = createNoteItemSchema.safeParse({
        workspaceId: validUuid,
        title: 'My Note'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('');
      }
    });

    it('should accept markdown content', () => {
      const result = createNoteItemSchema.safeParse({
        workspaceId: validUuid,
        title: 'My Note',
        content: '# Hello World\n\nThis is **markdown**.'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateItemSchema', () => {
    it('should accept partial updates', () => {
      expect(updateItemSchema.safeParse({ title: 'New Title' }).success).toBe(true);
      expect(updateItemSchema.safeParse({ content: 'New content' }).success).toBe(true);
      expect(updateItemSchema.safeParse({ url: 'https://new.com' }).success).toBe(true);
    });

    it('should reject unknown fields', () => {
      expect(updateItemSchema.safeParse({ unknownField: 'value' }).success).toBe(false);
    });
  });

  describe('moveItemSchema', () => {
    it('should accept valid move input', () => {
      expect(moveItemSchema.safeParse({
        itemId: validUuid,
        newFolderId: validUuid
      }).success).toBe(true);
    });

    it('should accept null newFolderId (move to root)', () => {
      expect(moveItemSchema.safeParse({
        itemId: validUuid,
        newFolderId: null
      }).success).toBe(true);
    });
  });
});

// ==================== Tab Schema Tests ====================

describe('Tab Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('openTabSchema', () => {
    it('should accept valid tab open input', () => {
      expect(openTabSchema.safeParse({ itemId: validUuid }).success).toBe(true);
    });
  });

  describe('closeTabSchema', () => {
    it('should accept valid tab close input', () => {
      expect(closeTabSchema.safeParse({ tabId: validUuid }).success).toBe(true);
    });
  });

  describe('switchTabSchema', () => {
    it('should accept valid tab switch input', () => {
      expect(switchTabSchema.safeParse({ tabId: validUuid }).success).toBe(true);
    });
  });

  describe('navigateTabSchema', () => {
    it('should accept valid navigation input', () => {
      expect(navigateTabSchema.safeParse({ url: 'https://example.com' }).success).toBe(true);
    });
  });

  describe('saveSessionSchema', () => {
    it('should accept valid session save input', () => {
      const result = saveSessionSchema.safeParse({
        activeWorkspaceId: validUuid,
        openTabs: [validUuid],
        activeTabIndex: 0,
        aiProvider: 'claude'
      });
      expect(result.success).toBe(true);
    });

    it('should accept null activeWorkspaceId', () => {
      expect(saveSessionSchema.safeParse({
        activeWorkspaceId: null,
        openTabs: [],
        activeTabIndex: 0,
        aiProvider: 'none'
      }).success).toBe(true);
    });
  });
});

// ==================== Search Schema Tests ====================

describe('Search Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('searchQuerySchema', () => {
    it('should accept valid search query', () => {
      const result = searchQuerySchema.safeParse({
        workspaceId: validUuid,
        query: 'hello world'
      });
      expect(result.success).toBe(true);
    });

    it('should apply default limit', () => {
      const result = searchQuerySchema.safeParse({
        workspaceId: validUuid,
        query: 'test'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should trim query', () => {
      const result = searchQuerySchema.safeParse({
        workspaceId: validUuid,
        query: '  test  '
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('test');
      }
    });

    it('should reject empty query', () => {
      expect(searchQuerySchema.safeParse({
        workspaceId: validUuid,
        query: ''
      }).success).toBe(false);
    });
  });

  describe('quickSearchSchema', () => {
    it('should have lower default limit', () => {
      const result = quickSearchSchema.safeParse({
        workspaceId: validUuid,
        query: 'test'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });
  });
});

// ==================== Tag Schema Tests ====================

describe('Tag Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('hexColorSchema', () => {
    it('should accept valid hex colors', () => {
      expect(hexColorSchema.safeParse('#FF0000').success).toBe(true);
      expect(hexColorSchema.safeParse('#00ff00').success).toBe(true);
      expect(hexColorSchema.safeParse('#0000FF').success).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(hexColorSchema.safeParse('red').success).toBe(false);
      expect(hexColorSchema.safeParse('#FFF').success).toBe(false);
      expect(hexColorSchema.safeParse('FF0000').success).toBe(false);
      expect(hexColorSchema.safeParse('#GGGGGG').success).toBe(false);
    });
  });

  describe('createTagSchema', () => {
    it('should accept valid tag creation input', () => {
      const result = createTagSchema.safeParse({
        workspaceId: validUuid,
        name: 'Important'
      });
      expect(result.success).toBe(true);
    });

    it('should apply default color', () => {
      const result = createTagSchema.safeParse({
        workspaceId: validUuid,
        name: 'Test'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#808080');
      }
    });

    it('should accept custom color', () => {
      const result = createTagSchema.safeParse({
        workspaceId: validUuid,
        name: 'Urgent',
        color: '#FF0000'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('addItemTagsSchema', () => {
    it('should accept valid input', () => {
      expect(addItemTagsSchema.safeParse({
        itemId: validUuid,
        tagIds: [validUuid]
      }).success).toBe(true);
    });

    it('should reject empty tagIds array', () => {
      expect(addItemTagsSchema.safeParse({
        itemId: validUuid,
        tagIds: []
      }).success).toBe(false);
    });

    it('should reject more than 20 tags', () => {
      const manyUuids = Array(21).fill(validUuid);
      expect(addItemTagsSchema.safeParse({
        itemId: validUuid,
        tagIds: manyUuids
      }).success).toBe(false);
    });
  });
});

// ==================== AI Schema Tests ====================

describe('AI Schemas', () => {
  describe('switchAIProviderSchema', () => {
    it('should accept valid provider switch', () => {
      expect(switchAIProviderSchema.safeParse({
        providerId: 'claude'
      }).success).toBe(true);
    });

    it('should accept custom URL', () => {
      expect(switchAIProviderSchema.safeParse({
        providerId: 'custom',
        url: 'https://my-ai.com'
      }).success).toBe(true);
    });
  });
});

// ==================== Autosave Schema Tests ====================

describe('Autosave Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('scheduleAutosaveSchema', () => {
    it('should accept valid autosave input', () => {
      expect(scheduleAutosaveSchema.safeParse({
        itemId: validUuid,
        content: '# My Note\n\nContent here'
      }).success).toBe(true);
    });

    it('should accept large content', () => {
      const largeContent = 'a'.repeat(1000000); // 1MB
      expect(scheduleAutosaveSchema.safeParse({
        itemId: validUuid,
        content: largeContent
      }).success).toBe(true);
    });
  });

  describe('flushAutosaveSchema', () => {
    it('should accept valid flush input', () => {
      expect(flushAutosaveSchema.safeParse({
        itemId: validUuid
      }).success).toBe(true);
    });
  });
});

// ==================== Asset Schema Tests ====================

describe('Asset Schemas', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('copyAssetSchema', () => {
    it('should accept valid copy asset input', () => {
      expect(copyAssetSchema.safeParse({
        sourcePath: '/path/to/image.png',
        workspaceId: validUuid
      }).success).toBe(true);
    });

    it('should accept optional description', () => {
      expect(copyAssetSchema.safeParse({
        sourcePath: '/path/to/image.png',
        workspaceId: validUuid,
        description: 'Screenshot of dashboard'
      }).success).toBe(true);
    });
  });

  describe('deleteAssetSchema', () => {
    it('should accept valid delete asset input', () => {
      expect(deleteAssetSchema.safeParse({
        assetPath: 'assets/image-123.png',
        workspaceId: validUuid
      }).success).toBe(true);
    });
  });
});
