import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  PENDING: { color: "badge-amber", label: "Pending" },
  CONFIRMED: { color: "badge-green", label: "Confirmed" },
  COMPLETED: { color: "badge-teal", label: "Completed" },
  CANCELLED: { color: "badge-muted", label: "Cancelled" },
  NO_SHOW: { color: "badge-rose", label: "No Show" },
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    adminAPI.getAppointments({ status: statusFilter })
      .then((res) => setAppointments(res.data.data?.appointments || res.data.data || []))
      .catch(() => toast.error("Failed to load appointments"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <AppLayout title="All Appointments" subtitle="System-wide appointment management">
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <select className="form-select" style={{ width: "auto", minWidth: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3 className="table-title">📅 Appointments ({appointments.length})</h3>
        </div>
        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : appointments.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">No appointments found</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{apt.patient?.name}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 14 }}>Dr. {apt.doctor?.name}</td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{new Date(apt.date).toLocaleDateString("en-IN")}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{apt.startTime}</div>
                    </td>
                    <td><span className={`badge ${apt.visitType === "ONLINE" ? "badge-blue" : "badge-purple"}`}>{apt.visitType}</span></td>
                    <td><span className={`badge ${STATUS_CONFIG[apt.status]?.color || "badge-muted"}`}>{STATUS_CONFIG[apt.status]?.label || apt.status}</span></td>
                    <td style={{ color: "var(--accent-teal)", fontWeight: 700 }}>{apt.consultationFee ? `₹${apt.consultationFee}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminAppointments;
