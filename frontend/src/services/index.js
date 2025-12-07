import apiClient from "./api";

export const authService = {
  register: (data) => apiClient.post("/auth/register", data),
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),
  refreshToken: (refreshToken) =>
    apiClient.post("/auth/refresh", { refreshToken }),
  logout: () => apiClient.post("/auth/logout"),
};

export const patientService = {
  getProfile: () => apiClient.get("/patients/profile"),
  updateProfile: (data) => apiClient.put("/patients/profile", data),
  getAppointments: (status) =>
    apiClient.get("/patients/appointments", { params: { status } }),
  cancelAppointment: (appointmentId) =>
    apiClient.delete(`/patients/appointments/${appointmentId}`),
  getMedicalHistory: () => apiClient.get("/patients/history"),
  getPrescriptions: () => apiClient.get("/patients/prescriptions"),
  getInvoices: () => apiClient.get("/patients/invoices"),
};

export const doctorService = {
  getProfile: () => apiClient.get("/doctors/profile"),
  updateProfile: (data) => apiClient.put("/doctors/profile", data),
  getAppointments: (filters) =>
    apiClient.get("/doctors/appointments", { params: filters }),
  confirmAppointment: (appointmentId) =>
    apiClient.patch(`/doctors/appointments/${appointmentId}/confirm`),
  completeAppointment: (appointmentId) =>
    apiClient.patch(`/doctors/appointments/${appointmentId}/complete`),
  getAvailableSlots: (date) =>
    apiClient.get("/doctors/slots", { params: { date } }),
  createPrescription: (data) => apiClient.post("/doctors/prescriptions", data),
  getPrescriptions: () => apiClient.get("/doctors/prescriptions"),
  createMedicalRecord: (data) =>
    apiClient.post("/doctors/medical-records", data),
};

export const adminService = {
  getStats: () => apiClient.get("/admin/stats"),
  getUsers: (filters) => apiClient.get("/admin/users", { params: filters }),
  approveDoctor: (doctorId) =>
    apiClient.patch(`/admin/doctors/${doctorId}/approve`),
  rejectDoctor: (doctorId) =>
    apiClient.delete(`/admin/doctors/${doctorId}/reject`),
  blockUser: (userId) => apiClient.patch(`/admin/users/${userId}/block`),
  unblockUser: (userId) => apiClient.patch(`/admin/users/${userId}/unblock`),
  getAppointments: (filters) =>
    apiClient.get("/admin/appointments", { params: filters }),
  getInvoices: (filters) =>
    apiClient.get("/admin/invoices", { params: filters }),
};

export const doctorSearchService = {
  searchDoctors: (filters) =>
    apiClient.get("/doctor-search/search", { params: filters }),
  getDoctorDetail: (doctorId) => apiClient.get(`/doctor-search/${doctorId}`),
  getDoctorSlots: (doctorId, date) =>
    apiClient.get(`/doctor-search/${doctorId}/slots`, { params: { date } }),
};

export const appointmentService = {
  createAppointment: (data) => apiClient.post("/appointments", data),
  verifyPayment: (data) => apiClient.post("/appointments/verify-payment", data),
  checkSymptoms: (data) => apiClient.post("/symptom-checker", data),
};

export const symptomCheckerService = {
  checkSymptoms: (data) => apiClient.post("/symptom-checker", data),
};
