import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLanguage } from '../types';
import { translations, languageNames, type TranslationKey } from './translations';

const SUPPORTED: SupportedLanguage[] = ['en', 'hi', 'te'];

// Maps a browser/device locale (e.g. "hi-IN", "te", "en-GB") to one of our
// supported languages, defaulting to English when nothing matches.
function detectLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    const code = raw?.slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(code as SupportedLanguage)) return code as SupportedLanguage;
  }
  return 'en';
}

interface LangState {
  lang: SupportedLanguage;
  // True until the person explicitly picks a language — lets us know it's
  // still safe to re-run auto-detection (e.g. if they switch browser locale).
  isAuto: boolean;
  setLang: (lang: SupportedLanguage) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: detectLanguage(),
      isAuto: true,
      setLang: (lang) => set({ lang, isAuto: false }),
    }),
    { name: 'fmc-lang' }
  )
);

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: TranslationKey) => translations[lang][key] ?? translations.en[key] ?? key;
}

export { languageNames, SUPPORTED as supportedLanguages };
