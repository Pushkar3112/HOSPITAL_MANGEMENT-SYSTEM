import React, { useEffect, useState } from "react";
import axios from "axios";
import DoctorCard from "../components/DoctorCard";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  useEffect(() => {
    axios.get("http://localhost:5000/api/doctors").then(res => setDoctors(res.data));
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Doctors</h1>
      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
        {doctors.map(doc => <DoctorCard doctor={doc} key={doc._id} />)}
      </div>
    </div>
  );
}