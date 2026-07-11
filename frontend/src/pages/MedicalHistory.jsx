import React, { useEffect, useState } from "react";
import { patientAPI } from "../services/api";
import AppLayout from "../components/AppLayout";

const MedicalHistory = () => {
  const [history, setHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");

  useEffect(() => {
    Promise.all([patientAPI.getMedicalHistory(), patientAPI.getPrescriptions()])
      .then(([hRes, pRes]) => {
        setHistory(hRes.data.data || []);
        setPrescriptions(pRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const tabs = [
    { id: "records", label: "Medical Records", count: history.length },
    { id: "prescriptions", label: "Prescriptions", count: prescriptions.length },
  ];

  return (
    <AppLayout title="Medical History" subtitle="Complete health records and prescriptions">
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border-primary)", paddingBottom: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-secondary)",
              borderBottom: `2px solid ${activeTab === tab.id ? "var(--accent-primary)" : "transparent"}`,
              fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s", marginBottom: -1,
            }}
          >
            {tab.label}
            <span style={{ background: activeTab === tab.id ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.06)", color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-muted)", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: "var(--radius-full)" }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : activeTab === "records" ? (
        history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No medical records yet</div>
            <div className="empty-subtitle">Your medical records will appear here after consultations</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((record) => (
              <div key={record.id} className="glass-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                      📅 {formatDate(record.createdAt)} · Dr. {record.doctor?.name}
                    </div>
                    {record.diagnoses?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {record.diagnoses.map((d, i) => (
                          <span key={i} className="badge badge-blue">🩺 {d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {record.notes && (
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", padding: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Doctor Notes</div>
                    <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{record.notes}</div>
                  </div>
                )}

                {record.testsOrdered?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Tests Ordered</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {record.testsOrdered.map((t, i) => <span key={i} className="badge badge-amber">🔬 {t}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        prescriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <div className="empty-title">No prescriptions yet</div>
            <div className="empty-subtitle">Prescriptions from your doctors will appear here</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rx-card">
                <div className="rx-header">
                  <div>
                    <div className="rx-title">Prescription</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      From Dr. {rx.doctor?.name} · {formatDate(rx.createdAt)}
                    </div>
                    {rx.diagnosis && <div style={{ fontSize: 12, color: "var(--accent-teal)", marginTop: 4, fontWeight: 600 }}>Diagnosis: {rx.diagnosis}</div>}
                  </div>
                  {rx.followUpDate && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Follow-up</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-amber)" }}>
                        {formatDate(rx.followUpDate)}
                      </div>
                    </div>
                  )}
                </div>

                {rx.medications?.map((med, i) => (
                  <div key={i} className="medication-item">
                    <div className="medication-dot" />
                    <div>
                      <div className="medication-name">{med.name} — {med.dosage}</div>
                      <div className="medication-details">{med.frequency} · {med.duration}{med.notes ? ` · ${med.notes}` : ""}</div>
                    </div>
                  </div>
                ))}

                {rx.lifestyleAdvice && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,212,170,0.06)", borderRadius: "var(--radius-md)", border: "1px solid rgba(0,212,170,0.15)" }}>
                    <div style={{ fontSize: 11, color: "var(--accent-teal)", fontWeight: 700, marginBottom: 4 }}>🌿 LIFESTYLE ADVICE</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{rx.lifestyleAdvice}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </AppLayout>
  );
};

export default MedicalHistory;
