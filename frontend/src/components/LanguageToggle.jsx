import {
  Languages,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";


function LanguageToggle() {
  const {
    language,
    toggleLanguage,
    t,
  } = useLanguage();


  return (
    <button
      type="button"
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label={t("shell.changeLanguage")}
      title={t("shell.changeLanguage")}
    >
      <Languages size={17} />

      <span>
        {language === "en"
          ? "AR"
          : "EN"}
      </span>
    </button>
  );
}


export default LanguageToggle;
