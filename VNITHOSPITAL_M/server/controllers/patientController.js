const Patient = require('../models/Patient');

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate('assignedDoctor');
    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching patients', error: err.message });
  }
};

const createPatient = async (req, res) => {
  const { name, age, gender, disease, assignedDoctor, phone, address } = req.body;
  try {
    const patient = await Patient.create({ name, age, gender, disease, assignedDoctor, phone, address });
    res.status(201).json({ msg: 'Patient added successfully', patient });
  } catch (err) {
    res.status(500).json({ msg: 'Error adding patient', error: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ msg: 'Patient updated', patient });
  } catch (err) {
    res.status(500).json({ msg: 'Update failed', error: err.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Delete failed', error: err.message });
  }
};

module.exports = { getPatients, createPatient, updatePatient, deletePatient };