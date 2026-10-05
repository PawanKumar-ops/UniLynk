"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark } from "lucide-react";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { PostCard } from "@/components/PostCard";
import { loreleiAvatar } from "@/lib/avatar";
import { Icon } from "@iconify/react";

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
            <div className="flex min-h-[420px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
            </div>
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
                avatarFallback={(_name, email) => loreleiAvatar(email)}
              />
            ))
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-4 text-center">
              <div className="mb-6 flex h-[220px] w-[280px] max-w-[80vw] items-center justify-center">
                <img
                  src="/illuistrations/noSavedposts.svg"
                  alt="No saved posts"
                  className="h-full w-full object-contain"
                />
              </div>

              <h3 className="text-[17px] font-bold tracking-[-0.01em]">
                No Saved Posts Yet
              </h3>

              <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-relaxed text-[#71717a]">
                Posts you save will appear here. Save posts you want to come back to later.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardEventsShell>
  );
}
