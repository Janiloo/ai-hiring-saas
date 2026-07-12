interface LogoProps {
  /** Height of the mark in px. */
  size?: number;
  /** Render the "autome." wordmark next to the mark. */
  showWordmark?: boolean;
}

// Autome brand mark: two overlapping circles — ink-navy (the organization) and
// orange (the AI) — meeting in a deep plum lens where Autome does its work.
// Colors follow the brand tokens so the mark adapts to light/dark themes.
// Distinct from the organization logo that admins upload in Settings.
export default function Logo({ size = 40, showWordmark = true }: LogoProps) {
  const width = size * 1.25;
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={width}
        height={size}
        viewBox="0 0 60 48"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="23" cy="24" r="17" fill="var(--brand)" />
        <circle cx="37" cy="24" r="17" fill="var(--accent)" />
        <path d="M30 11.4 A17 17 0 0 1 30 36.6 A17 17 0 0 1 30 11.4 Z" fill="#1d1030" />
      </svg>
      {showWordmark && (
        <span
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
        >
          autome<span style={{ color: "var(--accent)" }}>.</span>
        </span>
      )}
    </div>
  );
}
