import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Play, ChevronRight, BookOpen } from 'lucide-react';
import { getAllLists, getWordsByList, deleteList, getDueWords } from '@/utils/db';
import type { WordList } from '@/types';

interface ListWithStats extends WordList {
  wordCount: number;
  dueCount: number;
}

export function Lists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ListWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    setLoading(true);
    const allLists = await getAllLists();

    const listsWithStats = await Promise.all(
      allLists.map(async (list) => {
        const words = await getWordsByList(list.id);
        const due = await getDueWords(list.id);
        return {
          ...list,
          wordCount: words.length,
          dueCount: due.length,
        };
      })
    );

    // Sort by most recently updated
    listsWithStats.sort((a, b) => b.updatedAt - a.updatedAt);

    setLists(listsWithStats);
    setLoading(false);
  }

  async function handleDelete(list: ListWithStats, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Weet je zeker dat je "${list.name}" wilt verwijderen? Alle ${list.wordCount} woorden worden ook verwijderd.`)) {
      return;
    }

    await deleteList(list.id);
    await loadLists();
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold">Mijn lijsten</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {lists.length} lijsten
          </p>
        </div>
        <Link to="/lists/new" className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Nieuw
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* Lists */}
      {!loading && lists.length > 0 && (
        <div className="space-y-3">
          {lists.map(list => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="card p-4 flex items-center gap-4 hover:border-primary-500 transition-colors"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-primary-500" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{list.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {list.wordCount} woorden • {list.sourceLanguage} → {list.targetLanguage}
                </p>
                {list.dueCount > 0 && (
                  <p className="text-sm text-primary-500 font-medium mt-1">
                    {list.dueCount} te reviewen
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {list.dueCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/practice/${list.id}`);
                    }}
                    className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDelete(list, e)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && lists.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Nog geen lijsten</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Maak je eerste woordenlijst aan
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/scan" className="btn btn-primary">
              Scan een lijst
            </Link>
            <Link to="/lists/new" className="btn btn-secondary">
              Handmatig maken
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
