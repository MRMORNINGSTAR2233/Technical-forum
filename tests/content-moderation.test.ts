import { describe, it, expect } from 'vitest';
import { validateQuestionContent, validateAnswerContent } from '@/lib/content-moderation';

describe('Content Moderation', () => {
  describe('Question Validation', () => {
    it('should accept valid questions', () => {
      const result = validateQuestionContent(
        'How do I implement authentication in Next.js?',
        'I am building a Next.js application and need to add user authentication. What is the best approach?'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject questions with short titles', () => {
      const result = validateQuestionContent(
        'Help',
        'I need help with my code'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Title is too short');
    });

    it('should reject questions with short content', () => {
      const result = validateQuestionContent(
        'How do I fix this error?',
        'Help me'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Content is too short');
    });

    it('should reject questions with spam keywords', () => {
      const result = validateQuestionContent(
        'Buy viagra online cheap',
        'Click here to buy viagra at the best prices. Limited offer!'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('spam keywords');
    });

    it('should reject questions with repeated characters', () => {
      const result = validateQuestionContent(
        'aaaaaaaaaaaaaaaa',
        'This is my question content with enough words'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('invalid patterns');
    });

    it('should reject questions with too many URLs', () => {
      const result = validateQuestionContent(
        'Check out these links',
        'Visit http://example1.com and http://example2.com and http://example3.com and http://example4.com for more info'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too many URLs');
    });

    it('should reject questions with all caps title', () => {
      const result = validateQuestionContent(
        'HOW DO I FIX THIS ERROR',
        'I am getting an error when I run my code. Can someone help me fix it?'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('uppercase');
    });

    it('should reject questions with too few words', () => {
      const result = validateQuestionContent(
        'How to fix error?',
        'Help please now thanks'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too few words');
    });
  });

  describe('Answer Validation', () => {
    it('should accept valid answers', () => {
      const result = validateAnswerContent(
        'You can use NextAuth.js for authentication. Here is how to set it up: First install the package, then configure your providers.'
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject answers with short content', () => {
      const result = validateAnswerContent('Yes');
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Answer is too short');
    });

    it('should reject answers with spam keywords', () => {
      const result = validateAnswerContent(
        'You should buy this amazing product from our casino website. Click here for free money!'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('spam keywords');
    });

    it('should reject answers with too many URLs', () => {
      const result = validateAnswerContent(
        'Check http://link1.com and http://link2.com and http://link3.com and http://link4.com and http://link5.com and http://link6.com'
      );
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too many URLs');
    });
  });
});
