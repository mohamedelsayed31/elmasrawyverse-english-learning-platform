import {
  ArrowLeft,
  Home,
  SearchX,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useLanguage,
} from "../context/LanguageContext";


function NotFound() {
  const navigate =
    useNavigate();

  const { t } =
    useLanguage();


  return (
    <div className="premium-not-found">
      <div className="premium-not-found-card">
        <div className="premium-not-found-icon">
          <SearchX size={39} />
        </div>

        <span>{t("notFound.error")}</span>
        <h1>{t("notFound.title")}</h1>
        <p>{t("notFound.description")}</p>

        <div className="premium-not-found-actions">
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
          >
            <ArrowLeft size={16} />
            {t("common.back") || "Back"}
          </button>

          <button
            type="button"
            className="primary"
            onClick={() =>
              navigate("/")
            }
          >
            <Home size={16} />
            {t("notFound.backHome")}
          </button>
        </div>
      </div>
    </div>
  );
}


export default NotFound;
