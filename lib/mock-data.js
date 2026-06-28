export const me = {
    id: "me",
    name: "You",
    handle: "you",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=me",
    followers: 128,
    joined: "March 2022",
};

export const conversations = [
    {
        id: "suka",
        user: {
            id: "suka",
            name: "suka",
            handle: "sukuna_senpai12",
            avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=suka",
            followers: 2,
            joined: "October 2023",
        },
        preview: "You sent a photo",
        time: "10m",
        pinned: true,
        messages: [
            { id: "1", from: "me", text: "Hello", time: "11:22 AM", seen: true },
            {
                id: "2",
                from: "suka",
                text: "Hello",
                time: "11:29 AM",
                reactions: [{ emoji: "😀", by: "me" }],
            },
            {
                id: "3",
                from: "me",
                time: "11:31 AM",
                media: {
                    type: "image",
                    url: "https://images.unsplash.com/photo-1517242027094-631f8c218a0f?w=600",
                },
            },
        ],
    },
    {
        id: "pew",
        user: {
            id: "pew",
            name: "PewDiePie News",
            handle: "pewnews",
            avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=pew",
            followers: 12000,
            joined: "Jan 2019",
            verified: true,
        },
        preview: "Apolozing for toxic Boruto fans, Pew and 1...",
        time: "1h",
        messages: [
            { id: "1", from: "pew", text: "Welcome to the channel!", time: "10:00 AM" },
        ],
    },
    {
        id: "ada",
        user: {
            id: "ada",
            name: "Ada Lovelace",
            handle: "ada_l",
            avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=ada",
            followers: 980,
            joined: "Feb 2020",
        },
        preview: "Sure, let's catch up tomorrow ☕",
        time: "3h",
        unread: 2,
        messages: [
            { id: "1", from: "ada", text: "Hey are you free?", time: "9:10 AM" },
            { id: "2", from: "ada", text: "Sure, let's catch up tomorrow ☕", time: "9:11 AM" },
        ],
    },
    {
        id: "mark",
        user: {
            id: "mark",
            name: "Mark",
            handle: "markdev",
            avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=mark",
            followers: 320,
            joined: "May 2021",
        },
        preview: "🔥",
        time: "1d",
        messages: [{ id: "1", from: "mark", text: "🔥", time: "Yesterday" }],
    },
];

export const communities = [
    {
        id: "design",
        name: "Design Engineers",
        members: 24500,
        cover: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=600",
        description: "Where design meets code.",
        unread: 3,
    },
    {
        id: "build",
        name: "Build in Public",
        members: 81230,
        cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600",
        description: "Ship daily. Share progress.",
    },
    {
        id: "ai",
        name: "AI Builders",
        members: 152000,
        cover: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600",
        description: "All things LLMs and agents.",
        unread: 12,
    },
    {
        id: "indie",
        name: "Indie Hackers",
        members: 67800,
        cover: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600",
        description: "Bootstrapped founders.",
    },
    {
        id: "frontend",
        name: "Frontend Wizards",
        members: 41200,
        cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
        description: "React, CSS, animations.",
    },
];

export const messageRequests = [
    {
        id: "libor",
        user: {
            id: "libor",
            name: "Libor",
            handle: "Libor85166",
            avatar: "",
            followers: 0,
            joined: "October 2025",
        },
        preview: "Join our Stock Forum Community — Turn Knowledge into Profit",
        time: "Nov 9, 2025",
        messages: [
            {
                id: "1",
                from: "libor",
                text: "Join our Stock Forum Community — Turn Knowledge into Profit\n\nIn today's fast-moving stock market, smart traders are making real profits every week — not by luck, but by learning how.",
                time: "Nov 9, 2025",
            },
        ],
    },
    {
        id: "pawan",
        user: {
            id: "pawan",
            name: "Pawan",
            handle: "pawan85166",
            avatar: "",
            followers: 0,
            joined: "October 2025",
        },
        preview: "Join our Krishna Community — Turn Knowledge into Profit",
        time: "Nov 9, 2025",
        messages: [
            {
                id: "1",
                from: "pawan",
                text: "Join o into Profit\n\nIn today's fast-moving stock market, smart traders are making real profits every week — not by luck, but by learning how.",
                time: "Nov 9, 2025",
            },
        ],
    },
];

export const gifs = [
    "https://media.tenor.com/x8v1oNUOmg4AAAAi/hi.gif",
    "https://media.tenor.com/wpSo-8t6iV4AAAAi/cat.gif",
    "https://media.tenor.com/D6Zof1pNHEEAAAAi/excited-yay.gif",
    "https://media.tenor.com/dN57kFFhJa0AAAAi/clap.gif",
    "https://media.tenor.com/jBnvHm-IBaUAAAAi/fire.gif",
    "https://media.tenor.com/8XK0bV9_5lsAAAAi/love.gif",
    "https://media.tenor.com/MAOPDQQAxhwAAAAi/laugh.gif",
    "https://media.tenor.com/MdyAdkBM3mUAAAAi/wave.gif",
];

export const emojis = ["😀", "😂", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "🔥", "🎉", "💯", "🙏", "👀", "✨", "😅", "🤣", "😍", "🥳", "😴", "🤯", "🙄", "😬", "💪", "👏", "🤝", "🫶", "🫡", "🤌"];

export const stickers = [
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=1",
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=2",
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=3",
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=4",
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=5",
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=6",
];

export const allUsers = [
    ...conversations.map((c) => c.user),
    {
        id: "elon",
        name: "Elon",
        handle: "elonmusk",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=elon",
        followers: 200000000,
        joined: "June 2009",
        verified: true,
    },
    {
        id: "jack",
        name: "jack",
        handle: "jack",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=jack",
        followers: 6000000,
        joined: "March 2006",
    },
    {
        id: "naval",
        name: "Naval",
        handle: "naval",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=naval",
        followers: 2000000,
        joined: "May 2008",
    },
];
