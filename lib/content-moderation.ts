/**
 * Content Moderation Utilities
 * Validates content quality and filters spam/trash content
 */

// List of spam/trash keywords and patterns
const SPAM_KEYWORDS = [
  'viagra',
  'cialis',
  'casino',
  'lottery',
  'winner',
  'click here',
  'buy now',
  'limited offer',
  'act now',
  'free money',
  'make money fast',
  'work from home',
  'nigerian prince',
  'inheritance',
  'congratulations you won',
];

// Patterns that indicate low-quality content
const TRASH_PATTERNS = [
  /^(.)\1{10,}$/i, // Repeated characters (e.g., "aaaaaaaaaa")
  /^[^a-zA-Z0-9\s]{20,}$/, // Too many special characters
  /https?:\/\/[^\s]+\s+https?:\/\/[^\s]+\s+https?:\/\/[^\s]+/, // Multiple URLs (3+)
];

// Minimum content quality requirements
const MIN_TITLE_LENGTH = 10;
const MAX_TITLE_LENGTH = 300;
const MIN_CONTENT_LENGTH = 20;
const MAX_CONTENT_LENGTH = 30000;
const MIN_WORD_COUNT = 5;

export interface ContentValidationResult {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
}

/**
 * Validates question content for quality and spam
 */
export function validateQuestionContent(
  title: string,
  content: string
): ContentValidationResult {
  // Check title length
  if (title.length < MIN_TITLE_LENGTH) {
    return {
      isValid: false,
      reason: 'Title is too short',
      suggestions: ['Please provide a more descriptive title (at least 10 characters)'],
    };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      reason: 'Title is too long',
      suggestions: ['Please keep your title under 300 characters'],
    };
  }

  // Check content length
  if (content.length < MIN_CONTENT_LENGTH) {
    return {
      isValid: false,
      reason: 'Content is too short',
      suggestions: [
        'Please provide more details about your question (at least 20 characters)',
        'Include what you have tried and what specific help you need',
      ],
    };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      isValid: false,
      reason: 'Content is too long',
      suggestions: ['Please keep your content under 30,000 characters'],
    };
  }

  // Check word count
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < MIN_WORD_COUNT) {
    return {
      isValid: false,
      reason: 'Content has too few words',
      suggestions: ['Please write at least 5 words to describe your question'],
    };
  }

  // Check for spam keywords
  const combinedText = `${title} ${content}`.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      return {
        isValid: false,
        reason: 'Content contains spam keywords',
        suggestions: ['Please remove promotional or spam content from your question'],
      };
    }
  }

  // Check for trash patterns
  for (const pattern of TRASH_PATTERNS) {
    if (pattern.test(title) || pattern.test(content)) {
      return {
        isValid: false,
        reason: 'Content contains invalid patterns',
        suggestions: [
          'Please avoid repeated characters or excessive special characters',
          'Write meaningful content that helps others understand your question',
        ],
      };
    }
  }

  // Check for all caps (shouting)
  const titleWords = title.split(/\s+/);
  const capsWords = titleWords.filter((word) => word.length > 2 && word === word.toUpperCase());
  if (capsWords.length > titleWords.length * 0.5) {
    return {
      isValid: false,
      reason: 'Title contains too many uppercase words',
      suggestions: ['Please use normal capitalization in your title'],
    };
  }

  // Check for excessive URLs
  const urlMatches = content.match(/https?:\/\/[^\s]+/g);
  if (urlMatches && urlMatches.length > 3) {
    return {
      isValid: false,
      reason: 'Content contains too many URLs',
      suggestions: ['Please limit URLs to 3 or fewer and focus on your question'],
    };
  }

  // All checks passed
  return {
    isValid: true,
  };
}

/**
 * Validates answer content for quality and spam
 */
export function validateAnswerContent(content: string): ContentValidationResult {
  // Check content length
  if (content.length < MIN_CONTENT_LENGTH) {
    return {
      isValid: false,
      reason: 'Answer is too short',
      suggestions: ['Please provide a more detailed answer (at least 20 characters)'],
    };
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      isValid: false,
      reason: 'Answer is too long',
      suggestions: ['Please keep your answer under 30,000 characters'],
    };
  }

  // Check word count
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < MIN_WORD_COUNT) {
    return {
      isValid: false,
      reason: 'Answer has too few words',
      suggestions: ['Please write at least 5 words to provide a helpful answer'],
    };
  }

  // Check for spam keywords
  const lowerContent = content.toLowerCase();
  for (const keyword of SPAM_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      return {
        isValid: false,
        reason: 'Content contains spam keywords',
        suggestions: ['Please remove promotional or spam content from your answer'],
      };
    }
  }

  // Check for trash patterns
  for (const pattern of TRASH_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        reason: 'Content contains invalid patterns',
        suggestions: [
          'Please avoid repeated characters or excessive special characters',
          'Write meaningful content that helps answer the question',
        ],
      };
    }
  }

  // Check for excessive URLs
  const urlMatches = content.match(/https?:\/\/[^\s]+/g);
  if (urlMatches && urlMatches.length > 5) {
    return {
      isValid: false,
      reason: 'Content contains too many URLs',
      suggestions: ['Please limit URLs to 5 or fewer and focus on your answer'],
    };
  }

  // All checks passed
  return {
    isValid: true,
  };
}
