interface LogoProps {
  /** Size of the mark square in px. */
  size?: number;
  /** Render the "HyperFlow" wordmark next to the mark. */
  showWordmark?: boolean;
}

// App brand: chevron mark in a rounded square + "HyperFlow" wordmark.
// Distinct from the organization logo that admins upload in Settings.
export default function Logo({ size = 40, showWordmark = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex shrink-0 items-center justify-center rounded-[28%] bg-slate-900 text-white dark:bg-white dark:text-slate-900"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.58}
          height={size * 0.58}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8l4 4-4 4" />
          <path d="M9 8l4 4-4 4" />
          <path d="M15 8l4 4-4 4" />
        </svg>
      </div>
      {showWordmark && (
        <span className="text-xl tracking-tight text-gray-900">
          <span className="font-bold">Hyper</span>
          <span className="font-medium">Flow</span>
        </span>
      )}
    </div>
  );
}
