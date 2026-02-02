import { useEffect, useState } from 'react';
import { Flame, Trophy, Target, TrendingUp } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { getAllWords, getAllLists, getStats, getAllSessions } from '@/utils/db';
import { calculateMastery } from '@/utils/sm2';
import type { Word, WordList, AppStats, StudySession } from '@/types';

interface MasteryLevel {
  label: string;
  count: number;
  color: string;
}

export function Stats() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [lists, setLists] = useState<WordList[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [statsData, wordsData, listsData, sessionsData] = await Promise.all([
        getStats(),
        getAllWords(),
        getAllLists(),
        getAllSessions(),
      ]);

      setStats(statsData);
      setWords(wordsData);
      setLists(listsData);
      setSessions(sessionsData);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate mastery distribution
  const masteryLevels: MasteryLevel[] = [
    { label: 'Nieuw', count: 0, color: 'bg-slate-400' },
    { label: 'Leren', count: 0, color: 'bg-amber-500' },
    { label: 'Bekend', count: 0, color: 'bg-blue-500' },
    { label: 'Geleerd', count: 0, color: 'bg-emerald-500' },
  ];

  words.forEach(word => {
    const mastery = calculateMastery(word);
    if (mastery === 0) masteryLevels[0].count++;
    else if (mastery < 40) masteryLevels[1].count++;
    else if (mastery < 80) masteryLevels[2].count++;
    else masteryLevels[3].count++;
  });

  // Calculate overall stats
  const totalMastery = words.length > 0
    ? Math.round(words.reduce((sum, w) => sum + calculateMastery(w), 0) / words.length)
    : 0;

  const dueNow = words.filter(w => w.nextReview <= Date.now()).length;

  // Calculate accuracy from sessions
  const totalCorrect = sessions.reduce((sum, s) => sum + s.correct, 0);
  const totalIncorrect = sessions.reduce((sum, s) => sum + s.incorrect, 0);
  const accuracy = totalCorrect + totalIncorrect > 0
    ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
    : 0;

  // Recent activity (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter(s => s.startedAt > weekAgo);
  const wordsThisWeek = recentSessions.reduce((sum, s) => sum + s.wordsStudied, 0);

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold mb-1">Statistieken</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Je voortgang in cijfers
        </p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4 text-center">
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Dagen streak</p>
        </div>

        <div className="card p-4 text-center">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats?.longestStreak || 0}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Beste streak</p>
        </div>

        <div className="card p-4 text-center">
          <Target className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{accuracy}%</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Nauwkeurigheid</p>
        </div>

        <div className="card p-4 text-center">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{wordsThisWeek}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Deze week</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Totale voortgang</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {words.length} woorden in {lists.length} lijsten
            </p>
          </div>
          <ProgressRing progress={totalMastery} size={64} strokeWidth={5}>
            <span className="text-sm font-bold">{totalMastery}%</span>
          </ProgressRing>
        </div>

        {/* Mastery distribution */}
        <div className="space-y-2">
          {masteryLevels.map((level) => (
            <div key={level.label} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${level.color}`} />
              <span className="text-sm flex-1">{level.label}</span>
              <span className="text-sm font-medium">{level.count}</span>
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${level.color} transition-all`}
                  style={{
                    width: `${words.length > 0 ? (level.count / words.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="card p-4 mb-6">
        <h2 className="font-semibold mb-3">Samenvatting</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Totaal reviews</span>
            <span className="font-medium">{stats?.totalReviews || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Woorden geleerd</span>
            <span className="font-medium">{stats?.totalWordsLearned || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Nu te reviewen</span>
            <span className="font-medium text-primary-500">{dueNow}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Laatste sessie</span>
            <span className="font-medium">
              {stats?.lastStudyDate
                ? new Date(stats.lastStudyDate).toLocaleDateString('nl-NL')
                : 'Nog niet'}
            </span>
          </div>
        </div>
      </div>

      {/* Per list stats */}
      {lists.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Per lijst</h2>
          <div className="space-y-2">
            {lists.map(list => {
              const listWords = words.filter(w => w.listId === list.id);
              const listMastery = listWords.length > 0
                ? Math.round(listWords.reduce((sum, w) => sum + calculateMastery(w), 0) / listWords.length)
                : 0;
              const listDue = listWords.filter(w => w.nextReview <= Date.now()).length;

              return (
                <div key={list.id} className="card p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{list.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {listWords.length} woorden
                        {listDue > 0 && ` • ${listDue} te reviewen`}
                      </p>
                    </div>
                    <ProgressRing progress={listMastery} size={40} strokeWidth={3}>
                      <span className="text-xs font-bold">{listMastery}%</span>
                    </ProgressRing>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
