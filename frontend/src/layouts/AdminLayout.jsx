import {
  useState,
} from "react";

import {
  Outlet,
} from "react-router-dom";

import {
  Menu,
} from "lucide-react";

import Navbar
  from "../components/Navbar";

import Sidebar
  from "../components/Sidebar";

import {
  useLanguage,
} from "../context/LanguageContext";


function AdminLayout() {
  const { t } =
    useLanguage();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);


  return (
    <div className="ev-app">
      <Navbar />

      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
        aria-label={t("shell.openNavigation")}
      >
        <Menu size={21} />
      </button>

      <div className="admin-layout ev-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {sidebarOpen && (
          <button
            type="button"
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("shell.closeNavigation")}
          />
        )}

        <main className="admin-content ev-content">
          <div className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


export default AdminLayout;
