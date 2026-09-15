import {
  NavLink,
} from "react-router-dom";

import {
  Award,
  BarChart3,
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import {
  useLanguage,
} from "../context/LanguageContext";


function Sidebar({
  isOpen = false,
  onClose = () => {},
}) {
  const { t } =
    useLanguage();


  const navClass = ({
    isActive,
  }) =>
    isActive
      ? "admin-nav-link active"
      : "admin-nav-link";


  const closeMobile = () => {
    onClose();
  };


  return (
    <aside
      className={
        isOpen
          ? "admin-sidebar admin-sidebar--open"
          : "admin-sidebar"
      }
    >

      <div className="admin-sidebar-brand">

        <div className="admin-brand-mark">
          <GraduationCap size={21} />
        </div>

        <div className="admin-brand-copy">
          <strong>ElmasrawyVerse</strong>
          <span>{t("shell.adminConsole")}</span>
        </div>

        <button
          type="button"
          className="admin-sidebar-close"
          onClick={onClose}
          aria-label={t("shell.closeNavigation")}
        >
          <X size={19} />
        </button>

      </div>


      <nav className="admin-sidebar-nav">

        <div className="admin-nav-group">
          <span className="admin-nav-label">
            {t("shell.overview")}
          </span>

          <NavLink
            to="/admin/dashboard"
            className={navClass}
            onClick={closeMobile}
          >
            <LayoutDashboard size={18} />
            <span>{t("common.dashboard")}</span>
          </NavLink>
        </div>


        <div className="admin-nav-group">
          <span className="admin-nav-label">
            {t("shell.people")}
          </span>

          <NavLink
            to="/admin/students"
            className={navClass}
            onClick={closeMobile}
          >
            <Users size={18} />
            <span>{t("admin.students")}</span>
          </NavLink>

          <NavLink
            to="/admin/instructors"
            className={navClass}
            onClick={closeMobile}
          >
            <UserRoundCheck size={18} />
            <span>{t("admin.instructors")}</span>
          </NavLink>

          <NavLink
            to="/admin/enrollments"
            className={navClass}
            onClick={closeMobile}
          >
            <GraduationCap size={18} />
            <span>{t("admin.enrollments")}</span>
          </NavLink>
        </div>


        <div className="admin-nav-group">
          <span className="admin-nav-label">
            {t("shell.learning")}
          </span>

          <NavLink
            to="/admin/courses"
            className={navClass}
            onClick={closeMobile}
          >
            <BookOpen size={18} />
            <span>{t("admin.courses")}</span>
          </NavLink>

          <NavLink
            to="/admin/assignments"
            className={navClass}
            onClick={closeMobile}
          >
            <ClipboardList size={18} />
            <span>{t("admin.assignments")}</span>
          </NavLink>

          <NavLink
            to="/admin/submissions"
            className={navClass}
            onClick={closeMobile}
          >
            <FileCheck2 size={18} />
            <span>{t("admin.submissions")}</span>
          </NavLink>
        </div>


        <div className="admin-nav-group">
          <span className="admin-nav-label">
            {t("shell.assessment")}
          </span>

          <NavLink
            to="/admin/questions"
            className={navClass}
            onClick={closeMobile}
          >
            <CircleHelp size={18} />
            <span>{t("shell.questionBank")}</span>
          </NavLink>

          <NavLink
            to="/admin/assessments"
            className={navClass}
            onClick={closeMobile}
          >
            <ClipboardCheck size={18} />
            <span>{t("shell.assessments")}</span>
          </NavLink>

          <NavLink
            to="/admin/assessment-results"
            className={navClass}
            onClick={closeMobile}
          >
            <BarChart3 size={18} />
            <span>{t("shell.results")}</span>
          </NavLink>

          <NavLink
            to="/admin/certificates"
            className={navClass}
            onClick={closeMobile}
          >
            <Award size={18} />
            <span>{t("shell.certificates")}</span>
          </NavLink>
        </div>

      </nav>


      <div className="admin-sidebar-footer">
        <span className="admin-system-dot" />

        <div>
          <strong>{t("shell.systemReady")}</strong>
          <span>ElmasrawyVerse</span>
        </div>
      </div>

    </aside>
  );
}


export default Sidebar;
