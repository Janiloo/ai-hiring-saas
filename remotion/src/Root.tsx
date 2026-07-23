import React from "react";
import { Composition } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { AiEvaluating } from "./scenes/AiEvaluating";
import { VIDEO } from "./theme";

// Load the brand display face so headings/wordmark match the app.
loadDisplay();

// Scene durations (seconds) — Scene 1 only for this first pass.
const SCENE1 = 7.5;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Scene1-AiEvaluating"
        component={AiEvaluating}
        durationInFrames={Math.round(SCENE1 * VIDEO.fps)}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
