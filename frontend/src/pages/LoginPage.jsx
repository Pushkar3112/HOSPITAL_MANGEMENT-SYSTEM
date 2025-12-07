import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(credentials.email, credentials.password);

      if (result.user.role === "PATIENT") {
        navigate("/patient/dashboard");
      } else if (result.user.role === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else if (result.user.role === "ADMIN") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Demo credentials
  const demoAccounts = [
    { email: "john@example.com", password: "patient123", role: "Patient" },
    { email: "rajesh@hms.com", password: "doctor123", role: "Doctor" },
    { email: "admin@hms.com", password: "admin123", role: "Admin" },
  ];

  const handleDemoLogin = (email, password) => {
    setCredentials({ email, password });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <div className="card">
          <h2
            style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}
          >
            Login to HMS
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: "#ffe0e0",
                color: "#c41e3a",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "20px" }}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Demo Accounts */}
          <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "15px",
                textAlign: "center",
              }}
            >
              Demo Credentials (for testing)
            </p>
            <div style={{ display: "grid", gap: "10px" }}>
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() =>
                    handleDemoLogin(account.email, account.password)
                  }
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: "#f9f9f9",
                    cursor: "pointer",
                    fontSize: "12px",
                    textAlign: "center",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#f9f9f9";
                  }}
                >
                  <strong>{account.role}:</strong> {account.email}
                </button>
              ))}
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginTop: "20px",
              marginBottom: 0,
            }}
          >
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "none",
                border: "none",
                color: "#0066cc",
                cursor: "pointer",
                textDecoration: "underline",
                fontWeight: "600",
              }}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
