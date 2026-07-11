import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error("Failed to load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { icon: "👥", label: "Total Users", value: stats.totalUsers ?? 0, color: "blue" },
    { icon: "🩺", label: "Doctors", value: stats.totalDoctors ?? 0, color: "purple" },
    { icon: "🧑", label: "Patients", value: stats.totalPatients ?? 0, color: "teal" },
    { icon: "📅", label: "Total Appointments", value: stats.totalAppointments ?? 0, color: "amber" },
    { icon: "✅", label: "Completed", value: stats.completedAppointments ?? 0, color: "green" },
    { icon: "⏳", label: "Pending", value: stats.pendingAppointments ?? 0, color: "rose" },
  ] : [];

  return (
    <AppLayout title="Admin Dashboard" subtitle="System overview and management">
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {cards.map((c, i) => (
              <div key={i} className="stat-card">
                <div className={`stat-icon ${c.color}`}>{c.icon}</div>
                <div>
                  <div className="stat-value">{c.value}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {stats?.recentAppointments?.length > 0 && (
            <div className="table-container" style={{ marginTop: 24 }}>
              <div className="table-header">
                <h3 className="table-title">📅 Recent Appointments</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAppointments.slice(0, 8).map((apt) => (
                      <tr key={apt.id}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{apt.patient?.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>Dr. {apt.doctor?.name}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{new Date(apt.date).toLocaleDateString("en-IN")}</td>
                        <td>
                          <span className={`badge badge-${apt.status === "COMPLETED" ? "green" : apt.status === "CONFIRMED" ? "blue" : apt.status === "PENDING" ? "amber" : "muted"}`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default AdminDashboard;
