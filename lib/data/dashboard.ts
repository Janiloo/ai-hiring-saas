import type { Candidate } from "@/components/CandidateCard";

export const dashboardStats = [
  { label: "Total Candidates", value: 142, change: "+12 this week", positive: true, icon: "👥" },
  { label: "Active Jobs", value: 8, change: "+2 this month", positive: true, icon: "📋" },
  { label: "Interviews Scheduled", value: 23, change: "5 today", positive: true, icon: "🗓" },
  { label: "Avg. AI Score", value: "74%", change: "-3% from last week", positive: false, icon: "🤖" },
];

export const recentCandidates: Candidate[] = [
  { id: "1", name: "Sarah Johnson", role: "Senior Frontend Engineer", status: "Interview", score: 92, initials: "SJ", appliedAt: "Jun 27" },
  { id: "2", name: "Marcus Chen", role: "Product Designer", status: "Screening", score: 78, initials: "MC", appliedAt: "Jun 26" },
  { id: "3", name: "Priya Patel", role: "Backend Engineer", status: "New", score: 85, initials: "PP", appliedAt: "Jun 26" },
  { id: "4", name: "James Okafor", role: "DevOps Engineer", status: "Offer", score: 95, initials: "JO", appliedAt: "Jun 24" },
  { id: "5", name: "Lea Müller", role: "Product Manager", status: "Rejected", score: 41, initials: "LM", appliedAt: "Jun 23" },
  { id: "6", name: "Carlos Rivera", role: "Full Stack Engineer", status: "Screening", score: 67, initials: "CR", appliedAt: "Jun 22" },
  { id: "7", name: "Aiko Tanaka", role: "Data Analyst", status: "Interview", score: 88, initials: "AT", appliedAt: "Jun 21" },
];
