import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Play, Plus, Trash2, Edit2, Check, X,
  BookOpen, Target, Clock
} from 'lucide-react';
import { getList, getWordsByList, deleteWord, createWord, updateWord, getDueWords } from '@/utils/db';
import { getDefaultSM2Values, getNextReviewText, calculateMastery } from '@/utils/sm2';
import { ProgressRing } from '@/components/ProgressRing';
import type { WordList, Word } from '@/types';

export function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<WordList | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDef, setEditDef] = useState('');

  // Add new word state
  const [showAdd, setShowAdd] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDef, setNewDef] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;

    setLoading(true);
    const [listData, wordsData, dueData] = await Promise.all([
      getList(id),
      getWordsByList(id),
      getDueWords(id),
    ]);

    if (!listData) {
      navigate('/lists');
      return;
    }

    setList(listData);
    setWords(wordsData);
    setDueWords(dueData);
    setLoading(false);
  }

  const handleStartEdit = useCallback((word: Word) => {
    setEditingId(word.id);
    setEditTerm(word.term);
    setEditDef(word.definition);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editTerm.trim() || !editDef.trim()) return;

    const word = words.find(w => w.id === editingId);
    if (word) {
      await updateWord({
        ...word,
        term: editTerm.trim(),
        definition: editDef.trim(),
      });
      await loadData();
    }

    setEditingId(null);
  }, [editingId, editTerm, editDef, words]);

  const handleDelete = useCallback(async (wordId: string) => {
    if (!confirm('Weet je zeker dat je dit woord wilt verwijderen?')) return;

    await deleteWord(wordId);
    await loadData();
  }, []);

  const handleAddWord = useCallback(async () => {
    if (!id || !newTerm.trim() || !newDef.trim()) return;

    await createWord({
      listId: id,
      term: newTerm.trim(),
      definition: newDef.trim(),
      ...getDefaultSM2Values(),
    });

    setNewTerm('');
    setNewDef('');
    setShowAdd(false);
    await loadData();
  }, [id, newTerm, newDef]);

  // Calculate stats
  const totalMastery = words.length > 0
    ? Math.round(words.reduce((sum, w) => sum + calculateMastery(w), 0) / words.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/lists')}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{list.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {list.sourceLanguage} → {list.targetLanguage}
          </p>
        </div>
      </div>

      {/* Stats card */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{words.length} woorden</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm">{dueWords.length} te reviewen</span>
            </div>
          </div>

          <ProgressRing progress={totalMastery} size={64} strokeWidth={5}>
            <span className="text-sm font-bold">{totalMastery}%</span>
          </ProgressRing>
        </div>

        {dueWords.length > 0 && (
          <Link
            to={`/practice/${list.id}`}
            className="btn btn-primary w-full mt-4"
          >
            <Play className="w-5 h-5" />
            Start review ({dueWords.length})
          </Link>
        )}
      </div>

      {/* Add word */}
      {showAdd ? (
        <div className="card p-4 mb-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Woord"
              className="input py-2"
              autoFocus
            />
            <input
              type="text"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              placeholder="Betekenis"
              className="input py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="btn btn-secondary btn-sm flex-1"
            >
              Annuleren
            </button>
            <button
              onClick={handleAddWord}
              disabled={!newTerm.trim() || !newDef.trim()}
              className="btn btn-primary btn-sm flex-1"
            >
              <Check className="w-4 h-4" />
              Toevoegen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="btn btn-ghost w-full mb-4"
        >
          <Plus className="w-5 h-5" />
          Woord toevoegen
        </button>
      )}

      {/* Words list */}
      <div className="space-y-2">
        {words.map(word => {
          const mastery = calculateMastery(word);
          const isEditing = editingId === word.id;

          return (
            <div key={word.id} className="card p-3">
              {isEditing ? (
                <div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                      className="input py-2 text-sm"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDef}
                      onChange={(e) => setEditDef(e.target.value)}
                      className="input py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn btn-ghost btn-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="btn btn-primary btn-sm"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{word.term}</span>
                      <span className="text-slate-400">—</span>
                      <span className="truncate text-slate-600 dark:text-slate-300">
                        {word.definition}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{mastery}% geleerd</span>
                      <span>Volgende: {getNextReviewText(word.nextReview)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartEdit(word)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(word.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {words.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            Deze lijst is nog leeg
          </p>
        </div>
      )}
    </div>
  );
}
