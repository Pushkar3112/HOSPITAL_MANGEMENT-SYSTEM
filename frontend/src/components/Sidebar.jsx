import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";
import { MdLogout } from "react-icons/md";

export const Sidebar = ({ items = [] }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#f5f5f5",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Logo/Brand */}
      <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
        <h2 style={{ color: "#0066cc", margin: 0, fontSize: "20px" }}>HMS</h2>
        <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
          {user?.role || "User"}
        </p>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "15px 0" }}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              width: "100%",
              padding: "15px 20px",
              textAlign: "left",
              border: "none",
              background:
                location.pathname === item.path ? "#e0e0e0" : "transparent",
              color: location.pathname === item.path ? "#0066cc" : "#333",
              fontWeight: location.pathname === item.path ? "600" : "500",
              cursor: "pointer",
              borderLeft:
                location.pathname === item.path
                  ? "4px solid #0066cc"
                  : "4px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              transition: "all 0.3s ease",
            }}
          >
            {item.icon && <span style={{ fontSize: "20px" }}>{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{ padding: "15px", borderTop: "1px solid #ddd" }}>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <MdLogout /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
