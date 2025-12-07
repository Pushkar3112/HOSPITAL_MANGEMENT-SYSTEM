import React from "react";
import { MdClose } from "react-icons/md";

export const Modal = ({ isOpen, title, children, onClose, size = "md" }) => {
  if (!isOpen) return null;

  const widths = {
    sm: "400px",
    md: "600px",
    lg: "800px",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: widths[size] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "15px",
            borderBottom: "1px solid #eee",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", color: "#333" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            <MdClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
