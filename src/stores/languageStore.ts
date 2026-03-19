import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'uz' | 'ru';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ru',
      setLanguage: (language) => set({ language }),
    }),
    { name: '77ck-language' }
  )
);
