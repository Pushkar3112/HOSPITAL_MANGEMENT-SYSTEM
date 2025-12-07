import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import { MdLogout, MdPerson } from "react-icons/md";

export const TopBar = ({ title = "Dashboard" }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ fontSize: "24px", color: "#333", margin: 0 }}>{title}</h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          position: "relative",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "600", color: "#333" }}>
            {user?.name}
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
            {user?.email}
          </p>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
          }}
        >
          <MdPerson />
        </button>

        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: "50px",
              right: "0",
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 100,
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px 20px",
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#d62828",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <MdLogout /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
