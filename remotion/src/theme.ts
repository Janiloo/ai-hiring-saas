// Makes brand tokens, mirrored from the app's globals.css so the video matches
// the product exactly. Kept as a plain object (Remotion uses inline styles).

export const makes = {
  // Surfaces — warm paper
  paper: "#f7f5f1",
  surface: "#ffffff",
  ink: "#26241f",
  ink2: "#5c584e",
  ink3: "#8d887b",
  border: "#e5e1d8",

  // Brand — from the logo
  navy: "#262353",
  navyHover: "#1b1940",
  orange: "#f9822f",
  plum: "#1d1030",

  // Spectrum stage hues
  hue: {
    sky: "#6aa9cf",
    amber: "#e9a23b",
    pink: "#d95970",
    steel: "#3e6b9e",
    navy: "#2b4c7e",
    green: "#4c8a3f",
    red: "#c74034",
    pine: "#2a7a66",
    coal: "#3a3f45",
    yellow: "#f2cb4e",
  },

  edge: "rgba(0,0,0,0.16)",

  font: {
    display: '"Bricolage Grotesque", system-ui, sans-serif',
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: '"Geist Mono", ui-monospace, monospace',
  },
} as const;

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;
