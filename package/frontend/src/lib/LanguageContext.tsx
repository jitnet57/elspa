'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Language } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // 초기 로드: localStorage에서 언어 설정 복원
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language | null;
    const browserLanguage = navigator.language.startsWith('ko') ? 'ko' : 'en';
    const initialLanguage = savedLanguage || browserLanguage;

    setLanguageState(initialLanguage as Language);
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'ko' : 'en';
    setLanguage(newLang);
  };

  if (!mounted) {
    return children; // SSR 안전성
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
