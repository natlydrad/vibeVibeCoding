# VibeLoops

MVP web app for vibe-coding music loops in the browser. Edit Tone.js patch code, see a timeline of scheduled events, and use natural-language-style chat to apply rule-based edits.

## Run

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Apply Code** after editing to run the patch. **Play** starts the transport; **Stop** stops it.

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

- **Save** – writes current code, BPM, and volume to `localStorage` (key `vibeloops-state`). Restored on next load.
- **Export .ts** – downloads the patch code as a `.ts` file.
- **Export .json** – downloads `{ code, bpm, volume, title }` as JSON.
- **Open file** – pick a `.ts` or `.json` file; code (and optionally BPM/volume) is loaded and applied.

## Chat rules (stub assistant)

The chat uses local rule-based pattern matching. To extend:

1. Open `src/chat/rules.ts`.
2. Add an entry to the `rules` array:
   - `pattern`: `RegExp` or `(text: string) => boolean`
   - `edit`: `(code: string, bpm: number) => string` – returns modified code
   - `message`: string shown as the assistant reply
   - Optional `setBpm`: `(currentBpm: number) => number` – if set, the engine BPM is updated to the returned value

Examples already implemented: “make it faster” / “slower” (BPM), “add swing”, “more hats” / “fewer hats”, “darker” (filter), “add reverb”.

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
