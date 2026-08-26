import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "./ui";

export function Registrants({ data = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const FILTERS = useMemo(() => ["All years", ...new Set(data.map((r) => r.year || r.user?.year).filter(Boolean))], [data]);
  const [filter, setFilter] = useState("All years");

  const list = useMemo(() => {
    if (filter === "All years") return data;
    return data.filter((r) => {
      const yr = r.year || r.user?.year || "";
      return yr.toLowerCase().includes(filter.toLowerCase().replace(" year", ""));
    });
  }, [filter, data]);

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
        {list.map((r, idx) => {
          const name = r.name || r.user?.name || "Participant";
          const email = r.email || r.userEmail || "—";
          const branch = r.branch || r.user?.branch || r.department || "N/A";
          const year = r.year || r.user?.year || "N/A";
          const imgSrc = r.img || r.avatar || r.user?.img || r.user?.profilePicture;
          const regDate = r.registeredAt || (r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "Recently");

          return (
            <button
              key={r.id || r._id || idx}
              onClick={() => router.push(`/FormPreview/${searchParams.get("formId")}?responseId=${r._id || r.id}`)}
              className="group flex w-full items-center gap-4 rounded-[20px] border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white px-4 py-3.5 text-left duration-200"
            >
              {/* Avatar with profile picture */}
              <div className="shrink-0">
                <Avatar name={name} src={imgSrc} size={44} />
              </div>

              {/* User information */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[15px] font-semibold leading-tight text-[#111111]">
                    {name}
                  </p>

                  <span className="rounded-full bg-[#f1f1f1] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                    {branch}
                  </span>

                  <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#888888]">
                    {String(year).split(" ")[0]} yr
                  </span>
                </div>

                <p className="mt-1 truncate font-mono text-[12px] text-[#999999]">
                  {email}
                </p>
              </div>

              {/* Registered date */}
              <div className="hidden text-right sm:block">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#aaaaaa]">
                  Registered
                </p>

                <p className="mt-0.5 font-mono text-[12px] text-[#555555]">
                  {regDate}
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
          );
        })}
      </div>

    </div>
  );
}
