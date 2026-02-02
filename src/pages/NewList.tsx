import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import { createList, createWords } from '@/utils/db';
import { getDefaultSM2Values } from '@/utils/sm2';

interface WordPair {
  term: string;
  definition: string;
}

export function NewList() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('Nederlands');
  const [targetLanguage, setTargetLanguage] = useState('Frans');
  const [words, setWords] = useState<WordPair[]>([
    { term: '', definition: '' },
    { term: '', definition: '' },
    { term: '', definition: '' },
  ]);

  const handleUpdateWord = useCallback((index: number, field: 'term' | 'definition', value: string) => {
    setWords(prev => prev.map((w, i) =>
      i === index ? { ...w, [field]: value } : w
    ));
  }, []);

  const handleAddWord = useCallback(() => {
    setWords(prev => [...prev, { term: '', definition: '' }]);
  }, []);

  const handleRemoveWord = useCallback((index: number) => {
    setWords(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      alert('Geef je lijst een naam');
      return;
    }

    const validWords = words.filter(w => w.term.trim() && w.definition.trim());
    if (validWords.length === 0) {
      alert('Voeg minimaal één woordpaar toe');
      return;
    }

    try {
      const list = await createList({
        name: name.trim(),
        sourceLanguage,
        targetLanguage,
      });

      const wordsToCreate = validWords.map(w => ({
        listId: list.id,
        term: w.term.trim(),
        definition: w.definition.trim(),
        ...getDefaultSM2Values(),
      }));

      await createWords(wordsToCreate);

      navigate(`/lists/${list.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Er ging iets mis bij het opslaan');
    }
  }, [name, sourceLanguage, targetLanguage, words, navigate]);

  const validCount = words.filter(w => w.term.trim() && w.definition.trim()).length;

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Nieuwe lijst</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Maak handmatig een woordenlijst aan
          </p>
        </div>
      </div>

      {/* List details */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Naam van de lijst
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="bv. Franse woordjes hoofdstuk 3"
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Van (taal)
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="input"
            >
              <option>Nederlands</option>
              <option>Engels</option>
              <option>Frans</option>
              <option>Duits</option>
              <option>Spaans</option>
              <option>Italiaans</option>
              <option>Latijn</option>
              <option>Grieks</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Naar (taal)
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="input"
            >
              <option>Frans</option>
              <option>Nederlands</option>
              <option>Engels</option>
              <option>Duits</option>
              <option>Spaans</option>
              <option>Italiaans</option>
              <option>Latijn</option>
              <option>Grieks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Words */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Woorden</label>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {validCount} van {words.length}
          </span>
        </div>

        <div className="space-y-2">
          {words.map((word, index) => (
            <div key={index} className="card p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 w-6">{index + 1}</span>
                <input
                  type="text"
                  value={word.term}
                  onChange={(e) => handleUpdateWord(index, 'term', e.target.value)}
                  placeholder="Woord"
                  className="input py-2 text-sm flex-1"
                />
                <input
                  type="text"
                  value={word.definition}
                  onChange={(e) => handleUpdateWord(index, 'definition', e.target.value)}
                  placeholder="Betekenis"
                  className="input py-2 text-sm flex-1"
                />
                <button
                  onClick={() => handleRemoveWord(index)}
                  disabled={words.length <= 1}
                  className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddWord}
          className="btn btn-ghost w-full mt-3"
        >
          <Plus className="w-5 h-5" />
          Woord toevoegen
        </button>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!name.trim() || validCount === 0}
        className="btn btn-primary w-full"
      >
        <Check className="w-5 h-5" />
        Lijst opslaan ({validCount} woorden)
      </button>
    </div>
  );
}
