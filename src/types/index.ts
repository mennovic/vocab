// Word pair with spaced repetition data
export interface Word {
  id: string;
  listId: string;
  term: string;
  definition: string;
  // SM-2 algorithm fields
  easeFactor: number; // Default 2.5
  interval: number; // Days until next review
  repetitions: number; // Successful reviews in a row
  nextReview: number; // Timestamp
  lastReview: number | null; // Timestamp
  // Stats
  timesCorrect: number;
  timesIncorrect: number;
  createdAt: number;
}

export interface WordList {
  id: string;
  name: string;
  description?: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: number;
  updatedAt: number;
}

export interface StudySession {
  id: string;
  listId: string;
  startedAt: number;
  endedAt: number | null;
  wordsStudied: number;
  correct: number;
  incorrect: number;
}

export interface AppStats {
  totalWordsLearned: number;
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
}

// SM-2 quality ratings
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 - Complete blackout
// 1 - Incorrect, but remembered upon seeing answer
// 2 - Incorrect, but easy to recall
// 3 - Correct with difficulty
// 4 - Correct with hesitation
// 5 - Perfect response

// Simplified user-facing ratings
export type UserRating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewResult {
  wordId: string;
  rating: UserRating;
  responseTime: number; // ms
}

export type PracticeDirection = 'term-to-def' | 'def-to-term' | 'mixed';

// OCR parsing result
export interface ParsedWordPair {
  term: string;
  definition: string;
  confidence: number;
}

export interface OCRResult {
  rawText: string;
  pairs: ParsedWordPair[];
  parseErrors: string[];
}
