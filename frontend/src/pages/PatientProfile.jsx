import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import usePatient from "../hooks/usePatient";
import { MdCalendarToday, MdSchedule } from "react-icons/md";
import { formatDate } from "../utils/dateUtils";

const PatientProfile = () => {
  const patient = usePatient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    patient.loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (patient.profile) {
      setFormData(patient.profile);
    }
  }, [patient.profile]);

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
      path: "/patient/dashboard",
      label: "Dashboard",
      icon: <MdCalendarToday />,
    },
    {
      path: "/patient/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
    { path: "/patient/profile", label: "My Profile" },
    { path: "/patient/symptom-checker", label: "Symptom Checker" },
    { path: "/patient/medical-history", label: "Medical History" },
  ];

  if (patient.isLoading) {
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
            <Card title="Patient Information">
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
                      Full Name
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
                      Phone
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.userId?.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Gender
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Date of Birth
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.dateOfBirth
                        ? formatDate(new Date(formData.dateOfBirth))
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Blood Group
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.bloodGroup || "N/A"}
                    </p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Address
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.address?.street || "N/A"}
                    </p>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Allergies
                    </label>
                    <p style={{ fontSize: "16px", fontWeight: "600" }}>
                      {formData.allergies?.join(", ") || "None"}
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
                      name="gender"
                      placeholder="Gender"
                      value={formData.gender || ""}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                      }}
                    />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={
                        formData.dateOfBirth
                          ? formData.dateOfBirth.split("T")[0]
                          : ""
                      }
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

export default PatientProfile;
