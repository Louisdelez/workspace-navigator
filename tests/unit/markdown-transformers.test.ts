/**
 * Unit Tests for Markdown Transformers (T016)
 */

import { describe, it, expect } from 'vitest';
import {
  applyBold,
  applyItalic,
  applyUnderline,
  applyStrikethrough,
  applyHeading,
  applyBulletList,
  applyNumberedList,
  applyQuote,
  applyCodeInline,
  applyCodeBlock,
  applyLink,
  applyImage,
  applyMath,
  applyTransformation,
  type Selection
} from '../../src/renderer/utils/markdown-transformers';

describe('Markdown Transformers', () => {
  describe('applyBold', () => {
    it('should wrap selected text with **', () => {
      const content = 'Hello world';
      const selection: Selection = { start: 6, end: 11 };
      const result = applyBold(content, selection);

      expect(result.content).toBe('Hello **world**');
      expect(result.newSelection).toEqual({ start: 8, end: 13 });
    });

    it('should handle empty selection', () => {
      const content = 'Hello world';
      const selection: Selection = { start: 6, end: 6 };
      const result = applyBold(content, selection);

      expect(result.content).toBe('Hello ****world');
      expect(result.newSelection).toEqual({ start: 8, end: 8 });
    });

    it('should toggle off existing bold', () => {
      const content = 'Hello **world**';
      const selection: Selection = { start: 6, end: 15 };
      const result = applyBold(content, selection);

      expect(result.content).toBe('Hello world');
      expect(result.newSelection).toEqual({ start: 6, end: 11 });
    });
  });

  describe('applyItalic', () => {
    it('should wrap selected text with *', () => {
      const content = 'Hello world';
      const selection: Selection = { start: 6, end: 11 };
      const result = applyItalic(content, selection);

      expect(result.content).toBe('Hello *world*');
      expect(result.newSelection).toEqual({ start: 7, end: 12 });
    });

    it('should toggle off existing italic', () => {
      const content = 'Hello *world*';
      const selection: Selection = { start: 6, end: 13 };
      const result = applyItalic(content, selection);

      expect(result.content).toBe('Hello world');
      expect(result.newSelection).toEqual({ start: 6, end: 11 });
    });
  });

  describe('applyUnderline', () => {
    it('should wrap selected text with <u> tags', () => {
      const content = 'Hello world';
      const selection: Selection = { start: 6, end: 11 };
      const result = applyUnderline(content, selection);

      expect(result.content).toBe('Hello <u>world</u>');
      expect(result.newSelection).toEqual({ start: 9, end: 14 });
    });
  });

  describe('applyStrikethrough', () => {
    it('should wrap selected text with ~~', () => {
      const content = 'Hello world';
      const selection: Selection = { start: 6, end: 11 };
      const result = applyStrikethrough(content, selection);

      expect(result.content).toBe('Hello ~~world~~');
      expect(result.newSelection).toEqual({ start: 8, end: 13 });
    });

    it('should toggle off existing strikethrough', () => {
      const content = 'Hello ~~world~~';
      const selection: Selection = { start: 6, end: 15 };
      const result = applyStrikethrough(content, selection);

      expect(result.content).toBe('Hello world');
      expect(result.newSelection).toEqual({ start: 6, end: 11 });
    });
  });

  describe('applyHeading', () => {
    it('should add H1 prefix to line', () => {
      const content = 'My Title\nParagraph';
      const selection: Selection = { start: 3, end: 5 };
      const result = applyHeading(content, selection, 1);

      expect(result.content).toBe('# My Title\nParagraph');
    });

    it('should add H2 prefix to line', () => {
      const content = 'My Title';
      const selection: Selection = { start: 0, end: 0 };
      const result = applyHeading(content, selection, 2);

      expect(result.content).toBe('## My Title');
    });

    it('should replace existing heading level', () => {
      const content = '# My Title';
      const selection: Selection = { start: 2, end: 2 };
      const result = applyHeading(content, selection, 3);

      expect(result.content).toBe('### My Title');
    });
  });

  describe('applyBulletList', () => {
    it('should add bullet prefix to single line', () => {
      const content = 'Item one\nItem two';
      const selection: Selection = { start: 0, end: 8 };
      const result = applyBulletList(content, selection);

      expect(result.content).toBe('- Item one\nItem two');
    });

    it('should add bullet prefix to multiple lines', () => {
      const content = 'Item one\nItem two\nItem three';
      const selection: Selection = { start: 0, end: 17 };
      const result = applyBulletList(content, selection);

      expect(result.content).toBe('- Item one\n- Item two\nItem three');
    });

    it('should toggle off existing bullets', () => {
      const content = '- Item one\n- Item two';
      const selection: Selection = { start: 0, end: 21 };
      const result = applyBulletList(content, selection);

      expect(result.content).toBe('Item one\nItem two');
    });
  });

  describe('applyNumberedList', () => {
    it('should add numbered prefix to multiple lines', () => {
      const content = 'Item one\nItem two\nItem three';
      const selection: Selection = { start: 0, end: 17 };
      const result = applyNumberedList(content, selection);

      expect(result.content).toBe('1. Item one\n2. Item two\nItem three');
    });

    it('should toggle off existing numbers', () => {
      const content = '1. Item one\n2. Item two';
      const selection: Selection = { start: 0, end: 23 };
      const result = applyNumberedList(content, selection);

      expect(result.content).toBe('Item one\nItem two');
    });
  });

  describe('applyQuote', () => {
    it('should add quote prefix to line', () => {
      const content = 'A wise quote';
      const selection: Selection = { start: 0, end: 12 };
      const result = applyQuote(content, selection);

      expect(result.content).toBe('> A wise quote');
    });

    it('should add quote prefix to multiple lines', () => {
      const content = 'Line one\nLine two';
      const selection: Selection = { start: 0, end: 17 };
      const result = applyQuote(content, selection);

      expect(result.content).toBe('> Line one\n> Line two');
    });

    it('should toggle off existing quotes', () => {
      const content = '> Quoted text';
      const selection: Selection = { start: 0, end: 13 };
      const result = applyQuote(content, selection);

      expect(result.content).toBe('Quoted text');
    });
  });

  describe('applyCodeInline', () => {
    it('should wrap selected text with backticks', () => {
      const content = 'Use the print function';
      const selection: Selection = { start: 8, end: 13 };
      const result = applyCodeInline(content, selection);

      expect(result.content).toBe('Use the `print` function');
      expect(result.newSelection).toEqual({ start: 9, end: 14 });
    });

    it('should toggle off existing code', () => {
      const content = 'Use the `print` function';
      const selection: Selection = { start: 8, end: 15 };
      const result = applyCodeInline(content, selection);

      expect(result.content).toBe('Use the print function');
    });
  });

  describe('applyCodeBlock', () => {
    it('should wrap selected text with triple backticks', () => {
      const content = 'const x = 1;';
      const selection: Selection = { start: 0, end: 12 };
      const result = applyCodeBlock(content, selection);

      expect(result.content).toBe('```\nconst x = 1;\n```');
      expect(result.newSelection).toEqual({ start: 4, end: 16 });
    });
  });

  describe('applyLink', () => {
    it('should create markdown link with selected text', () => {
      const content = 'Visit Google for more';
      const selection: Selection = { start: 6, end: 12 };
      const result = applyLink(content, selection, 'https://google.com');

      expect(result.content).toBe('Visit [Google](https://google.com) for more');
    });

    it('should use placeholder text when no selection', () => {
      const content = 'Click here: ';
      const selection: Selection = { start: 12, end: 12 };
      const result = applyLink(content, selection, 'https://example.com');

      expect(result.content).toBe('Click here: [link text](https://example.com)');
    });
  });

  describe('applyImage', () => {
    it('should insert image markdown at position', () => {
      const content = 'See image below:\n';
      const result = applyImage(content, 17, 'assets/images/photo.png', 'Photo');

      expect(result.content).toBe('See image below:\n![Photo](assets/images/photo.png)');
    });

    it('should use default alt text', () => {
      const content = '';
      const result = applyImage(content, 0, 'path/to/img.jpg');

      expect(result.content).toBe('![image](path/to/img.jpg)');
    });
  });

  describe('applyMath', () => {
    it('should wrap inline math with $', () => {
      const content = 'The formula is E=mc^2 here';
      const selection: Selection = { start: 15, end: 21 };
      const result = applyMath(content, selection, false);

      expect(result.content).toBe('The formula is $E=mc^2$ here');
    });

    it('should wrap block math with $$', () => {
      const content = 'The integral';
      const selection: Selection = { start: 4, end: 12 };
      const result = applyMath(content, selection, true);

      expect(result.content).toBe('The $$\nintegral\n$$');
    });
  });

  describe('applyTransformation', () => {
    it('should dispatch to correct transformer based on type', () => {
      const content = 'test';
      const selection: Selection = { start: 0, end: 4 };

      const boldResult = applyTransformation(content, selection, 'bold');
      expect(boldResult.content).toBe('**test**');

      const h1Result = applyTransformation(content, selection, 'h1');
      expect(h1Result.content).toBe('# test');

      const bulletResult = applyTransformation(content, selection, 'bulletList');
      expect(bulletResult.content).toBe('- test');
    });

    it('should pass options for link transformation', () => {
      const content = 'click';
      const selection: Selection = { start: 0, end: 5 };

      const result = applyTransformation(content, selection, 'link', { url: 'https://test.com' });
      expect(result.content).toBe('[click](https://test.com)');
    });

    it('should pass options for image transformation', () => {
      const content = '';
      const selection: Selection = { start: 0, end: 0 };

      const result = applyTransformation(content, selection, 'image', {
        path: 'assets/test.png',
        alt: 'Test Image'
      });
      expect(result.content).toBe('![Test Image](assets/test.png)');
    });
  });
});
