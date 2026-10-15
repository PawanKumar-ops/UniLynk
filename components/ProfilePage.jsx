"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import {
  ChevronDown, ArrowLeft, Pencil, Bookmark, MessageSquare,
  GraduationCap, CalendarDays, Layers, BookOpen,
  Trophy, Award, Medal, Star,
} from "lucide-react";
import { getSkillIcon } from "@/lib/skillIcons";
import ReliableImage from "@/components/ReliableImage";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { PostCard } from "@/components/PostCard";
import PollCard from "@/components/PollCard";
import CommentModal from "@/components/CommentModal";
import ShareModal from "@/components/ShareModal";
import { ReportPostModal } from "@/components/ReportPostModal";
import { DeleteModal } from "@/components/DeleteModal";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { loreleiAvatar } from "@/lib/avatar";
import { formatPostTime } from "@/lib/formatPostTime";

function Button({ variant = "default", className = "", children, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants = { default: "bg-[#030213] text-white hover:opacity-90", secondary: "bg-[#f0f0f3] text-[#030213] hover:bg-[#f0f0f3]/80", outline: "border border-[#0000001A] bg-[#fff] text-[#0a0a0a] hover:bg-[#e9ebef]" };
  return <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>{children}</button>;
}

function ImageWithFallback({ src, email, alt = "", className = "", ...props }) {
  return <ReliableImage src={src} fallbackSrc={loreleiAvatar(email)} alt={alt} className={className} {...props} />;
}

function SectionCard({ title, icon: IconComponent, children }) {
  return <section className="rounded-2xl border border-[#0000001A] bg-[#fff] p-5"><div className="mb-4 flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-[#e9ebef]"><IconComponent className="size-4 text-[#0a0a0a]" /></div><h3 className="text-[1.125rem] font-normal">{title}</h3></div>{children}</section>;
}

const achievementIcons = [Trophy, Medal, Star];
const achievementTints = ["bg-amber-100 text-amber-600", "bg-slate-100 text-slate-600", "bg-indigo-100 text-indigo-600", "bg-emerald-100 text-emerald-600", "bg-rose-100 text-rose-600"];
const socialIconByPlatform = {
  LinkedIn: "hugeicons:linkedin-02",
  Instagram: "hugeicons:instagram",
  GitHub: "ant-design:github-filled",
  Twitter: "proicons:x-twitter",
  Website: "solar:global-linear",
};
const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";
const socialUrl = (url) => /^https?:\/\//i.test(url || "") ? url : `https://${url}`;
const getImageGridClass = (count) => count === 1 ? "x-single-image" : count === 2 ? "image-grid count-2" : count === 3 ? "image-grid count-3" : "image-grid count-4";
const formatAuthorHandle = (email) => (email && typeof email === "string" ? `@${email.split("@")[0]}` : "");

export function ProfilePostCard(props) {
  return <PostCard {...props} variant="dashboard" formatTime={formatPostTime} imageGridClass={getImageGridClass} avatarFallback={(_name, email) => loreleiAvatar(email)} onComment={props.onOpenPost} />;
}

export function ProfilePage() {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams(); const { data: session, status } = useSession();
  const routeUserId = useMemo(() => searchParams.get("userId") || pathname?.match(/\/dashboard\/search\/id=(.+)$/)?.[1], [pathname, searchParams]);
  const [me, setMe] = useState(null); const [profile, setProfile] = useState(null); const [clubs, setClubs] = useState([]); const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);

  const isOwnProfile = !!me && !!profile && String(me._id) === String(profile._id);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const meRes = await fetch("/api/user/me", {
          cache: "no-store",
          headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
        });
        const meData = await meRes.json();
        if (!meRes.ok) throw new Error(meData.error || "Could not load profile");
        const targetRes = routeUserId
          ? await fetch(`/api/users/${encodeURIComponent(routeUserId)}`, {
            cache: "no-store",
            headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
          })
          : null;
        const targetData = targetRes ? await targetRes.json() : null;
        if (targetRes && !targetRes.ok) throw new Error(targetData.error || "Could not load profile");
        const active = targetData?.user || meData.user;
        const postsRes = await fetch("/api/posts?audience=for-you&limit=50", { cache: "no-store" });
        const postsData = await postsRes.json();
        const clubsRes = active?._id ? await fetch(`/api/users/${active._id}/clubs`, { cache: "no-store" }) : null;
        const clubsData = clubsRes?.ok ? await clubsRes.json() : { clubs: [] };
        if (!cancelled) {
          setMe(meData.user);
          setProfile(active);
          setPosts((postsData.posts || []).filter((post) => normalizeEmail(post.authorEmail) === normalizeEmail(active.email)));
          setClubs(clubsData.clubs || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeUserId, status]);
  const academic = [{ icon: GraduationCap, label: "Branch", value: profile?.branch || "Not available" }, { icon: CalendarDays, label: "Year", value: profile?.year || "Not available" }, { icon: Layers, label: "Batch", value: profile?.year ? "Current batch" : "Not available" }, { icon: BookOpen, label: "Semester", value: profile?.year || "Not available" }];
  const achievements = profile?.achievements || []; const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, 2);
  const updatePost = (next) => setPosts((current) => current.map((post) => post.id === next.id ? next : post));

  const handleOpenAuthorProfile = async (event, item) => {
    event?.stopPropagation?.();
    if (item?.postAs === "club" && item?.clubId) {
      router.push(`/dashboard/Club?clubId=${item.clubId}`);
      return;
    }
    let authorId =
      typeof item?.authorId === "string"
        ? item.authorId.trim()
        : typeof item?.author?._id === "string"
          ? item.author._id.trim()
          : "";

    if (!authorId && typeof item?.authorEmail === "string" && item.authorEmail.trim()) {
      try {
        const res = await fetch(`/api/user/lookup?email=${encodeURIComponent(item.authorEmail)}`);
        if (res.ok) {
          const data = await res.json();
          authorId = data.userId || "";
        }
      } catch (err) {
        console.error("Failed to lookup user by email:", err);
      }
    }

    if (!authorId) return;
    router.push(`/dashboard/Userprofile?userId=${authorId}`);
  };

  const handleLike = async (postId) => {
    if (!postId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const currentlyLiked = Boolean(post.likedByCurrentUser);
    const nextLiked = !currentlyLiked;
    const nextLikeCount = Math.max(0, Number(post.likeCount || 0) + (nextLiked ? 1 : -1));

    updatePost({ ...post, likedByCurrentUser: nextLiked, likeCount: nextLikeCount });

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: currentlyLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update like");
      updatePost({
        ...post,
        likedByCurrentUser: Boolean(data.likedByCurrentUser),
        likeCount: Number(data.likeCount ?? nextLikeCount),
      });
    } catch (err) {
      console.error(err);
      updatePost(post);
    }
  };

  const handleSave = async (postId) => {
    if (!postId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const wasSaved = Boolean(post.savedByCurrentUser);
    const optimisticSaved = !wasSaved;
    const optimisticCount = Math.max(0, Number(post.bookmarkCount || 0) + (optimisticSaved ? 1 : -1));

    updatePost({ ...post, savedByCurrentUser: optimisticSaved, bookmarkCount: optimisticCount });

    try {
      const res = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to save post");
      updatePost({
        ...post,
        savedByCurrentUser: Boolean(data.saved),
        bookmarkCount: Number(data.bookmarkCount ?? optimisticCount),
      });
    } catch (err) {
      console.error(err);
      updatePost(post);
    }
  };

  const handleCommentSubmit = async (postId, payload) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add comment");

      const targetPost = posts.find((p) => p.id === postId);
      if (targetPost) {
        updatePost({ ...targetPost, commentCount: Number(targetPost.commentCount || 0) + 1 });
      }
      setActivePostId(null);
    } catch (err) {
      console.error(err);
      alert("Could not publish comment");
    }
  };

  const handleDeletePost = async () => {
    if (!deletePost?.id) return;
    setIsDeletingPost(true);
    try {
      const res = await fetch(`/api/posts/${deletePost.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      setPosts((prev) => prev.filter((p) => p.id !== deletePost.id));
      setDeletePost(null);
    } catch (err) {
      console.error(err);
      alert("Could not delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handlePollChange = (postId, nextPoll) => {
    const post = posts.find((p) => p.id === postId);
    if (post) updatePost({ ...post, poll: nextPoll });
  };
  if (status === "loading" || loading) return <DashboardEventsShell><ProfileSkeleton /></DashboardEventsShell>;
  if (status !== "authenticated" || error || !profile) return <DashboardEventsShell><div className="p-6 text-sm text-[#717182]">{error || "Please log in to view this profile."}</div></DashboardEventsShell>;
  return <DashboardEventsShell>



    <header
      className="sticky top-0 z-50 flex h-[54px] w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
      style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
    >
      {/* Left */}
      <div
        className="flex items-center"
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <button
          onClick={() => router.back()}
          className="mr-6 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <div>
          <h1 className="truncate text-[20px] font-bold leading-5 text-black">
            {profile.name || "User"}
          </h1>

          <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {isOwnProfile ? (
          <>
            <div className="group relative">
              <button
                onClick={() => router.push("/dashboard/Userprofile/saved")}
                className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
              >
                <Icon
                  icon="solar:bookmark-linear"
                  className="text-[21px] text-[#171717]"
                />
              </button>

              <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                Saved posts
              </div>
            </div>

            {/* Edit Profile */}
            <div className="group relative">
              <button
                onClick={() => router.push("/dashboard/UserProfileEdit")}
                className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
              >
                <Icon
                  icon="solar:pen-linear"
                  className="text-[21px] text-[#171717]"
                />
              </button>

              <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                Edit profile
              </div>
            </div>
          </>
        ) : (
          <div className="group relative">
            <button
              onClick={() => router.push(`/dashboard/chat2/${profile._id}`)}
              className="flex h-9 gap-1 px-4 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
            >
              <Icon
                icon="solar:chat-line-linear"
                className="text-[21px] text-[#171717]"
              />Chat
            </button>

            <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
              Chat
            </div>
          </div>
        )}


      </div>
    </header>



    <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">

      <div className="mx-auto flex min-w-0 w-full max-w-3xl flex-col gap-4 px-2.5 sm:px-3.5 py-5 sm:gap-3">
        <article
          style={{ boxShadow: "var(--shadow-card)" }}
          className="relative w-full overflow-hidden rounded-[24px] border border-[#0000001A] bg-white "
        >
          {/* Banner */}
          <div className="relative h-[160px] w-full overflow-hidden bg-[#F2F2F2] sm:h-[200px]">
            <ReliableImage
              src={profile.banner && profile.banner.trim() ? profile.banner : "/Background.jpg"}
              fallbackSrc="/Background.jpg"
              alt={`${profile.name || "User"} banner`}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {/* Body */}
          <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">

            {/* Profile Picture + Passport */}
            <div className="relative -mt-10 mb-4 flex items-end justify-between gap-3 sm:-mt-13 sm:mb-5">
              <div className="rounded-full w-fit bg-white p-0.75 ring-1 ring-white">
                <ImageWithFallback
                  src={profile.img}
                  email={profile.email}
                  alt={profile.name}
                  width={512}
                  height={512}
                  className="h-[75px] w-[75px] rounded-full object-cover sm:h-[100px] sm:w-[100px]"
                />
              </div>
















{/* 
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard/passport"
                  )
                }
                className="mb-1 inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f0f0f3] px-4 text-[12px] font-medium tracking-[-0.01em] text-[#030213] transition-all duration-200 hover:bg-[#f0f0f3]/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 sm:h-10 sm:px-5 sm:text-sm"              >
                <Icon
                  icon="solar:document-text-linear"
                  className="size-4 sm:size-[17px]"
                />
                <span>View passport</span>
              </button> */}





















              
            </div>

            {/* User Information */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              {/* User Information */}
              <div>
                <h1 className="text-[24px] font-medium leading-tight tracking-tight text-[#171717] sm:text-[28px]">
                  {profile.name || "UniLynk User"}
                </h1>

                <p className="mt-1 text-sm text-[#666666]">
                  {profile.branch || "Not available"}
                  {profile.year && ` · ${profile.year}`}
                </p>
              </div>

              {/* Social Profiles */}
              {(profile.socials || []).length > 0 && (
                <div className="flex items-center gap-2">
                  {(profile.socials || []).map((social) => {
                    const socialIcon =
                      socialIconByPlatform[social.platform] || "solar:global-linear";

                    return (
                      <a
                        key={`${social.platform}-${social.url}`}
                        href={socialUrl(social.url)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.platform}
                        className="flex size-9 items-center justify-center rounded-full border border-[#0000001A] bg-white text-[#717182] transition-colors hover:bg-[#e9ebef] hover:text-[#0a0a0a]"
                      >
                        <Icon icon={socialIcon} className="size-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </article>
        <SectionCard title="Academic Information" icon={GraduationCap}><div className="grid grid-cols-2 gap-3">{academic.map(({ icon: AcademicIcon, label, value }) => <div key={label} className="rounded-xl border border-[#0000001A] bg-[#fff] p-3"><div className="flex items-center gap-1.5 text-sm text-[#717182]"><AcademicIcon className="size-3.5" /> {label}</div><div className="mt-1 text-[#0a0a0a]">{value}</div></div>)}</div></SectionCard>
        <SectionCard title="Skills" icon={Layers}><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(profile.skills || []).map((skill) => <div key={skill} className="flex flex-col items-center gap-2.5 rounded-xl border border-[#0000001A] bg-[#fff] p-4 transition-shadow hover:shadow-md"><span className="flex size-12 items-center justify-center rounded-xl"><Icon icon={getSkillIcon(skill)} className="size-9" /></span><span className="text-sm text-[#0a0a0a]">{skill}</span></div>)}</div></SectionCard>
        <SectionCard title="Clubs" icon={BookOpen}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{clubs.map((club) => <div key={club._id} className="flex items-center gap-3 rounded-2xl border border-[#0000001A] bg-[#fff] p-3 transition-shadow hover:shadow-md"><div className="size-12 shrink-0 overflow-hidden rounded-xl"><ImageWithFallback src={club.logo} alt={club.clubName} className="size-full object-cover" /></div><div className="min-w-0 flex-1"><div className="truncate text-[#0a0a0a]">{club.clubName}</div><div className="truncate text-sm text-[#717182]">{club.position || "Member"}</div></div><Button variant="secondary" onClick={() => router.push(`/dashboard/Club?clubId=${club._id}`)} className="shrink-0 rounded-full">Visit</Button></div>)}</div></SectionCard>
        <SectionCard title="Achievements" icon={Award}><div className="flex flex-col gap-3">{visibleAchievements.map((achievement, index) => { const AchievementIcon = achievementIcons[index % achievementIcons.length]; return <div key={achievement._id || `${achievement.title}-${index}`} className="flex items-start gap-3 rounded-xl border border-[#0000001A] bg-[#fff] p-3 transition-shadow hover:shadow-md sm:items-center sm:gap-4 sm:p-4"><div className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${achievementTints[index % achievementTints.length]}`}><AchievementIcon className="size-5" /></div><div className="min-w-0 flex-1"><div className="text-[#0a0a0a]">{achievement.title}</div><div className="text-sm text-[#717182]">{achievement.description}</div><div className="mt-1 text-xs text-[#717182] sm:hidden">{achievement.date}</div></div><div className="hidden shrink-0 text-sm text-[#717182] sm:block">{achievement.date}</div></div>; })}</div>{achievements.length > 2 && <button onClick={() => setShowAllAchievements((value) => !value)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#0000001A] bg-[#fff] py-2.5 text-sm text-[#717182] transition-colors hover:bg-[#e9ebef] hover:text-[#0a0a0a]">{showAllAchievements ? "See less" : `See more (${achievements.length - 2})`}<ChevronDown className={`size-4 transition-transform ${showAllAchievements ? "rotate-180" : ""}`} /></button>}</SectionCard>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[1.125rem] font-bold">Recent Posts</h3>
          </div>

          <div className="space-y-4">
            {posts.map((post) => {
              const canDelete = Boolean(me && (post.authorId === me._id || normalizeEmail(post.authorEmail) === normalizeEmail(me.email)));
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  variant="dashboard"
                  formatTime={formatPostTime}
                  formatHandle={formatAuthorHandle}
                  imageGridClass={getImageGridClass}
                  avatarFallback={(_name, email) => loreleiAvatar(email)}
                  onOpenPost={(id) => router.push(`/dashboard/post/${id}`)}
                  onOpenAuthor={handleOpenAuthorProfile}
                  onToggleMenu={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
                  menuOpen={menuPostId === post.id}
                  onReport={(id) => { setMenuPostId(null); setReportPostId(id); }}
                  onDelete={(p) => { setMenuPostId(null); setDeletePost(p); }}
                  canDelete={canDelete}
                  onLike={handleLike}
                  onComment={(id) => setActivePostId(id)}
                  onShare={(p) => { setMenuPostId(null); setSharePost(p); setOpenShare(true); }}
                  onSave={handleSave}
                  pollContent={post.poll && <PollCard postId={post.id} poll={post.poll} onPollChange={(nextPoll) => handlePollChange(post.id, nextPoll)} />}
                />
              );
            })}

            {posts.length === 0 && (
              <div className="rounded-2xl border border-[#0000001A] bg-white p-8 text-center text-sm text-[#717182]">
                No posts yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <CommentModal
      isOpen={Boolean(activePostId)}
      onClose={() => setActivePostId(null)}
      onSubmit={(payload) => {
        if (!activePostId) return;
        handleCommentSubmit(activePostId, payload);
      }}
      currentUser={session?.user}
    />

    <ShareModal
      isOpen={openShare}
      post={sharePost}
      onClose={() => {
        setOpenShare(false);
        setSharePost(null);
      }}
    />

    <ReportPostModal
      isOpen={Boolean(reportPostId)}
      postId={reportPostId}
      onClose={() => setReportPostId(null)}
    />

    <DeleteModal
      open={Boolean(deletePost)}
      onOpenChange={(open) => {
        if (!open && !isDeletingPost) setDeletePost(null);
      }}
      onDelete={handleDeletePost}
      isDeleting={isDeletingPost}
    />
  </DashboardEventsShell>;
}
