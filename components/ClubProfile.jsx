"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import { PostCard } from "@/components/PostCard";
import { AddMembersModal } from "@/components/AddMembersFab";
import { MembersModal } from "@/components/ClubMembersModal";
import { PublishNewsLetter } from "@/components/PublishNewsLetter";
import {
    Users,
    UserPlus,
    Pencil,
    MapPin,
    Calendar,
    CheckCircle2,
    Info,
    Sparkles,
    Rocket,
    Target,
    Lightbulb,
    Handshake,
    MessageCircle,
    Newspaper,
    ArrowLeft,
    X,
    Clock,
    Ticket,
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
// --- Inline: Button ---

function Button({
    children,
    variant = "default",
    className = "",
    ...props
}) {
    const base = "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none disabled:opacity-50";
    const variants = {
        default: "bg-[#030213] text-white hover:bg-[#030213]/90",
        secondary: "bg-[#f0f0f3] text-[#030213] hover:bg-[#f0f0f3]/80",
        outline: "border border-[#0000001A] bg-[#ffffff] hover:bg-[#e9ebef] hover:text-[#0a0a0a]",
        ghost: "hover:bg-[#e9ebef] hover:text-[#0a0a0a]",
    };
    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}

// --- Inline: Badge ---
function Badge({
    children,
    variant = "default",
    className = "",
}) {
    const base = "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold";
    const variants = {
        default: "bg-[#030213] text-white",
        secondary: "bg-[#f0f0f3] text-[#030213]",
        outline: "border border-[#0000001A] text-[#0a0a0a]",
    };
    return <span className={`${base} ${variants[variant]} ${className}`}>{children}</span>;
}

// --- Inline: ImageWithFallback ---
function ImageWithFallback({
    src,
    alt,
    className = "",
}) {
    const [errored, setErrored] = useState(false);
    useEffect(() => setErrored(false), [src]);
    return !src || errored ? (
        <div className={`bg-[#ececf0] flex items-center justify-center text-[#717182] text-xs ${className}`}>
            {alt}
        </div>
    ) : (
        <img src={src} alt={alt} className={className} onError={() => setErrored(true)} />
    );
}


const TABS = [
    { key: "about", label: "About" },
    { key: "past", label: "Past Activities" },
    { key: "upcoming", label: "Upcoming Events" },
];

function SectionCard({
    title,
    icon: Icon,
    action,
    children,
}) {
    return (
        <section className="rounded-2xl border border-[#0000001A] bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">

                    <h3 className="text-[1.125rem] font-bold">{title}</h3>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function ClubPage() {
    const searchParams = useSearchParams();
    const [tab, setTab] = useState("about");
    const [lightbox, setLightbox] = useState(null);
    const [showAllLeaders, setShowAllLeaders] = useState(false);
    const [clubData, setClubData] = useState(null);
    const [clubPosts, setClubPosts] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [addMembersOpen, setAddMembersOpen] = useState(false);
    const [membersOpen, setMembersOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const clubId = searchParams.get("clubId");
        if (!clubId) return;

        let cancelled = false;
        const loadClubProfile = async () => {
            try {
                const [clubResponse, postsResponse, eventsResponse] = await Promise.all([
                    fetch(`/api/clubs/${clubId}`, { cache: "no-store" }),
                    fetch(`/api/posts?clubId=${clubId}`, { cache: "no-store" }),
                    fetch(`/api/forms/publics?clubId=${clubId}`, { cache: "no-store" }),
                ]);

                const [clubResult, postsResult, eventsResult] = await Promise.all([
                    clubResponse.json(),
                    postsResponse.json(),
                    eventsResponse.json(),
                ]);

                if (cancelled) return;
                setClubData(clubResponse.ok ? clubResult?.club || null : null);
                setClubPosts(postsResponse.ok && Array.isArray(postsResult?.posts) ? postsResult.posts : []);
                setUpcomingEvents(eventsResponse.ok && Array.isArray(eventsResult) ? eventsResult : []);
            } catch (error) {
                if (!cancelled) {
                    setClubData(null);
                    setClubPosts([]);
                    setUpcomingEvents([]);
                }
            }
        };

        loadClubProfile();
        return () => { cancelled = true; };
    }, [searchParams]);

    const club = {
        name: clubData?.clubName || "",
        category: clubData?.category || "",
        members: Number(clubData?.memberCount) || 0,
        founded: clubData?.foundedDate || "",
        location: clubData?.website || "",
        banner: clubData?.banner || "",
        logo: clubData?.logo || "",
        about: clubData?.description || "",
    };
    const whatWeDo = (clubData?.activities || [])
        .filter((activity) => !activity.date && !activity.formId)
        .map((activity) => ({ title: activity.title || "", desc: activity.description || "" }));
    const leadership = (clubData?.leaders || []).map((leader) => ({
        key: leader.userId || leader.email,
        id: typeof leader.email === "string" ? leader.email.split("@")[0] : "",
        name: leader.name || leader.email || "",
        role: leader.position || "",
        img: leader.image || "",
    }));
    const pastActivities = (clubData?.activities || [])
        .filter((activity) => activity.date || activity.formId)
        .map((activity, index) => ({
            id: `${activity.formId || activity.title || "activity"}-${index}`,
            title: activity.title || "",
            participants: Number(activity.participants) || 0,
            location: activity.location || "",
            desc: activity.description || "",
            images: Array.isArray(activity.images) ? activity.images : [],
        }));
    const upcoming = upcomingEvents.map((event, index) => ({
        id: event._id || `event-${index}`,
        title: event.title || "",
        date: event.date ? new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
        time: event.time || "",
        place: event.location || "",
        desc: event.description || "",
        img: event.image || event.clubId?.logo || "",
    }));
    const updatePost = (nextPost) => setClubPosts((current) => current.map((post) => (
        String(post.id || post._id) === String(nextPost.id || nextPost._id) ? nextPost : post
    )));
    const formatPostTime = (date) => date
        ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round((new Date(date) - Date.now()) / 86_400_000), "day")
        : "";
    const getImageGridClass = (count) => count === 1 ? "x-single-image" : count === 2 ? "image-grid count-2" : count === 3 ? "image-grid count-3" : "image-grid count-4";
    const handleAddMembers = async (emails) => {
        const clubId = searchParams.get("clubId");
        if (!clubId || !Array.isArray(emails) || emails.length === 0) return;

        try {
            const response = await fetch(`/api/clubs/${clubId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ members: emails }),
            });
            if (!response.ok) throw new Error("Failed to add members");

            const refreshedResponse = await fetch(`/api/clubs/${clubId}`, { cache: "no-store" });
            const refreshedData = await refreshedResponse.json();
            if (refreshedResponse.ok) setClubData(refreshedData?.club || null);
        } catch (error) {
            console.error("ADD MEMBERS ERROR:", error);
        }
    };
    const visibleLeaders = showAllLeaders ? leadership : leadership.slice(0, 4);

    return (
        <DashboardEventsShell>
            <div className="relative flex-1">
                <header
                    className="sticky top-0 z-50 -mx-4 mb-5 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
                    style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
                >
                    {/* Left */}
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
                                {club.name || "Club"}
                            </h1>

                            <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
                                {club.members.toLocaleString()} members
                            </p>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-1.5">
                        {/* Add Members */}
                        <div className="group relative">
                            <button
                                onClick={() => setAddMembersOpen(true)}
                                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                            >
                                <Icon
                                    icon="solar:user-plus-broken"
                                    className="text-[21px] text-[#171717]"
                                />
                            </button>

                            <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                                Add members
                            </div>
                        </div>

                        {/* Edit Club */}
                        <div className="group relative">
                            <button
                                onClick={() => {
                                    // edit
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                            >
                                <Icon
                                    icon="solar:pen-linear"
                                    className="text-[21px] text-[#171717]"
                                />
                            </button>

                            <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                                Edit club
                            </div>
                        </div>
                    </div>
                </header>
                <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:gap-6">

                    {/* Banner + identity */}


                    <article
                        style={{ maxWidth: "579.5px", boxShadow: "var(--shadow-card)" }}
                        className="relative w-full overflow-hidden rounded-[24px] bg-white ring-1 ring-[#0000000D] border border-[#0000001A] bg-white shadow-sm"

                    >
                        {/* Banner */}
                        <div className="relative h-[160px] w-full overflow-hidden bg-[#F2F2F2] sm:h-[200px]">
                            <ImageWithFallback
                                src={club.banner}
                                alt={`${club.name} banner`}
                                width={1600}
                                height={512}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                        </div>

                        {/* Body */}
                        <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
                            {/* Avatar */}
                            <div className="relative -mt-10 mb-4 flex items-end justify-between gap-3 sm:-mt-13 sm:mb-5">
                                <div className="rounded-full bg-[#fff] p-0.75 ring-1 ring-[#fff] sm:rounded-full">
                                    <ImageWithFallback
                                        src={club.logo}
                                        alt={club.name}
                                        width={512}
                                        height={512}
                                        className="h-[75px] w-[75px] rounded-full object-cover sm:h-[100px] sm:w-[100px] sm:rounded-full"
                                    />
                                </div>
                                <div className="mb-1 flex items-center gap-2">
                                    <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-[#E1E1E1] px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#666666] sm:h-8 sm:px-3 sm:text-[11px]">
                                        Invite only
                                    </span>
                                </div>
                            </div>

                            {/* Text */}
                            <div className="">
                                <h2
                                    className="text-[24px] font-medium leading-tight tracking-tight text-[#171717] sm:text-[28px]"
                                >
                                    {club.name}
                                </h2>
                                <p className="mt-1 text-sm text-[#666666]">{club.category}</p>
                            </div>

                            {/* Footer */}
                            <div className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Overlapping avatars */}
                                    <div className="flex -space-x-2">
                                        {leadership.slice(0, 3).map((leader, index) => (
                                            <div
                                                key={leader.key || index}
                                                className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-white"
                                            >
                                                <ImageWithFallback
                                                    src={leader.img}
                                                    alt={leader.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ))}

                                        {/* Show remaining count if there are more than 3 leaders */}
                                        {leadership.length > 3 && (
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[11px] font-semibold text-[#171717] ring-2 ring-white">
                                                +{leadership.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 leading-tight">
                                        <div className="text-[15px] font-semibold text-[#171717]">
                                            {club.members}
                                            <span className="ml-1 font-normal text-[#666666]">members</span>
                                        </div>
                                        <div className="text-[11px] uppercase tracking-[0.14em] text-[#666666]">
                                            Active community
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setMembersOpen(true)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#171717] px-5 py-2.5 text-sm font-medium text-[#FCFCFC] hover:bg-[#171717] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFFFF] sm:w-auto"
                                >

                                    See members

                                </button>
                            </div>
                        </div>
                    </article>






                    {/* Tabs */}
                    <div className="mx-auto mb-8 flex w-full max-w-[850px] gap-1 rounded-full border border-[#E1E1E1] bg-[#F3F3F3] p-1">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors ${tab === t.key
                                    ? "bg-[#030213] text-white"
                                    : "text-[#717182] hover:text-[#0a0a0a]"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ---------- ABOUT TAB ---------- */}
                    {tab === "about" && (
                        <div className="flex flex-col gap-4 sm:gap-6">
                            <SectionCard title="About" icon={Info}>
                                <p className="text-sm text-[#717182]">{club.about}</p>
                            </SectionCard>

                            <SectionCard title="What We Do" icon={Sparkles}>
                                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                    {whatWeDo.map(({ title, desc }, index) => (
                                        <div key={`${title}-${index}`} className="flex flex-col gap-1.5 rounded-xl border border-[#0000001A] bg-[#ffffff] p-3">

                                            <div className="text-sm text-[#0a0a0a]">{title}</div>
                                            <div className="hidden text-sm text-[#717182] sm:block">{desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>

                            <SectionCard title="Leadership Team" icon={Users}>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                    {visibleLeaders.map((m, index) => (
                                        <div key={`${m.key || m.id || "leader"}-${index}`} className="flex flex-col items-center gap-1.5 rounded-xl border border-[#0000001A] bg-[#ffffff] p-2.5 text-center">
                                            <div className="size-12 overflow-hidden rounded-full ring-2 ring-[#e9ebef]">
                                                <ImageWithFallback src={m.img} alt={m.name} className="size-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm text-[#0a0a0a]">{m.name}</div>
                                                <div className="truncate text-xs text-[#717182]">{m.role}</div>
                                                <div className="truncate text-xs text-[#717182]">{m.id}</div>
                                            </div>
                                            <button className="mt-0.5 w-full rounded-full bg-[#f0f0f3] px-2 py-1 text-xs text-[#030213] transition-colors hover:bg-[#e9ebef]">
                                                View Profile
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {leadership.length > 4 && (
                                    <button
                                        onClick={() => setShowAllLeaders((v) => !v)}
                                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#0000001A] bg-[#ffffff] py-2.5 text-sm text-[#717182] transition-colors hover:bg-[#e9ebef] hover:text-[#0a0a0a]"
                                    >
                                        {showAllLeaders ? "See less" : `See more (${leadership.length - 4})`}
                                    </button>
                                )}
                            </SectionCard>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-[1.125rem] font-bold">Recent Posts</h3>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {clubPosts.map((post, index) => (
                                        <PostCard
                                            key={post.id || post._id || `post-${index}`}
                                            post={post}
                                            variant="dashboard"
                                            formatTime={formatPostTime}
                                            imageGridClass={getImageGridClass}
                                            avatarFallback={() => club.logo || "/Defaultclublogo.svg"}
                                            onPostChange={updatePost}
                                        />
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ---------- PAST ACTIVITIES TAB ---------- */}
                    {tab === "past" && (
                        <div className="flex flex-col gap-4 sm:gap-6">
                            {pastActivities.map((a) => (
                                <SectionCard key={a.id} title={a.title} icon={Rocket}>
                                    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#717182]">
                                        <span className="flex items-center gap-1.5"><Icon icon="solar:user-linear" className="size-4" /> {a.participants} participants</span>
                                        <span className="flex items-center gap-1.5"><Icon icon="solar:map-point-linear" className="size-4" /> {a.location}</span>
                                    </div>
                                    <p className="mb-3 text-sm text-[#717182]">{a.desc}</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {a.images.slice(0, 4).map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setLightbox(img)}
                                                className="group aspect-square overflow-hidden rounded-lg border border-[#0000001A] bg-[#ececf0]"
                                            >
                                                <ImageWithFallback
                                                    src={img}
                                                    alt={`${a.title} ${i + 1}`}
                                                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </SectionCard>
                            ))}
                        </div>
                    )}

                    {/* ---------- UPCOMING EVENTS TAB ---------- */}
                    {tab === "upcoming" && (
                        <div className="flex flex-col gap-3">
                            {upcoming.map((e) => (
                                <div key={e.id} className="flex gap-3 rounded-2xl border border-[#0000001A] bg-white p-3 shadow-sm">
                                    <button
                                        onClick={() => setLightbox(e.img)}
                                        className="size-24 shrink-0 overflow-hidden rounded-xl bg-[#ececf0] sm:size-28"
                                    >
                                        <ImageWithFallback src={e.img} alt={e.title} className="size-full object-cover" />
                                    </button>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="truncate text-[#0a0a0a]">{e.title}</div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#717182]">
                                            <span className="flex items-center gap-1"><Icon icon="solar:calendar-linear" className="size-3.5" /> {e.date}</span>
                                            <span className="flex items-center gap-1"><Icon icon="solar:clock-circle-linear" className="size-3.5" /> {e.time}</span>
                                            <span className="flex items-center gap-1"><Icon icon="solar:map-point-linear" className="size-3.5" /> {e.place}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm text-[#717182]">{e.desc}</p>
                                        <div className="mt-auto flex gap-2 pt-2">
                                            <Button variant="secondary" className="h-8 flex-1 rounded-full px-3 text-xs">
                                                <Info className="size-3.5" /> Details
                                            </Button>
                                            <Button className="h-8 flex-1 rounded-full px-3 text-xs">
                                                <Ticket className="size-3.5" /> Apply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>

                <AddMembersModal
                    open={addMembersOpen}
                    onOpenChange={setAddMembersOpen}
                    onAdd={handleAddMembers}
                />
                <MembersModal
                    MemberModalopen={membersOpen}
                    onClose={() => setMembersOpen(false)}
                    clubData={clubData}
                />
                <PublishNewsLetter clubId={clubData?._id || searchParams.get("clubId") || ""} />

                {/* Lightbox */}
                {lightbox && (
                    <div
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            aria-label="Close"
                        >
                            <X className="size-5" />
                        </button>
                        <img
                            src={lightbox}
                            alt="Preview"
                            onClick={(ev) => ev.stopPropagation()}
                            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
                        />
                    </div>
                )}
            </div>
        </DashboardEventsShell>
    );
}
