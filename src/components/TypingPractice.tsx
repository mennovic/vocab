import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import type { Word, UserRating } from '@/types';

interface TypingPracticeProps {
  word: Word;
  showTerm: boolean;
  onRate: (rating: UserRating) => void;
  sourceLanguage?: string;
  targetLanguage?: string;
}

function normalizeAnswer(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics for comparison
    .replace(/[^\w\s]/g, ''); // Remove punctuation
}

function calculateSimilarity(a: string, b: string): number {
  const s1 = normalizeAnswer(a);
  const s2 = normalizeAnswer(b);

  if (s1 === s2) return 1;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

export function TypingPractice({ word, showTerm, onRate, sourceLanguage, targetLanguage }: TypingPracticeProps) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [similarity, setSimilarity] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const question = showTerm ? word.term : word.definition;
  const correctAnswer = showTerm ? word.definition : word.term;

  // Determine language labels for the prompt
  const fromLang = showTerm ? (sourceLanguage || 'het woord') : (targetLanguage || 'de vertaling');
  const toLang = showTerm ? (targetLanguage || 'de vertaling') : (sourceLanguage || 'het woord');

  useEffect(() => {
    inputRef.current?.focus();
  }, [word.id]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const sim = calculateSimilarity(answer, correctAnswer);
    setSimilarity(sim);
    setIsCorrect(sim >= 0.85); // 85% similarity = correct
    setSubmitted(true);
  }, [answer, correctAnswer]);

  const handleContinue = useCallback(() => {
    // Determine rating based on correctness
    let rating: UserRating;
    if (similarity >= 0.95) {
      rating = 'easy';
    } else if (similarity >= 0.85) {
      rating = 'good';
    } else if (similarity >= 0.6) {
      rating = 'hard';
    } else {
      rating = 'again';
    }

    setAnswer('');
    setSubmitted(false);
    onRate(rating);
  }, [similarity, onRate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (submitted && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleContinue();
    }
  }, [submitted, handleContinue]);

  return (
    <div
      className="w-full max-w-md mx-auto"
      onKeyDown={handleKeyDown}
    >
      {/* Question */}
      <div className="card p-6 text-center mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Vertaal naar {toLang}:
        </p>
        <p className="text-2xl font-semibold">{question}</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Typ je antwoord..."
          className={`input text-lg text-center ${
            submitted
              ? isCorrect
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : ''
          }`}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {!submitted && (
          <button
            type="submit"
            disabled={!answer.trim()}
            className="btn btn-primary w-full mt-4"
          >
            Controleer
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Result */}
      {submitted && (
        <div className="mt-6 animate-slide-up">
          <div className={`flex items-center justify-center gap-2 mb-4 ${
            isCorrect ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {isCorrect ? (
              <>
                <Check className="w-6 h-6" />
                <span className="text-lg font-medium">Correct!</span>
              </>
            ) : (
              <>
                <X className="w-6 h-6" />
                <span className="text-lg font-medium">Niet helemaal</span>
              </>
            )}
          </div>

          {!isCorrect && (
            <div className="card p-4 mb-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Het juiste antwoord was:
              </p>
              <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">
                {correctAnswer}
              </p>
              {similarity > 0.5 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Je was er {Math.round(similarity * 100)}% dichtbij
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleContinue}
            className="btn btn-primary w-full"
          >
            Volgende
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Druk op Enter om door te gaan
          </p>
        </div>
      )}
    </div>
  );
}
