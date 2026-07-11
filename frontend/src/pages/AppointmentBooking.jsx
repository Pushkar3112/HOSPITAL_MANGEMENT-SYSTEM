import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchAPI, appointmentAPI, patientAPI, chatAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import { toast } from "react-toastify";

const SPECIALIZATIONS = [
  "Cardiologist", "Neurologist", "Orthopedic Surgeon", "Dermatologist",
  "Pediatrician", "Gynecologist", "Psychiatrist", "General Physician",
  "Ophthalmologist", "ENT Specialist", "Gastroenterologist", "Endocrinologist",
];

const AppointmentBooking = () => {
  const [view, setView] = useState("search"); // "search" | "slots" | "myappts"
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsDate, setSlotsDate] = useState(new Date().toISOString().split("T")[0]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(null); // { slot, visitType, reason }
  const [submitting, setSubmitting] = useState(false);
  const [myAppointments, setMyAppointments] = useState([]);
  const [aptsLoading, setAptsLoading] = useState(false);
  const navigate = useNavigate();
  const [messagingId, setMessagingId] = useState(null);

  const handleMessage = async (doctorId) => {
    setMessagingId(doctorId);
    try {
      const res = await chatAPI.startSession({ otherUserId: doctorId });
      navigate(`/patient/chat?sessionId=${res.data.data.id}`);
    } catch {
      toast.error("Failed to start chat session");
    } finally {
      setMessagingId(null);
    }
  };

  const searchDoctors = async () => {
    setLoading(true);
    try {
      const res = await searchAPI.searchDoctors({ search, specialization: specFilter, limit: 20 });
      setDoctors(res.data.data?.doctors || res.data.data || []);
    } catch { toast.error("Search failed"); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { searchDoctors(); }, [search, specFilter]);

  const loadSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      const res = await doctorAPI_getSlots(doctorId, date);
      setSlots(res.data.data || []);
    } catch { toast.error("Failed to load slots"); }
    finally { setSlotsLoading(false); }
  };

  const doctorAPI_getSlots = (doctorId, date) => searchAPI.getSlots(doctorId, { date });

  const selectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setView("slots");
    loadSlots(doctor.id, slotsDate);
  };

  const handleDateChange = (d) => {
    setSlotsDate(d);
    if (selectedDoctor) loadSlots(selectedDoctor.id, d);
  };

  const handleBookSlot = async () => {
    if (!booking?.slot) return;
    setSubmitting(true);
    try {
      await appointmentAPI.create({
        doctorId: selectedDoctor.id,
        date: slotsDate,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        visitType: booking.visitType || "OFFLINE",
        reasonForVisit: booking.reason || "",
      });
      toast.success("Appointment booked successfully! 🎉");
      setBooking(null);
      loadSlots(selectedDoctor.id, slotsDate);
    } catch (e) {
      toast.error(e.response?.data?.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMyAppointments = async () => {
    setAptsLoading(true);
    try {
      const res = await patientAPI.getAppointments({ limit: 20 });
      setMyAppointments(res.data.data || []);
    } catch { toast.error("Failed to load appointments"); }
    finally { setAptsLoading(false); }
  };

  const handleCancelAppt = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await patientAPI.cancelAppointment(id);
      toast.success("Appointment cancelled");
      loadMyAppointments();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
  };

  const formatTime = (t) => { if (!t) return ""; const [h, m] = t.split(":"); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };

  return (
    <AppLayout title="Appointments" subtitle="Book appointments and manage your schedule">
      {/* Tab nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--border-primary)", paddingBottom: 0 }}>
        {[
          { id: "search", label: "🔍 Find Doctors" },
          { id: "myappts", label: "📅 My Appointments" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => { setView(tab.id); if (tab.id === "myappts") loadMyAppointments(); }}
            style={{ padding: "10px 20px", border: "none", background: "none", cursor: "pointer", color: view === tab.id ? "var(--accent-primary)" : "var(--text-secondary)", borderBottom: `2px solid ${view === tab.id ? "var(--accent-primary)" : "transparent"}`, fontWeight: 600, fontSize: 14, marginBottom: -1, transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Doctor Search */}
      {(view === "search" || view === "slots") && view !== "myappts" && (
        <>
          {view === "search" && (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                  <span style={{ color: "var(--text-muted)" }}>🔍</span>
                  <input placeholder="Search doctors by name or hospital..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: "auto", minWidth: 180 }} value={specFilter} onChange={(e) => setSpecFilter(e.target.value)}>
                  <option value="">All Specializations</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {loading ? (
                <div className="loading-screen"><div className="spinner" /></div>
              ) : doctors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👨‍⚕️</div>
                  <div className="empty-title">No doctors found</div>
                  <div className="empty-subtitle">Try a different search term or specialization</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                  {doctors.map((doc) => (
                    <div key={doc.id} className="doctor-card" onClick={() => selectDoctor(doc)}>
                      <div className="doctor-card-header">
                        <div className="user-avatar" style={{ width: 52, height: 52, fontSize: 20 }}>
                          {doc.avatar ? <img src={doc.avatar} alt={doc.name} /> : doc.name?.[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Dr. {doc.name}</div>
                          <div className="doctor-specialty-badge">{doc.doctorProfile?.specialization}</div>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
                            <span className="doctor-fee">₹{doc.doctorProfile?.consultationFee}</span>
                            {doc.doctorProfile?.rating > 0 && (
                              <span className="doctor-rating">⭐ {doc.doctorProfile.rating.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12 }}>
                        <span>🏥 {doc.doctorProfile?.hospitalName}</span>
                        <span>⏱️ {doc.doctorProfile?.yearsOfExperience}y exp</span>
                      </div>
                      <button className="btn btn-primary w-full" style={{ marginTop: 14 }} onClick={(e) => { e.stopPropagation(); selectDoctor(doc); }}>
                        📅 Book Appointment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view === "slots" && selectedDoctor && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setView("search")} style={{ marginBottom: 16 }}>← Back to doctors</button>

              <div className="glass-card-elevated" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
                    {selectedDoctor.avatar ? <img src={selectedDoctor.avatar} alt="" /> : selectedDoctor.name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>Dr. {selectedDoctor.name}</div>
                    <div style={{ fontSize: 14, color: "var(--accent-primary)", fontWeight: 600 }}>{selectedDoctor.doctorProfile?.specialization}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Fee: ₹{selectedDoctor.doctorProfile?.consultationFee} · {selectedDoctor.doctorProfile?.hospitalName}</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Select Date</label>
                      <input type="date" className="form-input" value={slotsDate} onChange={(e) => handleDateChange(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{ width: "auto" }} />
                    </div>
                  </div>
                </div>
              </div>

              {slotsLoading ? (
                <div className="loading-screen"><div className="spinner" /></div>
              ) : slots.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">No available slots</div>
                  <div className="empty-subtitle">Try a different date</div>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                    Available Slots for {new Date(slotsDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                    {slots.map((slot, i) => {
                      const isSelected = booking?.slot?.startTime === slot.startTime;
                      return (
                        <button
                          key={i}
                          onClick={() => setBooking({ slot, visitType: "OFFLINE", reason: "" })}
                          disabled={!slot.available}
                          style={{
                            padding: "12px 10px", borderRadius: "var(--radius-md)", border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-primary)",
                            background: isSelected ? "rgba(79,142,247,0.12)" : slot.available ? "var(--bg-card)" : "rgba(255,255,255,0.02)",
                            color: !slot.available ? "var(--text-muted)" : isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                            cursor: slot.available ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14, textAlign: "center", transition: "all 0.15s",
                          }}
                        >
                          {formatTime(slot.startTime)}
                          {!slot.available && <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400, marginTop: 2 }}>Booked</div>}
                        </button>
                      );
                    })}
                  </div>

                  {booking?.slot && (
                    <div className="glass-card-elevated" style={{ padding: 20, marginTop: 20 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>✅ Confirm Booking</h3>
                      <div style={{ marginBottom: 12, padding: "10px 14px", background: "rgba(79,142,247,0.08)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-secondary)" }}>
                        🕐 {formatTime(booking.slot.startTime)} — {formatTime(booking.slot.endTime)} · {new Date(slotsDate).toLocaleDateString("en-IN")} · Dr. {selectedDoctor.name}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Visit Type</label>
                        <div style={{ display: "flex", gap: 10 }}>
                          {["OFFLINE", "ONLINE"].map((vt) => (
                            <button key={vt} type="button" onClick={() => setBooking({ ...booking, visitType: vt })}
                              style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-md)", border: booking.visitType === vt ? "2px solid var(--accent-primary)" : "1px solid var(--border-primary)", background: booking.visitType === vt ? "rgba(79,142,247,0.1)" : "var(--bg-card)", color: booking.visitType === vt ? "var(--accent-primary)" : "var(--text-secondary)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                              {vt === "OFFLINE" ? "🏥 In-Person" : "💻 Online"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Reason for Visit (optional)</label>
                        <textarea className="form-textarea" rows={2} placeholder="Describe your symptoms or reason..." value={booking.reason || ""} onChange={(e) => setBooking({ ...booking, reason: e.target.value })} />
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => setBooking(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleBookSlot} disabled={submitting}>
                          {submitting ? <><span className="spinner spinner-sm" /> Booking...</> : "📅 Confirm Booking"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* My Appointments */}
      {view === "myappts" && (
        <div>
          {aptsLoading ? (
            <div className="loading-screen"><div className="spinner" /></div>
          ) : myAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-title">No appointments yet</div>
              <div className="empty-subtitle">Book your first appointment above</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setView("search")}>Find Doctors</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myAppointments.map((apt) => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-date-box">
                    <div className="apt-day">{new Date(apt.date).getDate()}</div>
                    <div className="apt-month">{new Date(apt.date).toLocaleString("default", { month: "short" })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>Dr. {apt.doctor?.name}</div>
                    {apt.doctor?.doctorProfile && <div style={{ fontSize: 12, color: "var(--accent-primary)", fontWeight: 600 }}>{apt.doctor.doctorProfile.specialization}</div>}
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>🕐 {formatTime(apt.startTime)} · {apt.visitType}</div>
                    {apt.reasonForVisit && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.reasonForVisit}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className={`badge badge-${apt.status === "CONFIRMED" ? "green" : apt.status === "PENDING" ? "amber" : apt.status === "COMPLETED" ? "teal" : "muted"}`}>
                      {apt.status}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleMessage(apt.doctorId)} disabled={messagingId === apt.doctorId}>
                        {messagingId === apt.doctorId ? "..." : "💬 Chat"}
                      </button>
                      {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancelAppt(apt.id)}>Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default AppointmentBooking;
