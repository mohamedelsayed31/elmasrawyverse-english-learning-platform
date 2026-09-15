import {
  Link,
  Outlet,
} from "react-router-dom";

import {
  GraduationCap,
  Mail,
} from "lucide-react";

import PublicNavbar
  from "../components/PublicNavbar";

import {
  useLanguage,
} from "../context/LanguageContext";


function PublicLayout() {
  const { t } =
    useLanguage();


  return (
    <div className="public-site">
      <PublicNavbar />

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="public-footer-brand">
            <span className="public-brand-mark">
              <GraduationCap size={22} />
            </span>

            <div>
              <strong>ElmasrawyVerse</strong>
              <p>{t("shell.footerDescription")}</p>
            </div>
          </div>

          <div className="public-footer-links">
            <Link to="/">{t("common.home")}</Link>
            <Link to="/courses">{t("common.courses")}</Link>
            <Link to="/login">{t("shell.signIn")}</Link>
            <Link to="/register">{t("auth.createAccount")}</Link>
          </div>

          <div className="public-footer-meta">
            <Mail size={15} />
            <span>ElmasrawyVerse © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


export default PublicLayout;
