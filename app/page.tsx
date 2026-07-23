import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Icon, { type IconName } from "@/components/ui/Icon";
import ThemeToggle from "@/components/ThemeToggle";
import FeatureVideo from "@/components/FeatureVideo";

// ─────────────────────────────────────────────────────────────────────────────
// Makes landing page — the public front door. Pure server component: no auth
// dependency, respects the cookie theme set by the app.
// ─────────────────────────────────────────────────────────────────────────────

const display = { fontFamily: "var(--font-display)", letterSpacing: "-0.025em" };

const STEPS: { title: string; body: string }[] = [
  { title: "Create your organization", body: "Spin up a workspace in minutes — no setup calls, no sales demo required." },
  { title: "Invite your team", body: "Admins, recruiters, and interviewers each get exactly the access their role needs." },
  { title: "Create job posts", body: "Draft the role once; let AI write the polished advertisement for every job board." },
  { title: "Receive applications automatically", body: "Candidates email their resume — Makes ingests, files, and stores it without a click." },
  { title: "AI evaluates candidates", body: "Every resume is parsed and scored against the job in the background." },
  { title: "Manage interviews and hiring", body: "Move candidates through a clear pipeline, schedule interviews, collect feedback." },
  { title: "Track organizational workflows", body: "Reports, audit trails, and team activity — always current, never assembled by hand." },
];

const FEATURES: { icon: IconName; title: string; body: string; ai?: boolean }[] = [
  { icon: "sparkles",  title: "AI Resume Evaluation",  body: "Every applicant scored 0–100 against the job post, with strengths, weaknesses, and a recruiter-ready summary.", ai: true },
  { icon: "mail",      title: "Gmail Resume Ingestion", body: "Connect your recruitment inbox once. Applications become candidates automatically — resume attached and filed." },
  { icon: "briefcase", title: "AI Job Post Generator",  body: "Turn rough role notes into a polished, board-ready advertisement — saved, editable, regenerable.", ai: true },
  { icon: "pipeline",  title: "Candidate Pipeline",     body: "A seven-stage hiring flow with clear rules: AI informs, people decide, every move is audited." },
  { icon: "shield",    title: "Role-based Access",      body: "Admins, recruiters, and interviewers see exactly what they should — enforced server-side, not by hiding buttons." },
  { icon: "building",  title: "Organization Management", body: "Multi-tenant by design. Your data stays yours — isolated per organization at the database level." },
  { icon: "chart",     title: "Reports & Analytics",     body: "Live hiring metrics from real data: pipeline health, interview load, AI evaluation coverage." },
  { icon: "users",     title: "Multi-user Collaboration", body: "Interview feedback, candidate notes, and activity timelines keep the whole team on the same page." },
];

// Product clips rendered from the Makes design system (see remotion/).
const DEMOS: { title: string; body: string; src: string; poster: string }[] = [
  {
    title: "AI writes the job post",
    body: "Enter the role details once. AI drafts a polished, board-ready advertisement you can copy straight to LinkedIn, Indeed, or your careers page — saved with the job and editable anytime.",
    src: "/video/job-post.mp4",
    poster: "/video/job-post.jpg",
  },
  {
    title: "AI reads and scores every resume",
    body: "Applications arriving by email are parsed automatically and scored 0–100 against the job, with strengths, weaknesses, and a recruiter-ready summary — all in the background.",
    src: "/video/ai-evaluation.mp4",
    poster: "/video/ai-evaluation.jpg",
  },
  {
    title: "Move a candidate — they hear instantly",
    body: "Every pipeline move fires a branded email to the applicant the moment it happens. Recruiters never write a status update, and candidates always know where they stand.",
    src: "/video/pipeline-inbox.mp4",
    poster: "/video/pipeline-inbox.jpg",
  },
];

/** Stylized product preview built from real UI primitives — replaceable with a screenshot later. */
function ProductPreview() {
  const rows = [
    { name: "Carter Rodriguez", role: "Frontend Engineer", score: 92, w: "92%", chip: "chip-applied",     chipLabel: "Applied",     tone: "var(--hue-green)" },
    { name: "Jane Mercado",     role: "Accountant",        score: 64, w: "64%", chip: "chip-screening",   chipLabel: "Screening",   tone: "var(--hue-amber)" },
    { name: "Leo Santos",       role: ".NET Developer",    score: 88, w: "88%", chip: "chip-interview",   chipLabel: "Interview",   tone: "var(--hue-green)" },
    { name: "Ana Lim",          role: "Virtual Assistant", score: 41, w: "41%", chip: "chip-shortlisted", chipLabel: "Shortlisted", tone: "var(--hue-red)" },
  ];
  return (
    <div className="card overflow-hidden text-left shadow-lg" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
        <p className="text-sm font-semibold text-gray-900" style={display}>Candidates</p>
        <span className="chip-ai-completed">AI evaluated</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{r.name}</p>
              <p className="truncate text-xs text-gray-500">{r.role}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="meter">
                <span className="meter-value">{r.score}</span>
                <span className="meter-bar"><span className="meter-fill" style={{ width: r.w, background: r.tone }} /></span>
              </span>
              <span className={r.chip}>{r.chipLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="Makes home">
            <Logo size={30} />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#demo" className="transition-colors hover:text-gray-900">Demo</a>
            <a href="#features" className="transition-colors hover:text-gray-900">Features</a>
            <a href="#solutions" className="transition-colors hover:text-gray-900">Solutions</a>
            <a href="#about" className="transition-colors hover:text-gray-900">About</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost btn-sm">Sign In</Link>
            <Link href="/register" className="btn-primary btn-sm">Get Started</Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--accent)" }}>
              AI-powered Organization Automation
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] text-gray-900 md:text-5xl" style={display}>
              Run your hiring on autopilot.
              <br />
              Decide like a human.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
              Makes helps organizations automate recruitment, collaboration, and operational
              workflows using AI. Applications arrive, resumes are read, candidates are scored —
              your team just makes the calls that matter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary px-6 py-3 text-base">Create Workspace</Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">Sign In</Link>
            </div>
            <p className="mt-4 text-xs text-gray-500">Free to start · No credit card required</p>
          </div>
          <ProductPreview />
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="border-y border-gray-200 bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-extrabold text-gray-900" style={display}>How it works</h2>
            <p className="mt-2 max-w-xl text-sm text-gray-600">
              From empty workspace to a running hiring operation — the numbers are the actual order.
            </p>
            <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white"
                    style={{ background: "var(--brand)", boxShadow: "inset 0 -2px 0 var(--edge)", ...display }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── See it in action (product clips) ─────────────────────────── */}
        <section id="demo" className="scroll-mt-20 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--accent)" }}>
                See it in action
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl" style={display}>
                The whole hiring loop, automated
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
                No signup needed — these are real screens from Makes. Watch a role go from
                a rough brief to a scored applicant to a candidate who&apos;s already been notified.
              </p>
            </div>

            <div className="mt-14 flex flex-col gap-16">
              {DEMOS.map((d, i) => (
                <div key={d.src}>
                  <div className="mb-4 flex items-baseline gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-extrabold text-white"
                      style={{ background: "var(--brand)", boxShadow: "inset 0 -2px 0 var(--edge)", ...display }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900" style={display}>{d.title}</h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{d.body}</p>
                    </div>
                  </div>
                  <FeatureVideo src={d.src} poster={d.poster} label={d.title} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
          <h2 className="text-3xl font-extrabold text-gray-900" style={display}>
            Everything hiring needs.
            <span style={{ color: "var(--accent)" }}> Nothing it doesn&apos;t.</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-pad transition-shadow hover:shadow-md">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: f.ai ? "var(--accent-subtle)" : "var(--brand-subtle)",
                    color: f.ai ? "var(--accent)" : "var(--brand)",
                    boxShadow: "inset 0 -2px 0 rgb(0 0 0 / 0.06)",
                  }}
                >
                  <Icon name={f.icon} size={20} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Solutions ────────────────────────────────────────────────── */}
        <section id="solutions" className="scroll-mt-20 border-y border-gray-200 bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-extrabold text-gray-900" style={display}>Built for every seat at the table</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { role: "For Admins", body: "Own the workspace: team roles, organization settings, Gmail connection, final hiring authority, and a complete audit trail." },
                { role: "For Recruiters", body: "Live in the pipeline: sync applications, review AI rankings, move candidates, schedule interviews — without tab-hopping." },
                { role: "For Interviewers", body: "See only what you need: your assigned candidates and a clean form to log structured interview feedback." },
              ].map((s) => (
                <div key={s.role} className="card card-pad">
                  <h3 className="text-base font-bold text-gray-900" style={display}>{s.role}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────── */}
        <section id="about" className="mx-auto max-w-3xl scroll-mt-20 px-6 py-20 text-center">
          <div className="flex justify-center">
            <Logo size={40} showWordmark={false} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900" style={display}>Why Makes</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            Hiring teams spend their best hours on busywork: reading identical resumes, copying
            details into spreadsheets, chasing status updates. Makes exists to hand that work to
            machines — while keeping every decision that affects a person in human hands. AI never
            moves a candidate through your pipeline. It reads, scores, and summarizes; your team
            judges. That boundary is built into the product, not written in a policy.
          </p>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="px-6 pb-24">
          <div
            className="mx-auto max-w-4xl rounded-2xl px-8 py-14 text-center"
            style={{ background: "var(--brand)", boxShadow: "inset 0 -4px 0 var(--edge)" }}
          >
            <h2 className="text-3xl font-extrabold text-white" style={display}>
              Ready to automate your organization?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Create your workspace, connect your inbox, and let the first applications file themselves.
            </p>
            <Link href="/register" className="btn-accent mt-8 inline-flex px-7 py-3 text-base">
              Create Workspace
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo size={24} />
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Makes · AI-powered Organization Automation
          </p>
          <div className="flex gap-5 text-xs font-medium text-gray-500">
            <Link href="/login" className="hover:text-gray-900">Sign In</Link>
            <Link href="/register" className="hover:text-gray-900">Create Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
