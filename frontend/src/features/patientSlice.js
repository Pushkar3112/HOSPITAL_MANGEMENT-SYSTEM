import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  appointments: [],
  medicalHistory: [],
  prescriptions: [],
  invoices: [],
  isLoading: false,
  error: null,
};

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    setAppointments: (state, action) => {
      state.appointments = action.payload;
    },
    setMedicalHistory: (state, action) => {
      state.medicalHistory = action.payload;
    },
    setPrescriptions: (state, action) => {
      state.prescriptions = action.payload;
    },
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    addAppointment: (state, action) => {
      state.appointments.push(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setProfile,
  setAppointments,
  setMedicalHistory,
  setPrescriptions,
  setInvoices,
  addAppointment,
  setLoading,
  setError,
} = patientSlice.actions;

export default patientSlice.reducer;
