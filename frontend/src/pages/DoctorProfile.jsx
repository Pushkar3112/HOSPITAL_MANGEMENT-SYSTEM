import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import useDoctor from "../hooks/useDoctor";
import { MdCalendarToday, MdSchedule } from "react-icons/md";

const DoctorProfile = () => {
  const doctor = useDoctor();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    doctor.loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (doctor.profile) {
      setFormData(doctor.profile);
    }
  }, [doctor.profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call update API
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const sidebarItems = [
    {
      path: "/doctor/dashboard",
      label: "Dashboard",
      icon: <MdCalendarToday />,
    },
    {
      path: "/doctor/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
    { path: "/doctor/profile", label: "My Profile" },
    { path: "/doctor/availability", label: "Availability" },
    { path: "/doctor/prescriptions", label: "Prescriptions" },
  ];

  if (doctor.isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar items={sidebarItems} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <TopBar title="My Profile" />
          <div style={{ flex: 1, padding: "30px" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="My Profile" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            <Card title="Doctor Information">
              {!isEditing ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Name
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.userId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Email
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.userId?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Specialization
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.specialization || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Consultation Fee
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      ₹{formData.consultationFee || "0"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Years of Experience
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.yearsOfExperience || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Hospital
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.hospitalName || "N/A"}
                    </p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Qualifications
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.qualifications?.join(", ") || "None"}
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "20px",
                      marginBottom: "20px",
                    }}
                  >
                    <input
                      type="text"
                      name="specialization"
                      placeholder="Specialization"
                      value={formData.specialization || ""}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                    <input
                      type="number"
                      name="consultationFee"
                      placeholder="Consultation Fee"
                      value={formData.consultationFee || ""}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#0066cc",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#ddd",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#0066cc",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Edit Profile
                </button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
