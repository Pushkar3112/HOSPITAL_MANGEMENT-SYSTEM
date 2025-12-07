import React from "react";

export const Card = ({ children, title, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <h3 style={{ margin: "0 0 15px 0", color: "#333", fontSize: "18px" }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export const StatCard = ({ icon, label, value, color = "primary" }) => {
  const colors = {
    primary: "#0066cc",
    success: "#06a77d",
    warning: "#f4a460",
    danger: "#d62828",
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div
          style={{
            fontSize: "40px",
            color: colors[color],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>{label}</p>
          <p
            style={{
              margin: "5px 0 0 0",
              fontSize: "28px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card;
