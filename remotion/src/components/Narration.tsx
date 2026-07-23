import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Sequence, Audio, staticFile } from "remotion";
import { makes } from "../theme";
import { captionsFor, NARRATION, type NarrationLine } from "../narration";

export type { NarrationLine };

// Friendly, timed narration.
//
// The landing-page clips autoplay MUTED, so the story is told on screen — this
// caption bar walks the viewer through each beat and doubles as an
// accessibility caption track. Pass `withVoice` to additionally play the
// Deepgram-generated voiceover (public/vo/), used by the sound-on cut.
export const Narration: React.FC<{
  /** Key into NARRATION — also the vo/ audio filename prefix. */
  clip: string;
  /** Play the generated voiceover audio in sync with the captions. */
  withVoice?: boolean;
  /** Horizontal centre in px — shift left when the right side is occupied. */
  centerX?: number;
  maxWidth?: number;
  bottom?: number;
}> = ({ clip, withVoice = false, centerX = 960, maxWidth = 1280, bottom = 58 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = 0.35 * fps;
  const lines = captionsFor(clip);

  return (
    <>
      {/* Voiceover — one file per line, started at that line's cue. */}
      {withVoice &&
        NARRATION[clip].map((l, i) => (
          <Sequence key={`vo-${i}`} from={Math.round(l.from * fps)}>
            <Audio src={staticFile(`vo/${clip}-${i}.mp3`)} />
          </Sequence>
        ))}

      {lines.map((l) => {
        const from = l.from * fps;
        const to = l.to * fps;
        if (frame < from - fade || frame > to + fade) return null;
        const opacity = interpolate(
          frame,
          [from - fade, from, to, to + fade],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const rise = interpolate(frame, [from - fade, from], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={l.text}
            style={{
              position: "absolute",
              bottom,
              left: centerX,
              transform: `translate(-50%, ${rise}px)`,
              maxWidth,
              opacity,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 30px",
              borderRadius: 14,
              background: makes.navy,
              color: "#fff",
              fontSize: 34,
              fontWeight: 600,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              boxShadow: `0 18px 40px -18px rgba(38,35,83,0.7), inset 0 -3px 0 ${makes.edge}`,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: makes.orange,
                flex: "0 0 auto",
              }}
            />
            {l.text}
          </div>
        );
      })}
    </>
  );
};
