import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setProfile,
  setAppointments,
  setPrescriptions,
  updateAppointment,
  setLoading,
  setError,
} from "../features/doctorSlice";
import { doctorService } from "../services";

export const useDoctor = () => {
  const dispatch = useDispatch();
  const doctor = useSelector((state) => state.doctor);

  const loadProfile = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await doctorService.getProfile();
      dispatch(setProfile(response.data.data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadAppointments = useCallback(
    async (filters) => {
      dispatch(setLoading(true));
      try {
        const response = await doctorService.getAppointments(filters);
        dispatch(setAppointments(response.data.data));
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const loadPrescriptions = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await doctorService.getPrescriptions();
      dispatch(setPrescriptions(response.data.data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const confirmAppointment = useCallback(
    async (appointmentId) => {
      try {
        const response = await doctorService.confirmAppointment(appointmentId);
        dispatch(updateAppointment(response.data.data));
        return response.data.data;
      } catch (error) {
        dispatch(setError(error.message));
        throw error;
      }
    },
    [dispatch]
  );

  return {
    ...doctor,
    loadProfile,
    loadAppointments,
    loadPrescriptions,
    confirmAppointment,
  };
};

export default useDoctor;
