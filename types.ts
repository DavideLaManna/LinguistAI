export enum AppMode {
  VARIATIONS = 'VARIATIONS', // Mode 1: 5 ways to say it
  CONTEXT = 'CONTEXT',       // Mode 2: 5 sentences using the word
  PARAPHRASE = 'PARAPHRASER'  // Mode 3: Rephrase source or target with specific tones
}

export enum ParaphraseTone {
  STANDARD = 'Standard',
  FLUENCY = 'Fluency',
  FORMAL = 'Formal',
  ACADEMIC = 'Academic',
  SIMPLE = 'Simple',
  CREATIVE = 'Creative',
  EXPAND = 'Expand',
  SHORTEN = 'Shorten'
}

export type ModelType = 'fast' | 'accurate';

export interface Language {
  code: string;
  name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'it', name: 'Italian' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

export const PARAPHRASE_TONES = Object.values(ParaphraseTone);

// API Response Types
export interface VariationResult {
  variations: string[];
}

export interface ContextExample {
  original: string;
  translated: string;
}

export interface ContextResult {
  examples: ContextExample[];
}

export interface ParaphraseState {
  sourceText: string;
  targetText: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  sourceLang: string;
  targetLang: string;
  inputText: string;
  modelType?: ModelType;
  variationResults?: string[];
  contextResults?: ContextExample[];
  paraphraseResult?: ParaphraseState; // For history restoration
}