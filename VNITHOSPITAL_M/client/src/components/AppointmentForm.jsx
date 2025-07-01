import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AppointmentForm({ onBooked }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    patient: "",
    doctor: "",
    date: "",
    time: "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:5000/api/patients").then(res => setPatients(res.data));
    axios.get("http://localhost:5000/api/doctors").then(res => setDoctors(res.data));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await axios.post("http://localhost:5000/api/appointments", { ...form });
      setMsg("✅ Appointment booked!");
      setForm({ patient: "", doctor: "", date: "", time: "" });
      onBooked && onBooked();
    } catch (e) {
      setMsg("❌ Booking failed");
    }
    setLoading(false);
  };

  return (
    <form className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg mx-auto my-6 border border-blue-200" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold mb-4 text-blue-700">Book Appointment</h2>
      {msg && <div className="mb-2 text-center font-medium">{msg}</div>}
      <div className="mb-4">
        <label className="block mb-1 font-medium">Patient</label>
        <select name="patient" value={form.patient} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-blue-400 focus:border-blue-400" required>
          <option value="">Select Patient</option>
          {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Doctor</label>
        <select name="doctor" value={form.doctor} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-blue-400 focus:border-blue-400" required>
          <option value="">Select Doctor</option>
          {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>)}
        </select>
      </div>
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <label className="block mb-1 font-medium">Date</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-blue-400 focus:border-blue-400" required />
        </div>
        <div className="flex-1">
          <label className="block mb-1 font-medium">Time</label>
          <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-blue-400 focus:border-blue-400" required />
        </div>
      </div>
      <button disabled={loading} className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-900 transition w-full font-semibold mt-4">{loading ? "Booking..." : "Book"}</button>
    </form>
  );
}