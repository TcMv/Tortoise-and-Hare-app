// components/ui/SummaryModal.tsx
"use client";
import React from "react";
import jsPDF from "jspdf";
import { createPortal } from "react-dom";


type Summary = {
    issue: string;
    emotion: string;
    shortTermGoal: string;
    longTermGoal: string;
    summary: string;
};

export default function SummaryModal({
    open,
    onClose,
    data,
    loading,
    error,
}: {
    open: boolean;
    onClose: () => void;
    data: Summary | null;
    loading: boolean;
    error: string | null;
}) {
    if (!open) return null;

    // small helper for the logo
    async function toDataUrl(path: string): Promise<string> {
        const res = await fetch(path);
        const blob = await res.blob();
        return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    }

    // ✅ make this async so we can await the logo
    async function exportPdfFromSummary(s: Summary) {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const M = 64;
        let y = M;

        // spacing tweaks
        const SECTION_GAP = 26;  // space between sections
        const HEADING_GAP = 14;  // space between a section heading and its body
        const LINE = 18;

        // --- Logo banner (bigger, centered)
        try {
            const logo = await toDataUrl("/tortoise-hare-logo.png");
            const bannerW = 220, bannerH = 110;
            doc.addImage(logo, "PNG", (pageW - bannerW) / 2, y, bannerW, bannerH);
            y += bannerH + 14;
        } catch {
            // no logo — continue
        }

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor("#11122D");
        doc.text("Chat Summary", pageW / 2, y, { align: "center" });
        y += 24;

        // Date/time
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor("#475569");
        doc.text(new Date().toLocaleString(), pageW / 2, y, { align: "center" });
        y += 18;

        // Divider
        doc.setDrawColor("#CBD5E1");
        doc.setLineWidth(1);
        doc.line(M, y, pageW - M, y);
        y += 18;

        // section helper with nicer spacing + divider
        const add = (label: string, text: string) => {
            // section heading
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor("#23B384");
            doc.text(label, M, y);
            y += HEADING_GAP;

            // body
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.setTextColor("#475569");
            // Break the text into lines that fit within the page margins
            const lines: string[] = doc.splitTextToSize(text, pageW - 2 * M);

            // simple page-break check
            const needed = lines.length * LINE + SECTION_GAP + 8 + 8;
            if (y + needed > pageH - M) {
                doc.addPage();
                y = M;
            }

            (lines as string[]).forEach((ln: string) => {
                doc.text(ln, M, y);
                y += LINE;
            });

            // light divider and breathing room
            y += 8;
            doc.setDrawColor("#CBD5E1");
            doc.setLineWidth(0.8);
            doc.line(M, y, pageW - M, y);
            y += SECTION_GAP;
        };

        // Sections
        add("Issue", s.issue);
        add("Emotions", s.emotion);
        add("Short-Term Goal", s.shortTermGoal);
        add("Long-Term Goal", s.longTermGoal);
        add("Summary of Chat", s.summary);

        doc.save("Tortoise_and_Hare_Chat_Summary.pdf");
    }

    const content = (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative z-10 w-screen h-[100svh] max-w-none rounded-none bg-white shadow-lg p-4
                    sm:w-full sm:h-auto sm:max-w-xl sm:max-h-[85vh] sm:rounded-2xl sm:p-6 sm:mx-auto sm:my-8
                    flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b flex-shrink-0 sticky top-0 bg-white">
                    <h3 className="text-lg font-semibold">Chat Summary</h3>
                    <button onClick={onClose} className="rounded-md px-2 py-1 border text-sm hover:bg-gray-50">
                        Close
                    </button>
                </div>

                {/* Scroll area */}
                <div className="flex-1 min-h-0 overflow-y-auto mt-2 pr-2 pb-24 overscroll-contain [-webkit-overflow-scrolling:touch]">
                    {loading && <p className="text-sm text-gray-600">Generating summary…</p>}

                    {!loading && error && (
                        <div className="text-sm text-red-600">Couldn’t generate summary: {error}</div>
                    )}

                    {!loading && !error && data && (
                        <div className="space-y-4">
                            <Section label="Issue" text={data.issue} />
                            <Section label="Emotions" text={data.emotion} />
                            <Section label="Short-Term Goal" text={data.shortTermGoal} />
                            <Section label="Long-Term Goal" text={data.longTermGoal} />
                            <Section label="Summary of Chat" text={data.summary} />
                        </div>
                    )}
                </div>

                {/* Sticky footer actions — outside the scroll area */}
                <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t
                      pt-2 pb-[env(safe-area-inset-bottom,0px)] flex justify-end gap-2">
                    
                    {data && (
                        <button
                            onClick={() => exportPdfFromSummary(data)}
                            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 text-sm"
                        >
                            Export to PDF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );


    if (typeof window === "undefined") return null; // SSR safety
    return createPortal(content, document.body);

}

function Section({ label, text }: { label: string; text: string }) {
    return (
        <div>
            <div className="text-sm font-semibold text-[#23B384]">{label}</div>
            <div className="text-sm sm:text-base text-[#475569] whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                {(text || "—").trim()}
            </div>
        </div>
    );
}
