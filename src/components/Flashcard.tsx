import { useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Word, UserRating } from '@/types';
import { getEstimatedIntervals } from '@/utils/sm2';

interface FlashcardProps {
  word: Word;
  showTerm: boolean; // true = show term first, false = show definition first
  onRate: (rating: UserRating) => void;
}

const ratingConfig: { rating: UserRating; label: string; color: string }[] = [
  { rating: 'again', label: 'Fout', color: 'bg-red-500 hover:bg-red-600' },
  { rating: 'hard', label: 'Moeilijk', color: 'bg-amber-500 hover:bg-amber-600' },
  { rating: 'good', label: 'Goed', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { rating: 'easy', label: 'Makkelijk', color: 'bg-blue-500 hover:bg-blue-600' },
];

export function Flashcard({ word, showTerm, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const front = showTerm ? word.term : word.definition;
  const back = showTerm ? word.definition : word.term;

  const intervals = getEstimatedIntervals(word);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleRate = useCallback((rating: UserRating) => {
    onRate(rating);
    setIsFlipped(false);
  }, [onRate]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    } else if (isFlipped) {
      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < ratingConfig.length) {
        handleRate(ratingConfig[index].rating);
      }
    }
  }, [handleFlip, handleRate, isFlipped]);

  return (
    <div
      className="w-full max-w-md mx-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Card */}
      <div
        className="flashcard h-64 cursor-pointer"
        onClick={handleFlip}
      >
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-front">
            <div>
              <p className="text-2xl font-semibold">{front}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                Tik om te draaien
              </p>
            </div>
          </div>

          {/* Back */}
          <div className="flashcard-back">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                {showTerm ? 'Betekenis' : 'Woord'}
              </p>
              <p className="text-2xl font-semibold">{back}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flip button */}
      <button
        onClick={handleFlip}
        className="btn btn-ghost mx-auto mt-4 flex"
      >
        <RotateCcw className="w-5 h-5" />
        <span>Draai kaart</span>
      </button>

      {/* Rating buttons - only show when flipped */}
      {isFlipped && (
        <div className="mt-6 animate-fade-in">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-3">
            Hoe ging het?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ratingConfig.map(({ rating, label, color }) => (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                className={`${color} text-white rounded-xl py-3 px-2 transition-all active:scale-95`}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs opacity-75 mt-1">
                  {intervals[rating]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Sneltoetsen: 1-4
          </p>
        </div>
      )}
    </div>
  );
}
