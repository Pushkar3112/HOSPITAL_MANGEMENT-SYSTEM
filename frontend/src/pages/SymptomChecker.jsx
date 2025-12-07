import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Card } from "../components/Card";
import { symptomCheckerService } from "../services";
import { MdCalendarToday, MdSchedule } from "react-icons/md";

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError("Please describe your symptoms");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await symptomCheckerService.checkSymptoms({ symptoms });
      setAnalysis(response.data.data);
    } catch (err) {
      setError(err.message || "Failed to analyze symptoms");
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    {
      path: "/patient/dashboard",
      label: "Dashboard",
      icon: <MdCalendarToday />,
    },
    {
      path: "/patient/appointments",
      label: "Appointments",
      icon: <MdSchedule />,
    },
    { path: "/patient/profile", label: "My Profile" },
    { path: "/patient/symptom-checker", label: "Symptom Checker" },
    { path: "/patient/medical-history", label: "Medical History" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar items={sidebarItems} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar title="Symptom Checker" />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "30px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <div className="container">
            <Card title="AI Symptom Analysis">
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                  }}
                >
                  Describe your symptoms:
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g., I have a fever and headache for 2 days..."
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    padding: "12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontFamily: "inherit",
                    fontSize: "16px",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#fee",
                    color: "#c33",
                    borderRadius: "6px",
                    marginBottom: "20px",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{
                  padding: "12px 30px",
                  backgroundColor: loading ? "#ccc" : "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                {loading ? "Analyzing..." : "Analyze Symptoms"}
              </button>
            </Card>

            {analysis && (
              <Card title="Analysis Result" style={{ marginTop: "20px" }}>
                <div style={{ display: "grid", gap: "20px" }}>
                  <div>
                    <label style={{ color: "#666", fontSize: "14px" }}>
                      Summary
                    </label>
                    <p style={{ fontSize: "16px" }}>{analysis.summary}</p>
                  </div>

                  {analysis.possibleCauses && (
                    <div>
                      <label style={{ color: "#666", fontSize: "14px" }}>
                        Possible Causes
                      </label>
                      <ul style={{ fontSize: "16px", paddingLeft: "20px" }}>
                        {analysis.possibleCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.recommendedSpecialization && (
                    <div>
                      <label style={{ color: "#666", fontSize: "14px" }}>
                        Recommended Specialist
                      </label>
                      <p style={{ fontSize: "16px", fontWeight: "600" }}>
                        {analysis.recommendedSpecialization}
                      </p>
                    </div>
                  )}

                  {analysis.urgencyLevel && (
                    <div>
                      <label style={{ color: "#666", fontSize: "14px" }}>
                        Urgency Level
                      </label>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color:
                            analysis.urgencyLevel === "URGENT"
                              ? "#d62828"
                              : analysis.urgencyLevel === "MODERATE"
                              ? "#f4a460"
                              : "#06a77d",
                        }}
                      >
                        {analysis.urgencyLevel}
                      </p>
                    </div>
                  )}

                  {analysis.disclaimer && (
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "#fffbe6",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      <strong>Disclaimer:</strong> {analysis.disclaimer}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;
