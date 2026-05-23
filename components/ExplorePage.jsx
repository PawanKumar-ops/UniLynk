import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Heart,
  MessageCircle,
  ArrowLeft,
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
    title: "48-hour Build Marathon kicks off",
    author: "Innovation Cell",
    image:
      "https://images.unsplash.com/photo-1701709304274-bd9e5402d979?w=800",
    likes: 482,
    comments: 73,
  },
  {
    title: "Inside the rooftop celebration of '26",
    author: "Cultural Society",
    image:
      "https://images.unsplash.com/photo-1736496503629-2d64fafca24e?w=800",
    likes: 311,
    comments: 44,
  },
  {
    title: "Voices of the quad — Friday lineup",
    author: "Music Club",
    image:
      "https://images.unsplash.com/photo-1764920265158-500a6e60c487?w=800",
    likes: 256,
    comments: 28,
  },
];

const avatars = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3OTUxMzg3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "User 1"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc5NDg3NDA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "User 2"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1554765345-6ad6a5417cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzkzOTI5NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    alt: "User 3"
  }
];

const extraCount = 3;


const ImageWithFallback = ({ src, alt, className = "" }) => (
  <ReliableImage
    src={src}
    alt={alt}
    className={className}
    maxRetries={2}
    fallbackSrc="/Profilepic.png"
  />
);

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

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
          className="w-9 h-9 shrink-0 grid place-items-center rounded-full hover:bg-neutral-100 transition"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="relative w-[85%]">
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
            <div
              className="absolute top-[calc(100%+8px)] left-0 z-30 max-h-[520px] overflow-y-auto overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
              style={{ width: 484 }}
            >
              {searchLoading ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  Searching users...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  No users found for "{query}"
                </div>
              ) : (
                <ul className="flex flex-col">
                  {results.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-neutral-50"
                        onClick={() => router.push(`/dashboard/search/id=${user.id}`)}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100 ring-2 ring-white shadow-sm">
                          {user.image ? (
                            <ImageWithFallback
                              src={user.image}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-700">
                              {initials(user.name)}
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-neutral-900">{user.name}</span>
                          <span className="truncate text-neutral-500">
                            {user.email || `@${user.username || "user"}`}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">


        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">

              <h3 className="text-[1.125rem] font-bold">Trending on Campus</h3>
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


                <div className="flex items-center">
                  {avatars.map((avatar, index) => (
                    <div
                      key={avatar.id}
                      className={`relative w-7 h-7 rounded-full overflow-hidden border-2 border-zinc-900 bg-white shrink-0 ${index !== 0 ? "-ml-3" : ""
                        }`}
                    >
                      <img
                        src={avatar.src}
                        alt={avatar.alt}
                        className="w-full h-full object-cover object-center scale-110"
                      />
                    </div>
                  ))}

                  <div className="relative w-7 h-7 -ml-3 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-medium">
                      +{extraCount}
                    </span>
                  </div>
                </div>



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



                  <div className="flex items-center">
                    {avatars.map((avatar, index) => (
                      <div
                        key={avatar.id}
                        className={`relative w-7 h-7 rounded-full overflow-hidden border-2 border-zinc-900 bg-white shrink-0 ${index !== 0 ? "-ml-3" : ""
                          }`}
                      >
                        <img
                          src={avatar.src}
                          alt={avatar.alt}
                          className="w-full h-full object-cover object-center scale-110"
                        />
                      </div>
                    ))}

                    <div className="relative w-7 h-7 -ml-3 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-medium">
                        +{extraCount}
                      </span>
                    </div>
                  </div>



                  <div className="text-xs leading-snug line-clamp-2">{t.title}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">

              <h3 className="text-[1.125rem] font-bold">Suggested for you</h3>
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
