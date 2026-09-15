import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import PageLoader
  from "./PageLoader";


function StudentRoute({ children }) {
  const {
    user,
    loading,
  } = useAuth();


  if (loading) {
    return <PageLoader />;
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }


  return children;
}


export default StudentRoute;
