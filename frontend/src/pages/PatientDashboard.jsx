import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { patientAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { Link } from "react-router-dom";

const PatientDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.getDashboardStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (t) => {
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout title={`${greeting()}, ${user?.name?.split(" ")[0] || "Patient"} 👋`} subtitle="Here's an overview of your health activity">
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            {[
              { icon: "📅", label: "Total Appointments", value: stats?.totalAppointments ?? 0, color: "blue" },
              { icon: "💊", label: "Prescriptions", value: stats?.totalPrescriptions ?? 0, color: "teal" },
              { icon: "📋", label: "Medical Records", value: stats?.totalMedicalRecords ?? 0, color: "purple" },
              { icon: "⏳", label: "Upcoming", value: stats?.upcomingAppointments?.length ?? 0, color: "amber" },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                <div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            {/* Upcoming Appointments */}
            <div className="glass-card-elevated" style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-header">
                <h3 className="table-title">📅 Upcoming Appointments</h3>
                <Link to="/patient/appointments" className="btn btn-sm btn-secondary">View All</Link>
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                {!stats?.upcomingAppointments?.length ? (
                  <div className="empty-state" style={{ padding: "30px 0" }}>
                    <div className="empty-icon">📅</div>
                    <div className="empty-title" style={{ fontSize: 15 }}>No upcoming appointments</div>
                    <Link to="/patient/appointments" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Book Appointment</Link>
                  </div>
                ) : (
                  stats.upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="appointment-card">
                      <div className="appointment-date-box">
                        <div className="apt-day">{new Date(apt.date).getDate()}</div>
                        <div className="apt-month">{new Date(apt.date).toLocaleString("default", { month: "short" })}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>
                          Dr. {apt.doctor?.name}
                        </div>
                        {apt.doctor?.doctorProfile && (
                          <div style={{ fontSize: 12, color: "var(--accent-primary)", fontWeight: 600 }}>
                            {apt.doctor.doctorProfile.specialization}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          🕐 {formatTime(apt.startTime)}
                        </div>
                      </div>
                      <div>
                        <span className={`badge badge-${apt.status === "CONFIRMED" ? "green" : apt.status === "PENDING" ? "amber" : "muted"}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="glass-card-elevated" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>⚡ Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { to: "/patient/appointments", icon: "📅", label: "Book Appointment", desc: "Schedule with a doctor", color: "var(--accent-primary)" },
                    { to: "/patient/rag-chat", icon: "🤖", label: "AI Health Assistant", desc: "Ask health questions", color: "var(--accent-teal)" },
                    { to: "/patient/chat", icon: "💬", label: "Message Doctor", desc: "Real-time chat", color: "var(--accent-secondary)" },
                    { to: "/patient/medical-history", icon: "📋", label: "Medical Records", desc: "View your health history", color: "var(--accent-amber)" },
                    { to: "/patient/prescriptions", icon: "💊", label: "Prescriptions", desc: "View all prescriptions", color: "var(--accent-rose)" },
                  ].map((action, i) => (
                    <Link
                      key={i}
                      to={action.to}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)",
                        background: "var(--bg-card)", textDecoration: "none", transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.background = "var(--bg-card)"; }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: `${action.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {action.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{action.label}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{action.desc}</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "var(--text-muted)" }}>›</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default PatientDashboard;
