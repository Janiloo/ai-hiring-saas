import React from "react";
import { makes } from "../theme";

// Paint-chip badge — solid hue, white uppercase text, tactile pressed edge.
export const Chip: React.FC<{
  bg: string;
  color?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ bg, color = "#fff", children, style }) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px 8px",
        borderRadius: 8,
        fontFamily: makes.font.body,
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        background: bg,
        boxShadow: `inset 0 -3px 0 ${makes.edge}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
