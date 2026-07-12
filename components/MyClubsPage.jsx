"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Search, ArrowUpRight, Sparkles, Star, Layers } from "lucide-react";

/* ---------- Inline UI primitives (no external ui/figma imports) ---------- */

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-[#030213] text-white hover:opacity-90",
    secondary: "bg-[#f0f0f3] text-[#030213] hover:bg-[#e4e4ea]",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Badge({ variant = "default", className = "", children }) {
  const variants = {
    default: "bg-[#030213] text-white",
    secondary: "bg-[#f0f0f3] text-[#030213]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}

function ImageWithFallback({ src, alt = "", className = "", ...props }) {
  const [errored, setErrored] = useState(false);
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23ececf0'/></svg>`,
    );
  return (
    <img
      src={errored ? fallback : src || fallback}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}

/* ---------- Page ---------- */

export function MyClubsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [myClubs, setMyClubs] = useState([]);
  const [suggestedClubs, setSuggestedClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const loadClubs = async () => {
      try {
        setLoading(true);

        const [myClubsResponse, allClubsResponse] = await Promise.all([
          fetch("/api/clubs?memberOf=true", { cache: "no-store" }),
          fetch("/api/clubs", { cache: "no-store" }),
        ]);

        const myClubsData = await myClubsResponse.json();
        const allClubsData = await allClubsResponse.json();

        if (!cancelled) {
          const joinedClubs = Array.isArray(myClubsData?.clubs) ? myClubsData.clubs : [];
          const allClubs = Array.isArray(allClubsData?.clubs) ? allClubsData.clubs : [];
          const joinedIds = new Set(joinedClubs.map((club) => String(club._id)));
          const availableClubs = allClubs.filter((club) => !joinedIds.has(String(club._id)));
          const shuffledSuggestions = [...availableClubs].sort(() => Math.random() - 0.5).slice(0, 3);

          setMyClubs(joinedClubs);
          setSuggestedClubs(shuffledSuggestions);
        }
      } catch (error) {
        console.error("MY CLUBS FETCH ERROR:", error);
        if (!cancelled) {
          setMyClubs([]);
          setSuggestedClubs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadClubs();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const clubCards = useMemo(
    () =>
      myClubs.map((club) => ({
        id: club._id,
        name: club.clubName || "Campus Club",
        role: club.position || club.roleLabel || "Member",
        category: club.category || "General",
        members: club.memberCount || 0,
        img: club.banner || club.logo || "",
        logo: club.logo || "",
      })),
    [myClubs],
  );

  const suggestedCards = useMemo(
    () =>
      suggestedClubs.map((club) => ({
        id: club._id,
        name: club.clubName || "Campus Club",
        category: club.category || "General",
        members: club.memberCount || 0,
        img: club.logo || "",
      })),
    [suggestedClubs],
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-[rgba(0,0,0,0.1)] bg-white/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#030213] text-white sm:size-10">
              <Users className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0">
              <h2>My Clubs</h2>
              <div className="truncate text-sm text-[#717182]">Communities you follow and love</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-[#f3f3f5] px-3 py-1.5 sm:flex">
            <Search className="size-4 text-[#717182]" />
            <input
              className="w-40 bg-transparent text-sm outline-none placeholder:text-[#717182]"
              placeholder="Search clubs..."
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-[14px] py-5 sm:gap-6">
        {/* Summary strip */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9ebef] text-[#030213] sm:size-12">
              <Layers className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-[#717182]">You're a member of</div>
              <div className="mt-0.5 text-[#0a0a0a]">{clubCards.length} campus clubs</div>
            </div>
          </div>
          <div className="flex shrink-0 -space-x-3">
            {clubCards.slice(0, 4).map((club) => (
              <div key={club.id} className="size-8 overflow-hidden rounded-full ring-2 ring-white sm:size-10">
                <ImageWithFallback src={club.logo} alt={club.name} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* My Clubs */}
        <section className="flex flex-col gap-3">
          <h3>Clubs you're part of</h3>
          {loading ? (
            <div className="rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-6 text-sm text-[#717182] shadow-sm">
              Loading clubs...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {clubCards.map((club) => (
                <button
                  key={club.id}
                  onClick={() => router.push(`/Club?clubId=${club.id}`)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md sm:hover:-translate-y-1 sm:hover:shadow-lg"
                >
                  {/* Banner */}
                  <div className="relative h-24 overflow-hidden">
                    <ImageWithFallback
                      src={club.img}
                      alt={club.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/0 to-black/0" />
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-xs text-[#030213] backdrop-blur">
                      {club.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-3 pt-0">
                    <div className="flex items-start gap-3">
                      <div className="-mt-7 size-12 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                        <ImageWithFallback src={club.logo} alt={club.name} className="size-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 pt-2">
                        <div className="wrap-break-word text-[#0a0a0a]">{club.name}</div>
                        <span className="mt-1 inline-flex items-center rounded-full bg-[#e9ebef] px-2 py-0.5 text-xs text-[#030213]">
                          {club.role}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] pt-3">
                      <span className="flex items-center gap-1.5 text-sm text-[#717182]">
                        <Users className="size-4" /> {club.members.toLocaleString()} members
                      </span>
                      <span className="flex items-center gap-1 text-sm text-[#030213] transition-colors group-hover:text-[#5b5bd6]">
                        Visit
                        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Suggested Clubs */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#717182]" />
            <h3>Suggested for you</h3>
          </div>
          <div className="flex flex-col gap-3">
            {suggestedCards.map((club) => (
              <div
                key={club.id}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4"
              >
                <div className="size-14 shrink-0 overflow-hidden rounded-xl sm:size-16">
                  <ImageWithFallback src={club.img} alt={club.name} className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="mb-1 rounded-full">{club.category}</Badge>
                  <div className="wrap-break-word text-[#0a0a0a]">{club.name}</div>
                  <div className="flex items-center gap-1 text-sm text-[#717182]">
                    <Star className="size-3.5" /> {club.members} members
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 rounded-full px-3 sm:px-4"
                  onClick={() => router.push(`/Club?clubId=${club.id}`)}
                >
                  <span className="hidden sm:inline">Visit</span>
                  <ArrowUpRight className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MyClubsPage;
