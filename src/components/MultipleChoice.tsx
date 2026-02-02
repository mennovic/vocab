import { useState, useCallback, useMemo, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import type { Word, UserRating } from '@/types';

interface MultipleChoiceProps {
  word: Word;
  allWords: Word[];
  showTerm: boolean;
  onRate: (rating: UserRating) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MultipleChoice({ word, allWords, showTerm, onRate }: MultipleChoiceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const question = showTerm ? word.term : word.definition;
  const correctAnswer = showTerm ? word.definition : word.term;

  // Generate options (1 correct + 3 distractors)
  const options = useMemo(() => {
    const otherWords = allWords.filter(w => w.id !== word.id);
    const distractors = shuffleArray(otherWords)
      .slice(0, 3)
      .map(w => showTerm ? w.definition : w.term);

    // If we don't have enough distractors, duplicate some
    while (distractors.length < 3) {
      distractors.push(`${correctAnswer} (anders)`);
    }

    const allOptions = [...distractors, correctAnswer];
    return shuffleArray(allOptions);
  }, [word.id, allWords, showTerm, correctAnswer]);

  const correctIndex = options.indexOf(correctAnswer);

  // Reset state when word changes
  useEffect(() => {
    setSelectedIndex(null);
    setShowResult(false);
  }, [word.id]);

  const handleSelect = useCallback((index: number) => {
    if (showResult) return;

    setSelectedIndex(index);
    setShowResult(true);

    // Auto-continue after delay
    const isCorrect = index === correctIndex;
    const delay = isCorrect ? 1000 : 2000;

    setTimeout(() => {
      const responseTime = Date.now() - startTime;
      let rating: UserRating;

      if (!isCorrect) {
        rating = 'again';
      } else if (responseTime < 3000) {
        rating = 'easy';
      } else if (responseTime < 6000) {
        rating = 'good';
      } else {
        rating = 'hard';
      }

      onRate(rating);
    }, delay);
  }, [showResult, correctIndex, startTime, onRate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResult) return;

      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < options.length) {
        handleSelect(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, options.length, handleSelect]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Question */}
      <div className="card p-6 text-center mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {showTerm ? 'Wat betekent' : 'Wat is het woord voor'}
        </p>
        <p className="text-2xl font-semibold">{question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;

          let className = 'card p-4 w-full text-left transition-all ';

          if (showResult) {
            if (isCorrect) {
              className += 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
            } else if (isSelected) {
              className += 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake';
            } else {
              className += 'opacity-50';
            }
          } else {
            className += 'hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer active:scale-98';
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={className}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="flex-1">{option}</span>
                {showResult && isCorrect && (
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
        Sneltoetsen: 1-4
      </p>
    </div>
  );
}
