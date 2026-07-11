import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { ragAPI } from "../services/api";
import AppLayout from "../components/AppLayout";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "What are Dr. Sarah Johnson's timings?",
  "What are the symptoms of diabetes?",
  "What is the consultation fee for a cardiologist?",
  "What are hospital working hours?",
  "How to manage blood pressure?",
  "What is normal blood sugar level?",
];

const RAGChatbot = () => {
  const { user } = useSelector((s) => s.auth);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      content: `Hello ${user?.name?.split(" ")[0] || "there"}! 👋 I'm **MedBot**, your AI health assistant powered by our hospital knowledge base.\n\nI can help you with:\n- 🕐 **Doctor timings** and schedules\n- 👨‍⚕️ **Doctor information** and specializations\n- 🩺 **Health conditions** like diabetes, blood pressure\n- 🏥 **Hospital services** and contact information\n\nWhat would you like to know?`,
      sources: [],
      queryType: "general",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ragOnline, setRagOnline] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    // Check RAG health
    ragAPI.health().then(() => setRagOnline(true)).catch(() => setRagOnline(false));
  }, []);

  const conversationHistory = messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }));

  const sendMessage = async (query) => {
    const q = query || input.trim();
    if (!q || loading) return;
    setInput("");

    const userMsg = { id: Date.now(), role: "user", content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await ragAPI.query({ query: q, conversationHistory: conversationHistory.slice(-6) });
      const data = res.data.data;
      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: data.answer,
        sources: data.sources || [],
        queryType: data.query_type || "general",
        confidence: data.confidence || 0,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: "I apologize, I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or contact our hospital directly at +91-9876543210.",
        sources: [],
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const queryTypeIcon = (type) => {
    const icons = { schedule: "🕐", doctor_info: "👨‍⚕️", diabetes: "🩺", symptoms: "💊", general: "💬" };
    return icons[type] || "💬";
  };

  return (
    <AppLayout title="AI Health Assistant" subtitle="Powered by RAG — Ask about doctors, timings, health conditions">
      {ragOnline === false && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          ⚠️ AI service is currently offline. Answers may be limited.
        </div>
      )}

      <div className="rag-chat-container">
        {/* Header */}
        <div className="rag-header">
          <div className="rag-bot-icon">🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>MedBot — AI Health Assistant</div>
            <div style={{ fontSize: 12, color: "var(--accent-teal)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ragOnline === false ? "#ef4444" : "var(--accent-teal)", display: "inline-block", animation: ragOnline !== false ? "pulse 2s infinite" : "none" }} />
              {ragOnline === false ? "Offline" : "Online — Hybrid RAG with Reranking"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>
            <div>🔍 BM25 + Dense Retrieval</div>
            <div>🎯 LangGraph Pipeline</div>
          </div>
        </div>

        {/* Messages */}
        <div className="rag-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`rag-message ${msg.role === "user" ? "user" : "bot"}`}>
              <div className={`rag-avatar ${msg.role === "user" ? "user" : "bot"}`}>
                {msg.role === "user" ? (user?.name?.[0] || "U") : "🤖"}
              </div>
              <div style={{ maxWidth: "75%" }}>
                <div className={`rag-bubble ${msg.role === "user" ? "user" : "bot"}`} style={msg.isError ? { borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" } : {}}>
                  {msg.role === "bot" ? (
                    <div style={{ lineHeight: 1.6 }}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: "6px 0" }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: "6px 0" }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ color: "var(--accent-primary)", fontWeight: 700 }}>{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="rag-sources">
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Sources:</span>
                    {msg.sources.map((s, i) => (
                      <span key={i} className="rag-source-tag">
                        📄 {s.replace(".txt", "").replace(/_/g, " ")}
                      </span>
                    ))}
                    {msg.queryType && (
                      <span className="rag-source-tag" style={{ background: "rgba(124,92,252,0.1)", color: "var(--accent-secondary)", borderColor: "rgba(124,92,252,0.2)" }}>
                        {queryTypeIcon(msg.queryType)} {msg.queryType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="rag-message bot">
              <div className="rag-avatar bot">🤖</div>
              <div className="rag-bubble bot" style={{ padding: "14px 18px" }}>
                <div className="rag-typing">
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>MedBot is thinking</span>
                  <div className="typing-dots">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="rag-input-area">
          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="rag-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="rag-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="rag-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about doctor timings, health conditions, symptoms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ resize: "none", borderRadius: "var(--radius-lg)", padding: "12px 18px", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ opacity: !input.trim() || loading ? 0.5 : 1, width: 44, height: 44, fontSize: 20 }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
            Powered by Groq LLaMA + LangGraph RAG Pipeline • Press Enter to send
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RAGChatbot;
