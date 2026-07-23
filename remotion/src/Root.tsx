import React from "react";
import { Composition, Series } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { AiEvaluating } from "./scenes/AiEvaluating";
import { PipelineMove } from "./scenes/PipelineMove";
import { CandidateInbox } from "./scenes/CandidateInbox";
import { Outro } from "./scenes/Outro";
import { SceneWrap } from "./components/SceneWrap";
import { VIDEO } from "./theme";

// Load the brand display face so headings/wordmark match the app.
loadDisplay();

// Scene durations (seconds).
const S = { evaluate: 7.5, pipeline: 8, inbox: 9, outro: 3.5 };
const f = (sec: number) => Math.round(sec * VIDEO.fps);

// Full stitched promo — scenes cross-dissolve via SceneWrap fades.
const MakesPromo: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={f(S.evaluate)}>
      <SceneWrap durationInFrames={f(S.evaluate)}>
        <AiEvaluating />
      </SceneWrap>
    </Series.Sequence>
    <Series.Sequence durationInFrames={f(S.pipeline)}>
      <SceneWrap durationInFrames={f(S.pipeline)}>
        <PipelineMove />
      </SceneWrap>
    </Series.Sequence>
    <Series.Sequence durationInFrames={f(S.inbox)}>
      <SceneWrap durationInFrames={f(S.inbox)}>
        <CandidateInbox />
      </SceneWrap>
    </Series.Sequence>
    <Series.Sequence durationInFrames={f(S.outro)}>
      <SceneWrap durationInFrames={f(S.outro)}>
        <Outro />
      </SceneWrap>
    </Series.Sequence>
  </Series>
);

const base = { fps: VIDEO.fps, width: VIDEO.width, height: VIDEO.height };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full video */}
      <Composition
        id="MakesPromo"
        component={MakesPromo}
        durationInFrames={f(S.evaluate + S.pipeline + S.inbox + S.outro)}
        {...base}
      />
      {/* Individual scenes for isolated preview */}
      <Composition id="Scene1-AiEvaluating" component={AiEvaluating} durationInFrames={f(S.evaluate)} {...base} />
      <Composition id="Scene2-Pipeline" component={PipelineMove} durationInFrames={f(S.pipeline)} {...base} />
      <Composition id="Scene3-Inbox" component={CandidateInbox} durationInFrames={f(S.inbox)} {...base} />
      <Composition id="Outro" component={Outro} durationInFrames={f(S.outro)} {...base} />
    </>
  );
};
