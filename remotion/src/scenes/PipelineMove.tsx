import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { makes } from "../theme";
import { LogoMark, Wordmark } from "../components/Logo";

// Scene 2 — "Move candidates through the pipeline".
// Carter's card slides Applied -> Screening -> Interview across the kanban lanes;
// each destination lane cap lights up as the card lands, and the card's stage
// chip recolors to the lane's hue.

const LANES: { key: string; label: string; hue: string }[] = [
  { key: "applied", label: "Applied", hue: makes.hue.sky },
  { key: "screening", label: "Screening", hue: makes.hue.amber },
  { key: "shortlisted", label: "Shortlisted", hue: makes.hue.pink },
  { key: "interview", label: "Interview", hue: makes.hue.steel },
  { key: "decision", label: "Decision", hue: makes.hue.navy },
  { key: "hired", label: "Hired", hue: makes.hue.green },
  { key: "rejected", label: "Rejected", hue: makes.hue.red },
];

const BOARD_X = 120;
const BOARD_TOP = 300;
const LANE_W = 232;
const LANE_GAP = 18;
const CARD_TOP_IN_LANE = 132; // moving card's y offset within a lane

const laneX = (i: number) => BOARD_X + i * (LANE_W + LANE_GAP);

// Static filler cards so lanes don't look empty.
const FILLER: Record<number, string[]> = {
  0: ["Ana Lim", "Marco Reyes"],
  1: ["Jane Mercado"],
  5: ["Leo Santos"],
};

const MiniCard: React.FC<{ name: string; role?: string; faded?: boolean }> = ({
  name,
  role = "Candidate",
  faded,
}) => (
  <div
    style={{
      background: makes.surface,
      borderRadius: 12,
      border: `1px solid ${makes.border}`,
      boxShadow: "0 2px 6px rgba(38,36,31,0.06)",
      padding: "14px 16px",
      opacity: faded ? 0.85 : 1,
    }}
  >
    <div style={{ fontSize: 22, fontWeight: 700, color: makes.ink }}>{name}</div>
    <div style={{ fontSize: 17, color: makes.ink3, marginTop: 2 }}>{role}</div>
  </div>
);

export const PipelineMove: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Keyframed lane index (float) for a smooth slide.
  // sit Applied -> Screening -> hold -> Interview -> hold
  const idx = interpolate(
    frame,
    [0, fps * 1.4, fps * 2.4, fps * 3.4, fps * 4.4, fps * 5.4],
    [0, 0, 1, 1, 3, 3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  // Settled lane (for chip label/hue) — which lane the card is closest to.
  const settled = Math.round(idx);
  const lane = LANES[settled];

  // Card entrance
  const cardIn = spring({ frame, fps, config: { damping: 200 } });
  const cardX = laneX(idx) + 16;
  const cardY = BOARD_TOP + CARD_TOP_IN_LANE;

  // A little lift while moving (when idx is between integers)
  const moving = Math.abs(idx - settled) > 0.02;
  const lift = moving ? -10 : 0;

  return (
    <AbsoluteFill style={{ background: makes.paper, fontFamily: makes.font.body }}>
      {/* Caption */}
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: makes.orange,
          }}
        >
          Step 2
        </div>
        <div
          style={{
            fontFamily: makes.font.display,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: makes.ink,
            marginTop: 8,
          }}
        >
          Move candidates through the pipeline
        </div>
      </div>

      {/* Board */}
      {LANES.map((l, i) => {
        // Cap glows when the moving card is at this lane.
        const near = 1 - Math.min(1, Math.abs(idx - i));
        const capGlow = interpolate(near, [0, 1], [0.35, 1]);
        const isTarget = settled === i && !moving;
        return (
          <div
            key={l.key}
            style={{
              position: "absolute",
              left: laneX(i),
              top: BOARD_TOP,
              width: LANE_W,
              height: 620,
              background: "#efece6",
              borderRadius: 16,
              overflow: "hidden",
              border: isTarget ? `2px solid ${l.hue}` : `1px solid ${makes.border}`,
              boxShadow: isTarget ? `0 12px 30px -12px ${l.hue}` : "none",
            }}
          >
            <div style={{ height: 6, background: l.hue, opacity: capGlow }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: makes.ink2,
                }}
              >
                {l.label}
              </span>
            </div>
            {/* filler cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 12px" }}>
              {(FILLER[i] ?? []).map((n) => (
                <MiniCard key={n} name={n} faded />
              ))}
            </div>
          </div>
        );
      })}

      {/* The moving candidate card */}
      <div
        style={{
          position: "absolute",
          left: cardX,
          top: cardY + lift,
          width: LANE_W - 32,
          transform: `scale(${interpolate(cardIn, [0, 1], [0.9, 1])})`,
          opacity: cardIn,
          background: makes.surface,
          borderRadius: 14,
          border: `1px solid ${makes.border}`,
          boxShadow: moving
            ? "0 24px 44px -16px rgba(38,36,31,0.4)"
            : "0 6px 16px -6px rgba(38,36,31,0.25)",
          padding: "16px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "#e9e9f6",
              color: makes.navy,
              fontFamily: makes.font.display,
              fontWeight: 800,
              fontSize: 19,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            CR
          </div>
          <div>
            <div style={{ fontSize: 23, fontWeight: 700, color: makes.ink }}>Carter Rodriguez</div>
            <div style={{ fontSize: 16, color: makes.ink3 }}>Frontend Engineer · 92</div>
          </div>
        </div>
        <span
          style={{
            display: "inline-flex",
            padding: "5px 12px 7px",
            borderRadius: 7,
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#fff",
            background: lane.hue,
            boxShadow: `inset 0 -3px 0 ${makes.edge}`,
          }}
        >
          {lane.label}
        </span>
      </div>

      {/* Brand corner */}
      <div style={{ position: "absolute", bottom: 56, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <LogoMark size={40} />
        <Wordmark size={34} />
      </div>
    </AbsoluteFill>
  );
};
