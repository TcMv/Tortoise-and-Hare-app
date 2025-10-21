// app/api/export-summary/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper: send JSON back
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
        if (!apiKey)
            return json({ error: "Server is missing OPENAI_API_KEY." }, { status: 500 });

        const chatText = messages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n");

        // Schema for structured output
        const schema = {
            type: "object",
            additionalProperties: false,
            required: ["issue", "emotion", "shortTermGoal", "longTermGoal", "summary"],
            properties: {
                issue: { type: "string" },
                emotion: { type: "string" },
                shortTermGoal: { type: "string" },
                longTermGoal: { type: "string" },
                summary: { type: "string" },
            },
        };

        const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                temperature: 0.2,
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "THWChatSummary",
                        strict: true,
                        schema,
                    },
                },
                messages: [
                    {
                        role: "system",
                        content:
                            "You summarise wellbeing chats for Tortoise & Hare Wellness. " +
                            "Your task is to extract key information ONLY from the actual chat content provided. " +
                            "Return a valid JSON object with exactly these keys: issue, emotion, shortTermGoal, longTermGoal, summary. " +
                            "If the chat text contains no meaningful user input, or if any field cannot be confidently identified from user-provided text, " +
                            "you must leave that field blank. " +
                            "Never invent, imagine, or infer content that was not explicitly mentioned in the chat. " +
                            "If the chat is empty or generic (e.g. greetings only), return all fields as empty strings. " +
                            "Keep all extracted text short, natural, and in plain language."
                    },
                    { role: "user", content: chatText },
                ],
            }),
        });

        if (!r.ok) {
            const err = await r.text();
            return json({ error: err || "Model error." }, { status: 500 });
        }

        const data = await r.json();
        let raw = (data?.choices?.[0]?.message?.content ?? "").trim();
        raw = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return json({ error: "Invalid JSON from model." }, { status: 500 });
        }

        return json({
            issue: parsed?.issue ?? "",
            emotion: parsed?.emotion ?? "",
            shortTermGoal: parsed?.shortTermGoal ?? "",
            longTermGoal: parsed?.longTermGoal ?? "",
            summary: parsed?.summary ?? "",
        });
    } catch (e: any) {
        return json({ error: e?.message || "Unknown error" }, { status: 500 });
    }
}
