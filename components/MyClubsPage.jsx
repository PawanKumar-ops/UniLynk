import { useState } from "react";
import { Users, Search, ArrowUpRight, Sparkles, Star, Layers } from "lucide-react";
import { ClubProfilePage } from "./club-profile-page";

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
      src={errored ? fallback : src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}

/* ---------- Data ---------- */

const myClubs = [
  {
    id: "c1",
    name: "Innovation Cell",
    role: "Core Member",
    category: "Technology",
    members: 240,
    img: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    logo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  },
  {
    id: "c2",
    name: "Coding Club",
    role: "Contributor",
    category: "Technology",
    members: 512,
    img: "https://images.unsplash.com/photo-1558137623-ce933996c730?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    logo: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  },
  {
    id: "c3",
    name: "Robotics Society",
    role: "Volunteer",
    category: "Engineering",
    members: 180,
    img: "https://images.unsplash.com/photo-1527612820672-5b56351f7346?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    logo: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  },
  {
    id: "c4",
    name: "Design Guild",
    role: "Member",
    category: "Creative",
    members: 96,
    img: "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    logo: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
  },
];

const suggestedClubs = [
  {
    id: "s1",
    name: "Canvas Collective",
    category: "Arts & Culture",
    members: 45,
    img: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  },
  {
    id: "s2",
    name: "Debate Society",
    category: "Literary",
    members: 132,
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  },
  {
    id: "s3",
    name: "Photography Club",
    category: "Creative",
    members: 210,
    img: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  },
];

/* ---------- Page ---------- */

export function MyClubsPage() {
  const [selectedClub, setSelectedClub] = useState(null);

  if (selectedClub) {
    return <ClubProfilePage club={selectedClub} onBack={() => setSelectedClub(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white text-[#0a0a0a]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-[rgba(0,0,0,0.1)] bg-white/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
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

      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        {/* Summary strip */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-4 shadow-sm sm:gap-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e9ebef] text-[#030213] sm:size-12">
              <Layers className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-[#717182]">You're a member of</div>
              <div className="mt-0.5 text-[#0a0a0a]">{myClubs.length} campus clubs</div>
            </div>
          </div>
          <div className="flex shrink-0 -space-x-3">
            {myClubs.slice(0, 4).map((c) => (
              <div key={c.id} className="size-8 overflow-hidden rounded-full ring-2 ring-white sm:size-10">
                <ImageWithFallback src={c.logo} alt={c.name} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* My Clubs */}
        <section className="flex flex-col gap-3">
          <h3>Clubs you're part of</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {myClubs.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClub(c)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white text-left shadow-sm transition-all duration-300 hover:shadow-md sm:hover:-translate-y-1 sm:hover:shadow-lg"
              >
                {/* Banner */}
                <div className="relative h-24 overflow-hidden">
                  <ImageWithFallback
                    src={c.img}
                    alt={c.name}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0" />
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-xs text-[#030213] backdrop-blur">
                    {c.category}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-3 pt-0">
                  <div className="flex items-start gap-3">
                    {/* Club profile picture (logo) overlapping the banner */}
                    <div className="-mt-7 size-12 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                      <ImageWithFallback src={c.logo} alt={c.name} className="size-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 pt-2">
                      <div className="break-words text-[#0a0a0a]">{c.name}</div>
                      <span className="mt-1 inline-flex items-center rounded-full bg-[#e9ebef] px-2 py-0.5 text-xs text-[#030213]">
                        {c.role}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] pt-3">
                    <span className="flex items-center gap-1.5 text-sm text-[#717182]">
                      <Users className="size-4" /> {c.members.toLocaleString()} members
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
        </section>

        {/* Suggested Clubs */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#717182]" />
            <h3>Suggested for you</h3>
          </div>
          <div className="flex flex-col gap-3">
            {suggestedClubs.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4"
              >
                <div className="size-14 shrink-0 overflow-hidden rounded-xl sm:size-16">
                  <ImageWithFallback src={c.img} alt={c.name} className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="secondary" className="mb-1 rounded-full">{c.category}</Badge>
                  <div className="break-words text-[#0a0a0a]">{c.name}</div>
                  <div className="flex items-center gap-1 text-sm text-[#717182]">
                    <Star className="size-3.5" /> {c.members} members
                  </div>
                </div>
                <Button variant="secondary" className="shrink-0 rounded-full px-3 sm:px-4">
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
