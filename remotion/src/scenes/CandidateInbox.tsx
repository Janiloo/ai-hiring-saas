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

// Scene 3 — the candidate's POV: their inbox receives Makes updates one by one
// as they advance through the pipeline (mirrors Scene 2's moves).

const EMAILS: { subject: string; snippet: string; time: string; hue: string }[] = [
  {
    subject: "We received your application",
    snippet: "Thanks for applying — our team has your application and will review it shortly.",
    time: "9:41 AM",
    hue: makes.hue.sky,
  },
  {
    subject: "Your application is under review",
    snippet: "Good news — your application is being reviewed by our hiring team.",
    time: "11:02 AM",
    hue: makes.hue.amber,
  },
  {
    subject: "You've been shortlisted!",
    snippet: "You've advanced to the next step. We'll be in touch with details soon.",
    time: "2:15 PM",
    hue: makes.hue.pink,
  },
  {
    subject: "Your interview has been scheduled",
    snippet: "Your interview is confirmed. You'll receive the meeting link separately.",
    time: "4:30 PM",
    hue: makes.hue.steel,
  },
];

const PHONE_W = 460;
const PHONE_H = 900;

export const CandidateInbox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneIn = spring({ frame, fps, config: { damping: 200 } });

  // Each email arrives 1.2s apart, starting at 0.8s.
  const arriveAt = (i: number) => fps * (0.8 + i * 1.5);

  return (
    <AbsoluteFill style={{ background: makes.paper, fontFamily: makes.font.body }}>
      {/* Caption (left) */}
      <div style={{ position: "absolute", left: 120, top: 300, width: 640 }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: makes.orange,
          }}
        >
          Step 3
        </div>
        <div
          style={{
            fontFamily: makes.font.display,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: makes.ink,
            marginTop: 10,
            lineHeight: 1.1,
          }}
        >
          Candidates stay in the loop, automatically
        </div>
        <div style={{ fontSize: 27, lineHeight: 1.5, color: makes.ink2, marginTop: 22 }}>
          Every pipeline move triggers a branded email — no recruiter lifts a
          finger. Applicants always know where they stand.
        </div>
      </div>

      {/* Phone (right) */}
      <div
        style={{
          position: "absolute",
          right: 190,
          top: 540 - PHONE_H / 2,
          width: PHONE_W,
          height: PHONE_H,
          transform: `translateY(${interpolate(phoneIn, [0, 1], [40, 0])}px)`,
          opacity: phoneIn,
          background: "#0f0e1a",
          borderRadius: 52,
          padding: 14,
          boxShadow: "0 40px 90px -30px rgba(15,14,26,0.6)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: makes.paper,
            borderRadius: 40,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Mail header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "34px 24px 16px",
              background: makes.surface,
              borderBottom: `1px solid ${makes.border}`,
            }}
          >
            <LogoMark size={28} />
            <span style={{ fontFamily: makes.font.display, fontWeight: 800, fontSize: 24, color: makes.ink }}>
              Inbox
            </span>
          </div>

          {/* Emails */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {EMAILS.map((e, i) => {
              const t0 = arriveAt(i);
              const enter = spring({ frame: frame - t0, fps, config: { damping: 200 } });
              if (frame < t0 - 4) return null;
              // Fresh highlight fades over ~1s after arrival.
              const fresh = interpolate(frame, [t0, t0 + fps], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={e.subject}
                  style={{
                    transform: `translateY(${interpolate(enter, [0, 1], [-24, 0])}px)`,
                    opacity: enter,
                    padding: "18px 22px",
                    borderBottom: `1px solid ${makes.border}`,
                    background: `rgba(249,130,47,${0.12 * fresh})`,
                    display: "flex",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      marginTop: 8,
                      borderRadius: 999,
                      flex: "0 0 auto",
                      background: e.hue,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 19, fontWeight: 800, color: makes.ink }}>Makes</span>
                      <span style={{ fontSize: 15, color: makes.ink3 }}>{e.time}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: makes.ink, marginTop: 3 }}>
                      {e.subject}
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        color: makes.ink2,
                        marginTop: 4,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {e.snippet}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand corner */}
      <div style={{ position: "absolute", bottom: 56, left: 64, display: "flex", alignItems: "center", gap: 14 }}>
        <LogoMark size={40} />
        <Wordmark size={34} />
      </div>
    </AbsoluteFill>
  );
};
