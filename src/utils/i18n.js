import { createContext, useContext, useMemo, useState } from "react";
import DICT from "./i18nDict";

const I18nCtx = createContext({
  lang: "en",
  setLang: () => {},
  t: (k, ...args) =>
    typeof DICT.en[k] === "function" ? DICT.en[k](...args) : DICT.en[k] || k,
});

export function I18nProvider({ children }) {
  // Try to detect language from URL prefix (e.g., /en, /ar, etc.)

  const [lang, setLang] = useState("en");

  const t = useMemo(() => {
    const dict = DICT[lang] || DICT.en;
    return (key, ...args) => {
      const val = dict[key] ?? DICT.en[key] ?? key;
      return typeof val === "function" ? val(...args) : val;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
