import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import usePatient from "../hooks/usePatient";
import { MdCalendarToday, MdSchedule } from "react-icons/md";

const MedicalHistory = () => {
  const patient = usePatient();

  useEffect(() => {
    patient.loadMedicalHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Medical History" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {patient.isLoading ? (
              <p>Loading medical history...</p>
            ) : patient.medicalHistory && patient.medicalHistory.length > 0 ? (
              <div style={{ display: "grid", gap: "20px" }}>
                {patient.medicalHistory.map((record, index) => (
                  <Card key={index} title={`Visit ${index + 1}`}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Diagnoses
                        </label>
                        <p style={{ fontSize: "16px", fontWeight: "600" }}>
                          {record.diagnoses?.join(", ") || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Doctor
                        </label>
                        <p style={{ fontSize: "16px", fontWeight: "600" }}>
                          {record.doctorId?.name || "N/A"}
                        </p>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Notes
                        </label>
                        <p style={{ fontSize: "16px", fontWeight: "600" }}>
                          {record.notes || "No notes"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card title="Medical History">
                <p style={{ color: "#666" }}>No medical records found</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistory;
