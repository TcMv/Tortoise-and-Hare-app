// app/page.tsx
'use client';

import { useCallback, useEffect, useState } from "react";
import Chat from "@/components/Chat";

export default function Page() {
  const [showChat, setShowChat] = useState(false);
  const [ack, setAck] = useState(false);
  const [appKey, setAppKey] = useState(0); // force-remount landing after exit if needed

  // (Optional) remember the disclaimer checkbox so users don't have to re-tick every time
  useEffect(() => {
    try {
      const saved = localStorage.getItem("thw_ack");
      if (saved) setAck(saved === "1");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("thw_ack", ack ? "1" : "0");
    } catch {}
  }, [ack]);

  const handleExit = useCallback(() => {
    // Called by Chat after it finishes submitting feedback
    setShowChat(false);
    setAppKey(k => k + 1);        // ensure a clean landing remount
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Safety net: allow Chat to broadcast completion without prop wiring
  useEffect(() => {
    function onEndChatEvent() {
      handleExit();
    }
    window.addEventListener("thw:end-chat" as any, onEndChatEvent);
    return () => window.removeEventListener("thw:end-chat" as any, onEndChatEvent);
  }, [handleExit]);

  if (showChat) {
    // Pass onExit so Chat can call it after: await fetch('/api/feedback', ...);
    return <Chat onExit={handleExit} />;
  }

  return (
    <main
      key={appKey}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // gradient background
        background: "linear-gradient(145deg, #e6f0ff 0%, #f6f9ff 50%, #ffffff 100%)",
      }}
    >
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 20px 24px", textAlign: "center" }}>
        {/* small welcome line */}
        <div style={{ opacity: 0.6, marginBottom: 6, fontSize: 16 }}>Welcome To</div>

        {/* title */}
        <h1 style={{ fontSize: 34, lineHeight: 1.15, margin: "0 0 10px" }}>
          🐢 <span style={{ fontWeight: 700 }}>Tortoise &amp; Hare Wellness</span> 🐇
        </h1>

        {/* tagline */}
        <p style={{ fontSize: 18, opacity: 0.75, margin: "0 0 28px" }}>
          Immediate Advice - Long Term Growth
        </p>

        {/* disclaimer checkbox */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            margin: "12px 0 18px",
            fontSize: 14,
            opacity: 0.9,
          }}
        >
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          <span>I understand this chat is not monitored or recorded.</span>
        </label>

        {/* start button */}
        <button
          onClick={() => setShowChat(true)}
          disabled={!ack}
          style={{
            padding: "14px 28px",
            borderRadius: 24,
            border: "none",
            background: ack ? "#5e6ad2" : "#c9cce6",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: ack ? "pointer" : "not-allowed",
            boxShadow: ack ? "0 6px 18px rgba(94,106,210,0.25)" : "none",
            transition: "background .2s ease, transform .08s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          Start Chat
        </button>
      </div>

      {/* footer disclaimer */}
      <footer style={{ padding: "18px 20px", textAlign: "center", fontSize: 12, opacity: 0.6 }}>
        This app does not provide medical advice or crisis intervention. In Australia call 000 or Lifeline 13 11 14. 
        For other regions, contact your local emergency number.
      </footer>
    </main>
  );
}
