// components/ui/ExportSummaryButton.tsx
"use client";
import * as React from "react";
import SummaryModal from "@/components/ui/SummaryModal";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant" | "system";
type ChatMessage = { role: Role; content: string };

type Summary = {
  issue: string;
  emotion: string;
  shortTermGoal: string;
  longTermGoal: string;
  summary: string;
};


type Props = React.ComponentProps<"button"> & {
  messages: ChatMessage[];
};


export default function ExportSummaryButton({ 
    messages,
  className,     // now valid
  ...buttonProps // any other button props passed in
}: Props) {
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

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        setError(txt || `HTTP ${resp.status}`);
        setLoading(false);
        return;
      }

      const s = (await resp.json()) as Summary;
      setData({
        issue: s.issue ?? "",
        emotion: s.emotion ?? "",
        shortTermGoal: s.shortTermGoal ?? "",
        longTermGoal: s.longTermGoal ?? "",
        summary: s.summary ?? "",
      });
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-[15px] font-medium text-stone-800 hover:bg-stone-100 active:scale-[0.98] transition",
          className
        )}
        {...buttonProps}
      >
        Summary
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
