import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card, StatCard } from "../components/Card";
import { SkeletonLoader } from "../components/Loading";
import { adminService } from "../services";
import {
  MdDashboard,
  MdPeople,
  MdSchedule,
  MdAttachMoney,
} from "react-icons/md";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminService.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <MdDashboard /> },
    { path: "/admin/users", label: "Users Management", icon: <MdPeople /> },
    {
      path: "/admin/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
    { path: "/admin/invoices", label: "Invoices", icon: <MdAttachMoney /> },
    { path: "/admin/doctors", label: "Doctor Approvals" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Admin Dashboard" />
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
            {loading ? (
              <SkeletonLoader count={4} height={120} />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginBottom: "40px",
                }}
              >
                <StatCard
                  icon={<MdPeople />}
                  label="Total Patients"
                  value={stats?.totalPatients || 0}
                  color="primary"
                />
                <StatCard
                  icon={<MdPeople />}
                  label="Total Doctors"
                  value={stats?.totalDoctors || 0}
                  color="secondary"
                />
                <StatCard
                  icon={<MdSchedule />}
                  label="Today's Appointments"
                  value={stats?.todaysAppointments || 0}
                  color="warning"
                />
                <StatCard
                  icon={<MdAttachMoney />}
                  label="Total Revenue"
                  value={`₹${stats?.totalRevenue || 0}`}
                  color="success"
                />
              </div>
            )}

            {/* Quick Actions */}
            <Card title="System Overview">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                }}
              >
                {[
                  { label: "Manage Users", path: "/admin/users" },
                  { label: "View Appointments", path: "/admin/appointments" },
                  { label: "Approve Doctors", path: "/admin/doctors" },
                  { label: "View Invoices", path: "/admin/invoices" },
                ].map((action) => (
                  <button
                    key={action.path}
                    onClick={() => (window.location.href = action.path)}
                    style={{
                      padding: "20px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.3s",
                      color: "#0066cc",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f0f7ff";
                      e.target.style.boxShadow =
                        "0 4px 12px rgba(0, 102, 204, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f9f9f9";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
