import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  useEffect(() => {
    axios.get("http://localhost:5000/api/patients").then(res => setPatients(res.data));
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Patients</h1>
      <div className="bg-white rounded-xl shadow-md p-6 border border-blue-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Age</th>
              <th className="py-2 px-4">Gender</th>
              <th className="py-2 px-4">Disease</th>
              <th className="py-2 px-4">Doctor</th>
              <th className="py-2 px-4">Phone</th>
              <th className="py-2 px-4">Address</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p._id} className="odd:bg-blue-50">
                <td className="py-1 px-4">{p.name}</td>
                <td className="py-1 px-4">{p.age}</td>
                <td className="py-1 px-4">{p.gender}</td>
                <td className="py-1 px-4">{p.disease}</td>
                <td className="py-1 px-4">{p.assignedDoctor?.name || "-"}</td>
                <td className="py-1 px-4">{p.phone}</td>
                <td className="py-1 px-4">{p.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}