import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  appointments: [],
  prescriptions: [],
  isLoading: false,
  error: null,
};

const doctorSlice = createSlice({
  name: "doctor",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    setAppointments: (state, action) => {
      state.appointments = action.payload;
    },
    setPrescriptions: (state, action) => {
      state.prescriptions = action.payload;
    },
    updateAppointment: (state, action) => {
      const index = state.appointments.findIndex(
        (apt) => apt._id === action.payload._id
      );
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
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
  setPrescriptions,
  updateAppointment,
  setLoading,
  setError,
} = doctorSlice.actions;

export default doctorSlice.reducer;
