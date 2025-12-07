import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import useDoctor from "../hooks/useDoctor";
import { MdCalendarToday, MdSchedule } from "react-icons/md";

const DoctorAppointments = () => {
  const doctor = useDoctor();

  useEffect(() => {
    doctor.loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="My Appointments" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {doctor.isLoading ? (
              <p>Loading appointments...</p>
            ) : doctor.appointments && doctor.appointments.length > 0 ? (
              <div style={{ display: "grid", gap: "20px" }}>
                {doctor.appointments.map((apt, index) => (
                  <Card key={index} title={`Appointment ${index + 1}`}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Patient Name
                        </label>
                        <p style={{ fontSize: "16px", fontWeight: "600" }}>
                          {apt.patientId?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Date & Time
                        </label>
                        <p style={{ fontSize: "16px", fontWeight: "600" }}>
                          {apt.date} {apt.startTime}
                        </p>
                      </div>
                      <div>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Status
                        </label>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color:
                              apt.status === "CONFIRMED"
                                ? "#06a77d"
                                : apt.status === "PENDING"
                                ? "#f4a460"
                                : "#666",
                          }}
                        >
                          {apt.status}
                        </p>
                      </div>
                      <div>
                        <label style={{ color: "#666", fontSize: "14px" }}>
                          Visit Type
                        </label>
                        <p style={{ fontSize: "16px", fontWeight: "600" }}>
                          {apt.visitType || "N/A"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card title="Appointments">
                <p style={{ color: "#666" }}>No appointments found</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
