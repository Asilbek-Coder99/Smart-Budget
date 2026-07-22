import { createContext, useContext, useState, useCallback } from 'react';
import uz from '../i18n/uz.js';
import en from '../i18n/en.js';
import ru from '../i18n/ru.js';

const translations = { uz, en, ru };

export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
  { code: 'en', label: 'English',   flag: '🇺🇸' },
];

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(
    () => localStorage.getItem('lang') || 'uz'
  );

  // "dashboard.title" yoki "common.save" kabi key qabul qiladi
  const t = useCallback((key) => {
    const parts  = key.split('.');
    let   value  = translations[lang];
    for (const part of parts) {
      value = value?.[part];
    }
    // Tarjima topilmasa ingliz tilidagi matnni qaytaradi
    if (!value) {
      let fallback = translations['en'];
      for (const part of parts) fallback = fallback?.[part];
      return fallback || key;
    }
    return value;
  }, [lang]);

  const changeLang = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('lang', newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, t, changeLang, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
};
