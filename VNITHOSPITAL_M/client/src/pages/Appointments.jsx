import React, { useEffect, useState } from "react";
import axios from "axios";
import AppointmentForm from "../components/AppointmentForm";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = () => {
    axios.get("http://localhost:5000/api/appointments").then(res => setAppointments(res.data));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Appointments</h1>
      <AppointmentForm onBooked={fetchAppointments} />
      <div className="bg-white rounded-xl shadow-md p-6 mt-6 border border-blue-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-4">Patient</th>
              <th className="py-2 px-4">Doctor</th>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Time</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a._id} className="odd:bg-blue-50">
                <td className="py-1 px-4">{a.patient?.name}</td>
                <td className="py-1 px-4">{a.doctor?.name}</td>
                <td className="py-1 px-4">{a.date}</td>
                <td className="py-1 px-4">{a.time}</td>
                <td className="py-1 px-4">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}