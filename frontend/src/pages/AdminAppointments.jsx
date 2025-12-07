import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { adminService } from "../services";
import { MdDashboard, MdPeople, MdSchedule } from "react-icons/md";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAppointments();
      setAppointments(response.data.data.appointments || []);
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <MdDashboard />,
    },
    {
      path: "/admin/users",
      label: "Users",
      icon: <MdPeople />,
    },
    {
      path: "/admin/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="All Appointments" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            {loading ? (
              <p>Loading appointments...</p>
            ) : appointments.length > 0 ? (
              <Card title="All Appointments">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Patient
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Doctor
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Date & Time
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Status
                      </th>
                      <th style={{ padding: "12px", textAlign: "left" }}>
                        Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr
                        key={apt._id}
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <td style={{ padding: "12px" }}>
                          {apt.patientId?.name || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {apt.doctorId?.name || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {apt.date} {apt.startTime}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              backgroundColor:
                                apt.status === "CONFIRMED"
                                  ? "#efe"
                                  : apt.status === "PENDING"
                                  ? "#fffbe6"
                                  : "#fee",
                              borderRadius: "4px",
                              fontSize: "14px",
                            }}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          ₹{apt.consultationFee || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
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

export default AdminAppointments;
