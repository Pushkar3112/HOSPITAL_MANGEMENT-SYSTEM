import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import store from "./features/store";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GoogleOAuthCallback from "./pages/GoogleOAuthCallback";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfile from "./pages/PatientProfile";
import MedicalHistory from "./pages/MedicalHistory";
import RAGChatbot from "./pages/RAGChatbot";
import AppointmentBooking from "./pages/AppointmentBooking";
import PatientDoctorChat from "./pages/PatientDoctorChat";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorAvailability from "./pages/DoctorAvailability";
import DoctorChatPage from "./pages/DoctorChatPage";
import PrescriptionTemplates from "./pages/PrescriptionTemplates";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAppointments from "./pages/AdminAppointments";
import Prescriptions from "./pages/Prescriptions";
import Invoices from "./pages/Invoices";

import "./index.css";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />

          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="PATIENT"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/appointments" element={<ProtectedRoute requiredRole="PATIENT"><AppointmentBooking /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute requiredRole="PATIENT"><PatientProfile /></ProtectedRoute>} />
          <Route path="/patient/medical-history" element={<ProtectedRoute requiredRole="PATIENT"><MedicalHistory /></ProtectedRoute>} />
          <Route path="/patient/rag-chat" element={<ProtectedRoute requiredRole="PATIENT"><RAGChatbot /></ProtectedRoute>} />
          <Route path="/patient/prescriptions" element={<ProtectedRoute requiredRole="PATIENT"><Prescriptions /></ProtectedRoute>} />
          <Route path="/patient/invoices" element={<ProtectedRoute requiredRole="PATIENT"><Invoices /></ProtectedRoute>} />
          <Route path="/patient/chat" element={<ProtectedRoute requiredRole="PATIENT"><PatientDoctorChat /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/doctor/profile" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorProfile /></ProtectedRoute>} />
          <Route path="/doctor/availability" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorAvailability /></ProtectedRoute>} />
          <Route path="/doctor/chat" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorChatPage /></ProtectedRoute>} />
          <Route path="/doctor/templates" element={<ProtectedRoute requiredRole="DOCTOR"><PrescriptionTemplates /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute requiredRole="ADMIN"><AdminAppointments /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </Router>
    </Provider>
  );
}

export default App;
