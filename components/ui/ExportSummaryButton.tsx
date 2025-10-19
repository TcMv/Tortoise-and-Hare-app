// components/ui/ExportSummaryButton.tsx
"use client";
import React from "react";
import SummaryModal from "@/components/ui/SummaryModal";

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string };
type Summary = {
  issue: string;
  emotion: string;
  shortTermGoal: string;
  longTermGoal: string;
  summary: string;
};

export default function ExportSummaryButton({ messages }: { messages: ChatMessage[] }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Summary | null>(null);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const nonEmpty = (messages ?? []).filter(m => (m.content ?? "").trim().length > 0);
      if (nonEmpty.length === 0) {
        setLoading(false);
        setError("No chat content yet.");
        return;
      }

      const resp = await fetch("/api/export-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nonEmpty }),
      });

      const txt = await resp.text();
      if (!resp.ok) {
        setError(txt || `HTTP ${resp.status}`);
        setLoading(false);
        return;
      }

      const s = JSON.parse(txt) as Summary;
      setData({
        issue: s.issue || "",
        emotion: s.emotion || "",
        shortTermGoal: s.shortTermGoal || "",
        longTermGoal: s.longTermGoal || "",
        summary: s.summary || "",
      });
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center rounded-2xl px-4 py-2 shadow-sm bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-60"
      >
        Export Summary
      </button>

      <SummaryModal
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        loading={loading}
        error={error}
      />
    </>
  );
}
