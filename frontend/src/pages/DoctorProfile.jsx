import React, { useEffect, useState } from "react";
import { doctorAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const SPECIALIZATIONS = [
  "Cardiologist", "Neurologist", "Orthopedic Surgeon", "Dermatologist",
  "Pediatrician", "Gynecologist", "Psychiatrist", "General Physician",
  "Ophthalmologist", "ENT Specialist", "Gastroenterologist", "Radiologist",
  "Oncologist", "Nephrologist", "Pulmonologist", "Endocrinologist",
];

const DoctorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = () => {
    doctorAPI.getProfile()
      .then((res) => {
        setProfile(res.data.data);
        const d = res.data.data;
        setForm({
          name: d.user?.name || "",
          phone: d.user?.phone || "",
          specialization: d.profile?.specialization || "",
          qualifications: d.profile?.qualifications?.join(", ") || "",
          yearsOfExperience: d.profile?.yearsOfExperience || 0,
          hospitalName: d.profile?.hospitalName || "",
          consultationFee: d.profile?.consultationFee || 0,
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorAPI.updateProfile({
        ...form,
        qualifications: form.qualifications ? form.qualifications.split(",").map((q) => q.trim()).filter(Boolean) : [],
        yearsOfExperience: parseInt(form.yearsOfExperience),
        consultationFee: parseFloat(form.consultationFee),
      });
      toast.success("Profile updated successfully");
      setEditing(false);
      loadProfile();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLayout title="My Profile"><div className="loading-screen"><div className="spinner" /></div></AppLayout>;

  const { user: u, profile: p } = profile || {};

  return (
    <AppLayout title="My Profile" subtitle="Manage your professional information">
      {/* Profile Header */}
      <div className="profile-header" style={{ marginBottom: 20 }}>
        <div className="profile-avatar-large">
          {u?.avatar ? <img src={u.avatar} alt={u?.name} /> : u?.name?.[0] || "D"}
        </div>
        <div className="profile-info">
          <div className="profile-name">Dr. {u?.name}</div>
          <div className="profile-specialty">{p?.specialization}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {p?.isVerified ? (
              <span className="badge badge-green">✓ Verified Doctor</span>
            ) : (
              <span className="badge badge-amber">⏳ Pending Verification</span>
            )}
            <span className="badge badge-blue">🏥 {p?.hospitalName}</span>
            {p?.rating > 0 && <span className="badge badge-amber">⭐ {p.rating.toFixed(1)}</span>}
          </div>
        </div>
        <div style={{ marginLeft: "auto", position: "relative", zIndex: 1 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "✏️ Edit Profile"}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="glass-card-elevated" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>Edit Profile</h3>
          <form onSubmit={handleSave}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <select className="form-select" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}>
                  <option value="">Select...</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input type="number" className="form-input" min="0" max="60" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Hospital Name</label>
                <input className="form-input" value={form.hospitalName} onChange={(e) => setForm({ ...form, hospitalName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (₹)</label>
                <input type="number" className="form-input" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Qualifications (comma-separated)</label>
              <input className="form-input" placeholder="MBBS, MD, DM Cardiology" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner spinner-sm" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="glass-card-elevated" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>👨‍⚕️ Professional Info</h3>
            {[
              { label: "Specialization", value: p?.specialization },
              { label: "Hospital", value: p?.hospitalName },
              { label: "Experience", value: `${p?.yearsOfExperience} years` },
              { label: "Consultation Fee", value: `₹${p?.consultationFee}` },
              { label: "Qualifications", value: p?.qualifications?.join(", ") || "—" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-primary)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{item.value || "—"}</span>
              </div>
            ))}
          </div>
          <div className="glass-card-elevated" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>📞 Contact Info</h3>
            {[
              { label: "Full Name", value: u?.name },
              { label: "Email", value: u?.email },
              { label: "Phone", value: u?.phone || "—" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-primary)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>Schedule</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                {p?.dailyStartTime} — {p?.dailyEndTime} · {p?.slotDurationMinutes} min slots
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default DoctorProfile;
