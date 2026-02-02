import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Word, WordList, StudySession, AppStats } from '@/types';

interface VocabDB extends DBSchema {
  words: {
    key: string;
    value: Word;
    indexes: {
      'by-list': string;
      'by-next-review': number;
    };
  };
  lists: {
    key: string;
    value: WordList;
  };
  sessions: {
    key: string;
    value: StudySession;
    indexes: {
      'by-list': string;
      'by-date': number;
    };
  };
  stats: {
    key: string;
    value: AppStats;
  };
}

const DB_NAME = 'vocab-flashcards';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<VocabDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<VocabDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<VocabDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Words store
      const wordStore = db.createObjectStore('words', { keyPath: 'id' });
      wordStore.createIndex('by-list', 'listId');
      wordStore.createIndex('by-next-review', 'nextReview');

      // Lists store
      db.createObjectStore('lists', { keyPath: 'id' });

      // Sessions store
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('by-list', 'listId');
      sessionStore.createIndex('by-date', 'startedAt');

      // Stats store
      db.createObjectStore('stats', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Word operations
export async function createWord(word: Omit<Word, 'id' | 'createdAt'>): Promise<Word> {
  const db = await getDB();
  const newWord: Word = {
    ...word,
    id: generateId(),
    createdAt: Date.now(),
  };
  await db.put('words', newWord);
  return newWord;
}

export async function createWords(words: Omit<Word, 'id' | 'createdAt'>[]): Promise<Word[]> {
  const db = await getDB();
  const tx = db.transaction('words', 'readwrite');
  const newWords: Word[] = [];

  for (const word of words) {
    const newWord: Word = {
      ...word,
      id: generateId(),
      createdAt: Date.now(),
    };
    newWords.push(newWord);
    tx.store.put(newWord);
  }

  await tx.done;
  return newWords;
}

export async function getWord(id: string): Promise<Word | undefined> {
  const db = await getDB();
  return db.get('words', id);
}

export async function updateWord(word: Word): Promise<void> {
  const db = await getDB();
  await db.put('words', word);
}

export async function deleteWord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('words', id);
}

export async function getWordsByList(listId: string): Promise<Word[]> {
  const db = await getDB();
  return db.getAllFromIndex('words', 'by-list', listId);
}

export async function getDueWords(listId?: string): Promise<Word[]> {
  const db = await getDB();
  const now = Date.now();

  let words: Word[];
  if (listId) {
    words = await db.getAllFromIndex('words', 'by-list', listId);
  } else {
    words = await db.getAll('words');
  }

  return words.filter(w => w.nextReview <= now);
}

export async function getAllWords(): Promise<Word[]> {
  const db = await getDB();
  return db.getAll('words');
}

// List operations
export async function createList(list: Omit<WordList, 'id' | 'createdAt' | 'updatedAt'>): Promise<WordList> {
  const db = await getDB();
  const now = Date.now();
  const newList: WordList = {
    ...list,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.put('lists', newList);
  return newList;
}

export async function getList(id: string): Promise<WordList | undefined> {
  const db = await getDB();
  return db.get('lists', id);
}

export async function getAllLists(): Promise<WordList[]> {
  const db = await getDB();
  return db.getAll('lists');
}

export async function updateList(list: WordList): Promise<void> {
  const db = await getDB();
  await db.put('lists', { ...list, updatedAt: Date.now() });
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDB();

  // Delete all words in the list
  const words = await getWordsByList(id);
  const tx = db.transaction(['words', 'lists'], 'readwrite');

  for (const word of words) {
    tx.objectStore('words').delete(word.id);
  }
  tx.objectStore('lists').delete(id);

  await tx.done;
}

// Session operations
export async function createSession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
  const db = await getDB();
  const newSession: StudySession = {
    ...session,
    id: generateId(),
  };
  await db.put('sessions', newSession);
  return newSession;
}

export async function updateSession(session: StudySession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getSessionsByList(listId: string): Promise<StudySession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-list', listId);
}

export async function getAllSessions(): Promise<StudySession[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

// Stats operations
export async function getStats(): Promise<AppStats> {
  const db = await getDB();
  const stats = await db.get('stats', 'main');

  if (!stats) {
    const defaultStats: AppStats = {
      totalWordsLearned: 0,
      totalReviews: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
    };
    await db.put('stats', { ...defaultStats, id: 'main' } as AppStats & { id: string });
    return defaultStats;
  }

  return stats;
}

export async function updateStats(updates: Partial<AppStats>): Promise<void> {
  const db = await getDB();
  const current = await getStats();
  await db.put('stats', {
    ...current,
    ...updates,
    id: 'main'
  } as AppStats & { id: string });
}

// Streak calculation
export async function updateStreak(): Promise<void> {
  const stats = await getStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (stats.lastStudyDate === today) {
    // Already studied today, no update needed
    return;
  }

  let newStreak: number;
  if (stats.lastStudyDate === yesterday) {
    // Continuing streak
    newStreak = stats.currentStreak + 1;
  } else if (stats.lastStudyDate === null || stats.lastStudyDate < yesterday) {
    // Starting new streak
    newStreak = 1;
  } else {
    newStreak = stats.currentStreak;
  }

  await updateStats({
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, stats.longestStreak),
    lastStudyDate: today,
  });
}
