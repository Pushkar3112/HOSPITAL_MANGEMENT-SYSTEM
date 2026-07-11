import React, { useEffect, useState } from "react";
import { patientAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const BLOOD_GROUP_MAP = { "A+": "A_PLUS", "A-": "A_MINUS", "B+": "B_PLUS", "B-": "B_MINUS", "AB+": "AB_PLUS", "AB-": "AB_MINUS", "O+": "O_PLUS", "O-": "O_MINUS" };
const BLOOD_GROUP_DISPLAY = { A_PLUS: "A+", A_MINUS: "A-", B_PLUS: "B+", B_MINUS: "B-", AB_PLUS: "AB+", AB_MINUS: "AB-", O_PLUS: "O+", O_MINUS: "O-" };

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = () => {
    patientAPI.getProfile()
      .then((res) => {
        const d = res.data.data;
        setProfile(d);
        setForm({
          name: d.user?.name || "",
          phone: d.user?.phone || "",
          gender: d.profile?.gender || "",
          dateOfBirth: d.profile?.dateOfBirth ? d.profile.dateOfBirth.split("T")[0] : "",
          bloodGroup: BLOOD_GROUP_DISPLAY[d.profile?.bloodGroup] || "",
          allergies: d.profile?.allergies?.join(", ") || "",
          chronicConditions: d.profile?.chronicConditions?.join(", ") || "",
          addressLine: d.profile?.address?.line || "",
          addressCity: d.profile?.address?.city || "",
          addressState: d.profile?.address?.state || "",
          emergencyName: d.profile?.emergencyContact?.name || "",
          emergencyPhone: d.profile?.emergencyContact?.phone || "",
          emergencyRelation: d.profile?.emergencyContact?.relation || "",
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
      await patientAPI.updateProfile({
        name: form.name,
        phone: form.phone,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        bloodGroup: form.bloodGroup ? BLOOD_GROUP_MAP[form.bloodGroup] : undefined,
        allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()).filter(Boolean) : [],
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(",").map((c) => c.trim()).filter(Boolean) : [],
        address: { line: form.addressLine, city: form.addressCity, state: form.addressState },
        emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation },
      });
      toast.success("Profile updated");
      setEditing(false);
      loadProfile();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLayout title="My Profile"><div className="loading-screen"><div className="spinner" /></div></AppLayout>;

  const { user: u, profile: p } = profile || {};

  return (
    <AppLayout title="My Profile" subtitle="Manage your personal and health information">
      {/* Profile Header */}
      <div className="profile-header" style={{ marginBottom: 20 }}>
        <div className="profile-avatar-large">
          {u?.avatar ? <img src={u.avatar} alt={u?.name} /> : u?.name?.[0] || "P"}
        </div>
        <div className="profile-info">
          <div className="profile-name">{u?.name}</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{u?.email}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {p?.bloodGroup && <span className="badge badge-rose">🩸 {BLOOD_GROUP_DISPLAY[p.bloodGroup]}</span>}
            {p?.gender && <span className="badge badge-blue">{p.gender}</span>}
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
          <form onSubmit={handleSave}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>Edit Profile</h3>

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
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {BLOOD_GROUPS.map((bg) => (
                  <button key={bg} type="button" onClick={() => setForm({ ...form, bloodGroup: form.bloodGroup === bg ? "" : bg })}
                    style={{ padding: "6px 14px", borderRadius: "var(--radius-full)", border: form.bloodGroup === bg ? "2px solid var(--accent-rose)" : "1px solid var(--border-primary)", background: form.bloodGroup === bg ? "rgba(247,111,163,0.1)" : "var(--bg-card)", color: form.bloodGroup === bg ? "var(--accent-rose)" : "var(--text-secondary)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Allergies (comma-separated)</label>
                <input className="form-input" placeholder="Penicillin, Aspirin" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Chronic Conditions (comma-separated)</label>
                <input className="form-input" placeholder="Diabetes, Hypertension" value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Address</div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Mumbai" value={form.addressCity} onChange={(e) => setForm({ ...form, addressCity: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" placeholder="Maharashtra" value={form.addressState} onChange={(e) => setForm({ ...form, addressState: e.target.value })} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Emergency Contact</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>🩺 Health Info</h3>
            {[
              { label: "Blood Group", value: p?.bloodGroup ? `${BLOOD_GROUP_DISPLAY[p.bloodGroup]} 🩸` : "—" },
              { label: "Date of Birth", value: p?.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              { label: "Gender", value: p?.gender || "—" },
              { label: "Allergies", value: p?.allergies?.length ? p.allergies.join(", ") : "None" },
              { label: "Chronic Conditions", value: p?.chronicConditions?.length ? p.chronicConditions.join(", ") : "None" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-primary)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="glass-card-elevated" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>📞 Contact & Emergency</h3>
            {[
              { label: "Email", value: u?.email },
              { label: "Phone", value: u?.phone || "—" },
              { label: "Address", value: [p?.address?.city, p?.address?.state].filter(Boolean).join(", ") || "—" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-primary)" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
            {p?.emergencyContact?.name && (
              <div style={{ marginTop: 16, padding: 14, background: "rgba(247,111,163,0.06)", borderRadius: "var(--radius-md)", border: "1px solid rgba(247,111,163,0.15)" }}>
                <div style={{ fontSize: 11, color: "var(--accent-rose)", fontWeight: 700, marginBottom: 8 }}>🆘 EMERGENCY CONTACT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.emergencyContact.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p.emergencyContact.phone} · {p.emergencyContact.relation}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default PatientProfile;
