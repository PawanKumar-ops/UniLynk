"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark } from "lucide-react";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { PostCard } from "@/components/PostCard";

const formatPostTime = (date) => date ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round((new Date(date) - Date.now()) / 86_400_000), "day") : "";
const getImageGridClass = (count) => count === 1 ? "x-single-image" : count === 2 ? "image-grid count-2" : count === 3 ? "image-grid count-3" : "image-grid count-4";

export function SavedPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/posts?audience=for-you&limit=50", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setPosts((data.posts || []).filter((post) => post.savedByCurrentUser)); })
      .catch(() => { if (!cancelled) setPosts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updatePost = (nextPost) => setPosts((current) => current.map((post) => post.id === nextPost.id ? nextPost : post).filter((post) => post.savedByCurrentUser));
  return (
    <DashboardEventsShell>

      <header
        className="sticky top-0 z-50 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <div
          className="flex items-center"
          style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <button
            onClick={() => router.back()}
            className="mr-6 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>

          <div>
  <h1 className="truncate text-[20px] font-bold leading-5 text-black">
    Saved posts
  </h1>

  <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
    {loading
      ? "Loading..."
      : `${posts.length} ${posts.length === 1 ? "saved post" : "saved posts"}`}
  </p>
</div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-[14px] py-5">
        <div className="flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading saved posts...
            </p>
          ) : posts.length ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                variant="dashboard"
                post={post}
                onPostChange={updatePost}
                onOpenPost={(id) => router.push(`/dashboard/post/${id}`)}
                onComment={(id) => router.push(`/dashboard/post/${id}`)}
                formatTime={formatPostTime}
                imageGridClass={getImageGridClass}
                avatarFallback={() => "/Profilepic.png"}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              <Bookmark className="mx-auto mb-3 size-6" />
              No saved posts yet.
            </div>
          )}
        </div>
      </div>
    </DashboardEventsShell>
  );
}
