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
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";

type Post = {
  id: string;
  author: string;
  handle: string;
  club?: boolean;
  verified?: boolean;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  tag?: string;
};

type Suggestion = {
  id: string;
  name: string;
  handle: string;
  meta: string;
  type: "user" | "club";
};

const clubPosts: Post[] = [
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

const trendingPosts: Post[] = [
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

const suggestions: Suggestion[] = [
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

function PostCard({ post }: { post: Post }) {
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
              <ImageWithFallback
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

function SuggestionRow({ s }: { s: Suggestion }) {
  const [following, setFollowing] = useState(false);
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50">
      <Avatar className="h-10 w-10">
        <AvatarFallback className={s.type === "club" ? "bg-black text-white" : ""}>
          {s.name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate">
          <span className="truncate">{s.name}</span>
          {s.type === "club" && <BadgeCheck className="h-3.5 w-3.5 fill-black text-white" />}
        </div>
        <div className="truncate text-neutral-500">{s.meta}</div>
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
        {following ? "Following" : s.type === "club" ? "Join" : "Follow"}
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
      ...clubPosts.map((p) => ({
        id: p.id,
        name: p.author,
        handle: p.handle,
        meta: "Club",
        type: "club" as const,
      })),
      ...trendingPosts.map((p) => ({
        id: p.id,
        name: p.author,
        handle: p.handle,
        meta: "User",
        type: "user" as const,
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
    <div className="mx-auto w-full max-w-2xl">
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="tracking-tight">Explore</h1>
          <Sparkles className="h-5 w-5 text-neutral-500" />
        </div>
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
        <Tabs value={tab} onValueChange={setTab} className="mt-3">
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0">
            {[
              { v: "forYou", l: "For You" },
              { v: "trending", l: "Trending" },
              { v: "clubs", l: "Clubs" },
              { v: "people", l: "People" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="rounded-full px-3 py-1.5 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                {t.l}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div>
        {tab !== "people" && (
          <section>
            <div className="flex items-center gap-2 px-4 pt-4 text-neutral-500">
              <TrendingUp className="h-4 w-4" />
              <span>Trending on campus</span>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-2 sm:grid-cols-4">
              {trendingTopics.map((t) => (
                <button
                  key={t.tag}
                  className="rounded-2xl border border-neutral-200 px-3 py-2 text-left transition-colors hover:bg-neutral-50"
                >
                  <div className="truncate">{t.tag}</div>
                  <div className="truncate text-neutral-500">{t.posts}</div>
                </button>
              ))}
            </div>
          </section>
        )}

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
              <button className="text-neutral-500 hover:text-black">See all</button>
            </div>
            <div className="divide-y divide-neutral-100">
              {suggestions.slice(0, 4).map((s) => (
                <SuggestionRow key={s.id} s={s} />
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

      <button className="md:hidden fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg">
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
