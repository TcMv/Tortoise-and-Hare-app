'use client';

import React, { useRef, useState } from "react";
import Image from "next/image";
import Chat from "@/components/Chat";
import { Card, CardContent } from "@/components/ui/card";

type MsgSlim = { role: "user" | "assistant" | "system"; content: string };

export default function Page() {
  // UI state
  const [showChat, setShowChat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ack, setAck] = useState(false);

  // Where the “Start Chat” button scrolls to
  const chatTopRef = useRef<HTMLDivElement | null>(null);

  // Mirror of Chat’s messages (role + content only) for the Export PDF button
  const [chatMessages, setChatMessages] = useState<MsgSlim[]>([]);

  // Called by Chat when the user hits “End chat”
  function handleExit() {
    setShowChat(false);
    // optional: scroll to top/hero
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  }

  // ----- Views we’ll toggle between -----
////-----CHAT VIEW-----////
  const ChatView = (
    <main className="min-h-screen flex flex-col bg-[#FFF8F1] text-[#11122D]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#FFF8F1]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/tortoise-hare-logo.png"
              alt="Tortoise & Hare Wellness"
              width={200}
              height={60}
              priority
            />
          </div>
        </div>
      </header>

      {/* Chat box */}
      <div className="flex-1 flex items-start justify-center mt-8 px-4">
        <div className="w-full max-w-5xl">
          <Card className="rounded-2xl shadow-sm border bg-white/90 backdrop-blur">
            <CardContent className="p-4 md:p-6">
              {/* 🔹 Chat pushes a slim copy of messages up via onMessagesChange */}
              <Chat
                onExit={handleExit}
                onMessagesChange={(msgs) => setChatMessages(msgs)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );


////-----LANDING VIEW--------////


  const LandingView = (
    <main className="min-h-screen flex flex-col bg-[#FFF8F1] text-[#11122D]">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#FFF8F1]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/tortoise-hare-logo.png"
              alt="Tortoise & Hare Wellness"
              width={200}
              height={60}
              priority
            />
          </div>

          <nav className="hidden md:flex items-center gap-6">
            

            <a
              className="text-sm hover:opacity-75"
              href="https://tarancroxton.wixsite.com/website"
              target="_blank"
              rel="noreferrer"
            >
              Book Counselling Session
            </a>

            <button
              type="button"
              className="text-sm hover:opacity-75"
              onClick={() => window.dispatchEvent(new Event("thw:open-privacy"))}
            >
              Privacy Statement
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg border border-black/10"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-black/5 bg-[#FFF8F1]">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
              
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
        className="flex-1 flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #FFF8F1 0%, #F5F3EE 100%)" }}
      >
        <div ref={chatTopRef} />

        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-semibold leading-[1.1] tracking-tight">
            Instant Advice. <span className="whitespace-nowrap">Long-Term Growth.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[#5F6B7A]">
            Your personal AI wellness coach — here to help you reflect, set goals, and move forward.
          </p>

          {/* Start button */}
          <div className="mt-10">
            <button
              onClick={() => setShowChat(true)}
              disabled={!ack}
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-white font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <label className="mt-6 mx-auto max-w-md flex items-center justify-center gap-3 text-sm text-[#11122D]">
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
            <strong className="font-semibold text-[#11122D]">Private, supportive coaching.</strong> No data stored or shared.
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

  // 🔹 One return only — choose which view to render
  return showChat ? ChatView : LandingView;
}
