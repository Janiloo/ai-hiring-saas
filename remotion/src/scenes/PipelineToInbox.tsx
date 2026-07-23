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
import { Narration, type NarrationLine } from "../components/Narration";

const NARRATION: NarrationLine[] = [
  { from: 0.5, to: 1.9, text: "Your team moves a candidate forward." },
  { from: 2.2, to: 3.6, text: "Makes emails them the moment it happens." },
  { from: 4.0, to: 5.9, text: "Every stage change — sent automatically." },
  { from: 6.4, to: 9.6, text: "No one chases updates. The candidate always knows where they stand." },
];

// Scene — the payoff shot. Left: the recruiter moves a candidate across the
// pipeline. Right: the candidate's phone. The instant the card lands in a new
// stage, an email flies out of the card, arcs across the screen, and drops into
// their inbox — the automation made visible.

const LANES = [
  { key: "applied", label: "Applied", hue: makes.hue.sky },
  { key: "screening", label: "Screening", hue: makes.hue.amber },
  { key: "interview", label: "Interview", hue: makes.hue.steel },
  { key: "hired", label: "Hired", hue: makes.hue.green },
];

// Board geometry (left half)
const BOARD_X = 90;
const BOARD_TOP = 300;
const LANE_W = 196;
const LANE_GAP = 16;
const LANE_H = 560;
const CARD_Y = BOARD_TOP + 110;
const laneX = (i: number) => BOARD_X + i * (LANE_W + LANE_GAP);

// Phone geometry (right half)
const PHONE_X = 1355;
const PHONE_W = 430;
const PHONE_H = 800;
const PHONE_TOP = 250;
const INBOX_X = PHONE_X + PHONE_W / 2;
const INBOX_Y = PHONE_TOP + 210;

// Each move: when the card slides, when the email flies, and what lands.
const MOVES = [
  { to: 1, moveStart: 1.2, moveEnd: 2.0, flyStart: 2.1, flyEnd: 3.0 },
  { to: 2, moveStart: 3.8, moveEnd: 4.6, flyStart: 4.7, flyEnd: 5.6 },
  { to: 3, moveStart: 6.4, moveEnd: 7.2, flyStart: 7.3, flyEnd: 8.2 },
];

const EMAILS = [
  { subject: "Your application is under review", time: "11:02 AM", hue: makes.hue.amber },
  { subject: "Your interview has been scheduled", time: "2:15 PM", hue: makes.hue.steel },
  { subject: "Congratulations — you're hired!", time: "4:30 PM", hue: makes.hue.green },
];

const EnvelopeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 26, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </svg>
);

export const PipelineToInbox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (sec: number) => sec * fps;

  // Card lane index over time
  const idx = interpolate(
    frame,
    [
      0,
      s(MOVES[0].moveStart), s(MOVES[0].moveEnd),
      s(MOVES[1].moveStart), s(MOVES[1].moveEnd),
      s(MOVES[2].moveStart), s(MOVES[2].moveEnd),
    ],
    [0, 0, 1, 1, 2, 2, 3],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );
  const settled = Math.round(idx);
  const lane = LANES[settled];
  const moving = Math.abs(idx - settled) > 0.02;

  const cardIn = spring({ frame, fps, config: { damping: 200 } });
  const phoneIn = spring({ frame: frame - s(0.3), fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ background: makes.paper, fontFamily: makes.font.body }}>
      {/* Caption */}
      <div style={{ position: "absolute", top: 78, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: makes.orange,
          }}
        >
          Pipeline → Inbox
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
          Move a candidate. They hear about it instantly.
        </div>
      </div>

      {/* ── Lanes ─────────────────────────────────────────────── */}
      {LANES.map((l, i) => {
        const near = 1 - Math.min(1, Math.abs(idx - i));
        const isTarget = settled === i && !moving;
        return (
          <div
            key={l.key}
            style={{
              position: "absolute",
              left: laneX(i),
              top: BOARD_TOP,
              width: LANE_W,
              height: LANE_H,
              background: "#efece6",
              borderRadius: 16,
              overflow: "hidden",
              border: isTarget ? `2px solid ${l.hue}` : `1px solid ${makes.border}`,
              boxShadow: isTarget ? `0 14px 34px -14px ${l.hue}` : "none",
            }}
          >
            <div style={{ height: 6, background: l.hue, opacity: interpolate(near, [0, 1], [0.35, 1]) }} />
            <div style={{ padding: "12px 14px" }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: makes.ink2,
                }}
              >
                {l.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Moving candidate card */}
      <div
        style={{
          position: "absolute",
          left: laneX(idx) + 14,
          top: CARD_Y + (moving ? -8 : 0),
          width: LANE_W - 28,
          opacity: cardIn,
          background: makes.surface,
          borderRadius: 13,
          border: `1px solid ${makes.border}`,
          boxShadow: moving
            ? "0 22px 40px -14px rgba(38,36,31,0.4)"
            : "0 6px 14px -6px rgba(38,36,31,0.25)",
          padding: "14px 15px",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: makes.ink }}>Carter R.</div>
        <div style={{ fontSize: 15, color: makes.ink3, marginBottom: 10 }}>Frontend · 92</div>
        <span
          style={{
            display: "inline-flex",
            padding: "4px 10px 6px",
            borderRadius: 6,
            fontSize: 13,
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

      {/* ── Flying emails ─────────────────────────────────────── */}
      {MOVES.map((m, k) => {
        const p = interpolate(frame, [s(m.flyStart), s(m.flyEnd)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        });
        if (p <= 0 || p >= 1) return null;
        const from = { x: laneX(m.to) + LANE_W / 2, y: CARD_Y + 40 };
        const x = interpolate(p, [0, 1], [from.x, INBOX_X]);
        const y = interpolate(p, [0, 1], [from.y, INBOX_Y]) - Math.sin(p * Math.PI) * 190;
        const scale = 0.7 + Math.sin(p * Math.PI) * 0.5;
        const fade = interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${interpolate(p, [0, 1], [-12, 8])}deg)`,
              opacity: fade,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              borderRadius: 12,
              background: EMAILS[k].hue,
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: `0 18px 36px -12px ${EMAILS[k].hue}, inset 0 -3px 0 ${makes.edge}`,
            }}
          >
            <EnvelopeIcon />
            Email sent
          </div>
        );
      })}

      {/* ── Phone / inbox ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: PHONE_X,
          top: PHONE_TOP,
          width: PHONE_W,
          height: PHONE_H,
          opacity: phoneIn,
          transform: `translateY(${interpolate(phoneIn, [0, 1], [40, 0])}px)`,
          background: "#0f0e1a",
          borderRadius: 48,
          padding: 13,
          boxShadow: "0 40px 90px -30px rgba(15,14,26,0.6)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: makes.paper,
            borderRadius: 37,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "30px 22px 14px",
              background: makes.surface,
              borderBottom: `1px solid ${makes.border}`,
            }}
          >
            <LogoMark size={26} />
            <span style={{ fontFamily: makes.font.display, fontWeight: 800, fontSize: 22, color: makes.ink }}>
              Inbox
            </span>
          </div>

          {/* Newest first */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {EMAILS.map((e, i) => {
              const land = s(MOVES[i].flyEnd);
              if (frame < land) return null;
              const pop = spring({ frame: frame - land, fps, config: { damping: 180 } });
              const fresh = interpolate(frame, [land, land + fps], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={e.subject}
                  style={{
                    order: -i,
                    transform: `scale(${interpolate(pop, [0, 1], [0.94, 1])})`,
                    opacity: pop,
                    padding: "16px 20px",
                    borderBottom: `1px solid ${makes.border}`,
                    background: `rgba(249,130,47,${0.16 * fresh})`,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 11,
                      height: 11,
                      marginTop: 7,
                      borderRadius: 999,
                      flex: "0 0 auto",
                      background: e.hue,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: makes.ink }}>Makes</span>
                      <span style={{ fontSize: 14, color: makes.ink3 }}>{e.time}</span>
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: makes.ink, marginTop: 3 }}>
                      {e.subject}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Narration sits left of the phone so it never covers the inbox. */}
      <Narration lines={NARRATION} centerX={660} maxWidth={1120} bottom={40} />

      {/* Brand mark — top-left; the bottom strip belongs to the narration. */}
      <div style={{ position: "absolute", top: 54, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <LogoMark size={36} />
        <Wordmark size={30} />
      </div>
    </AbsoluteFill>
  );
};
