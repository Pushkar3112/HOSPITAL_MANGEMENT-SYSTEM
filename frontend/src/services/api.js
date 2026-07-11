import axios from "axios";
import store from "../features/store";
import { logout } from "../features/authSlice";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = store.getState().auth.refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          const newToken = response.data.data.accessToken;
          localStorage.setItem("accessToken", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          store.dispatch(logout());
          window.location.href = "/login";
        }
      } else {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  refresh: (token) => api.post("/auth/refresh", { refreshToken: token }),
  logout: () => api.post("/auth/logout"),
};

// Patient — all paths match backend patientRoutes.js
export const patientAPI = {
  getProfile: () => api.get("/patients/profile"),
  updateProfile: (data) => api.put("/patients/profile", data),
  getAppointments: (params) => api.get("/patients/appointments", { params }),
  cancelAppointment: (id) => api.patch(`/patients/appointments/${id}/cancel`),  // PATCH
  getMedicalHistory: () => api.get("/patients/medical-records"),                // matches route
  getPrescriptions: () => api.get("/patients/prescriptions"),
  getInvoices: () => api.get("/patients/invoices"),
  getDashboardStats: () => api.get("/patients/dashboard"),                       // matches /dashboard
};

// Doctor — all paths match backend doctorRoutes.js
export const doctorAPI = {
  getProfile: () => api.get("/doctors/profile"),
  updateProfile: (data) => api.put("/doctors/profile", data),
  getAppointments: (params) => api.get("/doctors/appointments", { params }),
  confirmAppointment: (id) => api.patch(`/doctors/appointments/${id}/confirm`),
  completeAppointment: (id) => api.patch(`/doctors/appointments/${id}/complete`),
  getSlots: (params) => api.get("/doctors/slots", { params }),
  createPrescription: (data) => api.post("/doctors/prescriptions", data),
  getPrescriptions: () => api.get("/doctors/prescriptions"),
  sendPrescription: (data) => api.post("/doctors/prescriptions/send", data),
  createMedicalRecord: (data) => api.post("/doctors/medical-records", data),
  getTemplates: () => api.get("/doctors/templates"),
  createTemplate: (data) => api.post("/doctors/templates", data),
  updateTemplate: (id, data) => api.put(`/doctors/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/doctors/templates/${id}`),
  getPatients: () => api.get("/doctors/patients"),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params) => api.get("/admin/users", { params }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  verifyDoctor: (id) => api.put(`/admin/doctors/${id}/verify`),
  getAppointments: (params) => api.get("/admin/appointments", { params }),
};

// Appointments
export const appointmentAPI = {
  create: (data) => api.post("/appointments", data),
  getById: (id) => api.get(`/appointments/${id}`),
  updateNotes: (id, data) => api.put(`/appointments/${id}/notes`, data),
};

// Doctor search — base path matches backend doctorSearchRoutes.js
export const searchAPI = {
  searchDoctors: (params) => api.get("/doctor-search", { params }),      // matches GET /
  getDoctorById: (id) => api.get(`/doctor-search/${id}`),
  getSlots: (doctorId, params) => api.get(`/doctor-search/${doctorId}/slots`, { params }),
};

// Chat
export const chatAPI = {
  getSessions: () => api.get("/chat/sessions"),
  getHistory: (sessionId, params) => api.get(`/chat/sessions/${sessionId}/messages`, { params }),
  startSession: (data) => api.post("/chat/sessions", data),
  getUnreadCount: () => api.get("/chat/unread-count"),
};

// RAG Chatbot
export const ragAPI = {
  query: (data) => api.post("/rag-chat/query", data),
  health: () => api.get("/rag-chat/health"),
};

export default api;
