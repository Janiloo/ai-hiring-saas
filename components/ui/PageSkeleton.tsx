// Route-level loading skeletons. Rendered instantly by Next.js loading.tsx
// files while an async server page streams its data — this is what turns
// blocking navigation into optimistic navigation (route changes immediately,
// content fills in). Uses the .skeleton shimmer utility from globals.css.

function Bar({ w = "100%", h = 14, className = "" }: { w?: string; h?: number; className?: string }) {
  return <div className={`skeleton ${className}`} style={{ width: w, height: h }} />;
}

function Header() {
  return (
    <div className="flex flex-col gap-2">
      <Bar w="200px" h={26} />
      <Bar w="320px" h={14} />
    </div>
  );
}

function StatCards({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card card-pad flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <Bar w="90px" h={13} />
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
          </div>
          <Bar w="60px" h={30} />
          <Bar w="110px" h={12} />
        </div>
      ))}
    </div>
  );
}

function ListRows({ n = 6 }: { n?: number }) {
  return (
    <div className="card divide-y divide-gray-100 overflow-hidden">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 999 }} />
            <div className="flex flex-col gap-2">
              <Bar w="150px" h={14} />
              <Bar w="100px" h={12} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton" style={{ width: 78, height: 20, borderRadius: 6 }} />
            <Bar w="70px" h={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Kanban() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 rounded-xl bg-gray-100 p-2.5">
          <Bar w="70%" h={12} className="mb-3" />
          {Array.from({ length: (i % 3) + 1 }).map((__, j) => (
            <div key={j} className="skeleton mb-2" style={{ height: 54, borderRadius: 8 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

type Variant = "dashboard" | "list" | "kanban" | "detail" | "cards";

export default function PageSkeleton({ variant = "list", filters = false }: { variant?: Variant; filters?: boolean }) {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Header />

      {filters && (
        <div className="flex flex-wrap gap-3">
          <div className="skeleton" style={{ width: 260, height: 40, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 150, height: 40, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 150, height: 40, borderRadius: 8 }} />
        </div>
      )}

      {variant === "dashboard" && (
        <>
          <StatCards />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ListRows n={4} />
            <ListRows n={4} />
          </div>
        </>
      )}
      {variant === "cards" && <StatCards n={8} />}
      {variant === "list" && <ListRows />}
      {variant === "kanban" && <Kanban />}
      {variant === "detail" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 card card-pad flex flex-col gap-4">
            <Bar w="240px" h={20} />
            <Bar w="100%" h={12} />
            <Bar w="90%" h={12} />
            <Bar w="95%" h={12} />
            <Bar w="70%" h={12} />
          </div>
          <div className="card card-pad flex flex-col gap-3">
            <Bar w="120px" h={16} />
            <Bar w="100%" h={12} />
            <Bar w="80%" h={12} />
          </div>
        </div>
      )}
    </div>
  );
}
