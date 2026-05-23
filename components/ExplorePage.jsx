import { useEffect, useMemo, useState } from "react";
import {
  Search,
  TrendingUp,
  Sparkles,
  UserPlus,
  Heart,
  MessageCircle,
  ArrowLeft,
  Flame,
  Calendar,
  Code,
  Music,
  Camera,
  BookOpen,
  BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ReliableImage from "./ReliableImage";

const users = [
  {
    name: "Aarav Mehta",
    role: "Third Year · CSE",
    avatar: "https://images.unsplash.com/photo-1654110455429-cf322b40a906?w=200",
    mutual: 12,
  },
  {
    name: "Priya Sharma",
    role: "Second Year · Design",
    avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=200",
    mutual: 8,
  },
  {
    name: "Rohan Verma",
    role: "Final Year · ECE",
    avatar: "https://images.unsplash.com/photo-1707396172424-f3293f788364?w=200",
    mutual: 5,
  },
  {
    name: "Ishita Roy",
    role: "First Year · MBA",
    avatar: "https://images.unsplash.com/photo-1740252117044-2af197eea287?w=200",
    mutual: 21,
  },
];

const trending = [
  {
    tag: "#HackathonWeek",
    title: "48-hour Build Marathon kicks off",
    author: "Innovation Cell",
    image:
      "https://images.unsplash.com/photo-1701709304274-bd9e5402d979?w=800",
    likes: 482,
    comments: 73,
  },
  {
    tag: "#FreshersNight",
    title: "Inside the rooftop celebration of '26",
    author: "Cultural Society",
    image:
      "https://images.unsplash.com/photo-1736496503629-2d64fafca24e?w=800",
    likes: 311,
    comments: 44,
  },
  {
    tag: "#OpenMic",
    title: "Voices of the quad — Friday lineup",
    author: "Music Club",
    image:
      "https://images.unsplash.com/photo-1764920265158-500a6e60c487?w=800",
    likes: 256,
    comments: 28,
  },
];

const categories = [
  { icon: Code, label: "Tech" },
  { icon: Music, label: "Music" },
  { icon: Camera, label: "Photo" },
  { icon: BookOpen, label: "Academics" },
  { icon: Calendar, label: "Events" },
  { icon: Flame, label: "Sports" },
];

const ImageWithFallback = ({ src, alt, className = "" }) => (
  <ReliableImage
    src={src}
    alt={alt}
    className={className}
    maxRetries={2}
    fallbackSrc="/Profilepic.png"
  />
);

export function ExplorePage({ onBack }) {
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults((data.results || []).filter((item) => item.type === "user"));
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const showSearchResults = useMemo(() => Boolean(query.trim()), [query]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
        <button
          onClick={onBack}
          className="w-9 h-9 grid place-items-center rounded-full hover:bg-neutral-100 transition"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div>Explore Campus</div>
          <div className="text-xs text-neutral-500">
            Discover people, clubs and what&apos;s buzzing today
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, clubs, events…"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-neutral-100 border border-transparent focus:bg-white focus:border-neutral-300 outline-none text-sm transition"
          />

          {showSearchResults && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-200 bg-[#f4f4f4] shadow-xl z-30">
              {searchLoading ? (
                <div className="px-4 py-4 text-sm text-neutral-500">Searching users...</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-4 text-sm text-neutral-500">No users found.</div>
              ) : (
                results.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-200/70 transition"
                    onClick={() => router.push(`/dashboard/search/id=${item.id}`)}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-neutral-200">
                      <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-neutral-900 truncate flex items-center gap-1">
                        {item.name}
                        <BadgeCheck size={16} className="text-sky-500 shrink-0" />
                      </div>
                      <div className="text-sm text-neutral-500 truncate">@{item.username || "user"}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 hover:border-black hover:bg-black hover:text-white transition text-sm"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} />
              <h3>Trending on Campus</h3>
            </div>
            <button className="text-xs text-neutral-500 hover:text-black">View all</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <article className="row-span-2 relative rounded-2xl overflow-hidden border border-neutral-200 group cursor-pointer">
              <ImageWithFallback
                src={trending[0].image}
                alt={trending[0].title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative h-full min-h-72 flex flex-col justify-end p-4 text-white">
                <span className="self-start text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                  {trending[0].tag}
                </span>
                <div className="text-sm leading-snug">{trending[0].title}</div>
                <div className="text-xs text-white/70 mt-1">by {trending[0].author}</div>
                <div className="flex items-center gap-3 mt-3 text-xs text-white/80">
                  <span className="flex items-center gap-1"><Heart size={12} /> {trending[0].likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} /> {trending[0].comments}</span>
                </div>
              </div>
            </article>

            {trending.slice(1).map((t) => (
              <article
                key={t.title}
                className="relative rounded-2xl overflow-hidden border border-neutral-200 group cursor-pointer"
              >
                <ImageWithFallback
                  src={t.image}
                  alt={t.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="relative min-h-36 flex flex-col justify-end p-3 text-white">
                  <span className="self-start text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mb-1.5">
                    {t.tag}
                  </span>
                  <div className="text-xs leading-snug line-clamp-2">{t.title}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <h3>Suggested for you</h3>
            </div>
            <button className="text-xs text-neutral-500 hover:text-black">Refresh</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {users.map((u) => (
              <div
                key={u.name}
                className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                  <ImageWithFallback
                    src={u.avatar}
                    alt={u.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{u.name}</div>
                  <div className="text-xs text-neutral-500 truncate">{u.role}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{u.mutual} mutual</div>
                </div>
                <button className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white text-xs hover:bg-neutral-800 transition">
                  <UserPlus size={12} />
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
