const Doctor = require('../models/Doctor');

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching doctors', error: err.message });
  }
};

const createDoctor = async (req, res) => {
  const { name, specialty, experience, availableDays, availableTime, contact } = req.body;
  try {
    const doctor = await Doctor.create({ name, specialty, experience, availableDays, availableTime, contact });
    res.status(201).json({ msg: 'Doctor added successfully', doctor });
  } catch (err) {
    res.status(500).json({ msg: 'Error adding doctor', error: err.message });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ msg: 'Doctor updated', doctor });
  } catch (err) {
    res.status(500).json({ msg: 'Update failed', error: err.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Delete failed', error: err.message });
  }
};

module.exports = { getDoctors, createDoctor, updateDoctor, deleteDoctor };