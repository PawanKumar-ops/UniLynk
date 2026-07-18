"use client";

import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
    Search,
    Mail,
    Users,
    ChevronDown,
    MoreHorizontal,
    MailPlus,
    ArrowLeft,
    Plus,
    Megaphone,
} from "lucide-react";
import { Icon } from "@iconify/react";

import { NewMessageModal, DotsMenu } from "@/components/chat/chat-ui";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { cn } from "@/lib/utils";

const lightTheme = {
    "--radius": "0.625rem",
    "--radius-sm": "calc(0.625rem - 4px)",
    "--radius-md": "calc(0.625rem - 2px)",
    "--radius-lg": "0.625rem",
    "--radius-xl": "calc(0.625rem + 4px)",
    "--radius-2xl": "calc(0.625rem + 8px)",
    "--radius-3xl": "calc(0.625rem + 12px)",
    "--radius-4xl": "calc(0.625rem + 16px)",

    "--background": "oklch(1 0 0)",
    "--color-background": "oklch(1 0 0)",

    "--foreground": "oklch(0.129 0.042 264.695)",
    "--color-foreground": "oklch(0.129 0.042 264.695)",

    "--card": "oklch(1 0 0)",
    "--color-card": "oklch(1 0 0)",

    "--card-foreground": "oklch(0.129 0.042 264.695)",
    "--color-card-foreground": "oklch(0.129 0.042 264.695)",

    "--popover": "oklch(1 0 0)",
    "--color-popover": "oklch(1 0 0)",

    "--popover-foreground": "oklch(0.129 0.042 264.695)",
    "--color-popover-foreground": "oklch(0.129 0.042 264.695)",

    "--primary": "oklch(0.208 0.042 265.755)",
    "--color-primary": "oklch(0.208 0.042 265.755)",

    "--primary-foreground": "oklch(0.984 0.003 247.858)",
    "--color-primary-foreground": "oklch(0.984 0.003 247.858)",

    "--secondary": "oklch(0.968 0.007 247.896)",
    "--color-secondary": "oklch(0.968 0.007 247.896)",

    "--secondary-foreground": "oklch(0.208 0.042 265.755)",
    "--color-secondary-foreground": "oklch(0.208 0.042 265.755)",

    "--muted": "oklch(0.968 0.007 247.896)",
    "--color-muted": "oklch(0.968 0.007 247.896)",

    "--muted-foreground": "oklch(0.554 0.046 257.417)",
    "--color-muted-foreground": "oklch(0.554 0.046 257.417)",

    "--accent": "oklch(0.968 0.007 247.896)",
    "--color-accent": "oklch(0.968 0.007 247.896)",

    "--accent-foreground": "oklch(0.208 0.042 265.755)",
    "--color-accent-foreground": "oklch(0.208 0.042 265.755)",

    "--destructive": "oklch(0.577 0.245 27.325)",
    "--color-destructive": "oklch(0.577 0.245 27.325)",

    "--destructive-foreground": "oklch(0.984 0.003 247.858)",
    "--color-destructive-foreground": "oklch(0.984 0.003 247.858)",

    "--border": "oklch(0.929 0.013 255.508)",
    "--color-border": "oklch(0.929 0.013 255.508)",

    "--input": "oklch(0.929 0.013 255.508)",
    "--color-input": "oklch(0.929 0.013 255.508)",

    "--ring": "oklch(0.704 0.04 256.788)",
    "--color-ring": "oklch(0.704 0.04 256.788)",

    "--chart-1": "oklch(0.646 0.222 41.116)",
    "--color-chart-1": "oklch(0.646 0.222 41.116)",

    "--chart-2": "oklch(0.6 0.118 184.704)",
    "--color-chart-2": "oklch(0.6 0.118 184.704)",

    "--chart-3": "oklch(0.398 0.07 227.392)",
    "--color-chart-3": "oklch(0.398 0.07 227.392)",

    "--chart-4": "oklch(0.828 0.189 84.429)",
    "--color-chart-4": "oklch(0.828 0.189 84.429)",

    "--chart-5": "oklch(0.769 0.188 70.08)",
    "--color-chart-5": "oklch(0.769 0.188 70.08)",

    "--sidebar": "oklch(0.984 0.003 247.858)",
    "--color-sidebar": "oklch(0.984 0.003 247.858)",

    "--sidebar-foreground": "oklch(0.129 0.042 264.695)",
    "--color-sidebar-foreground": "oklch(0.129 0.042 264.695)",

    "--sidebar-primary": "oklch(0.208 0.042 265.755)",
    "--color-sidebar-primary": "oklch(0.208 0.042 265.755)",

    "--sidebar-primary-foreground": "oklch(0.984 0.003 247.858)",
    "--color-sidebar-primary-foreground": "oklch(0.984 0.003 247.858)",

    "--sidebar-accent": "oklch(0.968 0.007 247.896)",
    "--color-sidebar-accent": "oklch(0.968 0.007 247.896)",

    "--sidebar-accent-foreground": "oklch(0.208 0.042 265.755)",
    "--color-sidebar-accent-foreground": "oklch(0.208 0.042 265.755)",

    "--sidebar-border": "oklch(0.929 0.013 255.508)",
    "--color-sidebar-border": "oklch(0.929 0.013 255.508)",

    "--sidebar-ring": "oklch(0.704 0.04 256.788)",
    "--color-sidebar-ring": "oklch(0.704 0.04 256.788)",
};

const darkTheme = {
    "--radius": "0.625rem",
    "--radius-sm": "calc(0.625rem - 4px)",
    "--radius-md": "calc(0.625rem - 2px)",
    "--radius-lg": "0.625rem",
    "--radius-xl": "calc(0.625rem + 4px)",
    "--radius-2xl": "calc(0.625rem + 8px)",
    "--radius-3xl": "calc(0.625rem + 12px)",
    "--radius-4xl": "calc(0.625rem + 16px)",

    "--background": "oklch(0.129 0.042 264.695)",
    "--color-background": "oklch(0.129 0.042 264.695)",

    "--foreground": "oklch(0.984 0.003 247.858)",
    "--color-foreground": "oklch(0.984 0.003 247.858)",

    "--card": "oklch(0.208 0.042 265.755)",
    "--color-card": "oklch(0.208 0.042 265.755)",

    "--card-foreground": "oklch(0.984 0.003 247.858)",
    "--color-card-foreground": "oklch(0.984 0.003 247.858)",

    "--popover": "oklch(0.208 0.042 265.755)",
    "--color-popover": "oklch(0.208 0.042 265.755)",

    "--popover-foreground": "oklch(0.984 0.003 247.858)",
    "--color-popover-foreground": "oklch(0.984 0.003 247.858)",

    "--primary": "oklch(0.929 0.013 255.508)",
    "--color-primary": "oklch(0.929 0.013 255.508)",

    "--primary-foreground": "oklch(0.208 0.042 265.755)",
    "--color-primary-foreground": "oklch(0.208 0.042 265.755)",

    "--secondary": "oklch(0.279 0.041 260.031)",
    "--color-secondary": "oklch(0.279 0.041 260.031)",

    "--secondary-foreground": "oklch(0.984 0.003 247.858)",
    "--color-secondary-foreground": "oklch(0.984 0.003 247.858)",

    "--muted": "oklch(0.279 0.041 260.031)",
    "--color-muted": "oklch(0.279 0.041 260.031)",

    "--muted-foreground": "oklch(0.704 0.04 256.788)",
    "--color-muted-foreground": "oklch(0.704 0.04 256.788)",

    "--accent": "oklch(0.279 0.041 260.031)",
    "--color-accent": "oklch(0.279 0.041 260.031)",

    "--accent-foreground": "oklch(0.984 0.003 247.858)",
    "--color-accent-foreground": "oklch(0.984 0.003 247.858)",

    "--destructive": "oklch(0.704 0.191 22.216)",
    "--color-destructive": "oklch(0.704 0.191 22.216)",

    "--destructive-foreground": "oklch(0.984 0.003 247.858)",
    "--color-destructive-foreground": "oklch(0.984 0.003 247.858)",

    "--border": "oklch(1 0 0 / 10%)",
    "--color-border": "oklch(1 0 0 / 10%)",

    "--input": "oklch(1 0 0 / 15%)",
    "--color-input": "oklch(1 0 0 / 15%)",

    "--ring": "oklch(0.551 0.027 264.364)",
    "--color-ring": "oklch(0.551 0.027 264.364)",

    "--chart-1": "oklch(0.488 0.243 264.376)",
    "--color-chart-1": "oklch(0.488 0.243 264.376)",

    "--chart-2": "oklch(0.696 0.17 162.48)",
    "--color-chart-2": "oklch(0.696 0.17 162.48)",

    "--chart-3": "oklch(0.769 0.188 70.08)",
    "--color-chart-3": "oklch(0.769 0.188 70.08)",

    "--chart-4": "oklch(0.627 0.265 303.9)",
    "--color-chart-4": "oklch(0.627 0.265 303.9)",

    "--chart-5": "oklch(0.645 0.246 16.439)",
    "--color-chart-5": "oklch(0.645 0.246 16.439)",

    "--sidebar": "oklch(0.208 0.042 265.755)",
    "--color-sidebar": "oklch(0.208 0.042 265.755)",

    "--sidebar-foreground": "oklch(0.984 0.003 247.858)",
    "--color-sidebar-foreground": "oklch(0.984 0.003 247.858)",

    "--sidebar-primary": "oklch(0.488 0.243 264.376)",
    "--color-sidebar-primary": "oklch(0.488 0.243 264.376)",

    "--sidebar-primary-foreground": "oklch(0.984 0.003 247.858)",
    "--color-sidebar-primary-foreground": "oklch(0.984 0.003 247.858)",

    "--sidebar-accent": "oklch(0.279 0.041 260.031)",
    "--color-sidebar-accent": "oklch(0.279 0.041 260.031)",

    "--sidebar-accent-foreground": "oklch(0.984 0.003 247.858)",
    "--color-sidebar-accent-foreground": "oklch(0.984 0.003 247.858)",

    "--sidebar-border": "oklch(1 0 0 / 10%)",
    "--color-sidebar-border": "oklch(1 0 0 / 10%)",

    "--sidebar-ring": "oklch(0.551 0.027 264.364)",
    "--color-sidebar-ring": "oklch(0.551 0.027 264.364)",
};

function useDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));

        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
}

export default function MessagesLayout({ children }) {
    const [tab, setTab] = useState("chat");
    const [filter, setFilter] = useState("all");
    const [showFilter, setShowFilter] = useState(false);
    const [newMsg, setNewMsg] = useState(false);
    const [q, setQ] = useState("");

    // ---- Community / groups state (WhatsApp-style) ----
    const [openCommunity, setOpenCommunity] = useState(null); // the community object whose groups are shown
    const [users, setUsers] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [chatConversations, setChatConversations] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [newGroup, setNewGroup] = useState(false);

    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const isChatRoot = pathname === "/dashboard/chat2" || pathname === "/dashboard/chat2/";
    const isRequestsRoute = pathname === "/dashboard/chat2/requests" || pathname.startsWith("/dashboard/chat2/requests/");
    const showSidebar = !isRequestsRoute;
    const showMainContent = isRequestsRoute || !isChatRoot;
    const isDark = useDarkMode();

    useEffect(() => {
        async function loadSidebarData() {
            const [usersRes, communitiesRes] = await Promise.all([
                fetch("/api/chat/users", { cache: "no-store" }),
                fetch("/api/communities", { cache: "no-store" }),
            ]);
            const usersData = await usersRes.json();
            const communitiesData = await communitiesRes.json();
            if (usersRes.ok) {
                setUsers(usersData.users || []);
                setChatConversations(usersData.conversations || []);
            }
            if (communitiesRes.ok) setCommunities(communitiesData.communities || []);
        }
        async function loadRequestCount() {
            const res = await fetch("/api/chat/requests", { cache: "no-store" });
            const data = await res.json();
            if (res.ok) setRequestCount(data.count || 0);
        }
        loadSidebarData().catch(console.error);
        loadRequestCount().catch(console.error);
    }, []);

    const conversations = useMemo(() => chatConversations.map((user) => ({
        id: user.id,
        user: { id: user.id, name: user.name || user.email || "UniLynk User", handle: user.email?.split("@")[0] || "user", avatar: user.image || "/Profilepic.png", verified: false },
        preview: user.lastMessage || user.email || "Start a conversation",
        time: "",
        unread: user.unreadCount || 0,
    })), [chatConversations]);

    const filtered = conversations.filter((c) => {
        if (filter === "unread" && !c.unread) return false;
        if (!q) return true;
        return c.user.name.toLowerCase().includes(q.toLowerCase()) || c.user.handle.toLowerCase().includes(q.toLowerCase());
    });

    // Return the groups for a community, always including a default Announcement group.
    const getGroups = (community) => {
        return community.groups || [];
    };

    const handleCreateGroup = (group) => {
        if (!openCommunity) return;

        const normalizedGroup = {
            id: `${(group?.name || "group").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group"}-${Date.now()}`,
            name: group?.name || "New group",
            image: group?.image || null,
            color: group?.image ? null : "#1d9bf0",
            gradient: null,
            cover: group?.image || null,
            preview: "Group created · say hi 👋",
            time: "now",
            members: 1,
            messages: [],
            description: group?.name || "New group",
        };

        setCommunities((prev) => prev.map((community) => community.id === openCommunity.id ? { ...community, groups: [...(community.groups || []), normalizedGroup] } : community));
    };

    const groups = openCommunity ? (openCommunity.groups || []).filter((g) => !q || g.name.toLowerCase().includes(q.toLowerCase())) : [];

    return (
        <div
            className="chat2-theme flex h-screen min-h-0 overflow-hidden bg-white text-black"
            style={isDark ? darkTheme : lightTheme}
        >
            <style>{`
        .chat2-theme :where(*):not(.active-border) {
  border-color: var(--color-border);
}
      `}</style>

            {/* Main chat area on LEFT (desktop) / full screen when inChat (mobile) */}
            <main
                className={cn(
                    "flex min-h-0 flex-1 flex-col border-r min-w-0",
                    showMainContent ? "flex" : "hidden md:flex",
                )}
            >
                {children}
            </main>

            {/* Sidebar on RIGHT (desktop) / full screen when not inChat (mobile) */}
            {/* Sidebar on RIGHT (desktop) / full screen when not inChat (mobile) */}
            <aside
                className={cn(
                    "flex min-h-0 flex-col border-l bg-white w-full md:w-[380px]",
                    showSidebar
                        ? showMainContent
                            // Chat is open — hide sidebar on mobile, show on desktop
                            ? "hidden md:flex"
                            // At root — show sidebar full screen on mobile
                            : "flex"
                        // Requests page — always hide
                        : "hidden",
                )}
            >
                {/* ---------- GROUPS VIEW (a community is opened) ---------- */}
                {tab === "communities" && openCommunity ? (
                    <>
                        {/* Group header with community identity + back */}
                        <header className="flex items-center gap-3 px-3 py-3"
                            style={{
                                display: "flex",
                                flexDirection: "row",
                            }}>
                            <button
                                onClick={() => {
                                    setOpenCommunity(null);
                                    setQ("");
                                }}
                                className="rounded-full p-2 hover:bg-[#f2f6fa]"
                                title="Back to communities"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f2f6fa]">
                                <img
                                    src={openCommunity.image || "/Profilepic.png"}
                                    alt={openCommunity.name}
                                    className="h-full w-full object-cover border object-center"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-base font-extrabold tracking-tight">
                                    {openCommunity.name}
                                </h1>
                                <p className="truncate text-xs text-[#62748e]">
                                    {(openCommunity.memberCount || openCommunity.members?.length || 0).toLocaleString()} members
                                </p>
                            </div>
                        </header>

                        {/* Search groups */}
                        <div className="px-3 pb-2">
                            <div className="flex items-center gap-2 rounded-full bg-[#f2f6fa] px-4 py-2">
                                <Search className="h-4 w-4 text-[#62748e]" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search groups"
                                    className="flex-1 bg-transparent text-sm outline-none"
                                />
                            </div>
                        </div>

                        {/* Add Group button */}
                        <div className="px-3 pb-1">
                            <button
                                onClick={() => setNewGroup(true)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-left transition hover:bg-[#f7f9fc]"
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d9bf0]/10 text-[#1d9bf0]">
                                    <Plus className="h-5 w-5" />
                                </span>
                                <span className="font-bold text-[#1d9bf0]">Add Group</span>
                            </button>
                        </div>

                        {/* Groups list (WhatsApp-style, chat-row UI) */}
                        <div className="flex-1 min-h-0 overflow-y-auto pb-4 md:pb-0">
                            {groups.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => router.push(`/dashboard/chat2/group/${openCommunity.id}/${g.id}`)}
                                    className={cn(
                                        "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition hover:bg-[#f7f9fc]",
                                        params.communityId === openCommunity.id && params.groupId === g.id
                                            ? "active-border border-[#1d9bf0] bg-[#f5f8fa]"
                                            : "border-transparent",
                                    )}
                                >

                                    {g.isAnnouncement ? (
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1d9bf0]/10 text-[#1d9bf0]">
                                            <Megaphone className="h-5 w-5" />
                                        </span>
                                    ) : g.image ? (
                                        // NEW: uploaded profile picture
                                        <img
                                            src={g.image}
                                            alt={g.name}
                                            className="h-12 w-12 shrink-0 rounded-full border object-cover ring-1 ring-slate-200"
                                        />
                                    ) : g.gradient ? (
                                        // NEW: gradient fallback from picker
                                        <span
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
                                            style={{ background: `linear-gradient(135deg, ${g.gradient.from}, ${g.gradient.to})` }}
                                        >
                                            <span className="text-lg font-black">{g.name[0]?.toUpperCase()}</span>
                                        </span>
                                    ) : g.color ? (
                                        <span
                                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#fff]"
                                            style={{ backgroundColor: g.color }}
                                        >
                                            <span className="text-lg font-black">{g.name[0]?.toUpperCase()}</span>
                                        </span>
                                    ) : (
                                        <img
                                            src={g.image || openCommunity.image || "/Profilepic.png"}
                                            alt={g.name}
                                            className="h-12 w-12 shrink-0 border rounded-full bg-[#f2f6fa] object-cover"
                                        />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate font-bold">{g.name}</span>
                                            {g.time ? (
                                                <span className="shrink-0 text-xs text-[#62748e]">
                                                    {g.time}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-sm text-[#62748e]">
                                                {g.lastMessage || g.description || "No messages yet"}
                                            </p>
                                            {g.unread ? (
                                                <span className="ml-2 rounded-full bg-[#1d9bf0] px-2 text-xs font-bold text-white">
                                                    {g.unread}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {groups.length === 0 && (
                                <div className="p-10 text-center text-sm text-[#62748e]">
                                    No groups found
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* ---------- DEFAULT VIEW (chat list / community list) ---------- */
                    <>
                        <header className="flex flex-row items-center justify-between px-4 py-3" style={{
                            display: "flex",
                            flexDirection: "row",
                        }}>
                            <h1 className="text-xl font-extrabold tracking-tight">
                                {tab === "chat" ? "Chat" : "Communities"}
                            </h1>
                            <div className="flex items-center gap-1">
                                {tab === "chat" && (
                                    <>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowFilter((v) => !v)}
                                                className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold hover:bg-[#f2f6fa]"
                                            >
                                                {filter === "all" ? "All" : "Unread"}
                                                <ChevronDown className="h-4 w-4" />
                                            </button>
                                            {showFilter && (
                                                <DotsMenu
                                                    onClose={() => setShowFilter(false)}
                                                    items={[
                                                        { label: "All messages", onClick: () => setFilter("all") },
                                                        { label: "Unread", onClick: () => setFilter("unread") },
                                                    ]}
                                                />
                                            )}
                                        </div>
                                        <Link
                                            href="/dashboard/chat2/requests"
                                            className="relative rounded-full border p-2 hover:bg-[#f2f6fa]"
                                            title="Message requests"
                                        >
                                            <Icon icon="solar:inbox-linear" className="h-5 w-5" />
                                            {requestCount > 0 && (
                                                <span className="absolute -right-1 -top-1 rounded-full bg-[#1d9bf0] px-1.5 text-[10px] font-bold leading-4 text-white">
                                                    {requestCount > 99 ? "99+" : requestCount}
                                                </span>
                                            )}
                                        </Link>

                                    </>
                                )}
                                <button
                                    onClick={() => setNewMsg(true)}
                                    className="rounded-full border p-2 hover:bg-[#f2f6fa]"
                                    title="New message"
                                >
                                    <Icon icon="mynaui:chat-plus" className="h-5 w-5" />
                                </button>
                            </div>
                        </header>

                        {/* Tabs */}
                        <div className="flex border-b">
                            {[
                                { k: "chat", l: "Chat" },
                                { k: "communities", l: "Communities" },
                            ].map((t) => (
                                <button
                                    key={t.k}
                                    onClick={() => {
                                        setTab(t.k);
                                        setQ("");
                                    }}
                                    className={cn(
                                        "relative flex-1 py-3 text-sm font-bold transition hover:bg-[#f7f9fc]",
                                        tab === t.k ? "text-[#000]" : "text-[#62748e]",
                                    )}
                                >
                                    {t.l}
                                    {tab === t.k && (
                                        <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="p-3">
                            <div className="flex items-center gap-2 rounded-full bg-[#f2f6fa] px-4 py-2">
                                <Search className="h-4 w-4 text-[#62748e]" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder={tab === "chat" ? "Search Direct Messages" : "Search Communities"}
                                    className="flex-1 bg-transparent text-sm outline-none"
                                />
                            </div>
                        </div>

                        {/* Lists */}
                        <div className="flex-1 min-h-0 overflow-y-auto pb-4 md:pb-0">
                            {tab === "chat" ? (
                                <>
                                    {filtered.map((c) => {
                                        const active = params.id === c.id;
                                        return (
                                            <Link
                                                key={c.id}
                                                href={`/dashboard/chat2/${c.id}`}
                                                className={cn(
                                                    "flex items-center gap-3 border-l-2 px-4 py-3 transition hover:bg-[#f7f9fc]",
                                                    active
                                                        ? "active-border border-[#1d9bf0] bg-[#f5f8fa]"
                                                        : "border-transparent"
                                                )}
                                            >
                                                <img
                                                    src={c.user.avatar}
                                                    alt={c.user.name}
                                                    className="h-12 w-12 rounded-full border bg-[#f2f6fa] object-cover"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1 truncate">
                                                            <span className="truncate font-bold">{c.user.name}</span>
                                                            {c.user.verified && <span className="text-[#1d9bf0]">✓</span>}
                                                            <span className="truncate text-sm text-[#62748e]">
                                                                @{c.user.handle}
                                                            </span>
                                                        </div>
                                                        <span className="shrink-0 text-xs text-[#62748e]">· {c.time}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate text-sm text-[#62748e]">{c.preview}</p>
                                                        {c.unread ? (
                                                            <span className="ml-2 rounded-full bg-[#1d9bf0] px-2 text-xs font-bold text-white">
                                                                {c.unread}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <div className="p-10 text-center text-sm text-[#62748e]">
                                            No conversations
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {communities
                                        .filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()))
                                        .map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    setOpenCommunity(c);
                                                    setQ("");
                                                }}
                                                className="flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-left transition hover:bg-[#f7f9fc]"
                                            >
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#f2f6fa]">
                                                    <img
                                                        src={c.image || "/Profilepic.png"}
                                                        alt={c.name}
                                                        className="h-full w-full border object-cover object-center"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate font-bold">{c.name}</span>
                                                        {c.unread ? (
                                                            <span className="rounded-full bg-[#1d9bf0] px-2 text-xs font-bold text-white">
                                                                {c.unread}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-[#62748e]">
                                                        <Icon icon="solar:user-linear" className="h-3 w-3" />
                                                        {(c.memberCount || c.members?.length || 0).toLocaleString()} members
                                                    </div>
                                                </div>
                                                <ChevronDown className="h-4 w-4 -rotate-90 text-[#62748e]" />
                                            </button>
                                        ))}
                                </>
                            )}
                        </div>
                    </>
                )}
            </aside>

            <NewMessageModal
                open={newMsg}
                onClose={() => setNewMsg(false)}
                onPick={(u) => router.push(`/dashboard/chat2/${u.id}`)}
            />

            <CreateGroupModal
                open={newGroup}
                onOpenChange={() => setNewGroup(false)}
                onCreate={handleCreateGroup}
            />
        </div>
    );
}
