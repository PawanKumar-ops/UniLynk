"use client"

import { useMemo, useState } from "react";
import {
  Search,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  TrendingUp,
  Sparkles,
  BadgeCheck,
  Plus,
  X,
} from "lucide-react";

function Input({ className = "", ...props }) {
  return (
    <input
      className={`flex w-full border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
      {...props}
    />
  );
}

function Avatar({ className = "", children }) {
  return (
    <div className={`relative flex size-10 shrink-0 overflow-hidden rounded-full ${className}`}>
      {children}
    </div>
  );
}

function AvatarImage({ src = "", alt = "", className = "" }) {
  if (!src) return null;

  return <img src={src} alt={alt} className={`aspect-square size-full ${className}`} />;
}

function AvatarFallback({ className = "", children }) {
  return (
    <div className={`flex size-full items-center justify-center rounded-full bg-neutral-100 ${className}`}>
      {children}
    </div>
  );
}

function Button({ className = "", type = "button", variant, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

function Badge({ className = "", children }) {
  return (
    <span className={`inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

const clubPosts = [
  {
    id: "c1",
    author: "Innovation Cell",
    handle: "innovation_cell",
    club: true,
    verified: true,
    time: "2h",
    content:
      "Hackathon registrations are now open! 48 hours of building, mentoring and prizes worth ₹1L. Lock your spot before Sunday.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    likes: 312,
    comments: 48,
    tag: "Event",
  },
  {
    id: "c2",
    author: "Literary Society",
    handle: "lit_society",
    club: true,
    verified: true,
    time: "5h",
    content:
      "Open mic night this Friday at the amphitheatre. Poetry, prose, anything that moves you. Sign up at the booth.",
    likes: 187,
    comments: 22,
    tag: "Open Mic",
  },
];

const trendingPosts = [
  {
    id: "t1",
    author: "Anuj Sharma",
    handle: "anuj.sh",
    time: "1h",
    content:
      "Spent the weekend rebuilding my portfolio in Next.js + Tailwind. Lighthouse 100 across the board. AMA.",
    likes: 1240,
    comments: 96,
  },
  {
    id: "t2",
    author: "Varsh",
    handle: "varsh",
    time: "3h",
    content: "Govind has officially joined the robotics team. Welcome aboard!",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    likes: 842,
    comments: 73,
  },
  {
    id: "t3",
    author: "Pawan",
    handle: "pawan",
    time: "6h",
    content: "Backstage from yesterday's debate finals. What an evening.",
    image:
      "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    likes: 654,
    comments: 41,
  },
];

const suggestions = [
  { id: "s1", name: "Design Club", handle: "design_club", meta: "1.2k members", type: "club" },
  { id: "s2", name: "Riya Mehta", handle: "riya.m", meta: "Third Year · CSE", type: "user" },
  { id: "s3", name: "Photography Society", handle: "photo_soc", meta: "860 members", type: "club" },
  { id: "s4", name: "Karan Verma", handle: "karan.v", meta: "Second Year · ECE", type: "user" },
  { id: "s5", name: "Music Club", handle: "music_club", meta: "2.4k members", type: "club" },
];

const trendingTopics = [
  { tag: "#Hackathon26", posts: "2,341 posts" },
  { tag: "#OpenMic", posts: "1,108 posts" },
  { tag: "#TechFest", posts: "987 posts" },
  { tag: "#Placements", posts: "756 posts" },
];

const tabItems = [
  { value: "forYou", label: "For You" },
  { value: "trending", label: "Trending" },
  { value: "clubs", label: "Clubs" },
  { value: "people", label: "People" },
];

function PostImage({ src, alt = "", className = "" }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <article className="border-b border-neutral-200 px-4 py-4 transition-colors hover:bg-neutral-50/60">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className={post.club ? "bg-black text-white" : ""}>
            {post.author[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-neutral-900">
            <span className="truncate">{post.author}</span>
            {post.verified && <BadgeCheck className="h-4 w-4 fill-black text-white" />}
            <span className="truncate text-neutral-500">@{post.handle}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">{post.time}</span>
            {post.tag && (
              <Badge
                variant="secondary"
                className="ml-auto rounded-full bg-neutral-100 text-neutral-700"
              >
                {post.tag}
              </Badge>
            )}
          </div>
          <p className="mt-1 whitespace-pre-line text-neutral-800">{post.content}</p>
          {post.image && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
              <PostImage
                src={post.image}
                alt=""
                className="h-72 w-full object-cover"
              />
            </div>
          )}
          <div className="mt-3 flex max-w-md items-center justify-between text-neutral-500">
            <button
              onClick={() => setLiked((v) => !v)}
              className="group flex items-center gap-1.5 transition-colors hover:text-black"
            >
              <Heart
                className={`h-4 w-4 ${liked ? "fill-black text-black" : ""}`}
              />
              <span>{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <button className="flex items-center gap-1.5 transition-colors hover:text-black">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 transition-colors hover:text-black">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSaved((v) => !v)}
              className="flex items-center gap-1.5 transition-colors hover:text-black"
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-black text-black" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SuggestionRow({ suggestion }) {
  const [following, setFollowing] = useState(false);
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50">
      <Avatar className="h-10 w-10">
        <AvatarFallback className={suggestion.type === "club" ? "bg-black text-white" : ""}>
          {suggestion.name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate">
          <span className="truncate">{suggestion.name}</span>
          {suggestion.type === "club" && <BadgeCheck className="h-3.5 w-3.5 fill-black text-white" />}
        </div>
        <div className="truncate text-neutral-500">{suggestion.meta}</div>
      </div>
      <Button
        onClick={() => setFollowing((v) => !v)}
        variant={following ? "outline" : "default"}
        className={`rounded-full ${
          following
            ? "border-neutral-300 bg-white text-black hover:bg-neutral-100"
            : "bg-black text-white hover:bg-neutral-800"
        }`}
      >
        {following ? "Following" : suggestion.type === "club" ? "Join" : "Follow"}
      </Button>
    </div>
  );
}

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("forYou");

  const allSearchable = useMemo(
    () => [
      ...suggestions,
      ...clubPosts.map((post) => ({
        id: post.id,
        name: post.author,
        handle: post.handle,
        meta: "Club",
        type: "club",
      })),
      ...trendingPosts.map((post) => ({
        id: post.id,
        name: post.author,
        handle: post.handle,
        meta: "User",
        type: "user",
      })),
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allSearchable
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.handle.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, allSearchable]);

  return (
    <div className="h-screen w-full overflow-y-auto bg-white overscroll-contain">
      <div className="mx-auto min-h-full w-full max-w-2xl border-x border-neutral-100 bg-white">
        <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 px-4 pb-3 pt-4 backdrop-blur">
          
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users, clubs, posts"
              className="h-11 rounded-full border-neutral-200 bg-neutral-100 pl-9 pr-9 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-black"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-500 hover:bg-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {filtered.length > 0 && (
              <div className="absolute inset-x-0 top-12 z-30 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
                <div className="px-4 py-2 text-neutral-500">Suggestions</div>
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={s.type === "club" ? "bg-black text-white" : ""}
                      >
                        {s.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{s.name}</div>
                      <div className="truncate text-neutral-500">
                        @{s.handle} · {s.meta}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div className="inline-flex h-9 w-full items-center justify-start gap-1 rounded-xl bg-transparent p-0 text-neutral-500">
              {tabItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  data-state={tab === item.value ? "active" : "inactive"}
                  onClick={() => setTab(item.value)}
                  className="inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-neutral-900 transition-[color,box-shadow] data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          

        {(tab === "forYou" || tab === "clubs") && (
          <section>
            <div className="border-y border-neutral-200 bg-neutral-50/60 px-4 py-2 text-neutral-600">
              From clubs you may like
            </div>
            {clubPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </section>
        )}

        {(tab === "forYou" || tab === "people") && (
          <section>
            <div className="flex items-center justify-between border-y border-neutral-200 bg-neutral-50/60 px-4 py-2 text-neutral-600">
              <span>Suggested for you</span>
              <button type="button" className="text-neutral-500 hover:text-black">See all</button>
            </div>
            <div className="divide-y divide-neutral-100">
              {suggestions.slice(0, 4).map((s) => (
                <SuggestionRow key={s.id} suggestion={s} />
              ))}
            </div>
          </section>
        )}

        {(tab === "forYou" || tab === "trending") && (
          <section>
            <div className="border-y border-neutral-200 bg-neutral-50/60 px-4 py-2 text-neutral-600">
              Most liked this week
            </div>
            {trendingPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </section>
        )}

          <div className="h-24 md:h-8" />
        </div>

        <button type="button" className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg md:hidden">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
