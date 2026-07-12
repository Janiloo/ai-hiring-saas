import { STAGE_META, type CandidateStage } from "@/types/candidate";

// Paint-chip stage badge: each pipeline stage owns a solid spectrum hue
// (defined as .chip-<stage> in globals.css) with the tactile pressed edge.
export default function CandidateStageBadge({ stage }: { stage: CandidateStage }) {
  const { label } = STAGE_META[stage];
  return <span className={`chip-${stage}`}>{label}</span>;
}
