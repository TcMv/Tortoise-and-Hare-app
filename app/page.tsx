'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Chat from "@/components/Chat";
import { Card, CardContent } from "@/components/ui/card";
// If you have a logo file, drop it in /public/logo-thw.svg and uncomment the next line:
// import Image from "next/image";

export default function Page() {
  const [showChat, setShowChat] = useState(false);
  const [ack, setAck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const chatTopRef = useRef<HTMLDivElement | null>(null);

  // Remember the checkbox setting
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
    setShowChat(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    function onEndChatEvent() {
      handleExit();
    }
    window.addEventListener("thw:end-chat" as any, onEndChatEvent);
    return () => window.removeEventListener("thw:end-chat" as any, onEndChatEvent);
  }, [handleExit]);

  // ---- Chat view ----
  if (showChat) {
    return (
      <div className="min-h-screen bg-[#FFF8F1] px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-2xl shadow-sm border bg-white/90 backdrop-blur">
            <CardContent className="p-4 md:p-6">
              <Chat onExit={handleExit} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Landing view ----
  return (
    <main className="min-h-screen flex flex-col bg-[#FFF8F1] text-[#11122D]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#FFF8F1]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* If you have a logo file, use Image here */}
            {/* <Image src="/logo-thw.svg" alt="Tortoise & Hare Wellness" width={36} height={36} /> */}
            <div className="flex items-center gap-2">
              {/* simple tortoise & hare mark as placeholder */}
              <span aria-hidden className="text-xl">🐢🐇</span>
              <span className="font-semibold tracking-tight">Tortoise &amp; Hare Wellness</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button
              className="text-sm hover:opacity-75"
              onClick={() => {
                chatTopRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start Chat
            </button>
            <a
              className="text-sm hover:opacity-75"
              href="https://tarancroxton.wixsite.com/website"
              target="_blank"
              rel="noreferrer"
            >
              Book Counselling Session
            </a>
            <a className="text-sm hover:opacity-75" href="/privacy" rel="noreferrer">
              Privacy Statement
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg border border-black/10"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {/* simple svg burger */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-black/5 bg-[#FFF8F1]">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
              <button
                className="text-left"
                onClick={() => {
                  setMenuOpen(false);
                  chatTopRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Start Chat
              </button>
              <a
                className="text-left"
                href="https://tarancroxton.wixsite.com/website"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                Book Counselling Session
              </a>
              <a className="text-left" href="/privacy" onClick={() => setMenuOpen(false)}>
                Privacy Statement
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        className="flex-1"
        style={{
          background: "linear-gradient(to bottom, #FFF8F1 0%, #F5F3EE 100%)",
        }}
      >
        <div ref={chatTopRef} />

        <div className="mx-auto max-w-3xl px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-semibold leading-[1.1] tracking-tight">
            Instant Advice. <span className="whitespace-nowrap">Long-Term Growth.</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-[#5F6B7A]">
            Your personal AI wellness coach — here to help you reflect, set goals, and move forward.
          </p>

          {/* Start button */}
          <div className="mt-8">
            <button
              onClick={() => setShowChat(true)}
              disabled={!ack}
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-white font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: ack
                  ? "linear-gradient(90deg, #23B384 0%, #3AD4B2 100%)"
                  : "#C7DAD4",
              }}
            >
              Start Chat
            </button>
          </div>

          {/* Checkbox */}
          <label className="mt-5 mx-auto max-w-md flex items-center justify-center gap-3 text-sm text-[#11122D]">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="size-4 accent-[#23B384]"
            />
            <span>I understand this chat is not monitored or recorded.</span>
          </label>

          {/* Reassurance line */}
          <div className="mt-3 text-sm text-[#5F6B7A]">
            <strong className="font-semibold text-[#11122D]">Private, supportive coaching.</strong> No data
            stored or shared.
          </div>
        </div>
      </section>

      {/* Footer disclaimer */}
      <footer className="px-4 py-5 text-center text-xs text-[#5F6B7A]">
        This app does not provide medical advice or crisis intervention. In Australia call <strong>000</strong> or
        <strong> Lifeline 13 11 14</strong>. For other regions, contact your local emergency number.
      </footer>
    </main>
  );
}
