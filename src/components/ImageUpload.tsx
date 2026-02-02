import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isProcessing?: boolean;
  progress?: number;
  progressText?: string;
}

export function ImageUpload({
  onImageSelect,
  isProcessing = false,
  progress = 0,
  progressText = '',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Selecteer een afbeelding');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  }, [onImageSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  return (
    <div className="w-full">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview */}
      {preview && (
        <div className="relative mb-4 animate-fade-in">
          <img
            src={preview}
            alt="Preview"
            className="w-full rounded-xl object-contain max-h-64"
          />
          {!isProcessing && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Progress overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
              <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white text-sm mt-2">{progressText}</p>
            </div>
          )}
        </div>
      )}

      {/* Upload area */}
      {!preview && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center transition-colors
            ${dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-slate-300 dark:border-slate-600'
            }
          `}
        >
          <ImageIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Sleep een foto hierheen of
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="btn btn-primary"
            >
              <Camera className="w-5 h-5" />
              Maak foto
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
            >
              <Upload className="w-5 h-5" />
              Upload bestand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
