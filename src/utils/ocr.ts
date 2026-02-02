import Tesseract from 'tesseract.js';
import type { OCRResult, ParsedWordPair } from '@/types';

// Common separators for word pairs
const SEPARATORS = [
  /\s*[-–—]\s*/,      // Dashes
  /\s*[=]\s*/,        // Equals
  /\s*[:]\s*/,        // Colon
  /\s*[|]\s*/,        // Pipe
  /\t+/,              // Tab(s)
  /\s{3,}/,           // Multiple spaces
];

// Progress callback type
type ProgressCallback = (progress: number, status: string) => void;

export async function performOCR(
  imageSource: File | string,
  onProgress?: ProgressCallback
): Promise<string> {
  const worker = await Tesseract.createWorker('nld+fra+eng+deu', 1, {
    logger: (m) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100), 'Tekst herkennen...');
      }
    },
  });

  try {
    onProgress?.(0, 'OCR starten...');

    const { data: { text } } = await worker.recognize(imageSource);

    onProgress?.(100, 'Voltooid');
    return text;
  } finally {
    await worker.terminate();
  }
}

export function parseWordPairs(rawText: string): OCRResult {
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const pairs: ParsedWordPair[] = [];
  const parseErrors: string[] = [];

  for (const line of lines) {
    const pair = parseLine(line);
    if (pair) {
      pairs.push(pair);
    } else if (line.length > 2) {
      // Only report as error if line has meaningful content
      parseErrors.push(line);
    }
  }

  return {
    rawText,
    pairs,
    parseErrors,
  };
}

function parseLine(line: string): ParsedWordPair | null {
  // Try each separator
  for (const separator of SEPARATORS) {
    const parts = line.split(separator);
    if (parts.length >= 2) {
      const term = cleanWord(parts[0]);
      const definition = cleanWord(parts.slice(1).join(' '));

      if (term && definition) {
        // Calculate confidence based on cleanliness
        const confidence = calculateConfidence(term, definition);
        return { term, definition, confidence };
      }
    }
  }

  // Try to detect table format (fixed width columns)
  const tableMatch = detectTableFormat(line);
  if (tableMatch) {
    return tableMatch;
  }

  return null;
}

function cleanWord(word: string): string {
  return word
    .trim()
    // Remove common OCR artifacts
    .replace(/^[•·∙○●◦▪▫■□\-\*\d\.]+\s*/, '') // Bullet points, numbers
    .replace(/[^\p{L}\p{N}\s\-'.,()]/gu, '') // Keep only letters, numbers, basic punctuation
    .trim();
}

function calculateConfidence(term: string, definition: string): number {
  let confidence = 1.0;

  // Reduce confidence for very short words
  if (term.length < 2 || definition.length < 2) {
    confidence *= 0.5;
  }

  // Reduce confidence for words with numbers (often OCR errors)
  if (/\d/.test(term) || /\d/.test(definition)) {
    confidence *= 0.7;
  }

  // Reduce confidence for words with unusual characters
  if (/[^a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ\s\-']/.test(term + definition)) {
    confidence *= 0.8;
  }

  return Math.round(confidence * 100) / 100;
}

function detectTableFormat(line: string): ParsedWordPair | null {
  // Look for large gaps that might indicate table columns
  const gapMatch = line.match(/^(.{2,30})\s{4,}(.{2,})$/);
  if (gapMatch) {
    const term = cleanWord(gapMatch[1]);
    const definition = cleanWord(gapMatch[2]);
    if (term && definition) {
      return { term, definition, confidence: 0.7 }; // Lower confidence for table detection
    }
  }
  return null;
}

// Pre-process image for better OCR results
export function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Scale up small images
        const scale = Math.max(1, 1500 / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to grayscale and increase contrast
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

          // Increase contrast
          const contrast = 1.5;
          const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
          const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

          // Apply threshold for cleaner text
          const threshold = newGray > 140 ? 255 : 0;

          data[i] = threshold;
          data[i + 1] = threshold;
          data[i + 2] = threshold;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Full OCR pipeline
export async function processImage(
  file: File,
  onProgress?: ProgressCallback
): Promise<OCRResult> {
  onProgress?.(0, 'Afbeelding voorbereiden...');

  const preprocessed = await preprocessImage(file);

  onProgress?.(10, 'OCR starten...');

  const rawText = await performOCR(preprocessed, (progress, status) => {
    onProgress?.(10 + progress * 0.8, status);
  });

  onProgress?.(95, 'Woordparen herkennen...');

  const result = parseWordPairs(rawText);

  onProgress?.(100, 'Voltooid');

  return result;
}
