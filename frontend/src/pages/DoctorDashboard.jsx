import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { doctorAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { Link } from "react-router-dom";

const DoctorDashboard = () => {
  const { user } = useSelector((s) => s.auth);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    doctorAPI.getAppointments({ date: today })
      .then((res) => setAppointments(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const pending = appointments.filter((a) => a.status === "PENDING").length;
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout title={`${greeting()}, Dr. ${user?.name?.split(" ")[0] || "Doctor"} 👋`} subtitle="Today's overview and patient management">
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            {[
              { icon: "📋", label: "Today's Appointments", value: appointments.length, color: "blue" },
              { icon: "⏳", label: "Pending", value: pending, color: "amber" },
              { icon: "✅", label: "Confirmed", value: confirmed, color: "green" },
              { icon: "🎯", label: "Completed", value: completed, color: "teal" },
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
            {/* Today's Appointments */}
            <div className="glass-card-elevated" style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-header">
                <h3 className="table-title">🗓️ Today's Schedule</h3>
                <Link to="/doctor/appointments" className="btn btn-sm btn-secondary">All Appointments</Link>
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                {appointments.length === 0 ? (
                  <div className="empty-state" style={{ padding: "30px 0" }}>
                    <div className="empty-icon">📅</div>
                    <div className="empty-title" style={{ fontSize: 15 }}>No appointments today</div>
                    <div className="empty-subtitle" style={{ fontSize: 12 }}>Enjoy your free day!</div>
                  </div>
                ) : (
                  appointments.slice(0, 6).map((apt) => (
                    <div key={apt.id} className="appointment-card">
                      <div className="user-avatar" style={{ width: 40, height: 40 }}>
                        {apt.patient?.avatar ? <img src={apt.patient.avatar} alt="" /> : apt.patient?.name?.[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{apt.patient?.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          🕐 {formatTime(apt.startTime)} — {formatTime(apt.endTime)}
                        </div>
                        {apt.reasonForVisit && (
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }} className="truncate">{apt.reasonForVisit}</div>
                        )}
                      </div>
                      <span className={`badge badge-${apt.status === "CONFIRMED" ? "green" : apt.status === "PENDING" ? "amber" : apt.status === "COMPLETED" ? "teal" : "muted"}`}>
                        {apt.status}
                      </span>
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
                    { to: "/doctor/appointments", icon: "📅", label: "View Appointments", desc: "Manage today's schedule", color: "var(--accent-primary)" },
                    { to: "/doctor/templates", icon: "📋", label: "Rx Templates", desc: "Create & send prescriptions", color: "var(--accent-teal)" },
                    { to: "/doctor/chat", icon: "💬", label: "Patient Messages", desc: "Real-time chat", color: "var(--accent-secondary)" },
                    { to: "/doctor/availability", icon: "🕐", label: "Availability", desc: "Manage your schedule", color: "var(--accent-amber)" },
                    { to: "/doctor/profile", icon: "👤", label: "My Profile", desc: "Update professional info", color: "var(--accent-rose)" },
                  ].map((action, i) => (
                    <Link
                      key={i}
                      to={action.to}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-primary)", background: "var(--bg-card)", textDecoration: "none", transition: "all 0.15s ease" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.background = "var(--bg-card)"; }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: `${action.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{action.icon}</div>
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

export default DoctorDashboard;
