// app/api/export-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new NextResponse(JSON.stringify(data), { ...init, headers });
}

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };


export async function POST(req: NextRequest) {
    try {
        const { messages } = (await req.json()) as { messages: ChatMessage[] };
        if (!Array.isArray(messages) || messages.length === 0) {
            return json({ error: "No messages provided." }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return json({ error: "Server is missing OPENAI_API_KEY." }, { status: 500 });

        // ✅ define model ONCE
        const model = process.env.OPENAI_MODEL || "gpt-4o";

        // ---- 1) Flatten chat
        const chatText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

        console.log("[export-pdf] chatText length:", chatText.length);
        console.log("[export-pdf] first 200 chars:\n", chatText.slice(0, 200));
        // ---- 2) JSON schema we want back
        const schema = {
            type: "object",
            additionalProperties: false,
            required: ["issue", "emotion", "shortTermGoal", "longTermGoal", "summary"],
            properties: {
                issue: { type: "string" },
                emotion: { type: "string" },
                shortTermGoal: { type: "string" },
                longTermGoal: { type: "string" },
                summary: { type: "string" }
            }
        };

        // ---- 3) Chat Completions with structured outputs
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "THWChatSummary",
                        strict: true,
                        schema
                    }
                },
                messages: [
                    {
                        role: "system",
                        content:
                            "You summarise wellbeing chats. Use ONLY the provided chat log. " +
                            "Return a strict JSON object with keys: issue, emotion, shortTermGoal, longTermGoal, summary. " +
                            "If a field cannot be supported by the chat, use an empty string. " +
                            "If no clear emotion is stated, infer a plausible single emotion (1–2 words). Keep outputs concise."
                    },
                    { role: "user", content: "CHAT LOG:\n" + chatText }
                ]
            })
        });

        if (!r.ok) {
            const err = await r.text();
            return json({ error: err || "Model error." }, { status: 500 });
        }

        const data = await r.json();

        // The model will return valid JSON per schema in message.content
        let raw = (data?.choices?.[0]?.message?.content ?? "").trim();
        raw = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

        let parsed: any;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return json({ error: "Could not parse JSON from model." }, { status: 500 });
        }

        return json(
            {
                issue: parsed?.issue ?? "",
                emotion: parsed?.emotion ?? "",
                shortTermGoal: parsed?.shortTermGoal ?? "",
                longTermGoal: parsed?.longTermGoal ?? "",
                summary: parsed?.summary ?? ""
            },
            { status: 200 }
        );
    } catch (e: any) {
        return json({ error: e?.message || "Unknown error" }, { status: 500 });
    }
}
