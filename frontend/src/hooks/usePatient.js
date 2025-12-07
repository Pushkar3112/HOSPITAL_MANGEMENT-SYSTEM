import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setProfile,
  setAppointments,
  setMedicalHistory,
  setPrescriptions,
  setInvoices,
  setLoading,
  setError,
} from "../features/patientSlice";
import { patientService } from "../services";

export const usePatient = () => {
  const dispatch = useDispatch();
  const patient = useSelector((state) => state.patient);

  const loadProfile = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await patientService.getProfile();
      dispatch(setProfile(response.data.data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadAppointments = useCallback(
    async (status) => {
      dispatch(setLoading(true));
      try {
        const response = await patientService.getAppointments(status);
        dispatch(setAppointments(response.data.data));
      } catch (error) {
        dispatch(setError(error.message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const loadMedicalHistory = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await patientService.getMedicalHistory();
      dispatch(setMedicalHistory(response.data.data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadPrescriptions = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await patientService.getPrescriptions();
      dispatch(setPrescriptions(response.data.data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadInvoices = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const response = await patientService.getInvoices();
      dispatch(setInvoices(response.data.data));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return {
    ...patient,
    loadProfile,
    loadAppointments,
    loadMedicalHistory,
    loadPrescriptions,
    loadInvoices,
  };
};

export default usePatient;
