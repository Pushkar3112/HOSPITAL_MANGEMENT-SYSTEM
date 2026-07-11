import React, { useState, useEffect } from "react";
import { doctorAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const EMPTY_TEMPLATE = { name: "", medications: [], lifestyleAdvice: "", diagnosis: "", notes: "", followUpDays: "" };
const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "", notes: "" };

const PrescriptionTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [sendForm, setSendForm] = useState({ templateId: "", patientId: "", appointmentId: "", customNotes: "" });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([doctorAPI.getTemplates(), doctorAPI.getPatients()]);
      setTemplates(tRes.data.data || []);
      setPatients(pRes.data.data || []);
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setForm(EMPTY_TEMPLATE);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditingTemplate(t);
    setForm({ name: t.name, medications: t.medications || [], lifestyleAdvice: t.lifestyleAdvice || "", diagnosis: t.diagnosis || "", notes: t.notes || "", followUpDays: t.followUpDays || "" });
    setShowForm(true);
  };

  const addMedication = () => setForm((f) => ({ ...f, medications: [...f.medications, { ...EMPTY_MED }] }));
  const updateMed = (i, field, val) => setForm((f) => ({ ...f, medications: f.medications.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));
  const removeMed = (i) => setForm((f) => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Template name required");
    if (form.medications.length === 0) return toast.error("Add at least one medication");
    setSaving(true);
    try {
      const payload = { ...form, followUpDays: form.followUpDays ? parseInt(form.followUpDays) : undefined };
      if (editingTemplate) {
        await doctorAPI.updateTemplate(editingTemplate.id, payload);
        toast.success("Template updated");
      } else {
        await doctorAPI.createTemplate(payload);
        toast.success("Template created");
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await doctorAPI.deleteTemplate(id);
      toast.success("Template deleted");
      loadData();
    } catch { toast.error("Failed to delete"); }
  };

  const openSend = (templateId) => {
    setSendForm({ templateId, patientId: "", appointmentId: "", customNotes: "" });
    setShowSendModal(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sendForm.patientId) return toast.error("Select a patient");
    setSending(true);
    try {
      await doctorAPI.sendPrescription(sendForm);
      toast.success("Prescription sent! Medical record created automatically.");
      setShowSendModal(false);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const frequencies = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed (PRN)", "Weekly", "Monthly"];

  return (
    <AppLayout title="Prescription Templates" subtitle="Create reusable templates and send to patients">
      {/* Header Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={openCreate}>
          ✚ Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : templates.length === 0 ? (
        <div className="glass-card-elevated" style={{ padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📋</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>No Templates Yet</div>
          <div style={{ color: "var(--text-muted)", marginBottom: 24 }}>Create prescription templates to save time and quickly send to patients</div>
          <button className="btn btn-primary" onClick={openCreate}>Create Your First Template</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {templates.map((t) => (
            <div key={t.id} className="glass-card" style={{ padding: 20 }}>
              {/* Template Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>📋 {t.name}</div>
                  {t.diagnosis && <div style={{ fontSize: 12, color: "var(--accent-teal)", fontWeight: 600 }}>🩺 {t.diagnosis}</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(t)} title="Edit">✏️</button>
                  <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(t.id)} title="Delete">🗑️</button>
                </div>
              </div>

              {/* Medications */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  💊 Medications ({t.medications?.length || 0})
                </div>
                {t.medications?.slice(0, 3).map((med, i) => (
                  <div key={i} className="medication-item">
                    <div className="medication-dot" />
                    <div>
                      <div className="medication-name">{med.name}</div>
                      <div className="medication-details">{med.dosage} • {med.frequency} • {med.duration}</div>
                    </div>
                  </div>
                ))}
                {t.medications?.length > 3 && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "4px 10px" }}>+{t.medications.length - 3} more medications</div>
                )}
              </div>

              {/* Additional Info */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {t.followUpDays && <span className="badge badge-blue">↩️ Follow-up in {t.followUpDays} days</span>}
                {t.lifestyleAdvice && <span className="badge badge-teal">🌿 Lifestyle advice included</span>}
                {t.notes && <span className="badge badge-muted">📝 Notes</span>}
              </div>

              {/* Send Button */}
              <button className="btn btn-success w-full" onClick={() => openSend(t.id)} style={{ gap: 8 }}>
                📤 Send to Patient
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 680, maxHeight: "90vh" }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTemplate ? "Edit Template" : "New Prescription Template"}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Template Name *</label>
                <input className="form-input" placeholder="e.g., Type 2 Diabetes Management" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <input className="form-input" placeholder="e.g., Type 2 Diabetes Mellitus" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up (days)</label>
                  <input className="form-input" type="number" placeholder="e.g., 30" value={form.followUpDays} onChange={(e) => setForm({ ...form, followUpDays: e.target.value })} min="1" max="365" />
                </div>
              </div>

              {/* Medications Section */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <label className="form-label" style={{ margin: 0 }}>💊 Medications *</label>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addMedication}>+ Add Medication</button>
                </div>

                {form.medications.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", border: "1px dashed var(--border-primary)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontSize: 13 }}>
                    Click "Add Medication" to add prescriptions
                  </div>
                )}

                {form.medications.map((med, i) => (
                  <div key={i} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-md)", padding: 14, marginBottom: 10, border: "1px solid var(--border-primary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Medication {i + 1}</span>
                      <button type="button" className="btn btn-sm btn-danger btn-icon" onClick={() => removeMed(i)}>🗑️</button>
                    </div>
                    <div className="grid-2" style={{ marginBottom: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Name *</label>
                        <input className="form-input" placeholder="e.g., Metformin" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Dosage *</label>
                        <input className="form-input" placeholder="e.g., 500mg" value={med.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Frequency</label>
                        <select className="form-select" value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)}>
                          <option value="">Select frequency</option>
                          {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Duration</label>
                        <input className="form-input" placeholder="e.g., 30 days" value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, marginTop: 8 }}>
                      <label className="form-label">Special Instructions</label>
                      <input className="form-input" placeholder="e.g., Take after meals" value={med.notes || ""} onChange={(e) => updateMed(i, "notes", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Lifestyle Advice</label>
                <textarea className="form-textarea" placeholder="Diet recommendations, exercise, restrictions..." value={form.lifestyleAdvice} onChange={(e) => setForm({ ...form, lifestyleAdvice: e.target.value })} rows={3} />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea className="form-textarea" placeholder="Any additional notes for the patient..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner spinner-sm" /> Saving...</> : (editingTemplate ? "Update Template" : "Create Template")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Prescription Modal */}
      {showSendModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowSendModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">📤 Send Prescription</h2>
              <button className="modal-close" onClick={() => setShowSendModal(false)}>✕</button>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              A medical record will be automatically created in the patient's history when you send this prescription.
            </div>

            <form onSubmit={handleSend}>
              <div className="form-group">
                <label className="form-label">Select Patient *</label>
                <select className="form-select" value={sendForm.patientId} onChange={(e) => setSendForm({ ...sendForm, patientId: e.target.value })} required>
                  <option value="">-- Select a patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Any custom notes for this specific patient..." value={sendForm.customNotes} onChange={(e) => setSendForm({ ...sendForm, customNotes: e.target.value })} rows={3} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSendModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={sending}>
                  {sending ? <><span className="spinner spinner-sm" /> Sending...</> : "📤 Send Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PrescriptionTemplates;
