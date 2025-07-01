import React from "react";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Dashboard</h1>
      {user ? (
        <div className="bg-white p-8 rounded-xl shadow-md border border-blue-200">
          <p className="mb-2 text-lg">
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p className="mb-2 text-lg">
            <span className="font-semibold">Email:</span> {user.email}
          </p>
          <p className="mb-2 text-lg">
            <span className="font-semibold">Role:</span> {user.role}
          </p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-md text-center border border-blue-200">
          <p className="text-gray-500">Please log in to see your dashboard.</p>
        </div>
      )}
    </div>
  );
}