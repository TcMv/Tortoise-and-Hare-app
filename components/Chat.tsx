'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import ExportSummaryButton from "@/components/ui/ExportSummaryButton";


// ---- Types ----
type Role = "user" | "assistant" | "system";
type Msg = { id: string; role: Role; content: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

// Reusable button style for header actions
const headerBtn =
  "rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[15px] font-medium text-stone-800 " +
  "hover:bg-stone-100 active:scale-[0.98] transition";


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

export default function Chat({
  onExit,
  onMessagesChange,
}: {
  onExit?: () => void;
  onMessagesChange?: (msgs: { role: Role; content: string }[]) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Hi there 👋, welcome to Tortoise and Hare Wellness. I am here to support you. \n\n" +
        "Would you like to tell me about about what brought you here today, or would you prefer to select a conversation starter above?\n\n"
    }
  ]);
  const [value, setValue] = useState("");
  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Feedback state + visibility control
  const [feedback, setFeedback] = useState<null | "up" | "down">(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackSource, setFeedbackSource] = useState<null | "auto" | "manual">(null);

  const summary = useMemo(() => summarize(messages), [messages]);
  const moodActive = isMoodProtocolActive(messages);
  const qNumber = getCurrentQuestionNumber(messages);

  // Let parent (page.tsx) mirror the chat if it wants to
  useEffect(() => {
    onMessagesChange?.(messages.map(({ role, content }) => ({ role, content })));
  }, [messages, onMessagesChange]);

  // Auto-show after long chats (never during protocol/while thinking)
  const autoShouldShow = !moodActive && !thinking && messages.length >= 16;
  useEffect(() => {
    if (autoShouldShow && !feedbackVisible) {
      setFeedbackVisible(true);
      setFeedbackSource("auto");
    }
  }, [autoShouldShow, feedbackVisible]);

  async function send(prompt?: string) {
    const content = (prompt ?? value).trim();
    if (!content) return;
    setValue("");

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

    setThinking(true);
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

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = await res.json() as { reply: string };
      setMessages(m => [...m, { id: uid(), role: "assistant", content: data.reply }]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages(m => [...m, { id: uid(), role: "assistant", content: "Sorry, I couldn’t reach the AI just now. Try again." }]);
      }
    } finally {
      abortRef.current = null;
      setThinking(false);
    }
  }




  // Reset / End handlers
  const handleResetChat = () => {
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content:
          "Hi there 👋, welcome to Tortoise and Hare Wellness. I am here to support you. \n\n" +
          "Would you like to tell me about about what brought you here today, or would you prefer me ask you some questions?\n\n"
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

  // Feedback recorder
  async function recordFeedback(rating: "up" | "down", source: "auto" | "manual") {
    setFeedback(rating);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          source,
          messageCount: messages.length,
          ts: new Date().toISOString(),
        }),
        cache: "no-store",
      });
    } catch {
      // non-blocking
    } finally {
      if (source === "manual") {
        try { localStorage.removeItem("th_chat_state"); } catch { }
        setMessages([{ id: uid(), role: "assistant", content: "Thanks for your time today. See you next session. 💙" }]);
        setFeedbackVisible(false);
        if (typeof onExit === "function") onExit();
        else window.dispatchEvent(new Event("thw:end-chat"));
      }
    }
  }

  const surveyPrompt =
    feedbackSource === "manual" ? "Did this chat help?" :
      feedbackSource === "auto" ? "Is this chat helping?" :
        "Did this chat help?";

  
  return (
    <div className="h-dvh bg-stone-50 grid grid-rows-[auto,1fr] overflow-hidden">

      {/* HEADER (title + three buttons) */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="mx-auto max-w-screen-sm px-4 sm:px-6 py-3">
          <h2 className="text-lg font-semibold text-center sm:text-left">
            Tortoise & Hare Wellness AI Chat
          </h2>

          {/* 3 equal buttons, consistent sizing */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="w-full">
              <ExportSummaryButton
                messages={messages
                  .filter(m => (m.content ?? "").trim().length > 0)
                  .map(({ role, content }) => ({ role, content }))}
              />
            </div>
            <button
              type="button"
              onClick={handleResetChat}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[15px] font-medium text-stone-800 hover:bg-stone-100 active:scale-[0.98] transition"
              title="Reset chat"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleEndChat}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[15px] font-medium text-stone-800 hover:bg-stone-100 active:scale-[0.98] transition"
              title="End chat & show survey"
            >
              End
            </button>
          </div>
        </div>
      </header>

      {/* MAIN – only the messages area scrolls; we pad bottom so fixed footer never overlaps */}
      <main className="relative">
        <div className="mx-auto max-w-screen-sm h-full px-4 sm:px-6">
          <div className="h-full pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+72px)] flex flex-col gap-3 overflow-hidden">


            {/* Conversation starter (disabled during protocol) */}
            <div style={{ opacity: moodActive ? 0.4 : 1, pointerEvents: moodActive ? "none" : "auto" }}>
              <ModeBar onQuick={send} />
            </div>

            {/* Protocol banner */}
            {moodActive && <ProtocolBanner qNumber={qNumber!} />}

            {/* Messages — fills remaining height and scrolls like a chat app */}
            <div className="flex-1 min-h-0">
              <MessageList items={messages} pending={thinking} />
            </div>

            {/* Optional feedback section (non-blocking) */}
            {feedbackVisible && !moodActive && !thinking && (
              <div className="text-center opacity-90">
                {feedback === null ? (
                  <>
                    <p className="mb-2">
                      {feedbackSource === "manual" ? "Did this chat help?" :
                        feedbackSource === "auto" ? "Is this chat helping?" :
                          "Did this chat help?"}
                    </p>
                    <button
                      onClick={() => recordFeedback("up", feedbackSource ?? "manual")}
                      className="text-2xl mr-3"
                      aria-label="Thumbs up"
                      title="Thumbs up"
                    >👍</button>
                    <button
                      onClick={() => recordFeedback("down", feedbackSource ?? "manual")}
                      className="text-2xl"
                      aria-label="Thumbs down"
                      title="Thumbs down"
                    >👎</button>
                  </>
                ) : (
                  <p className="mb-2">
                    {feedback === "up" ? "Thanks for your feedback 💙" : "Thanks — we’ll keep improving 💡"}
                  </p>
                )}
              </div>

            )}

          </div>
        </div>

        {/* AFTER (white only under the chat width) */}
        <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
  <div className="mx-auto max-w-screen-sm px-4 sm:px-6">
    <div className="pointer-events-auto rounded-t-2xl border-t bg-white/95 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 px-0">
        <div className="flex-1 min-w-0">
          <textarea
            placeholder={moodActive ? "Answer with 1, 2, 3, or 4…" : "Type your message…"}
            value={value}
            onChange={(e) => {
              let v = e.target.value;
              if (moodActive) v = v.replace(/[^1-4]/g, "").slice(0, 1);
              setValue(v);
              // auto-grow up to ~5 lines
              const el = e.currentTarget;
              el.style.height = "auto";
              const line = parseFloat(getComputedStyle(el).lineHeight || "22");
              const maxH = line * 5;
              el.style.height = Math.min(el.scrollHeight, maxH) + "px";
              el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            className="block w-full box-border leading-6 min-h-[44px] max-h-40 px-3 py-2 rounded-xl border border-stone-300 bg-white resize-none overflow-x-hidden appearance-none shadow-none focus:shadow-none focus:outline-none focus:ring-0"
            aria-label="Message input"
          />
        </div>

        <button
          disabled={thinking}
          className="rounded-xl bg-stone-900 text-white px-4 py-2 font-medium disabled:opacity-50"
        >
          {thinking ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  </div>
</div>




      </main>
    </div>
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
      className="h-full overflow-y-auto space-y-2 px-1"
      aria-live="polite"
    >
      {items.map(m => <Bubble key={m.id} role={m.role} text={m.content} />)}
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
  const starters = [
    { label: "Lately I’ve been feeling…", value: "I'd like to talk about what I have been feeling." },
    { label: "Mood check-in", value: "Hi, please begin a brief mood check-in now. Ask one question at a time (11 items). Start with the first question." },
    { label: "Mindfulness pause", value: "Yes, please guide a gentle 1-minute breathing pause now, step by step. Then ask how I feel." },
    { label: "Help me set a goal", value: "I would like assistance setting a goal. Please ask me a couple of questions to understand and help me set a goal" },
  ];

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (!v) return;
    onQuick(v);
    e.target.value = ""; // reset back to placeholder
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-stone-700/80">
        Conversation starter
      </div>

      <select
        onChange={handleSelect}
        defaultValue=""
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-[15px] leading-6 focus:outline-none focus:ring-2 focus:ring-blue-200"
        aria-label="Conversation starter"
      >
        <option value="" disabled>Choose a starter…</option>
        {starters.map(s => (
          <option key={s.label} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}


type QuickChipProps = { label: string; onClick?: () => void; className?: string; };
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

//function Hints({
//summary,
//onUse
//}: {
//summary: { issue: string; shortTerm: string; longTerm: string };
//onUse: (t: string) => void;
//}) {
//const hints: string[] = [];
//if (!summary.issue) hints.push("Lately I have been feeling...");
//if (!summary.shortTerm) hints.push("I'd like some guidance on...");
//if (!summary.longTerm) hints.push("Can I talk about...");

//if (!hints.length) return null;

//return (
//<div style={{ marginTop: 16, fontSize: 13, opacity: 0.7 }}>
//<div style={{ marginBottom: 4 }}>
//"Powered by Tortoise & Hare Wellness"
//</div>
//{/* If you later want clickable hints: */}
//{/* <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
//{hints.map(h => (
//<button key={h} onClick={() => onUse(h)} style={{ border:'1px solid #ddd', borderRadius:999, padding:'6px 10px', background:'#fff' }}>
//{h}
//</button>
//))}
//</div> */}
//</div>
//);
//}

