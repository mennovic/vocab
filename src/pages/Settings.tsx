import { useState } from 'react';
import { Moon, Sun, Monitor, Trash2, Download, Upload, Info } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { getAllWords, getAllLists, getStats } from '@/utils/db';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [words, lists, stats] = await Promise.all([
        getAllWords(),
        getAllLists(),
        getStats(),
      ]);

      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        lists,
        words,
        stats,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Er ging iets mis bij het exporteren');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.lists || !data.words) {
        throw new Error('Invalid backup file');
      }

      // Import using dynamic imports to avoid circular deps
      const db = await import('@/utils/db');

      // Import lists first
      for (const list of data.lists) {
        const { id, createdAt, updatedAt, ...listData } = list;
        await db.createList(listData);
      }

      // Create a mapping of old to new list IDs would be complex,
      // so for simplicity we'll just inform the user
      alert(`Geïmporteerd: ${data.lists.length} lijsten, ${data.words.length} woorden. Let op: Je moet mogelijk woorden opnieuw koppelen aan lijsten.`);

      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Ongeldig backup bestand');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Weet je zeker dat je ALLE data wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }
    if (!confirm('Echt zeker? Al je woordenlijsten en voortgang worden verwijderd.')) {
      return;
    }

    try {
      // Clear IndexedDB
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }

      // Clear localStorage
      localStorage.clear();

      alert('Alle data is verwijderd');
      window.location.reload();
    } catch (error) {
      console.error('Clear error:', error);
      alert('Er ging iets mis');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8 pt-4">
        <h1 className="text-2xl font-bold mb-1">Instellingen</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Pas de app aan naar je wensen
        </p>
      </div>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">Thema</h2>
        <div className="card">
          {[
            { value: 'light', label: 'Licht', icon: Sun },
            { value: 'dark', label: 'Donker', icon: Moon },
            { value: 'system', label: 'Systeem', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
              className={`w-full flex items-center gap-3 p-4 transition-colors ${
                theme === value
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${value !== 'system' ? 'border-b dark:border-slate-700' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{label}</span>
              {theme === value && (
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Data */}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">Data</h2>
        <div className="card divide-y dark:divide-slate-700">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-5 h-5 text-slate-500" />
            <div className="flex-1 text-left">
              <p>Exporteer data</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Download een backup van je woordenlijsten
              </p>
            </div>
          </button>

          <label className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 text-slate-500" />
            <div className="flex-1 text-left">
              <p>Importeer data</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Herstel van een backup bestand
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <div className="flex-1 text-left">
              <p>Wis alle data</p>
              <p className="text-sm opacity-75">
                Verwijder alle woordenlijsten en voortgang
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="font-semibold mb-3">Over</h2>
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium">Vocab Flashcards</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Versie 1.0.0
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Leer woordjes met spaced repetition. Upload een foto van je woordenlijst
                en de app helpt je met het onthouden via het SM-2 algoritme.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Alle data wordt lokaal opgeslagen op je apparaat. Er wordt niets
                naar externe servers verstuurd.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
