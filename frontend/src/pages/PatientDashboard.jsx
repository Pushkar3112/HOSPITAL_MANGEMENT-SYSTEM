import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card, StatCard } from "../components/Card";
import { SkeletonLoader } from "../components/Loading";
import usePatient from "../hooks/usePatient";
import { MdCalendarToday, MdSchedule, MdCheckCircle } from "react-icons/md";
import { formatDateTime } from "../utils/dateUtils";

const PatientDashboard = () => {
  const patient = usePatient();
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    patient.loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = patient.appointments.filter((apt) =>
    ["PENDING", "CONFIRMED"].includes(apt.status)
  );
  const completed = patient.appointments.filter(
    (apt) => apt.status === "COMPLETED"
  );

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
        <TopBar title="Patient Dashboard" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "40px",
              }}
            >
              <StatCard
                icon={<MdSchedule />}
                label="Upcoming Appointments"
                value={upcoming.length}
                color="primary"
              />
              <StatCard
                icon={<MdCheckCircle />}
                label="Completed Appointments"
                value={completed.length}
                color="success"
              />
            </div>

            {/* Appointments List */}
            <Card title="Your Appointments">
              <div
                style={{ marginBottom: "20px", display: "flex", gap: "10px" }}
              >
                <button
                  onClick={() => setActiveTab("upcoming")}
                  style={{
                    padding: "8px 15px",
                    border:
                      activeTab === "upcoming"
                        ? "2px solid #0066cc"
                        : "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor:
                      activeTab === "upcoming" ? "#f0f7ff" : "transparent",
                    color: activeTab === "upcoming" ? "#0066cc" : "#666",
                    fontWeight: activeTab === "upcoming" ? "600" : "500",
                    cursor: "pointer",
                  }}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  style={{
                    padding: "8px 15px",
                    border:
                      activeTab === "completed"
                        ? "2px solid #0066cc"
                        : "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor:
                      activeTab === "completed" ? "#f0f7ff" : "transparent",
                    color: activeTab === "completed" ? "#0066cc" : "#666",
                    fontWeight: activeTab === "completed" ? "600" : "500",
                    cursor: "pointer",
                  }}
                >
                  Completed
                </button>
              </div>

              {patient.isLoading ? (
                <SkeletonLoader count={3} height={100} />
              ) : (
                <div style={{ display: "grid", gap: "15px" }}>
                  {(activeTab === "upcoming" ? upcoming : completed).map(
                    (apt) => (
                      <div
                        key={apt._id}
                        style={{
                          padding: "15px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                          }}
                        >
                          <div>
                            <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                              {apt.doctorId?.name || "Doctor"}
                            </h4>
                            <p
                              style={{
                                margin: "0 0 5px 0",
                                color: "#666",
                                fontSize: "14px",
                              }}
                            >
                              {formatDateTime(apt.date, apt.startTime)}
                            </p>
                            <p
                              style={{
                                margin: "0 0 5px 0",
                                color: "#666",
                                fontSize: "14px",
                              }}
                            >
                              {apt.visitType === "ONLINE"
                                ? "🔗 Online"
                                : "📍 Offline"}
                            </p>
                          </div>
                          <span
                            className={`badge badge-${
                              apt.status === "CONFIRMED"
                                ? "success"
                                : apt.status === "PENDING"
                                ? "warning"
                                : "primary"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                  {(activeTab === "upcoming" ? upcoming : completed).length ===
                    0 && (
                    <p style={{ textAlign: "center", color: "#999" }}>
                      No {activeTab} appointments found
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
