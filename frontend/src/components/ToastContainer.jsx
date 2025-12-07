import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../features/uiSlice";
import {
  MdCheckCircle,
  MdError,
  MdWarning,
  MdInfoOutline,
} from "react-icons/md";

const Toast = ({ toast }) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const icons = {
    success: <MdCheckCircle />,
    error: <MdError />,
    warning: <MdWarning />,
    info: <MdInfoOutline />,
  };

  return (
    <div className={`toast ${toast.type || "info"}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {icons[toast.type || "info"]}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useSelector((state) => state.ui.toasts);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
