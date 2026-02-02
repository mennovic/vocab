import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Camera, Play, Flame, Target } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { getAllLists, getDueWords, getStats, getAllWords } from '@/utils/db';
import type { WordList, AppStats } from '@/types';

export function Home() {
  const [lists, setLists] = useState<WordList[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [totalWords, setTotalWords] = useState(0);
  const [masteredWords, setMasteredWords] = useState(0);

  useEffect(() => {
    async function loadData() {
      const [listsData, dueWords, statsData, allWords] = await Promise.all([
        getAllLists(),
        getDueWords(),
        getStats(),
        getAllWords(),
      ]);

      setLists(listsData);
      setDueCount(dueWords.length);
      setStats(statsData);
      setTotalWords(allWords.length);

      // Count mastered words (interval > 21 days)
      const mastered = allWords.filter(w => w.interval > 21).length;
      setMasteredWords(mastered);
    }

    loadData();
  }, []);

  const masteryPercent = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold mb-1">Vocab Flashcards</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Leer woordjes met spaced repetition
        </p>
      </div>

      {/* Stats overview */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">{stats?.currentStreak || 0} dagen streak</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalWords} woorden in {lists.length} lijsten
            </p>
          </div>

          <ProgressRing progress={masteryPercent} size={80} strokeWidth={6}>
            <div className="text-center">
              <span className="text-lg font-bold">{masteryPercent}%</span>
              <span className="text-xs text-slate-500 block">geleerd</span>
            </div>
          </ProgressRing>
        </div>
      </div>

      {/* Due words CTA */}
      {dueCount > 0 && (
        <Link to="/practice" className="block mb-6">
          <div className="card p-6 bg-primary-500 text-white hover:bg-primary-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm mb-1">Klaar voor review</p>
                <p className="text-2xl font-bold">{dueCount} woorden</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <Play className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link to="/scan" className="card p-4 hover:border-primary-500 transition-colors">
          <Camera className="w-8 h-8 text-primary-500 mb-2" />
          <p className="font-medium">Scan lijst</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Foto van woordenlijst
          </p>
        </Link>

        <Link to="/lists" className="card p-4 hover:border-primary-500 transition-colors">
          <BookOpen className="w-8 h-8 text-primary-500 mb-2" />
          <p className="font-medium">Mijn lijsten</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lists.length} lijsten
          </p>
        </Link>
      </div>

      {/* Recent lists */}
      {lists.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Recente lijsten</h2>
          <div className="space-y-3">
            {lists.slice(0, 3).map(list => (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                className="card p-4 flex items-center justify-between hover:border-primary-500 transition-colors"
              >
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {list.sourceLanguage} → {list.targetLanguage}
                  </p>
                </div>
                <Play className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Begin met leren!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Scan een woordenlijst of maak er handmatig een aan.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/scan" className="btn btn-primary">
              <Camera className="w-5 h-5" />
              Scan lijst
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
