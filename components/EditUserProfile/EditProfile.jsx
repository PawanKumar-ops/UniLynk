import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Plus,
  X,
  Check,
  Globe,
  AtSign,
  Hash,
  Code2,
  Briefcase,
  Search,
  Trash2,
} from "lucide-react";
import { Icon } from "@iconify/react";
import CropModal from "./CropModal";
import Select from "./Select";
import { SKILL_CATALOG, skillIcon } from "@/data/skills";

const BRANCHES = ["PIE", "CSE", "ECE", "Mechanical", "Civil", "Electrical", "IT", "Chemical"].map(
  (b) => ({ value: b, label: b }),
);
const YEARS = ["First Year", "Second Year", "Third Year", "Final Year"].map((y) => ({
  value: y,
  label: y,
}));

const SOCIALS = [
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: "hugeicons:linkedin-02",
    ph: "linkedin.com/in/username",
  },
  {
    value: "instagram",
    label: "Instagram",
    icon: "hugeicons:instagram",
    ph: "instagram.com/username",
  },
  {
    value: "github",
    label: "GitHub",
    icon: "ant-design:github-filled",
    ph: "github.com/username",
  },
  {
    value: "twitter",
    label: "X / Twitter",
    icon: "proicons:x-twitter",
    ph: "x.com/username",
  },
  {
    value: "website",
    label: "Website",
    icon: "solar:global-linear",
    ph: "yoursite.com",
  },
];

function SectionHeader({ index, title, desc }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted">
          {index}
        </span>
        <h2 className="font-display text-lg font-semibold leading-none">{title}</h2>
      </div>
      <p className="mt-1.5 text-sm text-muted">{desc}</p>
    </div>
  );
}

function Card({ children }) {
  return (
    <section className="rounded-[var(--radius)] border border-hair bg-white p-5 sm:p-6">
      {children}
    </section>
  );
}

export default function EditProfile({ onClose }) {
  const [banner, setBanner] = useState(
    "/Background.jpg",
  );
  const [avatar, setAvatar] = useState(
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&auto=format",
  );
  const [name, setName] = useState("Anime Merch");
  const [branch, setBranch] = useState("PIE");
  const [year, setYear] = useState("First Year");
  const [bio, setBio] = useState("Curating campus culture, one drop at a time.");

  const [socials, setSocials] = useState([
    { platform: "linkedin", url: "linkedin.com/in/animemerch" },
    { platform: "instagram", url: "instagram.com/animemerch" },
  ]);

  const [skills, setSkills] = useState([
    SKILL_CATALOG[0],
    SKILL_CATALOG[5],
    SKILL_CATALOG[7],
    SKILL_CATALOG[9],
  ]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);
  const skillRef = useRef(null);

  const [achievements, setAchievements] = useState([
    "Winner — Inter-College Design Sprint 2025",
    "Led a 40-member merchandise team",
  ]);
  const [achieveInput, setAchieveInput] = useState("");

  const [crop, setCrop] = useState(null);
  const bannerInput = useRef(null);
  const avatarInput = useRef(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onDoc = (e) => {
      if (skillRef.current && !skillRef.current.contains(e.target)) setSkillOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (kind) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCrop({ kind, src: url });
    e.target.value = "";
  };

  const skillSuggestions = useMemo(() => {
    const chosen = new Set(skills.map((s) => s.slug));
    return SKILL_CATALOG.filter(
      (s) =>
        !chosen.has(s.slug) &&
        s.name.toLowerCase().includes(skillQuery.trim().toLowerCase()),
    ).slice(0, 8);
  }, [skills, skillQuery]);

  const addSkill = (s) => {
    setSkills((prev) => [...prev, s]);
    setSkillQuery("");
    setSkillOpen(false);
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="min-h-full">
      <div className="space-y-3 pt-5">
        {/* Media */}
        {/* Media */}
        <section className="overflow-hidden rounded-[24px] border border-hair bg-white">
          <div className="relative">

            {/* Banner */}
            <div className="group relative h-[160px] w-full overflow-hidden bg-neutral-100 sm:h-[200px]">
              {banner ? (
  <img
    src={banner}
    alt="Profile banner"
    className="size-full object-cover"
  />
) : (
  <div className="size-full bg-gradient-to-br from-neutral-200 to-neutral-100" />
)}

{/* Same banner shadow as Profile Page */}
<div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

{/* Banner controls */}
<div className="absolute inset-0 flex items-center justify-center gap-3 bg-ink/25 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
                <button
                  onClick={() => bannerInput.current?.click()}
                  title="Upload banner"
                  className="grid size-11 place-items-center rounded-full bg-ink/70 text-white backdrop-blur transition hover:bg-ink"
                >
                  <Icon icon="solar:camera-outline" className="size-[18px]" />
                </button>

                {banner && (
                  <button
                    onClick={() => setCrop({ kind: "banner", src: banner })}
                    title="Adjust banner"
                    className="grid size-11 place-items-center rounded-full bg-ink/70 text-white backdrop-blur transition hover:bg-ink"
                  >
                    <Icon icon="solar:pen-outline" className="size-[18px]" />
                  </button>
                )}

                {banner && (
                  <button
                    onClick={() => setBanner("")}
                    title="Remove banner"
                    className="grid size-11 place-items-center rounded-full bg-ink/70 text-white backdrop-blur transition hover:bg-ink"
                  >
                    <X className="size-[18px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Picture Area */}
            <div className="relative px-5 pb-5 sm:px-7 sm:pb-7">
              <div className="flex items-end gap-4">
                <div className="group relative -mt-10 sm:-mt-13">
                  {/* Same avatar size as User Profile */}
                  <div className="w-fit rounded-full bg-white p-0.75 ring-1 ring-white">
                    <div className="h-[75px] w-[75px] overflow-hidden rounded-full bg-neutral-100 sm:h-[100px] sm:w-[100px]">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Profile avatar"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-neutral-200" />
                      )}
                    </div>
                  </div>

                  {/* Change photo */}
                  <button
                    onClick={() => avatarInput.current?.click()}
                    title="Change photo"
                    className="absolute inset-0 grid place-items-center rounded-full bg-ink/40 text-white opacity-0 transition group-hover:opacity-100 max-sm:opacity-100"
                  >
                    <Icon icon="solar:camera-outline" className="size-6" />
                  </button>

                  {/* Adjust photo */}
                  {avatar && (
                    <button
                      onClick={() => setCrop({ kind: "avatar", src: avatar })}
                      title="Adjust photo"
                      className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full border-2 border-white bg-ink text-white transition hover:opacity-90"
                    >
                      <Icon icon="solar:pen-outline" className="size-3.5" />
                    </button>
                  )}
                </div>

                <p className="pb-2 text-sm text-muted">
                  Hover a photo to upload, adjust, or remove.
                </p>
              </div>
            </div>
          </div>

          <input
            ref={bannerInput}
            type="file"
            accept="image/*"
            hidden
            onChange={pick("banner")}
          />

          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            hidden
            onChange={pick("avatar")}
          />
        </section>

        {/* Basic details */}
        <Card>
          <SectionHeader
            index="01"
            title="Basic details"
            desc="Your name and where you are in your academic journey."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </Field>
            <Field label="Bio">
              <input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input"
                placeholder="A short line about you"
              />
            </Field>
            <Field label="Branch">
              <Select value={branch} options={BRANCHES} onChange={setBranch} />
            </Field>
            <Field label="Year">
              <Select value={year} options={YEARS} onChange={setYear} />
            </Field>
          </div>
        </Card>

        {/* Socials */}
        <Card>
          <SectionHeader
            index="02"
            title="Social profiles"
            desc="Link the platforms where people can find you."
          />
          <div className="space-y-3">
            {socials.map((s, i) => {
              const meta = SOCIALS.find((x) => x.value === s.platform) ?? SOCIALS[4];
              return (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    className="sm:w-48 sm:shrink-0"
                    value={s.platform}
                    options={SOCIALS}
                    onChange={(v) =>
                      setSocials((p) => p.map((it, idx) => (idx === i ? { ...it, platform: v } : it)))
                    }
                  />
                  <input
                    value={s.url}
                    placeholder={meta.ph}
                    onChange={(e) =>
                      setSocials((p) =>
                        p.map((it, idx) => (idx === i ? { ...it, url: e.target.value } : it)),
                      )
                    }
                    className="input flex-1"
                  />
                  <button
                    onClick={() => setSocials((p) => p.filter((_, idx) => idx !== i))}
                    className="grid h-11 shrink-0 place-items-center rounded-xl border border-hair px-3 text-muted transition hover:text-red-500 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Icon icon="solar:trash-bin-trash-linear" className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setSocials((p) => [...p, { platform: "linkedin", url: "" }])}
            className="mt-3 flex items-center gap-2 rounded-full border border-hair px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-black/5 hover:text-ink"
          >
            <Plus className="size-4" /> Add social profile
          </button>
        </Card>

        {/* Skills */}
        <Card>
          <SectionHeader
            index="03"
            title="Skills"
            desc="Add the tools and languages you work with."
          />

          <div ref={skillRef} className="relative">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              <Icon icon="solar:magnifier-linear" className="size-4" />
            </div>
            <input
              value={skillQuery}
              onChange={(e) => {
                setSkillQuery(e.target.value);
                setSkillOpen(true);
              }}
              onFocus={() => setSkillOpen(true)}
              placeholder="Search skills — Python, C++, React…"
              className="input"
              style={{ paddingLeft: "2.75rem" }}
            />

            {skillOpen && (
              <div className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-hair bg-white p-1.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.25)]">
                {skillSuggestions.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-muted">No matches found.</p>
                ) : (
                  skillSuggestions.map((s) => (
                    <button
                      key={s.slug}
                      onClick={() => addSkill(s)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-neutral-100"
                    >
                      <img src={skillIcon(s.slug)} alt="" className="size-5" />
                      <span className="flex-1 font-medium">{s.name}</span>
                      <Plus className="size-4 text-muted" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {skills.length === 0 && <p className="text-sm text-muted">No skills yet.</p>}
            {skills.map((s) => (
              <span
                key={s.slug}
                className="flex items-center gap-2 rounded-full border border-hair py-1.5 pl-2.5 pr-1.5 text-sm font-medium"
              >
                <img src={skillIcon(s.slug)} alt="" className="size-4" />
                {s.name}
                <button
                  onClick={() => setSkills((p) => p.filter((x) => x.slug !== s.slug))}
                  className="grid size-5 place-items-center rounded-full text-muted transition hover:bg-ink hover:text-white"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card>
          <SectionHeader
            index="04"
            title="Achievements"
            desc="Highlight the wins you're proud of."
          />
          <div className="space-y-2.5">
            {achievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-hair px-3.5 py-3"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-ink font-mono text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm">{a}</span>
                <button
                  onClick={() => setAchievements((p) => p.filter((_, idx) => idx !== i))}
                  className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-ink hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={achieveInput}
              onChange={(e) => setAchieveInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && achieveInput.trim()) {
                  setAchievements((p) => [...p, achieveInput.trim()]);
                  setAchieveInput("");
                }
              }}
              placeholder="e.g. Hackathon finalist 2025"
              className="input flex-1"
            />
            <button
              onClick={() => {
                if (!achieveInput.trim()) return;
                setAchievements((p) => [...p, achieveInput.trim()]);
                setAchieveInput("");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </Card>

        {/* Mobile action bar */}
        <div className="flex gap-2 sm:hidden">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-hair bg-white px-4 py-3 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white"
          >
            {saved ? <Check className="size-4" /> : null}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      {crop && (
        <CropModal
          src={crop.src}
          aspect={crop.kind === "banner" ? 3 : 1}
          round={crop.kind === "avatar"}
          title={crop.kind === "banner" ? "Banner image" : "Profile picture"}
          onCancel={() => setCrop(null)}
          onApply={(url) => {
            crop.kind === "banner" ? setBanner(url) : setAvatar(url);
            setCrop(null);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
