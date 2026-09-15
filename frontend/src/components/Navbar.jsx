import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ExternalLink,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import LanguageToggle
  from "./LanguageToggle";


function Navbar() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const { t } =
    useLanguage();


  const name =
    user?.name ||
    "Admin";


  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase() ||
    "A";


  const handleLogout =
    async () => {
      try {
        if (
          typeof logout ===
          "function"
        ) {
          await logout();
        }
      } finally {
        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }
    };


  return (
    <header className="admin-topbar">

      <div className="admin-topbar-title">
        <span>{t("shell.administration")}</span>
        <strong>{t("shell.learningManagement")}</strong>
      </div>


      <div className="admin-topbar-actions">

        <LanguageToggle />

        <Link
          to="/"
          className="admin-topbar-link"
        >
          <ExternalLink size={15} />
          <span>{t("shell.website")}</span>
        </Link>


        <div className="admin-user-chip">
          <div className="admin-user-avatar">
            {initials}
          </div>

          <div>
            <strong>{name}</strong>
            <span>
              <ShieldCheck size={11} />
              {t("shell.administrator")}
            </span>
          </div>
        </div>


        <button
          type="button"
          className="admin-logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>{t("common.logout")}</span>
        </button>

      </div>

    </header>
  );
}


export default Navbar;
