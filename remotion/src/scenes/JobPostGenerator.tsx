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

// Scene — "AI writes the job post". Recruiter fills the role details, presses
// the orange AI action, and a board-ready advertisement streams in, ready to copy.

const FIELDS: { label: string; value: string }[] = [
  { label: "Job Title", value: "Frontend Engineer" },
  { label: "Department", value: "Engineering" },
  { label: "Location", value: "Remote — Philippines" },
  { label: "Experience", value: "Senior (5–8 yrs)" },
];

const SKILLS = ["React", "TypeScript", "Next.js", "Tailwind"];

const AD = `We're hiring a Senior Frontend Engineer to shape the products our
customers use every day.

You'll own features end to end — from design discussions through
shipping polished, accessible interfaces in React and TypeScript.

What you'll do
• Build and maintain core product surfaces
• Partner with design on a shared component system
• Mentor engineers and raise the front-end bar

How to Apply
Send your application to careers@company.com
Subject: Frontend Engineer Candidate
Attach your resume as a PDF.`;

export const JobPostGenerator: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 200 } });

  // Button press at 2.2s
  const pressT = interpolate(frame, [fps * 2.2, fps * 2.45, fps * 2.7], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const generating = frame >= fps * 2.45 && frame < fps * 3.2;

  // Panel + text stream
  const panelIn = interpolate(frame, [fps * 2.6, fps * 3.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const chars = Math.floor(
    interpolate(frame, [fps * 3.2, fps * 7.4], [0, AD.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const done = chars >= AD.length;

  // Copy button -> Copied!
  const copied = frame >= fps * 8.2;
  const copyIn = interpolate(frame, [fps * 7.6, fps * 8.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: makes.paper, fontFamily: makes.font.body }}>
      {/* Caption */}
      <div style={{ position: "absolute", top: 84, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: makes.orange,
          }}
        >
          AI Job Post Generator
        </div>
        <div
          style={{
            fontFamily: makes.font.display,
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: makes.ink,
            marginTop: 8,
          }}
        >
          Describe the role. Get a post you can paste anywhere.
        </div>
      </div>

      {/* Left — job details */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 268,
          width: 720,
          opacity: cardIn,
          transform: `translateY(${interpolate(cardIn, [0, 1], [30, 0])}px)`,
          background: makes.surface,
          borderRadius: 20,
          border: `1px solid ${makes.border}`,
          boxShadow: "0 20px 50px -24px rgba(38,36,31,0.3)",
          padding: "30px 34px",
        }}
      >
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: makes.ink3,
            marginBottom: 20,
          }}
        >
          Job details
        </div>

        {FIELDS.map((f, i) => {
          const on = interpolate(frame, [fps * (0.4 + i * 0.28), fps * (0.8 + i * 0.28)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={f.label} style={{ marginBottom: 16, opacity: on }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: makes.ink3, marginBottom: 6 }}>
                {f.label}
              </div>
              <div
                style={{
                  border: `1px solid ${makes.border}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 24,
                  color: makes.ink,
                  background: makes.paper,
                }}
              >
                {f.value}
              </div>
            </div>
          );
        })}

        {/* Skills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4, marginBottom: 26 }}>
          {SKILLS.map((s, i) => {
            const on = interpolate(frame, [fps * (1.5 + i * 0.12), fps * (1.8 + i * 0.12)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={s}
                style={{
                  opacity: on,
                  border: `1px solid ${makes.border}`,
                  background: makes.paper,
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 19,
                  color: makes.ink2,
                }}
              >
                {s}
              </span>
            );
          })}
        </div>

        {/* AI action button (orange = AI moment) */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 28px",
            borderRadius: 12,
            background: makes.orange,
            color: "#2b1607",
            fontSize: 25,
            fontWeight: 800,
            boxShadow: pressT > 0.5 ? "none" : `inset 0 -4px 0 ${makes.edge}`,
            transform: `translateY(${pressT * 3}px)`,
          }}
        >
          ✦ {generating ? "Generating…" : "Generate with AI"}
        </div>
      </div>

      {/* Right — generated advertisement */}
      <div
        style={{
          position: "absolute",
          left: 890,
          top: 268,
          width: 920,
          height: 640,
          opacity: panelIn,
          transform: `translateY(${interpolate(panelIn, [0, 1], [24, 0])}px)`,
          background: makes.surface,
          borderRadius: 20,
          border: `1px solid ${makes.border}`,
          boxShadow: "0 20px 50px -24px rgba(38,36,31,0.3)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: `1px solid ${makes.border}`,
          }}
        >
          <span style={{ fontFamily: makes.font.display, fontWeight: 800, fontSize: 26, color: makes.ink }}>
            AI Generated Job Posting
          </span>
          {/* Copy control */}
          <span
            style={{
              opacity: copyIn,
              padding: "9px 20px",
              borderRadius: 9,
              fontSize: 19,
              fontWeight: 800,
              color: copied ? "#fff" : makes.ink,
              background: copied ? makes.hue.pine : makes.paper,
              border: `1px solid ${copied ? makes.hue.pine : makes.border}`,
              boxShadow: `inset 0 -3px 0 ${copied ? makes.edge : "rgba(0,0,0,0.05)"}`,
            }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            padding: "24px 28px",
            fontSize: 21,
            lineHeight: 1.5,
            color: makes.ink2,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
          }}
        >
          {AD.slice(0, chars)}
          {!done && (
            <span style={{ opacity: frame % 20 < 10 ? 1 : 0, color: makes.orange }}>▌</span>
          )}
        </div>
      </div>

      {/* Brand corner */}
      <div style={{ position: "absolute", bottom: 48, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <LogoMark size={36} />
        <Wordmark size={30} />
      </div>
    </AbsoluteFill>
  );
};
