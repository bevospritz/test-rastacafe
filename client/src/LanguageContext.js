import React, { createContext, useContext, useState } from "react";
import translations from "./translations";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(
    localStorage.getItem("lang") || "IT"
  );

  const toggleLang = () => {
    const newLang = lang === "IT" ? "PT" : "IT";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = (key) => {
    const keys = key.split(".");
    let val = translations[lang];
    for (const k of keys) val = val?.[k];
    return val || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);