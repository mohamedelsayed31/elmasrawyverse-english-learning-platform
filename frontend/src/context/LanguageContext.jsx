import {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  import en from "../translations/en";
  import ar from "../translations/ar";
  
  
  const LanguageContext = createContext();
  
  
  const languages = {
    en,
    ar,
  };
  
  
  export function LanguageProvider({ children }) {
  
    const [language, setLanguage] = useState(
      () =>
        localStorage.getItem("language") ||
        "en"
    );
  
  
    useEffect(() => {
  
      localStorage.setItem(
        "language",
        language
      );
  
      document.documentElement.lang =
        language;
  
      document.documentElement.dir =
        language === "ar"
          ? "rtl"
          : "ltr";
  
    }, [language]);
  
  
    const toggleLanguage = () => {
  
      setLanguage((currentLanguage) =>
        currentLanguage === "en"
          ? "ar"
          : "en"
      );
  
    };
  
  
    const t = (key) => {
  
      const translation = key
        .split(".")
        .reduce(
          (object, part) =>
            object?.[part],
          languages[language]
        );
  
  
      if (translation !== undefined) {
        return translation;
      }
  
  
      const englishFallback = key
        .split(".")
        .reduce(
          (object, part) =>
            object?.[part],
          en
        );
  
  
      return englishFallback ?? key;
    };


    const tr = (text) => {

      if (language !== "ar") {
        return text;
      }

      return ar.phrases?.[text] ?? text;
    };

  
  
    return (
      <LanguageContext.Provider
        value={{
          language,
          setLanguage,
          toggleLanguage,
          t,
          tr,
          isArabic:
            language === "ar",
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }
  
  
  export function useLanguage() {
  
    const context =
      useContext(LanguageContext);
  
  
    if (!context) {
      throw new Error(
        "useLanguage must be used inside LanguageProvider"
      );
    }
  
  
    return context;
  }