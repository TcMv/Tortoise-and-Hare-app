'use client';

import React, { useRef, useState } from "react";
import Image from "next/image";
import Chat from "@/components/Chat";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // 👈 correct import (capitalised)
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type MsgSlim = { role: "user" | "assistant" | "system"; content: string };

export default function Page() {
  const [showChat, setShowChat] = useState(false);
  const [ack, setAck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<MsgSlim[]>([]);

  const chatTopRef = useRef<HTMLDivElement | null>(null);

  function handleExit() {
    setShowChat(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- CHAT VIEW ----------
  // remove these states + function at the top of Page():
  // const [value, setValue] = useState("");
  // const [thinking, setThinking] = useState(false);
  // async function handleSend(...) { ... }  // DELETE

  // ----- CHAT VIEW -----
  const ChatView = (
    <main className="min-h-screen flex flex-col bg-[#FFF8F1] text-[#11122D]">
      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#FFF8F1]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Light mode */}
            <Image
              src="/tortoise-hare-logo.png"
              alt="Tortoise & Hare Wellness"
              width={200}
              height={60}
              priority
              className="block dark:hidden"
            />
            {/* Dark mode */}
            <Image
              src="/tortoise-hare-logo-white.png"
              alt="Tortoise & Hare Wellness"
              width={200}
              height={60}
              priority
              className="hidden dark:block"
            />
          </div>

        </div>
      </header>

      {/* Card holds both chat and input */}
      <div className="flex-1 flex justify-center items-center bg-stone-50 py-6">
        <Card className="flex flex-col w-full max-w-5xl h-[80vh] rounded-2xl shadow-sm border bg-white/90 backdrop-blur">
          <CardContent className="flex flex-col h-full p-6 sm:p-10">

            {/* Chat section (scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto mb-4">
              <Chat
                onExit={handleExit}
                onMessagesChange={(msgs) => setChatMessages(msgs)}
              />
            </div>

            {/* Textarea section (inside card, below the scrollable area) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const el = e.currentTarget.elements.namedItem("thwMsg") as HTMLTextAreaElement | null;
                const text = el?.value?.trim() ?? "";
                if (!text) return;
                window.dispatchEvent(new CustomEvent("thw:send", { detail: { text } })); // send to Chat.tsx
                if (el) el.value = "";
                // ✅ reset the input
                if (el) {
                  el.value = "";
                  el.style.height = "";         // back to default (one line)
                  el.style.overflowY = "hidden"; // avoids residual scrollbars (safe even if not needed)
                }

              }}
              className="flex items-end gap-2 border-t pt-4"
            >
              <Textarea
                name="thwMsg"
                placeholder="Type your message…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-stone-300 px-3 py-2 leading-6 focus:ring-2 focus:ring-stone-400"
              />
              <Button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-xs"
                aria-label="Send message"
              >
                {/* paper plane icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 11.5l17-7-7 17-2.5-6.5L3 11.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Send</span>
              </Button>


            </form>

          </CardContent>
        </Card>
      </div>

      {/* Optional footer */}
      <footer className="px-4 py-5 text-center text-xs text-[#5F6B7A]">
        This app does not provide medical advice. If you need help, call
        <strong> Lifeline 13 11 14</strong>.
      </footer>
    </main>
  );


  // ---------- LANDING VIEW ----------
  const LandingView = (
    <main className="min-h-screen flex flex-col bg-[#FFF8F1] text-[#11122D]">
      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#FFF8F1]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Image
            src="/tortoise-hare-logo.png"
            alt="Tortoise & Hare Wellness"
            width={200}
            height={60}
            priority
            className="block dark:hidden"
          />
          {/* Dark mode */}
          <Image
            src="/tortoise-hare-logo-white.png"
            alt="Tortoise & Hare Wellness"
            width={200}
            height={60}
            priority
            className="hidden dark:block"
          />
        </div>
      </header>

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

          <label className="mt-6 mx-auto max-w-md flex items-center justify-center gap-3 text-sm text-[#11122D]">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="size-4 accent-[#23B384]"
            />
            <span>I understand this chat is not monitored or recorded.</span>
          </label>
        </div>
      </section>
    </main>
  );

  return showChat ? ChatView : LandingView;
}
