import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { WordEditor } from '@/components/WordEditor';
import { processImage } from '@/utils/ocr';
import { createList, createWords } from '@/utils/db';
import { getDefaultSM2Values } from '@/utils/sm2';
import type { OCRResult, ParsedWordPair } from '@/types';

type Step = 'upload' | 'review' | 'details';

export function Scan() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [confirmedPairs, setConfirmedPairs] = useState<ParsedWordPair[]>([]);

  // List details
  const [listName, setListName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('Nederlands');
  const [targetLanguage, setTargetLanguage] = useState('Frans');

  const handleImageSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await processImage(file, (prog, text) => {
        setProgress(prog);
        setProgressText(text);
      });

      setOcrResult(result);
      setStep('review');
    } catch (error) {
      console.error('OCR error:', error);
      alert('Er ging iets mis bij het verwerken van de afbeelding. Probeer het opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handlePairsConfirmed = useCallback((pairs: ParsedWordPair[]) => {
    setConfirmedPairs(pairs);
    setStep('details');
  }, []);

  const handleSave = useCallback(async () => {
    if (!listName.trim() || confirmedPairs.length === 0) return;

    try {
      // Create the list
      const list = await createList({
        name: listName.trim(),
        sourceLanguage,
        targetLanguage,
      });

      // Create words with default SM-2 values
      const wordsToCreate = confirmedPairs.map(pair => ({
        listId: list.id,
        term: pair.term,
        definition: pair.definition,
        ...getDefaultSM2Values(),
      }));

      await createWords(wordsToCreate);

      // Navigate to the new list
      navigate(`/lists/${list.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
    }
  }, [listName, sourceLanguage, targetLanguage, confirmedPairs, navigate]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            if (step === 'upload') navigate(-1);
            else if (step === 'review') setStep('upload');
            else setStep('review');
          }}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Scan woordenlijst</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {step === 'upload' && 'Maak een foto van je woordenlijst'}
            {step === 'review' && 'Controleer de herkende woorden'}
            {step === 'details' && 'Geef je lijst een naam'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {(['upload', 'review', 'details'] as const).map((s, i) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              step === s
                ? 'bg-primary-500'
                : i < ['upload', 'review', 'details'].indexOf(step)
                ? 'bg-primary-300'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div className="animate-fade-in">
          <ImageUpload
            onImageSelect={handleImageSelect}
            isProcessing={isProcessing}
            progress={progress}
            progressText={progressText}
          />

          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <h3 className="font-medium mb-2">Tips voor beste resultaten:</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Zorg voor goede belichting</li>
              <li>• Houd de tekst recht in beeld</li>
              <li>• Gebruik formaten zoals: "woord - betekenis"</li>
              <li>• Tabellen werken ook goed</li>
            </ul>
          </div>
        </div>
      )}

      {/* Review step */}
      {step === 'review' && ocrResult && (
        <div className="animate-fade-in">
          <WordEditor
            pairs={ocrResult.pairs}
            parseErrors={ocrResult.parseErrors}
            onSave={handlePairsConfirmed}
            onCancel={() => setStep('upload')}
          />
        </div>
      )}

      {/* Details step */}
      {step === 'details' && (
        <div className="animate-fade-in space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Naam van de lijst
            </label>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="bv. Franse woordjes hoofdstuk 3"
              className="input"
              autoFocus
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

          <div className="card p-4 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>{confirmedPairs.length}</strong> woordparen worden toegevoegd
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('review')}
              className="btn btn-secondary flex-1"
            >
              Terug
            </button>
            <button
              onClick={handleSave}
              disabled={!listName.trim()}
              className="btn btn-primary flex-1"
            >
              <Check className="w-5 h-5" />
              Opslaan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
