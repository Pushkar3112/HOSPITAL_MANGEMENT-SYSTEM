import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import patientReducer from "./patientSlice";
import doctorReducer from "./doctorSlice";
import adminReducer from "./adminSlice";
import uiReducer from "./uiSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    patient: patientReducer,
    doctor: doctorReducer,
    admin: adminReducer,
    ui: uiReducer,
  },
});

export default store;
