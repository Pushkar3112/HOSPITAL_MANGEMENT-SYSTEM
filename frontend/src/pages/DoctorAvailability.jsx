import React, { useEffect, useState } from "react";
import { doctorAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_DURATIONS = [15, 20, 30, 45, 60];

const DoctorAvailability = () => {
  const [, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    availableDays: [1, 2, 3, 4, 5],
    dailyStartTime: "09:00",
    dailyEndTime: "17:00",
    slotDurationMinutes: 30,
    maxPatientsPerSlot: 1,
    consultationFee: 500,
  });

  useEffect(() => {
    doctorAPI.getProfile()
      .then((res) => {
        const p = res.data.data?.profile;
        setProfile(p);
        if (p) {
          setForm({
            availableDays: p.availableDays || [1, 2, 3, 4, 5],
            dailyStartTime: p.dailyStartTime || "09:00",
            dailyEndTime: p.dailyEndTime || "17:00",
            slotDurationMinutes: p.slotDurationMinutes || 30,
            maxPatientsPerSlot: p.maxPatientsPerSlot || 1,
            consultationFee: p.consultationFee || 500,
          });
        }
      })
      .catch(() => toast.error("Failed to load availability"))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day].sort(),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.availableDays.length === 0) return toast.error("Select at least one working day");
    if (form.dailyStartTime >= form.dailyEndTime) return toast.error("End time must be after start time");
    setSaving(true);
    try {
      await doctorAPI.updateProfile(form);
      toast.success("Availability saved successfully");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Calculate preview slots
  const getSlotCount = () => {
    const [sh, sm] = form.dailyStartTime.split(":").map(Number);
    const [eh, em] = form.dailyEndTime.split(":").map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    return totalMins > 0 ? Math.floor(totalMins / form.slotDurationMinutes) : 0;
  };

  if (loading) return <AppLayout title="Availability"><div className="loading-screen"><div className="spinner" /></div></AppLayout>;

  return (
    <AppLayout title="Availability Settings" subtitle="Configure your working hours and appointment slots">
      <div className="dashboard-grid">
        {/* Form */}
        <div className="glass-card-elevated" style={{ padding: 28 }}>
          <form onSubmit={handleSave}>
            {/* Working Days */}
            <div className="form-group">
              <label className="form-label">Working Days</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {DAYS.map((day, i) => {
                  const isSelected = form.availableDays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      style={{
                        width: 52, height: 52, borderRadius: "var(--radius-md)",
                        border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-primary)",
                        background: isSelected ? "rgba(79,142,247,0.15)" : "var(--bg-card)",
                        color: isSelected ? "var(--accent-primary)" : "var(--text-muted)",
                        cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Range */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-input" value={form.dailyStartTime} onChange={(e) => setForm({ ...form, dailyStartTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="time" className="form-input" value={form.dailyEndTime} onChange={(e) => setForm({ ...form, dailyEndTime: e.target.value })} />
              </div>
            </div>

            {/* Slot Duration */}
            <div className="form-group">
              <label className="form-label">Appointment Duration</label>
              <div style={{ display: "flex", gap: 8 }}>
                {SLOT_DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, slotDurationMinutes: d })}
                    style={{
                      padding: "8px 16px", borderRadius: "var(--radius-md)",
                      border: form.slotDurationMinutes === d ? "2px solid var(--accent-primary)" : "1px solid var(--border-primary)",
                      background: form.slotDurationMinutes === d ? "rgba(79,142,247,0.1)" : "var(--bg-card)",
                      color: form.slotDurationMinutes === d ? "var(--accent-primary)" : "var(--text-secondary)",
                      cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Max Patients per Slot</label>
                <input type="number" className="form-input" min="1" max="10" value={form.maxPatientsPerSlot} onChange={(e) => setForm({ ...form, maxPatientsPerSlot: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Consultation Fee (₹)</label>
                <input type="number" className="form-input" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: parseFloat(e.target.value) })} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ marginTop: 8 }}>
              {saving ? <><span className="spinner spinner-sm" /> Saving...</> : "💾 Save Availability"}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass-card-elevated" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>📊 Schedule Preview</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Working Days", value: form.availableDays.map((d) => DAYS[d]).join(", ") || "None selected" },
                { label: "Working Hours", value: `${form.dailyStartTime} — ${form.dailyEndTime}` },
                { label: "Slot Duration", value: `${form.slotDurationMinutes} minutes` },
                { label: "Slots per Day", value: `${getSlotCount()} slots` },
                { label: "Max Patients/Slot", value: form.maxPatientsPerSlot },
                { label: "Consultation Fee", value: `₹${form.consultationFee}` },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-primary)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-elevated" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>💡 Tip</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Changes to your availability will take effect immediately for new bookings. Existing confirmed appointments will not be affected.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DoctorAvailability;
