import React from "react";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const features = [
  { icon: "🤖", title: "AI Health Assistant", desc: "RAG-powered chatbot with hybrid retrieval & reranking answers questions about doctors, timings, and conditions.", color: "var(--accent-teal)" },
  { icon: "💬", title: "Real-time Chat", desc: "Secure one-on-one messaging between patients and doctors via Socket.IO.", color: "var(--accent-primary)" },
  { icon: "💊", title: "Smart Prescriptions", desc: "Doctors create templates and send prescriptions that auto-update patient medical records.", color: "var(--accent-secondary)" },
  { icon: "📅", title: "Appointment Booking", desc: "Browse verified doctors, view real-time availability and book appointments instantly.", color: "var(--accent-amber)" },
  { icon: "📋", title: "Medical Records", desc: "Complete patient health history with diagnoses, tests, and treatment plans.", color: "var(--accent-rose)" },
  { icon: "🔐", title: "Google OAuth", desc: "Sign in seamlessly with Google or email. Secure JWT authentication with refresh tokens.", color: "var(--accent-green)" },
];

const stats = [
  { value: "500+", label: "Active Doctors" },
  { value: "10K+", label: "Happy Patients" },
  { value: "50K+", label: "Appointments Booked" },
  { value: "99.9%", label: "Uptime" },
];

const specializations = [
  { icon: "🫀", name: "Cardiology" },
  { icon: "🧠", name: "Neurology" },
  { icon: "🦷", name: "Dentistry" },
  { icon: "👁️", name: "Ophthalmology" },
  { icon: "🦴", name: "Orthopedics" },
  { icon: "🌸", name: "Gynecology" },
  { icon: "👶", name: "Pediatrics" },
  { icon: "🧬", name: "Dermatology" },
];

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>🏥</span>
          <span>MedCare <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>HMS</span></span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>Features</a>
          <a href="#specializations" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>Specializations</a>
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge">
          <span>✨</span> AI-Powered Healthcare Platform
        </div>
        <h1 className="hero-title">
          Healthcare,{" "}
          <span className="gradient-text">Reimagined</span>
          {" "}for the Digital Age
        </h1>
        <p className="hero-subtitle">
          A complete hospital management system with AI diagnostics, real-time doctor-patient chat, smart prescriptions, and seamless appointment booking.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start as Patient →
          </Link>
          <Link to="/register" className="btn btn-secondary btn-lg" onClick={() => { sessionStorage.setItem("preferredRole", "DOCTOR"); }}>
            Join as Doctor
          </Link>
          <a href={`${API_BASE}/auth/google`} className="btn btn-ghost btn-lg" style={{ border: "1px solid var(--border-glass)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 4 }}>
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
            </svg>
            Sign in with Google
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 40, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Outfit", fontSize: 36, fontWeight: 800, background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>EVERYTHING YOU NEED</div>
          <h2 style={{ fontFamily: "Outfit", fontSize: 42, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
            Powerful Features for{" "}
            <span className="gradient-text">Modern Healthcare</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, maxWidth: 1200, margin: "0 auto" }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specializations */}
      <section id="specializations" style={{ padding: "60px 48px", background: "rgba(79,142,247,0.02)", borderTop: "1px solid var(--border-primary)", borderBottom: "1px solid var(--border-primary)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontFamily: "Outfit", fontSize: 36, fontWeight: 800, color: "var(--text-primary)" }}>
            Medical <span className="gradient-text">Specializations</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", marginTop: 10 }}>Expert doctors across all major medical fields</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {specializations.map((s, i) => (
            <Link key={i} to="/register" style={{ textDecoration: "none" }}>
              <div className="glass-card" style={{ padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 48px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Outfit", fontSize: 42, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>
          Ready to Transform{" "}<span className="gradient-text">Your Healthcare?</span>
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 500, margin: "0 auto 32px" }}>
          Join thousands of patients and doctors already using MedCare HMS
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" className="btn btn-primary btn-lg">Create Free Account →</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px 48px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Outfit", fontWeight: 700, color: "var(--text-primary)" }}>
          <span>🏥</span> MedCare HMS
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2024 MedCare HMS. All rights reserved.</div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/login" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Login</Link>
          <Link to="/register" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
