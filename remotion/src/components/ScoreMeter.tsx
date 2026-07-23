import React from "react";
import { makes } from "../theme";

// AI score meter — the big number plus a hue-filled bar. `progress` 0..1 drives
// both the count-up and the bar width; `hue` colors the fill.
export const ScoreMeter: React.FC<{
  score: number;
  progress: number;
  hue: string;
}> = ({ score, progress, hue }) => {
  const shown = Math.round(score * progress);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          fontFamily: makes.font.mono,
          fontSize: 132,
          fontWeight: 700,
          lineHeight: 1,
          color: makes.ink,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {shown}
        <span style={{ fontSize: 52, color: makes.ink3 }}> / 100</span>
      </div>
      <div
        style={{
          width: 420,
          height: 18,
          borderRadius: 999,
          background: "#e3dfd5",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: hue,
            boxShadow: `inset 0 -3px 0 ${makes.edge}`,
          }}
        />
      </div>
    </div>
  );
};
