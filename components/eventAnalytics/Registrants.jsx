import { useMemo, useState } from "react";
import { REGISTRANTS, YEAR_DATA } from "@/data/analytics";
import { Avatar } from "./ui";

const FILTERS = ["All years", ...YEAR_DATA.map((y) => y.label)];

export function Registrants() {
  const [filter, setFilter] = useState("All years");

  const list = useMemo(
    () =>
      filter === "All years"
        ? REGISTRANTS
        : REGISTRANTS.filter((r) => r.year === filter),
    [filter]
  );

  return (
    <div className="w-full">

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
              filter === f
                ? "bg-[#111111] text-white"
                : "border border-[#e5e5e5] bg-white text-[#333333] hover:border-[#cfcfcf] hover:bg-[#f7f7f7]"
            }`}
          >
            {f}
          </button>
        ))}

        <span className="ml-auto whitespace-nowrap font-mono text-[12px] text-[#999999]">
          {list.length} people
        </span>
      </div>

      {/* Registrants */}
      <div className="flex flex-col gap-2.5">
        {list.map((r) => (
          <button
            key={r.id}
            className="group flex w-full items-center gap-4 rounded-[20px] border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white px-4 py-3.5 text-left duration-200 "
          >
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar name={r.name} size={44} />
            </div>

            {/* User information */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[15px] font-semibold leading-tight text-[#111111]">
                  {r.name}
                </p>

                <span className="rounded-full bg-[#f1f1f1] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                  {r.branch}
                </span>

                <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#888888]">
                  {r.year.split(" ")[0]} yr
                </span>
              </div>

              <p className="mt-1 truncate font-mono text-[12px] text-[#999999]">
                {r.email}
              </p>
            </div>

            {/* Registered date */}
            <div className="hidden text-right sm:block">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#aaaaaa]">
                Registered
              </p>

              <p className="mt-0.5 font-mono text-[12px] text-[#555555]">
                {r.registeredAt}
              </p>
            </div>

            {/* Arrow */}
            <span className="grid h-9 w-9 shrink-0 place-items-center text-[#777777] transition-all duration-200 group-hover:text-[#000]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12h14m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}