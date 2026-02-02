import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Trophy, X, RotateCcw } from 'lucide-react';
import { TypingPractice } from '@/components/TypingPractice';
import {
  getList, getWordsByList, getDueWords, updateWord, updateStats,
  getStats, updateStreak, createSession, updateSession
} from '@/utils/db';
import { calculateNextReview } from '@/utils/sm2';
import type { WordList, Word, UserRating, PracticeDirection, StudySession } from '@/types';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Practice() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<WordList | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  // Session tracking
  const [session, setSession] = useState<StudySession | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [direction, setDirection] = useState<PracticeDirection>('term-to-def');

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      let wordsToStudy: Word[];
      let listData: WordList | null = null;

      if (listId) {
        listData = await getList(listId) || null;
        const dueWords = await getDueWords(listId);
        const allListWords = await getWordsByList(listId);
        wordsToStudy = dueWords.length > 0 ? dueWords : allListWords;
      } else {
        const dueWords = await getDueWords();
        wordsToStudy = dueWords;
      }

      setList(listData);
      setWords(shuffleArray(wordsToStudy));
      setLoading(false);

      // Create session
      const newSession = await createSession({
        listId: listId || 'all',
        startedAt: Date.now(),
        endedAt: null,
        wordsStudied: 0,
        correct: 0,
        incorrect: 0,
      });
      setSession(newSession);

      // Update streak
      await updateStreak();
    }

    loadData();
  }, [listId]);

  const currentWord = words[currentIndex];

  // Determine which side to show first based on direction
  const showTerm = useMemo(() => {
    if (direction === 'term-to-def') return true;
    if (direction === 'def-to-term') return false;
    return Math.random() > 0.5;
  }, [direction, currentIndex]);

  const handleRate = useCallback(async (rating: UserRating) => {
    if (!currentWord) return;

    // Calculate new SM-2 values
    const updates = calculateNextReview(currentWord, rating);

    // Update the word in DB
    await updateWord({
      ...currentWord,
      ...updates,
    });

    // Update session stats
    const isCorrect = rating !== 'again';
    if (isCorrect) {
      setCorrectCount(c => c + 1);
    } else {
      setIncorrectCount(c => c + 1);
    }

    // Update global stats
    const stats = await getStats();
    await updateStats({
      totalReviews: stats.totalReviews + 1,
      totalWordsLearned: isCorrect && currentWord.repetitions === 0
        ? stats.totalWordsLearned + 1
        : stats.totalWordsLearned,
    });

    // Move to next word or finish
    if (currentIndex + 1 >= words.length) {
      setFinished(true);

      // End session
      if (session) {
        await updateSession({
          ...session,
          endedAt: Date.now(),
          wordsStudied: words.length,
          correct: correctCount + (isCorrect ? 1 : 0),
          incorrect: incorrectCount + (isCorrect ? 0 : 1),
        });
      }
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentWord, currentIndex, words.length, session, correctCount, incorrectCount]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setWords(shuffleArray(words));
    setFinished(false);
    setCorrectCount(0);
    setIncorrectCount(0);
  }, [words]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No words to study
  if (words.length === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Oefenen</h1>
        </div>

        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Alles bijgewerkt!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Er zijn geen woorden die nu gereviewed moeten worden.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary"
          >
            Terug naar lijst
          </button>
        </div>
      </div>
    );
  }

  // Finished state
  if (finished) {
    const accuracy = Math.round((correctCount / (correctCount + incorrectCount)) * 100);

    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="text-center py-12 animate-slide-up">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-emerald-500" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Sessie voltooid!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Je hebt {words.length} woorden geoefend
          </p>

          <div className="card p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-500">{correctCount}</p>
                <p className="text-sm text-slate-500">Goed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
                <p className="text-sm text-slate-500">Fout</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{accuracy}%</p>
                <p className="text-sm text-slate-500">Nauwkeurig</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="btn btn-secondary flex-1"
            >
              <RotateCcw className="w-5 h-5" />
              Opnieuw
            </button>
            <button
              onClick={() => navigate(listId ? `/lists/${listId}` : '/lists')}
              className="btn btn-primary flex-1"
            >
              Terug
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {list?.name || 'Alle woorden'}
          </p>
          <p className="font-medium">
            {currentIndex + 1} / {words.length}
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 -mr-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${((currentIndex) / words.length) * 100}%` }}
        />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card p-4 mb-6 animate-slide-up">
          <h3 className="font-medium mb-3">Vertaalrichting</h3>
          <div className="space-y-2">
            <button
              onClick={() => setDirection('term-to-def')}
              className={`btn w-full justify-start ${direction === 'term-to-def' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {list?.sourceLanguage || 'Woord'} → {list?.targetLanguage || 'Vertaling'}
            </button>
            <button
              onClick={() => setDirection('def-to-term')}
              className={`btn w-full justify-start ${direction === 'def-to-term' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {list?.targetLanguage || 'Vertaling'} → {list?.sourceLanguage || 'Woord'}
            </button>
            <button
              onClick={() => setDirection('mixed')}
              className={`btn w-full justify-start ${direction === 'mixed' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Gemengd (willekeurig)
            </button>
          </div>
        </div>
      )}

      {/* Typing practice */}
      <TypingPractice
        word={currentWord}
        showTerm={showTerm}
        onRate={handleRate}
        sourceLanguage={list?.sourceLanguage}
        targetLanguage={list?.targetLanguage}
      />
    </div>
  );
}
