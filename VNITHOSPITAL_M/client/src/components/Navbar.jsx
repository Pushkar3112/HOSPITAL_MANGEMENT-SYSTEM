import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-blue-700 text-white shadow-md mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-2xl tracking-tight flex items-center">
            <span className="mr-2">🏥</span> Hospital Management
          </span>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 md:mt-0">
          <Link
            to="/dashboard"
            className={`hover:underline ${location.pathname === "/dashboard" ? "font-bold underline" : ""}`}
          >
            Dashboard
          </Link>
          <Link
            to="/doctors"
            className={`hover:underline ${location.pathname === "/doctors" ? "font-bold underline" : ""}`}
          >
            Doctors
          </Link>
          <Link
            to="/patients"
            className={`hover:underline ${location.pathname === "/patients" ? "font-bold underline" : ""}`}
          >
            Patients
          </Link>
          <Link
            to="/appointments"
            className={`hover:underline ${location.pathname === "/appointments" ? "font-bold underline" : ""}`}
          >
            Appointments
          </Link>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <Link
            to="/login"
            className={`px-4 py-1 rounded ${location.pathname === "/login" ? "bg-white text-blue-700 font-bold" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            Login
          </Link>
          <Link
            to="/register"
            className={`px-4 py-1 rounded ${location.pathname === "/register" ? "bg-white text-blue-700 font-bold" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}