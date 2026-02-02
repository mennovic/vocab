import type { Word, UserRating, Quality } from '@/types';

// Map user-friendly ratings to SM-2 quality scores
function ratingToQuality(rating: UserRating): Quality {
  switch (rating) {
    case 'again': return 0;
    case 'hard': return 2;
    case 'good': return 4;
    case 'easy': return 5;
  }
}

// SM-2 Algorithm implementation
// Based on: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
export function calculateNextReview(word: Word, rating: UserRating): Partial<Word> {
  const quality = ratingToQuality(rating);
  const now = Date.now();

  let { easeFactor, interval, repetitions } = word;

  // If quality < 3, restart repetitions
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // EF should never be less than 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate next review timestamp
  const nextReview = now + interval * 24 * 60 * 60 * 1000;

  // Update stats
  const timesCorrect = quality >= 3 ? word.timesCorrect + 1 : word.timesCorrect;
  const timesIncorrect = quality < 3 ? word.timesIncorrect + 1 : word.timesIncorrect;

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview: now,
    timesCorrect,
    timesIncorrect,
  };
}

// Create default SM-2 values for a new word
export function getDefaultSM2Values(): Pick<
  Word,
  'easeFactor' | 'interval' | 'repetitions' | 'nextReview' | 'lastReview' | 'timesCorrect' | 'timesIncorrect'
> {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(), // Due immediately
    lastReview: null,
    timesCorrect: 0,
    timesIncorrect: 0,
  };
}

// Get human-readable next review text
export function getNextReviewText(nextReview: number): string {
  const now = Date.now();
  const diff = nextReview - now;

  if (diff <= 0) return 'Nu';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days} dag${days > 1 ? 'en' : ''}`;
  if (hours > 0) return `${hours} uur`;
  if (minutes > 0) return `${minutes} min`;
  return 'Nu';
}

// Calculate mastery level (0-100%)
export function calculateMastery(word: Word): number {
  if (word.timesCorrect + word.timesIncorrect === 0) return 0;

  const accuracy = word.timesCorrect / (word.timesCorrect + word.timesIncorrect);
  const repetitionBonus = Math.min(word.repetitions / 5, 1); // Max bonus at 5 reps
  const intervalBonus = Math.min(word.interval / 30, 1); // Max bonus at 30 days

  // Weighted average
  return Math.round((accuracy * 0.5 + repetitionBonus * 0.25 + intervalBonus * 0.25) * 100);
}

// Get estimated intervals for each rating
export function getEstimatedIntervals(word: Word): Record<UserRating, string> {
  const estimates: Record<UserRating, string> = {
    again: '1 dag',
    hard: '',
    good: '',
    easy: '',
  };

  // Calculate for each rating
  (['hard', 'good', 'easy'] as const).forEach(rating => {
    const result = calculateNextReview(word, rating);
    const days = result.interval!;
    if (days === 1) {
      estimates[rating] = '1 dag';
    } else if (days < 30) {
      estimates[rating] = `${days} dagen`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      estimates[rating] = `${months} maand${months > 1 ? 'en' : ''}`;
    } else {
      const years = Math.round(days / 365);
      estimates[rating] = `${years} jaar`;
    }
  });

  return estimates;
}
