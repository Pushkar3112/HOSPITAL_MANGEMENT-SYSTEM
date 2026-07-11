import React, { useEffect, useState } from "react";
import { patientAPI } from "../services/api";
import AppLayout from "../components/AppLayout";

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientAPI.getPrescriptions()
      .then((res) => setPrescriptions(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <AppLayout title="Prescriptions" subtitle="All prescriptions from your doctors">
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : prescriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <div className="empty-title">No prescriptions yet</div>
          <div className="empty-subtitle">Prescriptions sent by your doctors will appear here</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {prescriptions.map((rx) => (
            <div key={rx.id} className="rx-card">
              <div className="rx-header">
                <div>
                  <div className="rx-title">
                    {rx.isFromTemplate ? "📋 Template Prescription" : "💊 Prescription"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    By Dr. {rx.doctor?.name} · {formatDate(rx.createdAt)}
                  </div>
                  {rx.diagnosis && (
                    <div style={{ fontSize: 13, color: "var(--accent-teal)", marginTop: 6, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      🩺 {rx.diagnosis}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  {rx.followUpDate && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Follow-up</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-amber)" }}>
                        📅 {formatDate(rx.followUpDate)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  💊 Medications
                </div>
                {rx.medications?.map((med, i) => (
                  <div key={i} className="medication-item">
                    <div className="medication-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span className="medication-name">{med.name}</span>
                        <span className="badge badge-blue">{med.dosage}</span>
                      </div>
                      <div className="medication-details">
                        {[med.frequency, med.duration, med.notes].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {rx.lifestyleAdvice && (
                <div style={{ padding: "10px 14px", background: "rgba(0,212,170,0.06)", borderRadius: "var(--radius-md)", border: "1px solid rgba(0,212,170,0.15)", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--accent-teal)", fontWeight: 700, marginBottom: 4 }}>🌿 LIFESTYLE ADVICE</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{rx.lifestyleAdvice}</div>
                </div>
              )}

              {rx.notes && (
                <div style={{ padding: "10px 14px", background: "rgba(79,142,247,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(79,142,247,0.1)" }}>
                  <div style={{ fontSize: 11, color: "var(--accent-primary)", fontWeight: 700, marginBottom: 4 }}>📝 DOCTOR'S NOTES</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{rx.notes}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Prescriptions;
