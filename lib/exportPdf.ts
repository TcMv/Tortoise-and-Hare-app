// lib/exportPdf.ts
import jsPDF from "jspdf";

const LOGO_PATH = "/tortoise-hare-logo.png";
const NAVY = "#1E293B";
const SLATE = "#475569";
const BORDER = "#CBD5E1";
const ACCENT = "#38BDF8";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

async function toDataUrl(path: string) {
  const res = await fetch(path);
  const blob = await res.blob();
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function exportChatPdf(messages: ChatMessage[]) {
  // 1) Analyse with API
  const resp = await fetch("/api/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!resp.ok) {
    let msg = "Failed to analyse chat.";
    try { const j = await resp.json(); msg = j?.error || msg; } catch { msg = await resp.text(); }
    throw new Error(msg);
  }
  const s = await resp.json() as {
    issue: string; emotion: string; shortTermGoal: string; longTermGoal: string; summary: string;
  };

  // 2) Build PDF
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const contentW = pageW - marginX * 2;

  let logoDataUrl: string | null = null;
  try { logoDataUrl = await toDataUrl(LOGO_PATH); } catch {}

  const printDate = new Date().toLocaleString();

  const drawHeader = () => {
    let y = 40;
    if (logoDataUrl) {
      const w = 120, h = 60;
      doc.addImage(logoDataUrl, "PNG", (pageW - w) / 2, y, w, h);
    }
    y += 80;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(NAVY);
    doc.text("Tortoise and Hare Chat Summary", pageW / 2, y, { align: "center" });
    y += 10;
    doc.setDrawColor(BORDER);
    doc.line(marginX, y, pageW - marginX, y);
    return y + 20;
  };

  const drawFooter = () => {
    const footerY = pageH - 30;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(SLATE);
    doc.text(`Generated: ${printDate}`, marginX, footerY);
    const pageNo = (doc as any).getCurrentPageInfo?.().pageNumber || doc.getNumberOfPages();
    doc.text(`Page ${pageNo}`, pageW - marginX, footerY, { align: "right" });
  };

  let y = drawHeader();
  drawFooter();

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 48) {
      doc.addPage();
      y = drawHeader();
      drawFooter();
    }
  };

  const section = (label: string, text: string) => {
    const body = text?.trim() ? text : "—";
    ensureSpace(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(ACCENT);
    doc.text(label, marginX, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(SLATE);
    const lines = doc.splitTextToSize(body, contentW);
    for (const line of lines) {
      ensureSpace(18);
      doc.text(line as string, marginX, y + 16);
      y += 16;
    }
    y += 10;
  };

  section("Issue", s.issue);
  section("Emotions", s.emotion);
  section("Short-Term Goal", s.shortTermGoal);
  section("Long-Term Goal", s.longTermGoal);
  section("Summary of Chat", s.summary);

  doc.save("Tortoise_and_Hare_Chat_Summary.pdf");
}
