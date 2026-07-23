"use client";

import { useEffect, useRef } from "react";

interface FeatureVideoProps {
  src: string;
  poster: string;
  /** Describes the clip for screen readers / when video can't play. */
  label: string;
}

// Silent looping product clip. Plays only while scrolled into view — saves
// bandwidth and keeps autoplay policies happy (muted + playsInline required).
// Honors prefers-reduced-motion by staying paused on the poster frame.
export default function FeatureVideo({ src, poster, label }: FeatureVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Some browsers ignore the muted JSX prop — set it on the element directly
    // so autoplay is permitted.
    el.muted = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      controls
      aria-label={label}
      className="w-full rounded-xl border border-gray-200 bg-surface shadow-lg"
    />
  );
}
