import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MdHealthAndSafety,
  MdSchedule,
  MdPerson,
  MdArrowForward,
} from "react-icons/md";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Navbar */}
      <nav
        style={{
          padding: "20px 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#0066cc", margin: 0, fontSize: "24px" }}>
          <MdHealthAndSafety
            style={{ marginRight: "10px", verticalAlign: "middle" }}
          />
          HMS
        </h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => navigate("/login")}
            className="btn btn-secondary"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/register")}
            className="btn btn-primary"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          padding: "80px 30px",
          backgroundColor: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
          color: "white",
          textAlign: "center",
          background: "linear-gradient(135deg, #0066cc 0%, #00b4d8 100%)",
        }}
      >
        <h2
          style={{ fontSize: "48px", marginBottom: "20px", fontWeight: "bold" }}
        >
          Your Health, Our Priority
        </h2>
        <p style={{ fontSize: "18px", marginBottom: "30px", opacity: 0.9 }}>
          Book appointments with qualified doctors, access medical records, and
          manage your health in one place.
        </p>
        <button
          onClick={() => navigate("/register")}
          className="btn"
          style={{
            backgroundColor: "white",
            color: "#0066cc",
            fontSize: "16px",
            padding: "12px 30px",
          }}
        >
          Get Started <MdArrowForward style={{ marginLeft: "8px" }} />
        </button>
      </section>

      {/* Features Section */}
      <section style={{ padding: "60px 30px", backgroundColor: "#f5f5f5" }}>
        <div className="container">
          <h2
            style={{
              textAlign: "center",
              fontSize: "36px",
              marginBottom: "50px",
              color: "#333",
            }}
          >
            Why Choose HMS?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
            }}
          >
            {[
              {
                icon: <MdSchedule />,
                title: "Easy Scheduling",
                desc: "Book appointments with your preferred doctors anytime, anywhere.",
              },
              {
                icon: <MdPerson />,
                title: "Doctor Profiles",
                desc: "Access detailed profiles, specializations, and availability of all doctors.",
              },
              {
                icon: <MdHealthAndSafety />,
                title: "Medical Records",
                desc: "Secure storage of your medical history, prescriptions, and test results.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="card">
                <div
                  style={{
                    fontSize: "40px",
                    color: "#0066cc",
                    marginBottom: "15px",
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    marginBottom: "10px",
                    color: "#333",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: "#666", margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "60px 30px",
          textAlign: "center",
          backgroundColor: "white",
        }}
      >
        <h2 style={{ fontSize: "36px", marginBottom: "30px", color: "#333" }}>
          Ready to Get Started?
        </h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/register?role=PATIENT")}
            className="btn btn-primary"
            style={{ padding: "12px 30px" }}
          >
            Register as Patient
          </button>
          <button
            onClick={() => navigate("/register?role=DOCTOR")}
            className="btn btn-secondary"
            style={{ padding: "12px 30px" }}
          >
            Register as Doctor
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "30px",
          backgroundColor: "#1a1a1a",
          color: "white",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0 }}>
          &copy; 2024 Hospital Management System. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
