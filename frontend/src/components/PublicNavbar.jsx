import {
  useState,
} from "react";

import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Menu,
  UserPlus,
  X,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import LanguageToggle
  from "./LanguageToggle";


function PublicNavbar() {
  const navigate =
    useNavigate();

  const {
    user,
  } = useAuth();

  const { t } =
    useLanguage();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);


  const closeMenu = () => {
    setMenuOpen(false);
  };


  const dashboardPath =
    user?.role === "admin"
      ? "/admin/dashboard"
      : "/dashboard";


  const navClass = ({
    isActive,
  }) =>
    isActive
      ? "public-nav-link active"
      : "public-nav-link";


  return (
    <header className="public-navbar">

      <div className="public-navbar-inner">

        <Link
          to="/"
          className="public-brand"
          onClick={closeMenu}
        >
          <span className="public-brand-mark">
            <GraduationCap size={23} />
          </span>

          <span className="public-brand-copy">
            <strong>ElmasrawyVerse</strong>
            <small>{t("shell.englishPlatform")}</small>
          </span>
        </Link>


        <nav
          className={
            menuOpen
              ? "public-nav public-nav--open"
              : "public-nav"
          }
        >
          <NavLink
            to="/"
            className={navClass}
            onClick={closeMenu}
          >
            {t("common.home")}
          </NavLink>

          <NavLink
            to="/courses"
            className={navClass}
            onClick={closeMenu}
          >
            {t("common.courses")}
          </NavLink>

          <button
            type="button"
            className="public-mobile-close"
            onClick={closeMenu}
            aria-label={t("shell.closeMenu")}
          >
            <X size={20} />
          </button>
        </nav>


        <div className="public-navbar-actions">

          <LanguageToggle />

          {user ? (
            <button
              type="button"
              className="public-dashboard-btn"
              onClick={() =>
                navigate(
                  dashboardPath
                )
              }
            >
              <LayoutDashboard size={17} />
              <span>{t("common.dashboard")}</span>
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="public-login-btn"
              >
                <LogIn size={16} />
                <span>{t("shell.signIn")}</span>
              </Link>

              <Link
                to="/register"
                className="public-register-btn"
              >
                <UserPlus size={16} />
                <span>{t("shell.getStarted")}</span>
              </Link>
            </>
          )}

          <button
            type="button"
            className="public-menu-btn"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label={t("shell.openMenu")}
          >
            <Menu size={20} />
          </button>

        </div>

      </div>


      {menuOpen && (
        <button
          type="button"
          className="public-nav-overlay"
          onClick={closeMenu}
          aria-label={t("shell.closeMenu")}
        />
      )}

    </header>
  );
}


export default PublicNavbar;
