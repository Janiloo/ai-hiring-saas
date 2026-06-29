const statusStyles: Record<string, string> = {
  "New": "bg-blue-50 text-blue-700",
  "Screening": "bg-yellow-50 text-yellow-700",
  "Interview": "bg-purple-50 text-purple-700",
  "Offer": "bg-emerald-50 text-emerald-700",
  "Rejected": "bg-red-50 text-red-500",
};

const scoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-500";
};

export interface Candidate {
  id: string;
  name: string;
  role: string;
  status: keyof typeof statusStyles;
  score: number;
  initials: string;
  appliedAt: string;
}

interface CandidateCardProps {
  candidate: Candidate;
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
  const { name, role, status, score, initials, appliedAt } = candidate;

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? "bg-gray-100 text-gray-600"}`}>
          {status}
        </span>

        <div className="text-right">
          <p className={`text-sm font-bold ${scoreColor(score)}`}>{score}%</p>
          <p className="text-xs text-gray-400">AI Score</p>
        </div>

        <p className="hidden text-xs text-gray-400 sm:block">{appliedAt}</p>
      </div>
    </div>
  );
}
