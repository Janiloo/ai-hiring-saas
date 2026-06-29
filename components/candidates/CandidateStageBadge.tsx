import { STAGE_META, type CandidateStage } from "@/types/candidate";

export default function CandidateStageBadge({ stage }: { stage: CandidateStage }) {
  const { label, color } = STAGE_META[stage];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
