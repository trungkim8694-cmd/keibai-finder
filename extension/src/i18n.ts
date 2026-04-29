import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ja from './locales/ja.json';
import en from './locales/en.json';
import vi from './locales/vi.json';
import zhCN from './locales/zh-CN.json';

const resources = {
  ja: ja,
  en: en,
  vi: vi,
  'zh-CN': zhCN,
  zh: zhCN // fallback for generic 'zh'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
