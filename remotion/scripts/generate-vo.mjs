// Generates voiceover audio for each narration line using Deepgram Aura TTS.
//
//   node scripts/generate-vo.mjs
//
// Reads DEEPGRAM_API_KEY from remotion/.env (gitignored) and writes
// public/vo/<clip>-<index>.mp3 — consumed by the voiceover compositions via
// staticFile(). The generated audio is gitignored: re-run this to recreate it.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env reader (avoids a dependency).
function loadEnv() {
  const p = join(root, ".env");
  if (!existsSync(p)) return {};
  return Object.fromEntries(
    readFileSync(p, "utf8")
      .split("\n")
      .map((l) => l.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].trim()])
  );
}

const KEY = process.env.DEEPGRAM_API_KEY ?? loadEnv().DEEPGRAM_API_KEY;
if (!KEY) {
  console.error("Missing DEEPGRAM_API_KEY (set it in remotion/.env).");
  process.exit(1);
}

// Deepgram Aura voice. Override with VOICE=aura-2-andromeda-en etc.
const VOICE = process.env.VOICE ?? "aura-2-thalia-en";

// Narration text is duplicated here in plain JS so this script needs no TS
// build step; src/narration.ts is the source it mirrors.
const NARRATION = {
  "job-post": [
    "Start with the basics — title, location, and the skills you need.",
    "One click hands it over to AI.",
    "It writes a polished, board-ready advertisement for you.",
    "Copy it straight to LinkedIn, Indeed, or your careers page.",
  ],
  "ai-evaluation": [
    "A new application lands in your recruitment inbox.",
    "AI reads the resume and scores it against the job.",
    "Ninety-two out of a hundred — a strong match.",
    "Your team gets a summary and the highlights, ready to act on.",
  ],
  "pipeline-inbox": [
    "Your team moves a candidate forward.",
    "Makes emails them the moment it happens.",
    "Every stage change — sent automatically.",
    "No one chases updates. The candidate always knows where they stand.",
  ],
};

async function speak(text) {
  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${VOICE}&encoding=mp3`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );
  if (!res.ok) {
    throw new Error(`Deepgram ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const outDir = join(root, "public", "vo");
mkdirSync(outDir, { recursive: true });

let n = 0;
for (const [clip, lines] of Object.entries(NARRATION)) {
  for (let i = 0; i < lines.length; i++) {
    const file = join(outDir, `${clip}-${i}.mp3`);
    const audio = await speak(lines[i]);
    writeFileSync(file, audio);
    console.log(`✓ ${clip}-${i}.mp3  ${(audio.length / 1024).toFixed(0)} kB`);
    n++;
  }
}
console.log(`\nGenerated ${n} clips with voice "${VOICE}" → public/vo/`);
