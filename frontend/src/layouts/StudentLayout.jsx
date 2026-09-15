import {
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useLanguage,
} from "../context/LanguageContext";

import LanguageToggle
  from "../components/LanguageToggle";


function StudentLayout() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const { t } =
    useLanguage();

  const [
    open,
    setOpen,
  ] = useState(false);


  const name =
    user?.student?.name ||
    user?.name ||
    "Student";


  const navClass = ({
    isActive,
  }) =>
    isActive
      ? "student-nav-link active"
      : "student-nav-link";


  const close = () => {
    setOpen(false);
  };


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
    <div className="premium-student-shell">

      <aside
        className={
          open
            ? "premium-student-sidebar open"
            : "premium-student-sidebar"
        }
      >

        <div className="student-brand">
          <div className="student-brand-mark">
            <GraduationCap size={21} />
          </div>

          <div>
            <strong>ElmasrawyVerse</strong>
            <span>{t("shell.studentPortal")}</span>
          </div>

          <button
            type="button"
            className="student-sidebar-close"
            onClick={close}
            aria-label={t("shell.closeNavigation")}
          >
            <X size={19} />
          </button>
        </div>


        <nav className="student-nav">
          <NavLink
            to="/dashboard"
            className={navClass}
            onClick={close}
          >
            <LayoutDashboard size={18} />
            <span>{t("common.dashboard")}</span>
          </NavLink>

          <NavLink
            to="/my-courses"
            className={navClass}
            onClick={close}
          >
            <BookOpen size={18} />
            <span>{t("student.myCourses")}</span>
          </NavLink>

          <NavLink
            to="/my-assignments"
            className={navClass}
            onClick={close}
          >
            <ClipboardList size={18} />
            <span>{t("shell.assignments")}</span>
          </NavLink>

          <NavLink
            to="/my-submissions"
            className={navClass}
            onClick={close}
          >
            <FileCheck2 size={18} />
            <span>{t("shell.submissions")}</span>
          </NavLink>

          <NavLink
            to="/student/assessments"
            className={navClass}
            onClick={close}
          >
            <ClipboardCheck size={18} />
            <span>{t("shell.assessments")}</span>
          </NavLink>

          <NavLink
            to="/my-progress"
            className={navClass}
            onClick={close}
          >
            <BarChart3 size={18} />
            <span>{t("shell.progress")}</span>
          </NavLink>

          <NavLink
            to="/student/certificates"
            className={navClass}
            onClick={close}
          >
            <Award size={18} />
            <span>{t("shell.certificates")}</span>
          </NavLink>
        </nav>


        <div className="student-sidebar-bottom">
          <button
            type="button"
            className="student-signout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>{t("common.logout")}</span>
          </button>
        </div>

      </aside>


      {open && (
        <button
          type="button"
          className="premium-drawer-overlay"
          onClick={close}
          aria-label={t("shell.closeNavigation")}
        />
      )}


      <div className="premium-student-main">

        <header className="premium-student-topbar">
          <button
            type="button"
            className="student-mobile-menu"
            onClick={() =>
              setOpen(true)
            }
            aria-label={t("shell.openNavigation")}
          >
            <Menu size={20} />
          </button>

          <div className="student-topbar-name">
            <span>{t("shell.welcomeBack")}</span>
            <strong>{name}</strong>
          </div>

          <div className="student-topbar-actions">
            <LanguageToggle />

            <button
              type="button"
              className="student-topbar-signout"
              onClick={handleLogout}
              aria-label={t("common.logout")}
              title={t("common.logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>


        <main className="premium-student-content">
          <div className="premium-page-motion">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}


export default StudentLayout;
