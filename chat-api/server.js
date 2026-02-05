import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 5002;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a music patch editor for a Tone.js-based beat/music loop app.
The patch must export a function: export function buildPatch(ctx) { ... }
ctx provides: Transport, registerEvent, destination, bpm, volume, Tone.
- Use ctx.Transport, ctx.registerEvent, ctx.destination, ctx.bpm, ctx.volume
- Tone is the Tone.js library (MembraneSynth, Synth, MetalSynth, NoiseSynth, Part, Loop, Volume, Filter, Reverb, etc.)
- registerEvent({ time, duration, label, lane }) for timeline visualization (time in bars, e.g. 0, 1.5)
- Return { dispose: function() { ... } } that stops loops, disposes parts, disposes nodes
- Use Tone.Part and Tone.Loop for scheduling; connect nodes to ctx.destination (or via Volume)
- No network imports; Tone is injected

Output ONLY the complete buildPatch function code. No explanation, no markdown fences.
The code must be valid TypeScript/JavaScript that runs in the sandbox.`;

app.post("/chat/edit", async (req, res) => {
  const { userMessage, currentCode, bpm } = req.body;

  if (!userMessage || typeof userMessage !== "string") {
    return res.status(400).json({ error: "userMessage required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  }

  const userPrompt = `Current patch code:
---
${currentCode || ""}
---

Current BPM: ${typeof bpm === "number" ? bpm : 120}

User request: "${userMessage}"

Return the complete modified buildPatch function. Output ONLY the code, no markdown or explanation.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(500).json({ error: "Empty response from model" });
    }

    // Extract code from markdown block if present
    let code = raw;
    const fenceMatch = raw.match(/```(?:ts|typescript|js|javascript)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      code = fenceMatch[1].trim();
    }

    if (!code.includes("export function buildPatch")) {
      return res.status(500).json({ error: "Response missing buildPatch function" });
    }

    const message = `Applied: ${userMessage}`;
    res.json({ code, message });
  } catch (err) {
    console.error("Chat API error:", err.message);
    res.status(500).json({ error: err.message || "OpenAI API failed" });
  }
});

app.listen(port, () => {
  console.log(`Chat API running on http://localhost:${port}`);
});
