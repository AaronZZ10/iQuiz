import { createContext, useContext, useEffect, useMemo, useState } from "react";
import DICT from "./i18nDict";

const I18nCtx = createContext({
  lang: "en",
  setLang: () => {},
  t: (k, ...args) =>
    typeof DICT.en[k] === "function" ? DICT.en[k](...args) : DICT.en[k] || k,
});

export function I18nProvider({ children }) {
  // Try to detect language from URL prefix (e.g., /en, /ar, etc.)
  const supportedLangs = Object.keys(DICT);
  function detectLangFromUrl() {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname;
    const match = path.match(/^\/([a-zA-Z-]{2,})($|\/)/);
    if (match && supportedLangs.includes(match[1])) {
      return match[1];
    }
    return null;
  }

  const [lang, setLang] = useState(() => {
    // 1. Try URL
    const urlLang = detectLangFromUrl();
    if (urlLang) return urlLang;
    // 2. Try localStorage
    return localStorage.getItem("iquiz.lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("iquiz.lang", lang);
    try {
      document.documentElement.setAttribute("lang", lang);
      if (lang === "ar") document.documentElement.dir = "rtl";
      else document.documentElement.dir = "ltr";
    } catch {}

    // URL synchronization: update path to include /lang prefix if missing or changed
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const match = path.match(/^\/([a-zA-Z-]{2,})($|\/)/);
      let newPath;
      if (!match) {
        // No lang prefix, add it
        newPath = `/${lang}${path === "/" ? "" : path}`;
      } else if (match[1] !== lang) {
        // Different lang prefix, replace it
        newPath = path.replace(/^\/[a-zA-Z-]{2,}/, `/${lang}`);
      }
      if (newPath && newPath !== path) {
        window.history.replaceState(
          window.history.state,
          "",
          newPath + window.location.search + window.location.hash
        );
      }
    }
  }, [lang]);

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
