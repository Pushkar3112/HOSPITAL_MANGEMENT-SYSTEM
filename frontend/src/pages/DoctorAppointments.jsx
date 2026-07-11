import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctorAPI, chatAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const STATUS_CONFIG = {
  PENDING: { color: "badge-amber", label: "Pending" },
  CONFIRMED: { color: "badge-green", label: "Confirmed" },
  COMPLETED: { color: "badge-teal", label: "Completed" },
  CANCELLED: { color: "badge-muted", label: "Cancelled" },
  NO_SHOW: { color: "badge-rose", label: "No Show" },
};

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedApt, setSelectedApt] = useState(null);
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [rxForm, setRxForm] = useState({ medications: [], diagnosis: "", lifestyleAdvice: "", notes: "", followUpDate: "" });
  const [submittingRx, setSubmittingRx] = useState(false);
  const navigate = useNavigate();
  const [messagingId, setMessagingId] = useState(null);

  const handleMessage = async (patientId) => {
    setMessagingId(patientId);
    try {
      const res = await chatAPI.startSession({ otherUserId: patientId });
      navigate(`/doctor/chat?sessionId=${res.data.data.id}`);
    } catch {
      toast.error("Failed to start chat session");
    } finally {
      setMessagingId(null);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDate) params.date = filterDate;
      const res = await doctorAPI.getAppointments(params);
      setAppointments(res.data.data || []);
    } catch { toast.error("Failed to load appointments"); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAppointments(); }, [filterStatus, filterDate]);

  const handleConfirm = async (id) => {
    try { await doctorAPI.confirmAppointment(id); toast.success("Appointment confirmed"); loadAppointments(); }
    catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  const handleComplete = async (id) => {
    try { await doctorAPI.completeAppointment(id); toast.success("Marked as completed"); loadAppointments(); }
    catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  const openPrescModal = (apt) => {
    setSelectedApt(apt);
    setRxForm({ medications: [], diagnosis: "", lifestyleAdvice: "", notes: "", followUpDate: "" });
    setShowPrescModal(true);
  };

  const addMed = () => setRxForm((f) => ({ ...f, medications: [...f.medications, { name: "", dosage: "", frequency: "", duration: "", notes: "" }] }));
  const updateMed = (i, field, val) => setRxForm((f) => ({ ...f, medications: f.medications.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));
  const removeMed = (i) => setRxForm((f) => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }));

  const submitPrescription = async (e) => {
    e.preventDefault();
    if (rxForm.medications.length === 0) return toast.error("Add at least one medication");
    setSubmittingRx(true);
    try {
      await doctorAPI.createPrescription({
        patientId: selectedApt.patientId,
        appointmentId: selectedApt.id,
        ...rxForm,
        followUpDate: rxForm.followUpDate || undefined,
      });
      toast.success("Prescription created & medical record added!");
      setShowPrescModal(false);
      loadAppointments();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSubmittingRx(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const formatTime = (t) => { if (!t) return ""; const [h, m] = t.split(":"); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };

  return (
    <AppLayout title="Appointments" subtitle="Manage your patient consultations">
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="form-select" style={{ width: "auto", minWidth: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
        </select>
        <input type="date" className="form-input" style={{ width: "auto" }} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        {(filterStatus || filterDate) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(""); setFilterDate(""); }}>✕ Clear</button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-secondary btn-sm" onClick={loadAppointments}>🔄 Refresh</button>
        </div>
      </div>

      {/* Table */}
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
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                          {apt.patient?.name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{apt.patient?.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{apt.patient?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{formatDate(apt.date)}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatTime(apt.startTime)} — {formatTime(apt.endTime)}</div>
                    </td>
                    <td><span className={`badge ${apt.visitType === "ONLINE" ? "badge-blue" : "badge-purple"}`}>{apt.visitType}</span></td>
                    <td><span className={`badge ${STATUS_CONFIG[apt.status]?.color || "badge-muted"}`}>{STATUS_CONFIG[apt.status]?.label || apt.status}</span></td>
                    <td>
                      <span style={{ color: "var(--accent-teal)", fontWeight: 700 }}>
                        {apt.consultationFee ? `₹${apt.consultationFee}` : "—"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleMessage(apt.patientId)} disabled={messagingId === apt.patientId}>
                          {messagingId === apt.patientId ? "..." : "💬 Chat"}
                        </button>
                        {apt.status === "PENDING" && (
                          <button className="btn btn-success btn-sm" onClick={() => handleConfirm(apt.id)}>✓ Confirm</button>
                        )}
                        {apt.status === "CONFIRMED" && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleComplete(apt.id)}>✓ Complete</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => openPrescModal(apt)}>💊 Prescribe</button>
                          </>
                        )}
                        {apt.status === "COMPLETED" && !apt.prescriptionId && (
                          <button className="btn btn-secondary btn-sm" onClick={() => openPrescModal(apt)}>💊 Prescribe</button>
                        )}
                        {apt.status === "COMPLETED" && apt.prescriptionId && (
                          <span className="badge badge-teal">✓ Prescribed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      {showPrescModal && selectedApt && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPrescModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h2 className="modal-title">💊 Write Prescription</h2>
              <button className="modal-close" onClick={() => setShowPrescModal(false)}>✕</button>
            </div>

            <div style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.2)", borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
              👤 Patient: <strong style={{ color: "var(--text-primary)" }}>{selectedApt.patient?.name}</strong>
              {" · "}📅 {new Date(selectedApt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {" · "}🕐 {formatTime(selectedApt.startTime)}
            </div>

            <div className="alert alert-info" style={{ fontSize: 13 }}>
              ℹ️ A medical record will be automatically created in the patient's history.
            </div>

            <form onSubmit={submitPrescription}>
              <div className="form-group">
                <label className="form-label">Diagnosis</label>
                <input className="form-input" placeholder="Primary diagnosis..." value={rxForm.diagnosis} onChange={(e) => setRxForm({ ...rxForm, diagnosis: e.target.value })} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>💊 Medications *</label>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addMed}>+ Add</button>
              </div>

              {rxForm.medications.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", border: "1px dashed var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
                  Click "+ Add" to add medications
                </div>
              )}

              {rxForm.medications.map((med, i) => (
                <div key={i} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", padding: 12, marginBottom: 8, border: "1px solid var(--border-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Medication {i + 1}</span>
                    <button type="button" onClick={() => removeMed(i)} className="btn btn-sm btn-danger btn-icon">🗑️</button>
                  </div>
                  <div className="grid-2" style={{ marginBottom: 8 }}>
                    <input className="form-input" placeholder="Drug name *" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)} required />
                    <input className="form-input" placeholder="Dosage (e.g., 500mg)" value={med.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                  </div>
                  <div className="grid-2">
                    <input className="form-input" placeholder="Frequency (e.g., Twice daily)" value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                    <input className="form-input" placeholder="Duration (e.g., 7 days)" value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Lifestyle Advice</label>
                <textarea className="form-textarea" placeholder="Diet, exercise, restrictions..." value={rxForm.lifestyleAdvice} onChange={(e) => setRxForm({ ...rxForm, lifestyleAdvice: e.target.value })} rows={2} />
              </div>

              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input type="date" className="form-input" value={rxForm.followUpDate} onChange={(e) => setRxForm({ ...rxForm, followUpDate: e.target.value })} min={new Date().toISOString().split("T")[0]} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPrescModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={submittingRx}>
                  {submittingRx ? <><span className="spinner spinner-sm" /> Saving...</> : "💊 Create Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default DoctorAppointments;
