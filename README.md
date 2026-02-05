# vibeVibeCoding

MVP web app for vibe-coding music loops in the browser. Edit Tone.js patch code, see a timeline of scheduled events, and use natural-language-style chat (LLM or rule-based) to apply edits.

## Run

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Apply Code** after editing to run the patch. **Play** starts the transport; **Stop** stops it.

### LLM chat (optional)

For open-ended chat commands (e.g. “play an arpeggio over C major”, “make a jersey club style beat”), run the chat-api server:

```bash
cd chat-api && npm install && cp .env.example .env
# Add your OpenAI API key to chat-api/.env
npm run start
```

With the chat-api running on port 5002, the Vite dev server proxies `/chat-api` to it. The API key stays server-side.

**Production**: Set `VITE_CHAT_API_URL` to your deployed chat-api URL (e.g. `https://your-chat-api.onrender.com`).

## Patch API

The editor must define a single exported function:

```ts
export function buildPatch(ctx: PatchContext): PatchHandle
```

- **PatchContext** provides:
  - `Tone` – the Tone.js library (no network imports)
  - `Transport` – Tone Transport (BPM, swing, start/stop)
  - `bpm`, `volume` – current values
  - `destination` – master output to connect nodes to
  - `registerEvent(event)` – register `{ time, duration, label, lane }` for the timeline

- **PatchHandle** must expose:
  - `dispose()` – stop loops, clear events, dispose nodes

Time in events is in “bars” (e.g. 0 = bar 0, 1.5 = bar 1 beat 3). Lanes (e.g. `kick`, `snare`, `hats`, `bass`) map to rows in the visualizer.

## File save / export / import

- **Save** – writes current code, BPM, and volume to `localStorage` (key `vibevibecoding-state`). Restored on next load.
- **Export .ts** – downloads the patch code as a `.ts` file.
- **Export .json** – downloads `{ code, bpm, volume, title }` as JSON.
- **Open file** – pick a `.ts` or `.json` file; code (and optionally BPM/volume) is loaded and applied.

## Chat (LLM + rule fallback)

The chat tries the LLM first (when chat-api is running); if unavailable or it errors, it falls back to local rule-based pattern matching.

**Rule-based rules** – extend in `src/chat/rules.ts`:
- `pattern`: `RegExp` or `(text: string) => boolean`
- `edit`: `(code: string, bpm: number) => string` – returns modified code
- `message`: string shown as the assistant reply
- Optional `setBpm`: `(currentBpm: number) => number`

Examples: “make it faster” / “slower” (BPM), “add swing”, “more hats” / “fewer hats”, “darker” (filter), “add reverb”.

## Onion skin / change marking

After **Apply Code**, the previous code is stored. The editor shows:

- **Change markers** – list of added/removed/modified line ranges.
- **Show ghost** – overlay of the previous version behind the current code.
- Inline gutter/background highlights for added (green) and modified (amber) lines.

## Tech

- Vite + React + TypeScript
- Tone.js for audio
- Monaco Editor
- Code is evaluated in the browser via a minimal sandbox (Tone and context only; for local dev only).
