import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { makes } from "../theme";

export interface NarrationLine {
  /** Seconds. */
  from: number;
  to: number;
  text: string;
}

// Friendly, timed narration bar. The clips autoplay MUTED on the landing page,
// so the story has to be told on screen — this walks the viewer through each
// beat as it happens, and doubles as an accessibility caption track.
export const Narration: React.FC<{
  lines: NarrationLine[];
  /** Horizontal centre in px — shift left when the right side is occupied. */
  centerX?: number;
  maxWidth?: number;
  bottom?: number;
}> = ({ lines, centerX = 960, maxWidth = 1280, bottom = 58 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = 0.35 * fps;

  return (
    <>
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
