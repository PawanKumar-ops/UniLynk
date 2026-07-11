"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import {
  ChevronDown, ArrowLeft, Pencil, Bookmark, MessageSquare, Github, Linkedin,
  Twitter, Instagram, Globe, GraduationCap, CalendarDays, Layers, BookOpen,
  Trophy, Award, Medal, Star,
} from "lucide-react";
import { getSkillIcon } from "@/lib/skillIcons";
import ReliableImage from "@/components/ReliableImage";
import ProfileEditModal from "@/components/ProfileEditModal";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { PostCard } from "@/components/PostCard";

function Button({ variant = "default", className = "", children, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants = { default: "bg-[#030213] text-white hover:opacity-90", secondary: "bg-[#f0f0f3] text-[#030213] hover:bg-[#f0f0f3]/80", outline: "border border-[#0000001A] bg-[#fff] text-[#0a0a0a] hover:bg-[#e9ebef]" };
  return <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>{children}</button>;
}

function ImageWithFallback({ src, alt = "", className = "", ...props }) {
  return <ReliableImage src={src} fallbackSrc="/Profilepic.png" alt={alt} className={className} {...props} />;
}

function SectionCard({ title, icon: IconComponent, children }) {
  return <section className="rounded-2xl border border-[#0000001A] bg-[#fff] p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-[#e9ebef]"><IconComponent className="size-4 text-[#0a0a0a]" /></div><h3>{title}</h3></div>{children}</section>;
}

const achievementIcons = [Trophy, Medal, Star];
const achievementTints = ["bg-amber-100 text-amber-600", "bg-slate-100 text-slate-600", "bg-indigo-100 text-indigo-600", "bg-emerald-100 text-emerald-600", "bg-rose-100 text-rose-600"];
const socialIconByPlatform = { GitHub: Github, LinkedIn: Linkedin, Twitter, Instagram, Website: Globe };
const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";
const socialUrl = (url) => /^https?:\/\//i.test(url || "") ? url : `https://${url}`;
const formatPostTime = (date) => date ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round((new Date(date) - Date.now()) / 86_400_000), "day") : "";
const getImageGridClass = (count) => count === 1 ? "x-single-image" : count === 2 ? "image-grid count-2" : count === 3 ? "image-grid count-3" : "image-grid count-4";

export function ProfilePostCard(props) {
  return <PostCard {...props} variant="dashboard" formatTime={formatPostTime} imageGridClass={getImageGridClass} avatarFallback={() => "/Profilepic.png"} onComment={props.onOpenPost} />;
}

export function ProfilePage() {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams(); const { status } = useSession();
  const routeUserId = useMemo(() => searchParams.get("userId") || pathname?.match(/\/dashboard\/search\/id=(.+)$/)?.[1], [pathname, searchParams]);
  const [me, setMe] = useState(null); const [profile, setProfile] = useState(null); const [clubs, setClubs] = useState([]); const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [editing, setEditing] = useState(false); const [showAllAchievements, setShowAllAchievements] = useState(false);
  const isOwnProfile = !!me && !!profile && String(me._id) === String(profile._id);

  useEffect(() => { if (status !== "authenticated") return; let cancelled = false; (async () => { try { setLoading(true); const meRes = await fetch("/api/user/me", { cache: "no-store" }); const meData = await meRes.json(); if (!meRes.ok) throw new Error(meData.error || "Could not load profile"); const targetRes = routeUserId ? await fetch(`/api/users/${encodeURIComponent(routeUserId)}`, { cache: "no-store" }) : null; const targetData = targetRes ? await targetRes.json() : null; if (targetRes && !targetRes.ok) throw new Error(targetData.error || "Could not load profile"); const active = targetData?.user || meData.user; const postsRes = await fetch("/api/posts?audience=for-you&limit=50", { cache: "no-store" }); const postsData = await postsRes.json(); const clubsRes = active?._id ? await fetch(`/api/users/${active._id}/clubs`, { cache: "no-store" }) : null; const clubsData = clubsRes?.ok ? await clubsRes.json() : { clubs: [] }; if (!cancelled) { setMe(meData.user); setProfile(active); setPosts((postsData.posts || []).filter((post) => normalizeEmail(post.authorEmail) === normalizeEmail(active.email))); setClubs(clubsData.clubs || []); } } catch (e) { if (!cancelled) setError(e.message || "Could not load profile"); } finally { if (!cancelled) setLoading(false); } })(); return () => { cancelled = true; }; }, [routeUserId, status]);
  const academic = [{ icon: GraduationCap, label: "Branch", value: profile?.branch || "Not available" }, { icon: CalendarDays, label: "Year", value: profile?.year || "Not available" }, { icon: Layers, label: "Batch", value: profile?.year ? "Current batch" : "Not available" }, { icon: BookOpen, label: "Semester", value: profile?.year || "Not available" }];
  const achievements = profile?.achievements || []; const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, 2);
  const updatePost = (next) => setPosts((current) => current.map((post) => post.id === next.id ? next : post));
  const updatedProfile = (user) => { setMe(user); setProfile((current) => String(current?._id) === String(user._id) ? user : current); };
  if (status === "loading" || loading) return <DashboardEventsShell><div className="p-6 text-sm text-[#717182]">Loading profile...</div></DashboardEventsShell>;
  if (status !== "authenticated" || error || !profile) return <DashboardEventsShell><div className="p-6 text-sm text-[#717182]">{error || "Please log in to view this profile."}</div></DashboardEventsShell>;
  return <DashboardEventsShell><div className="flex-1 overflow-y-auto">
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#0000001A] bg-white/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4"><button onClick={() => router.back()} className="flex shrink-0 items-center gap-2 text-[#717182] transition-colors hover:text-[#0a0a0a]"><ArrowLeft className="size-4" /><span className="hidden sm:inline">Back to Explore</span></button><div className="flex gap-2">{isOwnProfile ? <><Button variant="secondary" onClick={() => router.push("/dashboard/Userprofile/saved")} className="rounded-full px-3 sm:px-4"><Bookmark className="size-4" /><span className="hidden sm:inline">Saved Posts</span></Button><Button onClick={() => setEditing(true)} className="rounded-full px-3 sm:px-4"><Pencil className="size-4" /><span className="hidden sm:inline">Edit Profile</span></Button></> : <Button onClick={() => router.push(`/dashboard/chat2/${profile._id}`)} className="rounded-full px-3 sm:px-4"><MessageSquare className="size-4" /><span className="hidden sm:inline">Message</span></Button>}</div></div>
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-[14px] py-5 sm:gap-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#0000001A] bg-[#fff] p-6 text-center shadow-sm sm:flex-row sm:items-start sm:text-left"><div className="size-24 shrink-0 overflow-hidden rounded-full ring-2 ring-[#e9ebef]"><ImageWithFallback src={profile.img} alt={profile.name} className="size-full object-cover" /></div><div className="flex flex-1 flex-col items-center gap-1 sm:items-start"><h1>{profile.name || "UniLynk User"}</h1><div className="text-[#717182]">{profile.branch || "Not available"} · {profile.year || "Not available"}</div><div className="mt-3 flex gap-2">{(profile.socials || []).map((social) => { const SocialIcon = socialIconByPlatform[social.platform] || Globe; return <a key={`${social.platform}-${social.url}`} href={socialUrl(social.url)} target="_blank" rel="noreferrer" aria-label={social.platform} className="flex size-9 items-center justify-center rounded-full border border-[#0000001A] bg-[#fff] text-[#717182] transition-colors hover:bg-[#e9ebef] hover:text-[#0a0a0a]"><SocialIcon className="size-4" /></a>; })}</div></div></div>
      <SectionCard title="Academic Information" icon={GraduationCap}><div className="grid grid-cols-2 gap-3">{academic.map(({ icon: AcademicIcon, label, value }) => <div key={label} className="rounded-xl border border-[#0000001A] bg-[#fff] p-3"><div className="flex items-center gap-1.5 text-sm text-[#717182]"><AcademicIcon className="size-3.5" /> {label}</div><div className="mt-1 text-[#0a0a0a]">{value}</div></div>)}</div></SectionCard>
      <SectionCard title="Skills" icon={Layers}><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(profile.skills || []).map((skill) => <div key={skill} className="flex flex-col items-center gap-2.5 rounded-xl border border-[#0000001A] bg-[#fff] p-4 transition-shadow hover:shadow-md"><span className="flex size-12 items-center justify-center rounded-xl"><Icon icon={getSkillIcon(skill)} className="size-9" /></span><span className="text-sm text-[#0a0a0a]">{skill}</span></div>)}</div></SectionCard>
      <SectionCard title="Clubs" icon={BookOpen}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{clubs.map((club) => <div key={club._id} className="flex items-center gap-3 rounded-2xl border border-[#0000001A] bg-[#fff] p-3 transition-shadow hover:shadow-md"><div className="size-12 shrink-0 overflow-hidden rounded-xl"><ImageWithFallback src={club.logo} alt={club.clubName} className="size-full object-cover" /></div><div className="min-w-0 flex-1"><div className="truncate text-[#0a0a0a]">{club.clubName}</div><div className="truncate text-sm text-[#717182]">{club.position || "Member"}</div></div><Button variant="secondary" onClick={() => router.push(`/Club?clubId=${club._id}`)} className="shrink-0 rounded-full">Visit</Button></div>)}</div></SectionCard>
      <SectionCard title="Achievements" icon={Award}><div className="flex flex-col gap-3">{visibleAchievements.map((achievement, index) => { const AchievementIcon = achievementIcons[index % achievementIcons.length]; return <div key={achievement._id || `${achievement.title}-${index}`} className="flex items-start gap-3 rounded-xl border border-[#0000001A] bg-[#fff] p-3 transition-shadow hover:shadow-md sm:items-center sm:gap-4 sm:p-4"><div className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${achievementTints[index % achievementTints.length]}`}><AchievementIcon className="size-5" /></div><div className="min-w-0 flex-1"><div className="text-[#0a0a0a]">{achievement.title}</div><div className="text-sm text-[#717182]">{achievement.description}</div><div className="mt-1 text-xs text-[#717182] sm:hidden">{achievement.date}</div></div><div className="hidden shrink-0 text-sm text-[#717182] sm:block">{achievement.date}</div></div>; })}</div>{achievements.length > 2 && <button onClick={() => setShowAllAchievements((value) => !value)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#0000001A] bg-[#fff] py-2.5 text-sm text-[#717182] transition-colors hover:bg-[#e9ebef] hover:text-[#0a0a0a]">{showAllAchievements ? "See less" : `See more (${achievements.length - 2})`}<ChevronDown className={`size-4 transition-transform ${showAllAchievements ? "rotate-180" : ""}`} /></button>}</SectionCard>
      <div className="mt-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-[1.125rem] font-bold">Recent Posts</h3>
  </div>

  <div className="space-y-4">
    {posts.map((post) => (
      <ProfilePostCard
        key={post.id}
        post={post}
        onPostChange={updatePost}
        onOpenPost={(id) => router.push(`/dashboard/post/${id}`)}
      />
    ))}

    {posts.length === 0 && (
      <div className="rounded-2xl border border-[#0000001A] bg-white p-8 text-center text-sm text-[#717182]">
        No posts yet.
      </div>
    )}
  </div>
</div>
    </div>{editing && <ProfileEditModal user={me} onSave={updatedProfile} onClose={() => setEditing(false)} />}
  </div></DashboardEventsShell>;
}
