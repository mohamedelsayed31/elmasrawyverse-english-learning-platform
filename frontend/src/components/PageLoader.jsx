import {
  useLanguage,
} from "../context/LanguageContext";


function PageLoader({ text }) {
  const { t } =
    useLanguage();


  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="loader-spinner" />
      <p>
        {text || t("shell.loadingPage")}
      </p>
    </div>
  );
}


export default PageLoader;
