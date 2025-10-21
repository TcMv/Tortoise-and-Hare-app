console.log("🧠 OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);

// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

console.log("🧠 OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);




export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- helpers ----
function json(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(data), { ...init, headers });
}

export async function OPTIONS() { return json({ ok: true }, { status: 200 }); }
export async function GET() { return json({ error: "Method not allowed" }, { status: 405 }); }

// ---- protocol questions (unchanged) ----
const MOOD_ITEMS: string[] = [
  "How calm do you feel right now?",
  "How energetic do you feel?",
  "How focused or clear-headed are you at this moment?",
  "How positive or hopeful do you feel?",
  "How connected do you feel to others right now?",
  "How motivated do you feel to do tasks or activities?",
  "How safe and secure do you feel in yourself?", // Q7 safety check
  "How balanced or in control of your emotions do you feel?",
  "How rested or physically well do you feel?",
  "How interested or engaged do you feel in your surroundings?",
  "How resilient do you feel if something stressful came up right now?"
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ reply: "Server is missing OPENAI_API_KEY." }, { status: 500 });

  // Parse body safely
  const body = await req.json().catch(() => ({}));
  const clientMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> =
    Array.isArray(body?.messages) ? body.messages : [];

  // --- Intent gate (crisis / emergency / out-of-scope) ---
  const latestUserText =
    clientMessages.slice().reverse().find(m => m.role === "user")?.content ?? "";
  const t = (latestUserText || "").toLowerCase();

  const crisis = /(suicide|self[-\s]?harm|kill myself|end my life|overdose)/.test(t);
  const medical = /(chest pain|can't breathe|cant breathe|not breathing|stroke symptoms|unconscious)/.test(t);

  if (medical) {
    return json({ reply: "This may be a medical emergency. Please call your local emergency number now or seek urgent in-person care." });
  }
  if (crisis) {
    return json({ reply: "I’m really glad you reached out. If you’re in danger or might act on these thoughts, please call your local emergency number now. In Australia, you can contact Lifeline on 13 11 14. I’m here to listen—would you like to share what you’re going through?" });
  }

  // --- Optional protocol system (mood or mindfulness) based on trigger phrases ---
  let protocolSystem: string | null = null;

  if (/begin a brief mood check[-\s]?in now|start a brief mood check[-\s]?in|mood check[-\s]?in.*begin|^yes, please begin a brief mood check[-\s]?in/.test(t)) {
    const itemsList = MOOD_ITEMS.map((q, i) => `${i + 1}) ${q} (1–4)`).join("\n");
    protocolSystem = `
PROTOCOL = MOOD_CHECKIN_ACTIVE
SCALE (repeat each item): 1 = Not at all, 2 = A little, 3 = Quite a bit, 4 = Extremely.
SEQUENCE: Ask exactly ONE question at a time using the wording below, in order, with the scale.
VALIDATION: Wait for a valid 1–4. If not, restate the scale and re-ask the SAME item.
SAFETY (Q7 = "How safe and secure do you feel in yourself?"): If the answer is 1, pause and provide a short safety message encouraging immediate help if at risk. Ask whether to stop or continue later.
COMPLETION: Do NOT score or diagnose. Close with a gentle invitation for next steps. Do not deviate from the questions!
QUESTIONS:
${itemsList}
`;
  } else if (/guide a gentle 1[-\s]?minute breathing pause now|mindfulness pause.*guide|breathing pause.*guide|^yes, please guide a gentle 1[-\s]?minute breathing pause/.test(t)) {
    protocolSystem = `
PROTOCOL = MINDFULNESS_ACTIVE
Guide a short, step-by-step breathing/grounding exercise (~1 minute). No diagnosis or evaluation. Don't ask to close eyes. Close with a brief reflection then ask what they'd like next.
`;
  }

const baseSystem = {
    role: "system" as const,
    content: `
 You are a counsellor-style wellbeing coach. **Scope**: mental health, emotions, coping, stress, relationships, values, habits, motivation, resilience, mindfulness, help-seeking. 
**Do NOT** provide instructions or advice on unrelated topics. Do NOT diagnose. Do NOT provide medical advice. Do NOT provide a mood check in score.
If user asks outside scope, say you’re focused on wellbeing and offer to link back to feelings/stressors or suggest a more suitable resource. If there's risk of harm or crisis, respond supportively and encourage immediate professional/urgent help per local norms.

Mannerisms & style:
Phase 1 - discovery of issue
- Begin with open-ended reflections/questions (UNLESS a protocol is active).
- Maximum 5 clarifying questions; no repetition.
- Prefer open prompts over yes/no.
- Do not rush to solutions; the user leads any move into suggestions/advice. Ask permission first.
- Warm, empathetic, exploratory tone. Do not assume issues are work-related.

Phase two - goal setting
When setting goals:
-Ask only one question at a time.
- Ensure the goal is acheivable within a short timeframe ~7 days
- Maintain user led focus

When offering ideas (outside of protocols):
- Share at most **2–3 gentle options** in plain language.
- **Do NOT** attach a follow-up question to every bullet. Instead, end with **one** open reflection such as:
  “What, if anything, stands out?” or “Would you like to explore one of these or go a different way?”
- If the user indicates readiness for action, **collaborate** to define **one small, specific goal for the next 7 days** (user-led; ask permission). Keep it simple, supportive, and feasible. Confirm the goal in the user’s words and invite how they’d like to check in on it (optional).

Allowed protocols on explicit opt-in:
- Mood check-in (11 items, 1–4 scale) — strict wording/order, one item at a time, no scoring/diagnosis; finish with a gentle invitation only.
- Mindfulness pause (~1 minute) — guide calmly, invite a brief reflection, then ask what they’d like next.

Phase 3. Summarise goals and check in
Ensure the user has a goal at the end of the session and a way to check in.

Overall goals:
- Help the user feel heard, supported, and in control of pace.
- Encourage exploration before solutions (outside protocols).
- Keep the conversation human and unrushed.
- Try to help them set an acheiveable short term goal based on the conversation.

 `};



  const messagesForModel = protocolSystem
      ? [baseSystem, { role: "system" as const, content: protocolSystem }, ...clientMessages]
      : [baseSystem, ...clientMessages];

    // Ensure at least one user turn (OpenAI requirement)
    if(!messagesForModel.some(m => m.role === "user")) {
      messagesForModel.push({ role: "user", content: "Hello" });
}
// after you compute messagesForModel:
console.log("🧩 SYSTEM first:", messagesForModel[0]?.role, "len:", messagesForModel[0]?.content?.length);
console.log("🧩 Has protocol system:", !!protocolSystem);
console.log("🧩 First 4 roles:", messagesForModel.slice(0,4).map(m => m.role));
console.log("🧩 First user msg:", messagesForModel.find(m => m.role==="user")?.content?.slice(0,140));
console.log("🧩 Total msgs:", messagesForModel.length);


// Timeout protection (25s)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 25000);

try {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // or "gpt-4o-mini"
      messages: messagesForModel,
      temperature: 0.3,
    }),
  }).finally(() => clearTimeout(timeoutId));

  if (!r.ok) {
    const err = await r.text();
    return json({ reply: `Upstream error: ${r.status} ${err}` }, { status: r.status });
  }

  const data = await r.json();
  const reply: string = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn’t generate a reply.";
  return json({ reply });
} catch (e: any) {
  const msg = typeof e?.message === "string" ? e.message : String(e);
  if (msg.includes("aborted")) return json({ reply: "The request timed out. Please try again." }, { status: 504 });
  return json({ reply: "Server error: " + msg }, { status: 500 });
}
}
