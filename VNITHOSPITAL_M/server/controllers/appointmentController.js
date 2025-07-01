const Appointment = require('../models/Appointment');

const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient doctor');
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching appointments', error: err.message });
  }
};

const createAppointment = async (req, res) => {
  const { patient, doctor, date, time, status } = req.body;
  try {
    const appointment = await Appointment.create({ patient, doctor, date, time, status });
    res.status(201).json({ msg: 'Appointment booked', appointment });
  } catch (err) {
    res.status(500).json({ msg: 'Error booking appointment', error: err.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ msg: 'Appointment updated', appointment });
  } catch (err) {
    res.status(500).json({ msg: 'Update failed', error: err.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ msg: 'Cancel failed', error: err.message });
  }
};

module.exports = { getAppointments, createAppointment, updateAppointment, deleteAppointment };