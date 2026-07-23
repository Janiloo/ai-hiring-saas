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
import { Chip } from "../components/Chip";
import { ScoreMeter } from "../components/ScoreMeter";
import { LogoMark, Wordmark } from "../components/Logo";

// Scene 1 — "AI evaluating the candidate".
// Beats (at 30fps):
//   0.0s  card springs in, "AI processing" chip pulsing, score at 0
//   1.0s  score counts 0 -> 92, bar fills
//   3.5s  chip flips processing -> evaluated (orange -> green)
//   4.0s  summary + strengths fade/slide in
//   ~7s   hold
export const AiEvaluating: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance
  const cardIn = spring({ frame, fps, config: { damping: 200 } });
  const cardY = interpolate(cardIn, [0, 1], [60, 0]);

  // Score fill 1.0s -> 3.3s
  const scoreProgress = interpolate(frame, [fps * 1, fps * 3.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const evaluated = frame >= fps * 3.4;

  // Processing chip pulse (before evaluation)
  const pulse = 0.55 + 0.45 * Math.sin(frame * 0.25);

  // Detail block reveal
  const detailIn = interpolate(frame, [fps * 3.8, fps * 4.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const strengths = ["6 yrs React & TypeScript", "Led a frontend team", "Strong system design"];

  return (
    <AbsoluteFill style={{ background: makes.paper, fontFamily: makes.font.body }}>
      {/* Caption */}
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontFamily: makes.font.body,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: makes.orange,
          }}
        >
          Step 1
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
          AI reads and scores every resume
        </div>
      </div>

      {/* Candidate card */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `translateY(${cardY}px)`,
            opacity: cardIn,
            width: 1100,
            background: makes.surface,
            borderRadius: 24,
            border: `1px solid ${makes.border}`,
            boxShadow: "0 30px 80px -30px rgba(38,36,31,0.35)",
            overflow: "hidden",
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "26px 36px",
              borderBottom: `1px solid ${makes.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 999,
                  background: "#e9e9f6",
                  color: makes.navy,
                  fontFamily: makes.font.display,
                  fontWeight: 800,
                  fontSize: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                CR
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 700, color: makes.ink }}>
                  Carter Rodriguez
                </div>
                <div style={{ fontSize: 24, color: makes.ink3, marginTop: 2 }}>
                  Frontend Engineer
                </div>
              </div>
            </div>
            {evaluated ? (
              <Chip bg={makes.hue.pine}>AI Evaluated</Chip>
            ) : (
              <Chip bg={makes.hue.yellow} color="#2e2607" style={{ opacity: pulse }}>
                AI Processing
              </Chip>
            )}
          </div>

          {/* Card body */}
          <div style={{ display: "flex", gap: 48, padding: "48px 56px" }}>
            {/* Score */}
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                paddingRight: 48,
                borderRight: `1px solid ${makes.border}`,
              }}
            >
              <ScoreMeter score={92} progress={scoreProgress} hue={makes.hue.green} />
              <div style={{ marginTop: 20 }}>
                {evaluated && <Chip bg="#eef2ff" color={makes.navy}>Strong Match</Chip>}
              </div>
            </div>

            {/* Summary */}
            <div style={{ flex: 1, opacity: detailIn, transform: `translateX(${(1 - detailIn) * 30}px)` }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: makes.ink3,
                  marginBottom: 14,
                }}
              >
                AI Summary
              </div>
              <div style={{ fontSize: 27, lineHeight: 1.45, color: makes.ink2, marginBottom: 26 }}>
                Senior frontend engineer with strong React and TypeScript depth and clear
                leadership signals. Excellent fit for the role.
              </div>
              {strengths.map((s, i) => {
                const on = interpolate(
                  frame,
                  [fps * (4.4 + i * 0.25), fps * (4.7 + i * 0.25)],
                  [0, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                );
                return (
                  <div
                    key={s}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      opacity: on,
                      transform: `translateX(${(1 - on) * 20}px)`,
                      fontSize: 25,
                      color: makes.ink,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ color: makes.hue.green, fontSize: 28 }}>✓</span>
                    {s}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Brand corner */}
      <div style={{ position: "absolute", bottom: 56, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <LogoMark size={40} />
        <Wordmark size={34} />
      </div>
    </AbsoluteFill>
  );
};
