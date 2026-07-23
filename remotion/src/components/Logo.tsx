import React from "react";
import { makes } from "../theme";

// The Makes mark — two overlapping circles (navy + orange) with a plum lens.
export const LogoMark: React.FC<{ size?: number }> = ({ size = 48 }) => {
  const w = size * 1.25;
  return (
    <svg width={w} height={size} viewBox="0 0 60 48">
      <circle cx="23" cy="24" r="17" fill={makes.navy} />
      <circle cx="37" cy="24" r="17" fill={makes.orange} />
      <path d="M30 11.4 A17 17 0 0 1 30 36.6 A17 17 0 0 1 30 11.4 Z" fill={makes.plum} />
    </svg>
  );
};

export const Wordmark: React.FC<{ size?: number }> = ({ size = 34 }) => {
  return (
    <span
      style={{
        fontFamily: makes.font.display,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.03em",
        color: makes.ink,
      }}
    >
      Makes<span style={{ color: makes.orange }}>.</span>
    </span>
  );
};
