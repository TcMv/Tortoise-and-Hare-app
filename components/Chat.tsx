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

  const [messages, setMessages] = useState<Msg[]>([]);


  const [thinking, setThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

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

  // ---- SEND LOGIC (async!) ----
  async function send(content: string) {
    const text = (content ?? "").trim();
    if (!text) return;

    if (feedback !== null) {
      setFeedback(null);
      setFeedbackVisible(false);
      setFeedbackSource(null);
    }

    const user: Msg = { id: uid(), role: "user", content: text };

    // ✅ Use the ref so we never send a stale history
    const history = [...messagesRef.current, user];

    // Update UI immediately
    setMessages((m) => [...m, user]);

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { reply: string };
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: data.reply },
      ]);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: "Sorry, I couldn’t reach the AI just now. Try again.",
          },
        ]);
      }
    } finally {
      abortRef.current = null;
      setThinking(false);
    }
  }


  // Allow page-level textarea to submit via event
  useEffect(() => {
    function onExternalSend(e: Event) {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (detail?.text) send(detail.text);
    }
    window.addEventListener("thw:send", onExternalSend as EventListener);
    return () => window.removeEventListener("thw:send", onExternalSend as EventListener);
  }, []); // send is stable enough here; user action triggers it

  // Reset / End handlers
  const handleResetChat = () => {
    // Clear the thread (no old welcome message)
    setMessages([]);

    // Reset feedback UI as you already do
    setFeedback(null);
    setFeedbackVisible(false);
    setFeedbackSource(null);

    // 🔔 Ask the page to open the new starters modal
    window.dispatchEvent(new CustomEvent("thw:open-starters"));
  };


  const handleEndChat = () => {
    setFeedbackVisible(true);
    setFeedbackSource("manual");
    setTimeout(() => {
      if (feedback === null) {
        if (typeof onExit === "function") onExit();
        else window.dispatchEvent(new Event("thw:end-chat"));
      }
    }, 5000);
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
        try {
          localStorage.removeItem("th_chat_state");
        } catch { }
        setMessages([
          {
            id: uid(),
            role: "assistant",
            content: "Thanks for your time today. See you next session. 💙",
          },
        ]);
        setFeedbackVisible(false);
        if (typeof onExit === "function") onExit();
        else window.dispatchEvent(new Event("thw:end-chat"));
      }
    }
  }

  const surveyPrompt =
    feedbackSource === "manual"
      ? "Did this chat help?"
      : feedbackSource === "auto"
        ? "Is this chat helping?"
        : "Did this chat help?";

  // ---------------- RENDER ----------------
  return (
    <div className="h-full w-full bg-stone-50 grid grid-rows-[auto,1fr] overflow-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="mx-auto max-w-screen-sm px-4 sm:px-6 py-3">
          <h2 className="text-xl font-semibold text-center">
            Tortoise & Hare Wellness AI Chat
          </h2>

          {/* Buttons row */}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <ExportSummaryButton
              className={headerBtn}
              messages={messages
                .filter((m) => (m.content ?? "").trim().length > 0)
                .map(({ role, content }) => ({ role, content }))}
            />

            <button type="button" onClick={handleResetChat} className={headerBtn}>
              Reset
            </button>

            <button type="button" onClick={handleEndChat} className={headerBtn}>
              End
            </button>
          </div>
        </div>
      </header>

      {/* MAIN (conversation starter + chat area) */}
      <main className="relative h-full overflow-hidden">
        <div className="mx-auto max-w-screen-sm h-full px-4 sm:px-6">
          <div className="h-full pt-3 flex flex-col gap-3 overflow-hidden">


            {/* Optional protocol progress */}
            {moodActive && <ProtocolBanner qNumber={qNumber!} />}

            {/* CHAT AREA – fills remaining height and scrolls */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MessageList items={messages} pending={thinking} />
            </div>

            {/* Optional feedback (kept lightweight) */}
            {feedbackVisible && !moodActive && !thinking && (
              <div className="text-center opacity-90">
                {feedback === null ? (
                  <>
                    <p className="mb-2">{surveyPrompt}</p>
                    <button
                      onClick={() => recordFeedback("up", feedbackSource ?? "manual")}
                      className="text-2xl mr-3"
                    >
                      👍
                    </button>
                    <button
                      onClick={() => recordFeedback("down", feedbackSource ?? "manual")}
                      className="text-2xl"
                    >
                      👎
                    </button>
                  </>
                ) : (
                  <p className="mb-2">
                    {feedback === "up"
                      ? "Thanks for your feedback 💙"
                      : "Thanks — we’ll keep improving 💡"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---------------- Subcomponents ----------------

function MessageList({ items, pending }: { items: Msg[]; pending: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [items.length, pending]);

  return (
    <div ref={ref} className="h-full overflow-y-auto space-y-2 px-1" aria-live="polite">
      {items.map((m) => (
        <Bubble key={m.id} role={m.role} text={m.content} />
      ))}
      {pending && <TypingBubble />}
    </div>
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  const isUser = role === "user";
  const align = isUser ? "flex-end" : "flex-start";
  const bg = isUser ? "#00B090" : "#fff";
  const color = isUser ? "#ffffff" : "#222";
  const border = isUser ? "BFEADF" : "#e7e7e7";
  const shadow = isUser ? "0 4px 12px rgba(16,185,129,0.20)" : "0 2px 8px rgba(0,0,0,0.04)";

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
          boxShadow: shadow,
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
          minWidth: 56,
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
        aria-label="Assistant is typing"
        role="status"
      >
        <span className="thw-dot" />
        <span className="thw-dot" style={{ animationDelay: "0.2s" }} />
        <span className="thw-dot" style={{ animationDelay: "0.4s" }} />
        <span className="sr-only">Assistant is typing…</span>

        <style jsx>{`
          .thw-dot {
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background: #9aa0a6; /* subtle grey */
            display: inline-block;
            animation: thwBlink 1.2s infinite ease-in-out both;
            opacity: 0.25;
          }
          @keyframes thwBlink {
            0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
            40% { opacity: 1; transform: translateY(-1px); }
          }
          .sr-only {
            position: absolute;
            width: 1px; height: 1px;
            padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
            white-space: nowrap; border: 0;
          }
        `}</style>
      </div>
    </div>
  );
}




function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
  const v = e.target.value;
  if (!v) return;
  onQuick(v);
  e.target.value = ""; // reset back to placeholder
}



function ProtocolBanner({ qNumber }: { qNumber: number }) {
  const pct = Math.round((qNumber / 11) * 100);
  return (
    <div
      style={{
        background: "#eef1ff",
        border: "1px solid #dfe3ff",
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}
      >
        <strong>Mood check-in in progress</strong>
        <span>Q{qNumber}/11</span>
      </div>
      <div style={{ height: 8, background: "#e6e9ff", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#5e6ad2" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
        Please answer with <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, or{" "}
        <strong>4</strong>.
      </div>
    </div>
  );
}
