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
import { LogoMark } from "../components/Logo";

// Outro — the Makes mark scales in, wordmark + tagline reveal, CTA.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markIn = spring({ frame, fps, config: { damping: 180, mass: 0.8 } });
  const wordIn = interpolate(frame, [fps * 0.5, fps * 1.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const tagIn = interpolate(frame, [fps * 0.9, fps * 1.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaIn = interpolate(frame, [fps * 1.4, fps * 2.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: makes.navy,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: makes.font.body,
      }}
    >
      <div style={{ transform: `scale(${interpolate(markIn, [0, 1], [0.6, 1])})`, opacity: markIn }}>
        <LogoMark size={140} onDark />
      </div>

      <div
        style={{
          fontFamily: makes.font.display,
          fontWeight: 800,
          fontSize: 96,
          letterSpacing: "-0.03em",
          color: "#fff",
          marginTop: 36,
          opacity: wordIn,
          transform: `translateY(${interpolate(wordIn, [0, 1], [20, 0])}px)`,
        }}
      >
        Makes<span style={{ color: makes.orange }}>.</span>
      </div>

      <div
        style={{
          fontSize: 34,
          color: "rgba(255,255,255,0.7)",
          marginTop: 10,
          opacity: tagIn,
        }}
      >
        AI-powered Organization Automation
      </div>

      <div
        style={{
          marginTop: 44,
          padding: "18px 40px",
          borderRadius: 12,
          background: makes.orange,
          color: "#2b1607",
          fontSize: 30,
          fontWeight: 800,
          boxShadow: `inset 0 -4px 0 ${makes.edge}`,
          opacity: ctaIn,
          transform: `translateY(${interpolate(ctaIn, [0, 1], [16, 0])}px)`,
        }}
      >
        Create your workspace
      </div>
    </AbsoluteFill>
  );
};
