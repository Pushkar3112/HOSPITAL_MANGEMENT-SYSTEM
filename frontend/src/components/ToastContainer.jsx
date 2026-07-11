import React from "react";
import { ToastContainer as ReactToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastContainer = () => (
  <ReactToastContainer
    position="top-right"
    autoClose={4000}
    hideProgressBar={false}
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="dark"
    toastStyle={{
      background: "rgba(8, 15, 28, 0.98)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "12px",
      backdropFilter: "blur(20px)",
      color: "#f0f4ff",
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5)",
    }}
  />
);

export default ToastContainer;
