import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../features/authSlice";
import { authAPI } from "../services/api";

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const role = searchParams.get("role");
    const error = searchParams.get("error");

    if (error) {
      navigate("/login?error=oauth_failed");
      return;
    }

    if (!accessToken) {
      navigate("/login?error=no_token");
      return;
    }

    // Store tokens
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken || "");

    // Fetch user info
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        dispatch(loginSuccess({
          user: response.data.data,
          accessToken,
          refreshToken: refreshToken || "",
        }));

        // Redirect based on role
        const userRole = response.data.data.role || role;
        if (userRole === "DOCTOR") navigate("/doctor/dashboard");
        else if (userRole === "ADMIN") navigate("/admin/dashboard");
        else navigate("/patient/dashboard");
      } catch {
        navigate("/login?error=auth_failed");
      }
    };

    fetchUser();
  }, [searchParams, navigate, dispatch]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div className="spinner" style={{ width: 48, height: 48 }}></div>
      <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>Completing Google sign-in...</p>
    </div>
  );
};

export default GoogleOAuthCallback;
