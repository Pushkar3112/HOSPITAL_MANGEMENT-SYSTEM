import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
} from "../features/authSlice";
import { authService } from "../services";

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const login = async (email, password) => {
    dispatch(loginStart());
    try {
      const response = await authService.login(email, password);
      dispatch(loginSuccess(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      dispatch(loginFailure(message));
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch(loginStart());
    try {
      const response = await authService.register(userData);
      dispatch(loginSuccess(response.data.data));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      dispatch(loginFailure(message));
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    dispatch(logout());
    navigate("/login");
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const response = await authService.refreshToken(refreshToken);
        dispatch(setUser(response.data.data));
      }
    } catch (error) {
      logoutUser();
    }
  };

  return {
    ...auth,
    login,
    register,
    logout: logoutUser,
    refreshAccessToken,
  };
};

export default useAuth;
