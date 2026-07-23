import React from "react";
import { makes } from "../theme";

// The Makes mark — two overlapping circles (navy + orange) with a plum lens.
// On dark grounds the navy circle would vanish, so `onDark` lifts it to a
// periwinkle so both circles stay legible.
export const LogoMark: React.FC<{ size?: number; onDark?: boolean }> = ({ size = 48, onDark }) => {
  const w = size * 1.25;
  const left = onDark ? "#8f96ec" : makes.navy;
  const lens = onDark ? "#3a2f52" : makes.plum;
  return (
    <svg width={w} height={size} viewBox="0 0 60 48">
      <circle cx="23" cy="24" r="17" fill={left} />
      <circle cx="37" cy="24" r="17" fill={makes.orange} />
      <path d="M30 11.4 A17 17 0 0 1 30 36.6 A17 17 0 0 1 30 11.4 Z" fill={lens} />
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
