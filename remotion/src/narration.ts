export interface NarrationLine {
  /** Seconds from scene start. */
  from: number;
  to: number;
  text: string;
}

// Single source of truth for the spoken/­on-screen narration.
// - The scenes render these as timed caption bars (works with sound off).
// - scripts/generate-vo.mjs sends the same text to Deepgram TTS, writing
//   public/vo/<clip>-<index>.mp3, which the voiceover cut plays in sync.
// Keep line order stable — audio filenames are index-based.
export const NARRATION: Record<string, NarrationLine[]> = {
  "job-post": [
    { from: 0.4, to: 2.1, text: "Start with the basics — title, location, and the skills you need." },
    { from: 2.3, to: 3.3, text: "One click hands it over to AI." },
    { from: 3.5, to: 7.3, text: "It writes a polished, board-ready advertisement for you." },
    { from: 7.6, to: 9.3, text: "Copy it straight to LinkedIn, Indeed, or your careers page." },
  ],
  "ai-evaluation": [
    { from: 0.4, to: 1.2, text: "A new application lands in your recruitment inbox." },
    { from: 1.4, to: 3.2, text: "AI reads the resume and scores it against the job." },
    { from: 3.5, to: 4.5, text: "Ninety-two out of a hundred — a strong match." },
    { from: 4.7, to: 7.3, text: "Your team gets a summary and the highlights, ready to act on." },
  ],
  "pipeline-inbox": [
    { from: 0.5, to: 1.9, text: "Your team moves a candidate forward." },
    { from: 2.2, to: 3.6, text: "Makes emails them the moment it happens." },
    { from: 4.0, to: 5.9, text: "Every stage change — sent automatically." },
    { from: 6.4, to: 9.6, text: "No one chases updates. The candidate always knows where they stand." },
  ],
};

/** On-screen caption text can differ slightly from what's spoken. */
export const CAPTION_OVERRIDES: Record<string, Record<number, string>> = {
  "ai-evaluation": { 2: "92 out of 100 — a strong match." },
};

export function captionsFor(clip: string): NarrationLine[] {
  const overrides = CAPTION_OVERRIDES[clip] ?? {};
  return NARRATION[clip].map((l, i) =>
    overrides[i] ? { ...l, text: overrides[i] } : l
  );
}
