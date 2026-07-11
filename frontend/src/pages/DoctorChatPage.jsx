import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { chatAPI } from "../services/api";
import AppLayout from "../components/AppLayout";

const BACKEND_URL = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";

const DoctorChatPage = () => {
  const { user, accessToken } = useSelector((s) => s.auth);
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { auth: { token: accessToken }, transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("new_message", (msg) => {
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setSessions((prev) => prev.map((s) => s.id === msg.sessionId ? { ...s, lastMessage: msg.message, lastMessageAt: msg.createdAt } : s));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => socket.disconnect();
  }, [accessToken]);

  useEffect(() => {
    const load = async () => {
      setLoadingSessions(true);
      try {
        const res = await chatAPI.getSessions();
        const data = res.data.data || [];
        setSessions(data);
        const params = new URLSearchParams(location.search);
        const sid = params.get("sessionId");
        if (sid) {
          const found = data.find((s) => s.id === sid);
          if (found) selectSession(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSessions(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const selectSession = async (session) => {
    setActiveSession(session);
    setLoadingMessages(true);
    try {
      const res = await chatAPI.getHistory(session.id);
      setMessages(res.data.data.messages || []);
      socketRef.current?.emit("mark_read", { sessionId: session.id });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error(e); }
    finally { setLoadingMessages(false); }
  };

  const sendMessage = () => {
    if (!input.trim() || !activeSession || !socketRef.current) return;
    socketRef.current.emit("send_message", {
      receiverId: activeSession.patientId,
      message: input.trim(),
      sessionId: activeSession.id,
    });
    setInput("");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) => {
    const date = new Date(d); const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <AppLayout title="Patient Messages" subtitle="Real-time chat with your patients">
      <div className="chat-container">
        {/* Sessions Panel */}
        <div className="chat-sessions-panel">
          <div className="chat-sessions-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Patients</span>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: "var(--radius-full)", background: connected ? "rgba(79,220,143,0.15)" : "rgba(239,68,68,0.15)", color: connected ? "var(--accent-green)" : "#ef4444", fontWeight: 700 }}>
              {connected ? "● Live" : "○ Offline"}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loadingSessions ? (
              <div style={{ padding: 20, textAlign: "center" }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
            ) : sessions.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-icon">💬</div>
                <div className="empty-title" style={{ fontSize: 15 }}>No patient conversations</div>
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className={`chat-session-item ${activeSession?.id === s.id ? "active" : ""}`} onClick={() => selectSession(s)}>
                  <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                    {s.patient?.avatar ? <img src={s.patient.avatar} alt="" /> : s.patient?.name?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chat-session-name">{s.patient?.name || "Patient"}</div>
                    <div className="chat-session-last">{s.lastMessage || "Start conversation"}</div>
                  </div>
                  {s.lastMessageAt && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatDate(s.lastMessageAt)}</div>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Main */}
        <div className="chat-main">
          {!activeSession ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>💬</div>
              <div className="empty-title">Select a patient</div>
              <div className="empty-subtitle">Choose a patient conversation from the left panel</div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="user-avatar" style={{ width: 40, height: 40 }}>
                  {activeSession.patient?.avatar ? <img src={activeSession.patient.avatar} alt="" /> : activeSession.patient?.name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{activeSession.patient?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Patient</div>
                </div>
              </div>
              <div className="chat-messages">
                {loadingMessages ? (
                  <div style={{ textAlign: "center", paddingTop: 40 }}><div className="spinner" style={{ margin: "0 auto" }} /></div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👋</div>
                    <div className="empty-title">Start the conversation</div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`chat-message ${isSent ? "sent" : "received"}`}>
                        {!isSent && <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>{msg.sender?.name?.[0]}</div>}
                        <div>
                          <div className="message-bubble">{msg.message}</div>
                          <div className="message-time">{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <input className="chat-input" placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} />
                <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim()} style={{ opacity: !input.trim() ? 0.5 : 1 }}>➤</button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DoctorChatPage;
