import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "../features/authSlice";
import { authAPI } from "../services/api";

const navItems = {
  PATIENT: [
    { path: "/patient/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/patient/appointments", icon: "📅", label: "Appointments" },
    { path: "/patient/rag-chat", icon: "🤖", label: "AI Assistant" },
    { path: "/patient/chat", icon: "💬", label: "Messages" },
    { path: "/patient/medical-history", icon: "📋", label: "Medical History" },
    { path: "/patient/prescriptions", icon: "💊", label: "Prescriptions" },
    { path: "/patient/invoices", icon: "🧾", label: "Invoices" },
    { path: "/patient/profile", icon: "👤", label: "Profile" },
  ],
  DOCTOR: [
    { path: "/doctor/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/doctor/appointments", icon: "📅", label: "Appointments" },
    { path: "/doctor/templates", icon: "📋", label: "Rx Templates" },
    { path: "/doctor/chat", icon: "💬", label: "Messages" },
    { path: "/doctor/availability", icon: "🕐", label: "Availability" },
    { path: "/doctor/profile", icon: "👤", label: "Profile" },
  ],
  ADMIN: [
    { path: "/admin/dashboard", icon: "🏠", label: "Dashboard" },
    { path: "/admin/users", icon: "👥", label: "Users" },
    { path: "/admin/appointments", icon: "📅", label: "Appointments" },
  ],
};

const AppLayout = ({ children, title, subtitle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((s) => s.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch user if not loaded
  useEffect(() => {
    if (!user && accessToken) {
      authAPI.getMe().then((res) => dispatch(setUser(res.data.data))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const role = user?.role || "PATIENT";
  const items = navItems[role] || [];

  const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const roleColors = { PATIENT: "var(--accent-teal)", DOCTOR: "var(--accent-primary)", ADMIN: "var(--accent-rose)" };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99, display: "none" }} className="mobile-overlay" />
      )}

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <div>
            <div className="sidebar-logo-text">MedCare HMS</div>
            <div style={{ fontSize: 10, color: roleColors[role], fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{role}</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">
              {user?.avatar ? <img src={user.avatar} alt={user?.name} /> : getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{user?.name || "Loading..."}</div>
              <div className="user-role" style={{ color: roleColors[role] }}>{role?.toLowerCase()}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: 4, borderRadius: 6, transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={(e) => { e.target.style.color = "#ef4444"; e.target.style.background = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; e.target.style.background = "none"; }}
            >
              ↩
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Page Header */}
        {(title || subtitle) && (
          <div className="topbar">
            <div>
              {title && <h1 className="topbar-title">{title}</h1>}
              {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
