// app/components/Chat.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { exportChatPdf } from "@/lib/exportPdf";  // ✅ must be here, not inside the component
import PrivacyModal from "@/components/PrivacyModal"; //Privacy modal
import Image from "next/image";



type Role = "user" | "assistant" | "system";
type Msg = { id: string; role: Role; content: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

// ---- Helpers for protocol detection (Mood Check-in) ----
const Q_LINE = /^Q(\d{1,2}):\s/i;
function getCurrentQuestionNumber(items: Msg[]) {
  for (let i = items.length - 1; i >= 0; i--) {
    const m = items[i];
    if (m.role !== "assistant") continue;
    const match = m.content.match(Q_LINE);
    if (match) return Math.min(11, Math.max(1, parseInt(match[1], 10)));
  }
  return null;
}
function isMoodProtocolActive(items: Msg[]) {
  const n = getCurrentQuestionNumber(items);
  return n !== null && n >= 1 && n <= 11;
}
// Simple placeholder so Hints has something to read.
// You can replace this later if you want smarter hints.
function summarize(_items: Msg[]) {
  return { issue: "", shortTerm: "", longTerm: "" };
}


export default function Chat({ onExit }: { onExit?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: uid(), role: "assistant", content: 
        "Hi there 👋, welcome to Tortoise and Hare Wellness. I am here to support you. \n\n" +
        "Would you like to tell me about about what brought you here today, or would you prefer to select a conversation starter above?\n\n" +
        "Remember our chat is not monitored, recorded or stored. If you or someone you know is at risk of harm please ensure to call a help line like Lifeline 13 11 14 or in an emergency call 000 (Australia). For other regions, contact your local emergency number." }
  ]);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const [privacyOpen, setPrivacyOpen] = React.useState(false);


  // Feedback state + visibility control
  const [feedback, setFeedback] = useState<null | "up" | "down">(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackSource, setFeedbackSource] = useState<null | "auto" | "manual">(null);

  const summary = useMemo(() => summarize(messages), [messages]);
  const moodActive = isMoodProtocolActive(messages);
  const qNumber = getCurrentQuestionNumber(messages);

  // Auto-show after long chats (never during protocol/while thinking)
  const autoShouldShow = !moodActive && !isPending && messages.length >= 16;
  useEffect(() => {
    if (autoShouldShow && !feedbackVisible) {
      setFeedbackVisible(true);
      setFeedbackSource("auto");
    }
  }, [autoShouldShow, feedbackVisible]);

  useEffect(() => {
  function onExport() { exportPDF(); }
  function onReset() { handleResetChat(); }
  function onEnd() { handleEndChat(); }

  window.addEventListener("thw:export-pdf", onExport);
  window.addEventListener("thw:reset-chat", onReset);
  window.addEventListener("thw:end-chat", onEnd);

  return () => {
    window.removeEventListener("thw:export-pdf", onExport);
    window.removeEventListener("thw:reset-chat", onReset);
    window.removeEventListener("thw:end-chat", onEnd);
  };
}, []);


  async function send(prompt?: string) {
    const content = (prompt ?? value).trim();
    if (!content) return;
    setValue("");

    // If user types after leaving feedback, clear thanks/survey
    if (feedback !== null) {
      setFeedback(null);
      setFeedbackVisible(false);
      setFeedbackSource(null);
    }


    const user: Msg = { id: uid(), role: "user", content };
    setMessages(m => [...m, user]);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    startTransition(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, user].map(({ role, content }) => ({ role, content }))
          }),
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { reply: string };
        setMessages(m => [...m, { id: uid(), role: "assistant", content: data.reply }]);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setMessages(m => [...m, { id: uid(), role: "assistant", content: "Sorry, I couldn’t reach the AI just now. Try again." }]);
      } finally {
        abortRef.current = null;
      }
    });
  }

  

// Somewhere inside your component:
async function exportPDF() {
  try {
    await exportChatPdf(messages); // 👈 messages is your chat history state
  } catch (e: any) {
    alert(`Export failed: ${e?.message || e}`);
  }
}

// --- Move existing button logic into handlers so the header can call them ---
const handleResetChat = () => {
  setMessages([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi there 👋, welcome to Tortoise and Hare Wellness. I am here to support you. \n\n" +
        "Would you like to tell me about about what brought you here today, or would you prefer me ask you some questions?\n\n" +
        "Remember our chat is not monitored, recorded or stored. If you or someone you know is at risk of harm please ensure to call a help line like Beyond Blue or 000 in an emergency"
    }
  ]);
  setFeedback(null);
  setFeedbackVisible(false);
  setFeedbackSource(null);
  setValue("");
};

const handleEndChat = () => {
  setFeedbackVisible(true);
  setFeedbackSource("manual");
};


  // ⬇️ record feedback; if source is "manual" (End chat), go back to the opening page after logging
  async function recordFeedback(rating: "up" | "down", source: "auto" | "manual") {
    setFeedback(rating);
    try {
      // You switched your /api/feedback to accept JSON or FormData; JSON is fine
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          source,
          messageCount: messages.length,
          ts: new Date().toISOString(),
          // sessionId: ..., // add if you track sessions
        }),
        cache: "no-store",
      });
    } catch {
      // non-blocking
    } finally {
      if (source === "manual") {
        // 1) Clear any persisted chat state (if you add it later)
        try { localStorage.removeItem("th_chat_state"); } catch {}

        // 2) Optional in-memory reset (nice visual clean-up before exit)
        setMessages([{ id: uid(), role: "assistant", content: "Thanks for your time today. See you next session. 💙" }]);
        setFeedbackVisible(false);

        // 3) Tell the parent landing page to show again
        if (typeof onExit === "function") {
          onExit();
        } else {
          // Safety net if onExit isn’t passed (Page.tsx also listens for this)
          window.dispatchEvent(new Event("thw:end-chat"));
        }
      }
    }
  }

  const surveyPrompt =
    feedbackSource === "manual" ? "Did this chat help?" :
    feedbackSource === "auto" ? "Is this chat helping?" :
    "Did this chat help?";

  return (
      <>
      <div className="mx-auto max-w-[900px] px-4 mt-8">



      {/* Mode bar (hidden/disabled during Mood protocol) */}
      <div style={{ opacity: moodActive ? 0.4 : 1, pointerEvents: moodActive ? "none" as const : "auto" }}>
        <ModeBar onQuick={send} />
      </div>

      {/* Protocol banner + progress */}
      {moodActive && <ProtocolBanner qNumber={qNumber!} />}

      <MessageList items={messages} pending={isPending} />

      {/* Feedback survey (manual or auto), never during protocol or while thinking */}
      {feedbackVisible && !moodActive && !isPending && (
        <div style={{ marginTop: 20, textAlign: "center", opacity: 0.9 }}>
          {feedback === null ? (
            <>
              <p style={{ marginBottom: 8 }}>{surveyPrompt}</p>
              <button
                onClick={() => recordFeedback("up", feedbackSource ?? "manual")}
                style={{ fontSize: 24, marginRight: 12, cursor: "pointer", background: "none", border: "none" }}
                aria-label="Thumbs up"
                title="Thumbs up"
              >
                👍
              </button>
              <button
                onClick={() => recordFeedback("down", feedbackSource ?? "manual")}
                style={{ fontSize: 24, cursor: "pointer", background: "none", border: "none" }}
                aria-label="Thumbs down"
                title="Thumbs down"
              >
                👎
              </button>
            </>
          ) : (
            <p style={{ marginBottom: 8 }}>
              {feedback === "up" ? "Thanks for your feedback 💙" : "Thanks — we’ll keep improving 💡"}
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{ display: "flex", gap: 8, marginTop: 12, position: "sticky", bottom: 0, background: "#fff", paddingBottom: 12 }}
      >
        <input
          placeholder={moodActive ? "Answer with 1, 2, 3, or 4…" : "Type your message…"}
          inputMode={moodActive ? "numeric" : "text"}
          pattern={moodActive ? "[1-4]" : undefined}
          maxLength={moodActive ? 1 : 2000}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "1px solid #ddd",
            borderRadius: 10
          }}
          aria-label="Message input"
        />
        <button disabled={isPending} style={btn()}>
          {isPending ? "Thinking…" : "Send"}
        </button>
      </form>

      <Hints summary={summary} onUse={(t) => setValue(t)} />
        </div>
  </>
);

}

function btn(variant: "primary" | "secondary" = "primary") {
  return {
    borderRadius: 10,
    padding: "12px 14px",
    border: "1px solid " + (variant === "primary" ? "#222" : "#ddd"),
    background: variant === "primary" ? "#222" : "#fff",
    color: variant === "primary" ? "#fff" : "#222",
    cursor: "pointer"
  } as React.CSSProperties;
}

function MessageList({ items, pending }: { items: Msg[]; pending: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [items.length, pending]);

  return (
    <div
      ref={ref}
      style={{
        border: "1px solid #eee",
        padding: 12,
        borderRadius: 12,
        minHeight: 320,
        maxHeight: 500,
        overflowY: "auto",
        background: "#fafafa"
      }}
      aria-live="polite"
    >
      {items.map(m => (
        <Bubble key={m.id} role={m.role} text={m.content} />
      ))}
      {pending && <TypingBubble />}
    </div>
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  const isUser = role === "user";
  const align = isUser ? "flex-end" : "flex-start";
  const bg = isUser ? "#5e6ad2" : "#fff";
  const color = isUser ? "#fff" : "#222";
  const border = isUser ? "transparent" : "#e7e7e7";

  return (
    <div style={{ display: "flex", justifyContent: align, marginBottom: 8 }}>
      <div
        style={{
          maxWidth: "80%",
          background: bg,
          color,
          border: `1px solid ${border}`,
          padding: "10px 12px",
          borderRadius: 14,
          whiteSpace: "pre-wrap",
          boxShadow: isUser ? "0 4px 12px rgba(94,106,210,0.20)" : "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 8 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e7e7",
          padding: "10px 12px",
          borderRadius: 14,
          width: 64
        }}
        aria-label="Assistant is typing"
      >
        <span style={{ opacity: 0.6 }}>typing…</span>
      </div>
    </div>
  );
}

function ModeBar({ onQuick }: { onQuick: (text: string) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h1 className="mt-6 mb-8 text-lg md:text-4xl font-semibold text-[#000000]">
      Tortoise & Hare Wellness Coach
    </h1>
      {/* Title for the quick action chips */}
      <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 14, opacity: 0.8 }}>
        Conversation Starters: Select one to start your conversation or start typing.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <QuickChip
          className="pill"   // ← this applies the rounded chip styling from globals.css
          label="Lately I've been feeling..."
          onClick={() => onQuick("I'd like to talk about what I have been feeling.")

          }
        />

        <QuickChip
          label="Mood check-in"
          onClick={() =>
            onQuick("Hi, please begin a brief mood check-in now. Ask one question at a time (11 items). Start with the first question.")
          }
        />
        <QuickChip
          label="Mindfulness pause"
          onClick={() =>
            onQuick("Yes, please guide a gentle 1-minute breathing pause now, step by step. Then ask how I feel.")
          }
        />
        <QuickChip
          label="Help me set a goal"
          onClick={() =>
            onQuick("I would like assistance setting a goal. Please ask me a couple of questions to understand and help me set a goal")
          }
        />


      </div>
    </div>
  );
}


type QuickChipProps = {
  label: string;
  onClick?: () => void;
  className?: string; // ✅
};

function QuickChip({ label, onClick, className }: QuickChipProps) {
  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}


function ProtocolBanner({ qNumber }: { qNumber: number }) {
  const pct = Math.round((qNumber / 11) * 100);
  return (
    <div style={{
      background: "#eef1ff",
      border: "1px solid #dfe3ff",
      borderRadius: 10,
      padding: 10,
      marginBottom: 10
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <strong>Mood check-in in progress</strong>
        <span>Q{qNumber}/11</span>
      </div>
      <div style={{ height: 8, background: "#e6e9ff", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#5e6ad2" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
        Please answer with <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, or <strong>4</strong>.
      </div>
    </div>
  );
}

function Hints({ summary, onUse }: { summary: { issue: string; shortTerm: string; longTerm: string }; onUse: (t: string) => void }) {
  const hints: string[] = [];
  if (!summary.issue) hints.push("Lately I have been feeling...");
  if (!summary.shortTerm) hints.push("I'd like some guidance on...");
  if (!summary.longTerm) hints.push("Can I talk about...");

  if (!hints.length) return null;
  return (
    <div style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>
      <div style={{ marginBottom: 4 }}>Helpful Starters (click a helpful starter to begin you conversation):</div>
      <ul>
        {hints.map((h, i) => (
          <li key={i} style={{ cursor: "pointer" }} onClick={() => onUse(h)}>
            {h}
          </li>
        ))}
      </ul>
    </div>
  );
}
