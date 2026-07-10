import { useState } from "react";
import {
  ChevronDown,
  ArrowLeft,
  Pencil,
  Bookmark,
  MessageSquare,
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Globe,
  GraduationCap,
  CalendarDays,
  Layers,
  BookOpen,
  Trophy,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Award,
  Medal,
  Star,
} from "lucide-react";

/* ---------- Inline UI primitives (no external ui/figma imports) ---------- */

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-background text-foreground hover:bg-accent",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </button>
  );
}

function ImageWithFallback({ src, alt = "", className = "", ...props }) {
  const [errored, setErrored] = useState(false);
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23ececf0'/></svg>`,
    );
  return (
    <img
      src={errored ? fallback : src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...props}
    />
  );
}

/* ---------- Data ---------- */

const socials = [
  { icon: Github, label: "GitHub" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Twitter, label: "Twitter" },
  { icon: Instagram, label: "Instagram" },
  { icon: Globe, label: "Website" },
];

const academic = [
  { icon: GraduationCap, label: "Branch", value: "Computer Science" },
  { icon: CalendarDays, label: "Year", value: "First Year" },
  { icon: Layers, label: "Batch", value: "2025 – 2029" },
  { icon: BookOpen, label: "Semester", value: "Semester 2" },
];

const skills = [
  { name: "Python", color: "#3776AB", initial: "Py" },
  { name: "C", color: "#5C6BC0", initial: "C" },
  { name: "C++", color: "#00599C", initial: "C++" },
  { name: "React", color: "#61DAFB", initial: "Re" },
  { name: "JavaScript", color: "#F7DF1E", initial: "JS" },
  { name: "TypeScript", color: "#3178C6", initial: "TS" },
  { name: "Node.js", color: "#539E43", initial: "No" },
  { name: "Figma", color: "#A259FF", initial: "Fi" },
];

const clubs = [
  {
    id: "c1",
    name: "Innovation Cell",
    role: "Core Member",
    img: "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300",
  },
  {
    id: "c2",
    name: "Coding Club",
    role: "Contributor",
    img: "https://images.unsplash.com/photo-1558137623-ce933996c730?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300",
  },
  {
    id: "c3",
    name: "Robotics Society",
    role: "Volunteer",
    img: "https://images.unsplash.com/photo-1527612820672-5b56351f7346?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300",
  },
];

const achievements = [
  {
    id: "a1",
    icon: Trophy,
    tint: "bg-amber-100 text-amber-600",
    title: "Winner — SmartCampus Hackathon 2026",
    desc: "Built an AI attendance system in 24 hours.",
    date: "Mar 2026",
  },
  {
    id: "a2",
    icon: Medal,
    tint: "bg-slate-100 text-slate-600",
    title: "2nd Place — National Robotics Sprint",
    desc: "Autonomous line-following bot.",
    date: "Feb 2026",
  },
  {
    id: "a3",
    icon: Star,
    tint: "bg-indigo-100 text-indigo-600",
    title: "Dean's List — Semester 1",
    desc: "Top 5% of the batch by GPA.",
    date: "Jan 2026",
  },
  {
    id: "a4",
    icon: Trophy,
    tint: "bg-emerald-100 text-emerald-600",
    title: "Finalist — Smart India Hackathon",
    desc: "Reached the national finals with team Bytecraft.",
    date: "Dec 2025",
  },
  {
    id: "a5",
    icon: Medal,
    tint: "bg-rose-100 text-rose-600",
    title: "Best Poster — Tech Symposium",
    desc: "Research on edge AI for campus IoT.",
    date: "Nov 2025",
  },
];

const posts = [
  {
    id: "p1",
    caption: "Late night debugging at the Innovation Cell 🚀 Shipping the new attendance model tonight!",
    img: "https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Jul 8",
    likes: 128,
    comments: 24,
    shares: 9,
  },
  {
    id: "p2",
    caption: "Our bot finally completed the track! Months of work paid off 🤖",
    img: "https://images.unsplash.com/photo-1558137623-ce933996c730?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Jun 29",
    likes: 96,
    comments: 12,
    shares: 4,
  },
];

/* ---------- Sub components ---------- */

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent">
          <Icon className="size-4 text-foreground" />
        </div>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function PostCard({ post }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <div className="size-10 shrink-0 overflow-hidden rounded-full">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200"
            alt="Aarav Sharma"
            className="size-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="text-foreground">Aarav Sharma</div>
          <div className="text-sm text-muted-foreground">{post.date}</div>
        </div>
        <button className="text-muted-foreground transition-colors hover:text-foreground">
          <MoreHorizontal className="size-5" />
        </button>
      </div>

      <p className="px-4 pb-3 text-sm text-foreground">{post.caption}</p>

      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        <ImageWithFallback src={post.img} alt={post.caption} className="size-full object-cover" />
      </div>

      <div className="flex items-center gap-6 px-4 py-3 text-sm text-muted-foreground">
        <button className="flex items-center gap-1.5 transition-colors hover:text-rose-500">
          <Heart className="size-4" /> {post.likes}
        </button>
        <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
          <MessageCircle className="size-4" /> {post.comments}
        </button>
        <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
          <Share2 className="size-4" /> {post.shares}
        </button>
        <button className="ml-auto transition-colors hover:text-foreground">
          <Bookmark className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */

export function ProfilePage({ onBack, isOwnProfile = true }) {
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const visibleAchievements = showAllAchievements ? achievements : achievements.slice(0, 2);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back to Explore</span>
        </button>
        <div className="flex gap-2">
          {isOwnProfile ? (
            <>
              <Button variant="secondary" className="rounded-full px-3 sm:px-4">
                <Bookmark className="size-4" />
                <span className="hidden sm:inline">Saved Posts</span>
              </Button>
              <Button className="rounded-full px-3 sm:px-4">
                <Pencil className="size-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            </>
          ) : (
            <Button className="rounded-full px-3 sm:px-4">
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">Message</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        {/* Profile header */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:flex-row sm:items-start sm:text-left">
          <div className="size-24 shrink-0 overflow-hidden rounded-full ring-2 ring-accent">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
              alt="Aarav Sharma"
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 sm:items-start">
            <h1>Aarav Sharma</h1>
            <div className="text-muted-foreground">Computer Science · First Year</div>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Builder, hackathon enthusiast, and part-time robotics tinkerer. Turning caffeine into code.
            </p>
            <div className="mt-3 flex gap-2">
              {socials.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <SectionCard title="Academic Information" icon={GraduationCap}>
          <div className="grid grid-cols-2 gap-3">
            {academic.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon className="size-3.5" /> {label}
                </div>
                <div className="mt-1 text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Skills" icon={Layers}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {skills.map((s) => (
              <div
                key={s.name}
                className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
              >
                <span
                  className="flex size-12 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.initial}
                </span>
                <span className="text-sm text-foreground">{s.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Clubs */}
        <SectionCard title="Clubs" icon={BookOpen}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {clubs.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-shadow hover:shadow-md"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-xl">
                  <ImageWithFallback src={c.img} alt={c.name} className="size-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-foreground">{c.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{c.role}</div>
                </div>
                <Button variant="secondary" className="shrink-0 rounded-full">
                  Visit
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Achievements */}
        <SectionCard title="Achievements" icon={Award}>
          <div className="flex flex-col gap-3">
            {visibleAchievements.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 transition-shadow hover:shadow-md sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${a.tint}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-foreground">{a.title}</div>
                    <div className="text-sm text-muted-foreground">{a.desc}</div>
                    <div className="mt-1 text-xs text-muted-foreground sm:hidden">{a.date}</div>
                  </div>
                  <div className="hidden shrink-0 text-sm text-muted-foreground sm:block">{a.date}</div>
                </div>
              );
            })}
          </div>
          {achievements.length > 2 && (
            <button
              onClick={() => setShowAllAchievements((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-background py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {showAllAchievements ? "See less" : `See more (${achievements.length - 2})`}
              <ChevronDown
                className={`size-4 transition-transform ${showAllAchievements ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </SectionCard>

        {/* Posts */}
        <SectionCard title="Posts" icon={Layers}>
          <div className="flex flex-col gap-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
