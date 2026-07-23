import React from "react";
import { Composition, Series } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { AiEvaluating } from "./scenes/AiEvaluating";
import { JobPostGenerator } from "./scenes/JobPostGenerator";
import { PipelineMove } from "./scenes/PipelineMove";
import { CandidateInbox } from "./scenes/CandidateInbox";
import { PipelineToInbox } from "./scenes/PipelineToInbox";
import { Outro } from "./scenes/Outro";
import { SceneWrap } from "./components/SceneWrap";
import { VIDEO } from "./theme";

// Load the brand display face so headings/wordmark match the app.
loadDisplay();

// Scene durations (seconds).
const S = { jobpost: 9.5, evaluate: 7.5, toInbox: 10, pipeline: 8, inbox: 9, outro: 3.5 };
const f = (sec: number) => Math.round(sec * VIDEO.fps);

// Full stitched promo — the product story end to end:
// write the post -> AI scores applicants -> move them, candidate is notified.
// `withVoice` adds the Deepgram narration (sound-on cut for portfolio/YouTube);
// the silent version is what the landing page embeds.
const MakesPromo: React.FC<{ withVoice?: boolean }> = ({ withVoice = false }) => (
  <Series>
    <Series.Sequence durationInFrames={f(S.jobpost)}>
      <SceneWrap durationInFrames={f(S.jobpost)}>
        <JobPostGenerator withVoice={withVoice} />
      </SceneWrap>
    </Series.Sequence>
    <Series.Sequence durationInFrames={f(S.evaluate)}>
      <SceneWrap durationInFrames={f(S.evaluate)}>
        <AiEvaluating withVoice={withVoice} />
      </SceneWrap>
    </Series.Sequence>
    <Series.Sequence durationInFrames={f(S.toInbox)}>
      <SceneWrap durationInFrames={f(S.toInbox)}>
        <PipelineToInbox withVoice={withVoice} />
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
        durationInFrames={f(S.jobpost + S.evaluate + S.toInbox + S.outro)}
        {...base}
      />
      {/* Feature clips — embedded individually on the landing page */}
      <Composition id="Feature-JobPost" component={JobPostGenerator} durationInFrames={f(S.jobpost)} {...base} />
      <Composition id="Feature-AiEvaluation" component={AiEvaluating} durationInFrames={f(S.evaluate)} {...base} />
      <Composition id="Feature-PipelineToInbox" component={PipelineToInbox} durationInFrames={f(S.toInbox)} {...base} />
      {/* Sound-on cut (Deepgram narration) — for portfolio / YouTube */}
      <Composition
        id="MakesPromoVoiceover"
        component={MakesPromo}
        defaultProps={{ withVoice: true }}
        durationInFrames={f(S.jobpost + S.evaluate + S.toInbox + S.outro)}
        {...base}
      />
      {/* Standalone scenes kept for preview */}
      <Composition id="Scene2-Pipeline" component={PipelineMove} durationInFrames={f(S.pipeline)} {...base} />
      <Composition id="Scene3-Inbox" component={CandidateInbox} durationInFrames={f(S.inbox)} {...base} />
      <Composition id="Outro" component={Outro} durationInFrames={f(S.outro)} {...base} />
    </>
  );
};
