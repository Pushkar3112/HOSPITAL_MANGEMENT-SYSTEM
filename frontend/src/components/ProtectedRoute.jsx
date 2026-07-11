import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import { useDispatch } from "react-redux";
import { setUser, logout } from "../features/authSlice";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, accessToken } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [loading, setLoading] = useState(!user && !!accessToken);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    if (!user && accessToken) {
      authAPI.getMe()
        .then((res) => {
          dispatch(setUser(res.data.data));
          setLoading(false);
        })
        .catch(() => {
          dispatch(logout());
          setAuthFailed(true);
          setLoading(false);
        });
    }
  }, [user, accessToken, dispatch]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <p style={{ color: "var(--text-secondary)" }}>Loading your account...</p>
      </div>
    );
  }

  if (!accessToken || authFailed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && requiredRole && user.role !== requiredRole) {
    // Redirect to correct dashboard
    const redirectMap = { PATIENT: "/patient/dashboard", DOCTOR: "/doctor/dashboard", ADMIN: "/admin/dashboard" };
    return <Navigate to={redirectMap[user.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
