import React, { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card, StatCard } from "../components/Card";
import { SkeletonLoader } from "../components/Loading";
import useDoctor from "../hooks/useDoctor";
import { MdCalendarToday, MdSchedule, MdCheckCircle } from "react-icons/md";
import { formatDateTime } from "../utils/dateUtils";

const DoctorDashboard = () => {
  const doctor = useDoctor();

  useEffect(() => {
    doctor.loadAppointments({ status: "PENDING,CONFIRMED" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmedCount = doctor.appointments.filter(
    (apt) => apt.status === "CONFIRMED"
  ).length;
  const pendingCount = doctor.appointments.filter(
    (apt) => apt.status === "PENDING"
  ).length;

  const sidebarItems = [
    {
      path: "/doctor/dashboard",
      label: "Dashboard",
      icon: <MdCalendarToday />,
    },
    {
      path: "/doctor/appointments",
      label: "My Appointments",
      icon: <MdSchedule />,
    },
    { path: "/doctor/prescriptions", label: "Prescriptions" },
    { path: "/doctor/profile", label: "My Profile" },
    { path: "/doctor/availability", label: "Availability" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Doctor Dashboard" />
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
                label="Pending Confirmations"
                value={pendingCount}
                color="warning"
              />
              <StatCard
                icon={<MdCheckCircle />}
                label="Confirmed Appointments"
                value={confirmedCount}
                color="success"
              />
            </div>

            {/* Upcoming Appointments */}
            <Card title="Today's Appointments">
              {doctor.isLoading ? (
                <SkeletonLoader count={3} height={100} />
              ) : (
                <div style={{ display: "grid", gap: "15px" }}>
                  {doctor.appointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt._id}
                      style={{
                        padding: "15px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        backgroundColor: "#f9f9f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
                          {apt.patientId?.name || "Patient"}
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
                            margin: "0",
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          Reason: {apt.reasonForVisit || "General Consultation"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => doctor.confirmAppointment(apt._id)}
                            className="btn btn-primary"
                            style={{ padding: "8px 12px", fontSize: "12px" }}
                          >
                            Confirm
                          </button>
                        )}
                        <span
                          className={`badge badge-${
                            apt.status === "CONFIRMED" ? "success" : "warning"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {doctor.appointments.length === 0 && (
                    <p style={{ textAlign: "center", color: "#999" }}>
                      No appointments scheduled
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

export default DoctorDashboard;
