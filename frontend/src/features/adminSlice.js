import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stats: null,
  users: [],
  appointments: [],
  invoices: [],
  isLoading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setAppointments: (state, action) => {
      state.appointments = action.payload;
    },
    setInvoices: (state, action) => {
      state.invoices = action.payload;
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
  setStats,
  setUsers,
  setAppointments,
  setInvoices,
  setLoading,
  setError,
} = adminSlice.actions;

export default adminSlice.reducer;
