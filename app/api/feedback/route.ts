// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(data), { ...init, headers });
}

export async function OPTIONS() {
  return json({ ok: true }, { status: 200 });
}

export async function GET() {
  return json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    // Try to parse as FormData first; if it fails, fall back to JSON.
    let rating: string | null = null;        // "up" | "down" | null
    let source: string | null = null;        // "auto" | "manual" | null
    let messageCount = 0;
    let feedbackText: string | null = null;  // optional free text
    let sessionId: string | null = null;     // optional session id
    const ts = new Date().toISOString();

    // Heuristic: check content-type to decide the parser
    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("multipart/form-data") || ctype.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData();
      rating = (fd.get("rating") as string) ?? null;
      source = (fd.get("source") as string) ?? null;
      sessionId = (fd.get("sessionId") as string) ?? null;
      feedbackText = (fd.get("feedback") as string) ?? null;
      const mc = Number(fd.get("messageCount"));
      messageCount = Number.isFinite(mc) ? mc : 0;
    } else {
      const body = await req.json().catch(() => ({}));
      rating = typeof body?.rating === "string" ? body.rating : null;
      source = typeof body?.source === "string" ? body.source : null;
      sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;
      feedbackText = typeof body?.feedback === "string" ? body.feedback : null;
      const mc = Number(body?.messageCount);
      messageCount = Number.isFinite(mc) ? mc : 0;
    }

    // Validate minimal payload; allow purely textual feedback too
    const ratingValid = rating === null || rating === "up" || rating === "down";
    const sourceValid = source === null || source === "auto" || source === "manual";

    if (!ratingValid || !sourceValid) {
      return json({ ok: false, error: "Invalid payload: rating/source" }, { status: 400 });
    }

    // Basic, serverless-safe logging
    console.log("[feedback]", {
      ts,
      rating,
      source,
      messageCount,
      sessionId,
      hasText: Boolean(feedbackText && feedbackText.trim().length > 0),
    });

    // If forwarding externally, do it here (don’t block too long)
    // const url = process.env.FEEDBACK_WEBHOOK_URL;
    // if (url) {
    //   await fetch(url, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ ts, rating, source, messageCount, sessionId, feedback: feedbackText }),
    //   });
    // }

    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
