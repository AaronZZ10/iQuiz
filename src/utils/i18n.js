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
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    } catch {}

    if (typeof window !== "undefined") {
      const fullPath = window.location.pathname;

      // Detect base prefix (e.g., "/iQuiz" on GitHub Pages)
      // Heuristic: first path segment that is NOT a language code
      const segments = fullPath.split("/").filter(Boolean);
      const isLang = (s) => /^[a-zA-Z-]{2,}$/.test(s);
      const basePrefix =
        segments.length && !isLang(segments[0]) ? `/${segments[0]}` : "";

      // Path without base
      const pathWithoutBase = basePrefix
        ? fullPath.slice(basePrefix.length) || "/"
        : fullPath;

      const match = pathWithoutBase.match(/^\/([a-zA-Z-]{2,})($|\/)/);

      let newPath;
      if (!match) {
        // No lang prefix, add it
        newPath = `${basePrefix}/${lang}${
          pathWithoutBase === "/" ? "" : pathWithoutBase
        }`;
      } else if (match[1] !== lang) {
        // Different lang prefix, replace it
        newPath = `${basePrefix}${pathWithoutBase.replace(
          /^\/[a-zA-Z-]{2,}/,
          `/${lang}`
        )}`;
      }

      if (newPath && newPath !== fullPath) {
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
