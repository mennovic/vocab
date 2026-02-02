import { useState, useCallback } from 'react';
import { Trash2, Plus, Check, AlertTriangle, GripVertical } from 'lucide-react';
import type { ParsedWordPair } from '@/types';

interface WordEditorProps {
  pairs: ParsedWordPair[];
  parseErrors: string[];
  onSave: (pairs: ParsedWordPair[]) => void;
  onCancel: () => void;
}

export function WordEditor({ pairs: initialPairs, parseErrors, onSave, onCancel }: WordEditorProps) {
  const [pairs, setPairs] = useState<ParsedWordPair[]>(initialPairs);

  const handleUpdate = useCallback((index: number, field: 'term' | 'definition', value: string) => {
    setPairs(prev => prev.map((pair, i) =>
      i === index ? { ...pair, [field]: value, confidence: 1 } : pair
    ));
  }, []);

  const handleDelete = useCallback((index: number) => {
    setPairs(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdd = useCallback(() => {
    setPairs(prev => [...prev, { term: '', definition: '', confidence: 1 }]);
  }, []);

  const handleAddFromError = useCallback((errorLine: string) => {
    // Try to split the error line manually
    const parts = errorLine.split(/\s+/);
    const mid = Math.ceil(parts.length / 2);
    const term = parts.slice(0, mid).join(' ');
    const definition = parts.slice(mid).join(' ');

    setPairs(prev => [...prev, { term, definition, confidence: 0.5 }]);
  }, []);

  const validPairs = pairs.filter(p => p.term.trim() && p.definition.trim());

  return (
    <div className="w-full">
      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {validPairs.length} woordparen herkend
        </p>
        <button
          onClick={handleAdd}
          className="btn btn-ghost btn-sm"
        >
          <Plus className="w-4 h-4" />
          Toevoegen
        </button>
      </div>

      {/* Word pairs */}
      <div className="space-y-3 mb-4">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className={`card p-3 ${pair.confidence < 0.7 ? 'border-amber-400' : ''}`}
          >
            <div className="flex items-start gap-2">
              <GripVertical className="w-5 h-5 text-slate-400 mt-3 flex-shrink-0 cursor-grab" />

              <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={pair.term}
                  onChange={(e) => handleUpdate(index, 'term', e.target.value)}
                  placeholder="Woord"
                  className="input py-2 text-sm"
                />
                <input
                  type="text"
                  value={pair.definition}
                  onChange={(e) => handleUpdate(index, 'definition', e.target.value)}
                  placeholder="Betekenis"
                  className="input py-2 text-sm"
                />
              </div>

              <button
                onClick={() => handleDelete(index)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {pair.confidence < 0.7 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 ml-7">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Lage zekerheid - controleer dit woordpaar
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Niet-herkende regels ({parseErrors.length})
          </p>
          <div className="space-y-2">
            {parseErrors.slice(0, 5).map((error, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
              >
                <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
                  {error}
                </span>
                <button
                  onClick={() => handleAddFromError(error)}
                  className="btn btn-ghost btn-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {parseErrors.length > 5 && (
              <p className="text-xs text-slate-400">
                +{parseErrors.length - 5} meer
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="btn btn-secondary flex-1"
        >
          Annuleren
        </button>
        <button
          onClick={() => onSave(validPairs)}
          disabled={validPairs.length === 0}
          className="btn btn-primary flex-1"
        >
          <Check className="w-5 h-5" />
          Opslaan ({validPairs.length})
        </button>
      </div>
    </div>
  );
}
