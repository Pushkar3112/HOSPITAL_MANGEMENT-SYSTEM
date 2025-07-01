import React from "react";

export default function DoctorCard({ doctor }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-2 border border-blue-100 hover:scale-105 transition-transform">
      <h3 className="text-xl font-bold text-blue-800 mb-1">{doctor.name}</h3>
      <div className="text-sm text-blue-600 mb-1">{doctor.specialty}</div>
      <div className="text-gray-700">Experience: <span className="font-semibold">{doctor.experience} years</span></div>
      <div className="text-gray-700">Availability: {doctor.availableDays.join(", ")} <span className="text-xs">({doctor.availableTime})</span></div>
      <div className="text-gray-700">Contact: {doctor.contact}</div>
    </div>
  );
}