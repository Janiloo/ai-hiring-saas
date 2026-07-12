"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface FilterConfig {
  paramName: string;
  label: string;
  options: { value: string; label: string }[];
}

interface PlatformFilterBarProps {
  searchPlaceholder: string;
  /** Query param used for the free-text search. Defaults to "q". */
  searchParam?: string;
  filter?: FilterConfig;
}

// Reusable search + optional select filter that syncs to the URL query string.
// Server pages read the params to run the guarded RPC — no client-side data.
export default function PlatformFilterBar({
  searchPlaceholder,
  searchParam = "q",
  filter,
}: PlatformFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentSearch = params.get(searchParam) ?? "";

  function pushParams(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("search")?.toString().trim() ?? "";
    const next = new URLSearchParams(params.toString());
    if (value) next.set(searchParam, value);
    else next.delete(searchParam);
    pushParams(next);
  }

  function changeFilter(value: string) {
    if (!filter) return;
    const next = new URLSearchParams(params.toString());
    if (value) next.set(filter.paramName, value);
    else next.delete(filter.paramName);
    pushParams(next);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={submitSearch} className="relative flex-1">
        {/* key resets the uncontrolled input when the URL param changes externally */}
        <input
          key={currentSearch}
          type="search"
          name="search"
          defaultValue={currentSearch}
          placeholder={searchPlaceholder}
          className="input w-full"
          aria-label={searchPlaceholder}
        />
      </form>

      {filter && (
        <select
          value={params.get(filter.paramName) ?? ""}
          onChange={(e) => changeFilter(e.target.value)}
          className="input sm:w-52"
          aria-label={filter.label}
        >
          <option value="">{filter.label}: All</option>
          {filter.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
