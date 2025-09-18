// app/api/route.ts (drop-in replacement)
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";            // keep Node.js for compatibility
export const dynamic = "force-dynamic";     // ensure no static caching

/**
 * >>> IMPORTANT <<<
 * Replace these 11 strings with your exact questionnaire text.
 * The model is told to use this wording VERBATIM and IN THIS ORDER.
 * Scale for *every* item: 1 = Not at all, 2 = A little, 3 = Quite a bit, 4 = Extremely
 */
const MOOD_ITEMS: string[] = [
  "How calm do you feel right now?",
  "How energetic do you feel?",
  "How focused or clear-headed are you at this moment?",
  "How positive or hopeful do you feel?",
  "How connected do you feel to others right now?",
  "How motivated do you feel to do tasks or activities?",
  "How safe and secure do you feel in yourself?", // Q7: safety check (see protocol)
  "How balanced or in control of your emotions do you feel?",
  "How rested or physically well do you feel?",
  "How interested or engaged do you feel in your surroundings?",
  "How resilient do you feel if something stressful came up right now?"
];

// Small helper to create JSON responses with no-store cache
function json(data: any, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(data), { ...init, headers });
}

// Allow OPTIONS (preflight) + reject non-POSTs cleanly
export async function OPTIONS() {
  return json({ ok: true }, { status: 200 });
}

export async function GET() {
  return json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({ reply: "Server is missing OPENAI_API_KEY." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> =
      Array.isArray(body?.messages) ? body.messages : [];

    // --- Intent gate: keep conversation in wellbeing scope and handle crisis/emergency ---
    function detectIntent(text: string): "wellbeing" | "crisis" | "medical_emergency" | "out_of_scope" {
      const t = (text || "").toLowerCase();

      if (/(suicide|self[-\s]?harm|kill myself|end my life|overdose)/.test(t)) return "crisis";
      if (/(chest pain|can.?t breathe|not breathing|stroke symptoms|unconscious)/.test(t)) return "medical_emergency";

      const wellbeing =
        /(anx|depress|stress|burnout|overwhelm|panic|sleep|mindful|mindfulness|breath(ing)?|meditat(e|ion)|ground(ing)?|mood|check[-\s]?in|coping|relationship|argu(ment|ing)|lonely|grief|values|purpose|motivation|habits|therapy|counsell(or|ing)|confidence|self[-\s]?esteem)/;
      if (wellbeing.test(t)) return "wellbeing";

      const out =
        /(change the oil|car repair|code this|write my assignment|tax return|stock tip|day trade|weapon|gun|rifle|build an app|lawsuit|visa|immigration|roofing|plumbing|electrical)/;
      if (out.test(t)) return "out_of_scope";

      return "wellbeing";
    }

    const latestUserText =
      messages
        .slice()
        .reverse()
        .find((m) => m.role === "user")?.content ?? "";

    const intent = detectIntent(latestUserText);

    if (intent === "medical_emergency") {
      return json({
        reply:
          "This may be a medical emergency. Please call your local emergency number now or seek urgent in-person care."
      });
    }
    if (intent === "crisis") {
      return json({
        reply:
          "I’m really glad you reached out. You deserve immediate support. If you’re in danger or might act on these thoughts, please call your local emergency number now. In Australia, you can contact Lifeline on 13 11 14. I’m here to listen—would you like to share what you’re going through?"
      });
    }
    if (intent === "out_of_scope") {
      return json({
        reply:
          "I focus on mental health and wellbeing. If you’d like, we can explore what’s behind this request—how it’s affecting you—and work on coping or next steps from a wellbeing angle."
      });
    }

    // --- Protocol lock (mood / mindfulness)
    const uText = (latestUserText || "").toLowerCase();
    let protocolSystem: string | null = null;

    if (
      /begin a brief mood check[-\s]?in now|start a brief mood check[-\s]?in|mood check[-\s]?in.*begin|^yes, please begin a brief mood check[-\s]?in/.test(
        uText
      )
    ) {
      const itemsList = MOOD_ITEMS.map((q, i) => `${i + 1}) ${q} (1–4)`).join("\n");
      protocolSystem = `
PROTOCOL = MOOD_CHECKIN_ACTIVE
You must run the mood check-in as a strict sequence. Follow these rules:

SCALE (for EVERY item; repeat scale with each question):
1 = Not at all, 2 = A little, 3 = Quite a bit, 4 = Extremely.

SEQUENCE & WORDING:
- Ask exactly ONE question at a time.
- provide detail of the scale for each question. 
- Do NOT diagnose during the mood check.
- Do NOT discuss responses during the mood check.
- Use the following 11 questions VERBATIM and IN THIS ORDER (do NOT paraphrase, add, skip, or reorder):
${itemsList}

INPUT VALIDATION:
- After each question, wait for a single number 1–4. If the reply is anything else, gently remind the scale and re-ask the SAME item until a valid 1–4 is given.

SAFETY OVERRIDE (Q7):
- On item 7 (“How safe and secure do you feel in yourself?”), if the user answers 1, pause the questionnaire and provide a short, supportive safety message encouraging immediate help if at risk. Ask whether they'd like to stop here or continue later. Do not resume unless they clearly wish to continue.

COMPLETION:
- When all 11 items are answered (without crisis pause), do NOT compute or present any scores. Do NOT diagnose. Do NOT summarise results numerically or qualitatively.
- Close the protocol with a single, gentle invitation that sets the tone for the chat, e.g.: 
  “Thanks for sharing that. What would feel most supportive next — keep talking, try a tiny gentle step, or a brief pause together?”
- Only then return to normal counsellor behaviour.
`;
    } else if (
      /guide a gentle 1[-\s]?minute breathing pause now|mindfulness pause.*guide|breathing pause.*guide|^yes, please guide a gentle 1[-\s]?minute breathing pause/.test(
        uText
      )
    ) {
      protocolSystem = `
PROTOCOL = MINDFULNESS_ACTIVE
While this protocol is active:
- Do NOT ask general clarifying questions.
- Guide a short, step-by-step breathing/grounding exercise (~1 minute) in plain language.
- Keep timing approximate; avoid counting every second.
- Do NOT diagnose or evaluate.
- Do NOT ask the user to close their eyes.
- Close by inviting a brief reflection on how they feel now, then ask what they'd like next.
- Only then return to normal counsellor behaviour.
`;
    }

    const baseSystem = {
      role: "system" as const,
      content: `
You are a counsellor-style wellbeing coach. **Scope**: mental health, emotions, coping, stress, relationships, values, habits, motivation, resilience, mindfulness, help-seeking. 
**Do NOT** provide instructions or advice on unrelated topics. Do NOT diagnose. Do NOT provide medical advice. Do NOT provide a mood check in score.
If user asks outside scope, say you’re focused on wellbeing and offer to link back to feelings/stressors or suggest a more suitable resource. If there's risk of harm or crisis, respond supportively and encourage immediate professional/urgent help per local norms.

Mannerisms & style:
- Begin with open-ended reflections/questions (UNLESS a protocol is active).
- Maximum 5 clarifying questions; no repetition.
- Prefer open prompts over yes/no.
- Do not rush to solutions; the user leads any move into suggestions/advice. Ask permission first.
- Warm, empathetic, exploratory tone. Do not assume issues are work-related.

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

Overall goals:
- Help the user feel heard, supported, and in control of pace.
- Encourage exploration before solutions (outside protocols).
- Keep the conversation human and unrushed.
- Try to help them set an acheiveable short term goal based on the conversation.
`
    };

    const messagesForModel = protocolSystem
      ? [baseSystem, { role: "system" as const, content: protocolSystem }, ...messages]
      : [baseSystem, ...messages];

    // Add a timeout so the client isn't stuck if upstream is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messagesForModel,
        temperature: 0.4,
        // You can set max_tokens if you want to hard-cap responses:
        // max_tokens: 500
      })
    }).finally(() => clearTimeout(timeoutId));

    if (!r.ok) {
      const err = await r.text();
      return json({ reply: `Upstream error: ${r.status} ${err}` }, { status: r.status });
    }

    const data = await r.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn’t generate a reply.";
    return json({ reply });
  } catch (e: any) {
    const message = typeof e?.message === "string" ? e.message : String(e);
    // If aborted due to timeout, let the client know gracefully
    if (message.includes("The user aborted a request.") || message.includes("aborted")) {
      return json({ reply: "The request timed out. Please try again." }, { status: 504 });
    }
    return json({ reply: "Server error: " + message }, { status: 500 });
  }
}
