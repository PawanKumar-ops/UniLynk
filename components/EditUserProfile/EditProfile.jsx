"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Camera,
  Plus,
  X,
  Check,
  Code2,
  Trash2,
  Loader2,
} from "lucide-react";
import { Icon } from "@iconify/react";
import CropModal from "./CropModal";
import Select from "./Select";
import { SKILLS } from "@/lib/skillsList";
import { getSkillIcon } from "@/lib/skillIcons";

const BRANCHES = ["PIE", "CSE", "ECE", "Mechanical", "Civil", "Electrical", "IT", "Chemical"].map(
  (b) => ({ value: b, label: b }),
);
const YEARS = ["First Year", "Second Year", "Third Year", "Final Year"].map((y) => ({
  value: y,
  label: y,
}));

const SOCIALS = [
  {
    value: "LinkedIn",
    label: "LinkedIn",
    icon: "hugeicons:linkedin-02",
    ph: "linkedin.com/in/username",
  },
  {
    value: "Instagram",
    label: "Instagram",
    icon: "hugeicons:instagram",
    ph: "instagram.com/username",
  },
  {
    value: "GitHub",
    label: "GitHub",
    icon: "ant-design:github-filled",
    ph: "github.com/username",
  },
  {
    value: "Twitter",
    label: "X / Twitter",
    icon: "proicons:x-twitter",
    ph: "x.com/username",
  },
  {
    value: "Website",
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

export default function EditProfile({ onClose, saveRef }) {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [banner, setBanner] = useState("/Background.jpg");
  const [avatar, setAvatar] = useState("/Profilepic.png");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("First Year");

  const [socials, setSocials] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);
  const skillRef = useRef(null);

  const [achievements, setAchievements] = useState([]);
  const [achieveInput, setAchieveInput] = useState("");

  const [crop, setCrop] = useState(null);
  const bannerInput = useRef(null);
  const avatarInput = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadUserProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/me", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data?.user && isMounted) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setBranch(data.user.branch || "CSE");
          setYear(data.user.year || "First Year");
          setAvatar(data.user.img || "/Profilepic.png");
          setBanner(data.user.banner || "/Background.jpg");
          setSocials(
            (data.user.socials || []).map((s) => ({
              platform: s.platform || "LinkedIn",
              url: s.url || "",
            }))
          );
          setSkills(data.user.skills || []);
          setAchievements(
            (data.user.achievements || []).map((a) =>
              typeof a === "string" ? { title: a, description: "", date: "" } : a
            )
          );
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadUserProfile();
    return () => {
      isMounted = false;
    };
  }, []);

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
    const chosen = new Set(skills.map((s) => s.toLowerCase()));
    return SKILLS.filter(
      (s) =>
        !chosen.has(s.toLowerCase()) &&
        s.toLowerCase().includes(skillQuery.trim().toLowerCase()),
    ).slice(0, 8);
  }, [skills, skillQuery]);

  const addSkill = (s) => {
    setSkills((prev) => {
      if (prev.some((skill) => skill.toLowerCase() === s.toLowerCase())) return prev;
      return [...prev, s];
    });
    setSkillQuery("");
    setSkillOpen(false);
  };

  const addCustomSkill = () => {
    const sName = skillQuery.trim();
    if (!sName) return;
    addSkill(sName);
  };

  const uploadImageToCloudinary = async (imgData, folder = "profile-images") => {
    if (!imgData || !imgData.startsWith("data:image/")) return imgData;
    const res = await fetch("/api/user/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imgData, folder }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Image upload failed");
    return data.url;
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setSaveError("");

      let uploadedAvatar = avatar;
      let uploadedBanner = banner;

      if (avatar && avatar.startsWith("data:image/")) {
        uploadedAvatar = await uploadImageToCloudinary(avatar, "profile-avatars");
      }

      if (banner && banner.startsWith("data:image/")) {
        uploadedBanner = await uploadImageToCloudinary(banner, "profile-banners");
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          branch,
          year,
          img: uploadedAvatar,
          banner: uploadedBanner,
          skills,
          socials: socials.filter((s) => s.platform && s.url.trim()),
          achievements: achievements
            .map((a) => (typeof a === "string" ? { title: a.trim(), description: "", date: "" } : a))
            .filter((a) => a.title),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      await updateSession?.();
      setSaved(true);
      setTimeout(() => {
        router.refresh();
        if (onClose) {
          onClose();
        } else {
          router.push("/dashboard/Userprofile");
        }
      }, 500);
    } catch (err) {
      console.error("Save profile error:", err);
      setSaveError(err.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  // Expose save handle via saveRef if provided
  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveProfile;
    }
  }, [saveRef, handleSaveProfile]);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="space-y-3 pt-5 pb-10">
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

              {/* Banner shadow */}
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

                {banner && banner !== "/Background.jpg" && (
                  <button
                    onClick={() => setBanner("/Background.jpg")}
                    title="Remove custom banner"
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
                  Hover a photo to upload or adjust.
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
            <Field label="Email">
              <input
                value={email}
                readOnly
                disabled
                className="input cursor-not-allowed bg-neutral-100 text-neutral-500 opacity-75"
                placeholder="Your email"
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
              const meta = SOCIALS.find((x) => x.value === s.platform) ?? SOCIALS[0];
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
            onClick={() => setSocials((p) => [...p, { platform: "LinkedIn", url: "" }])}
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
            <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted">
              <Icon icon="solar:magnifer-linear" className="size-4" />
            </div>

            <input
              value={skillQuery}
              onChange={(e) => {
                setSkillQuery(e.target.value);
                setSkillOpen(true);
              }}
              onFocus={() => setSkillOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (skillSuggestions.length > 0) {
                    addSkill(skillSuggestions[0]);
                  } else {
                    addCustomSkill();
                  }
                }
              }}
              placeholder="Search or add a skill..."
              className="input pr-20"
              style={{ paddingLeft: "2.75rem" }}
            />

            <button
              type="button"
              onClick={addCustomSkill}
              disabled={!skillQuery.trim()}
              className="absolute right-2 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-3.5" />
              Add
            </button>

            {skillOpen && skillQuery.trim() && (
              <div className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-hair bg-white p-1.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.25)]">
                {skillSuggestions.length > 0 ? (
                  skillSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => addSkill(s)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-neutral-100"
                    >
                      <Icon icon={getSkillIcon(s)} className="size-5" />
                      <span className="flex-1 font-medium">{s}</span>
                      <Plus className="size-4 text-muted" />
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition hover:bg-neutral-100"
                  >
                    <div className="grid size-7 place-items-center rounded-lg border border-dashed border-hair bg-neutral-50">
                      <Code2 className="size-4 text-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Add "{skillQuery.trim()}"</p>
                      <p className="mt-0.5 text-xs text-muted">Add this as a custom skill</p>
                    </div>
                    <Plus className="size-4 text-muted" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {skills.length === 0 && (
              <p className="text-sm text-muted">No skills added yet.</p>
            )}

            {skills.map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 rounded-full border border-hair py-1.5 pl-2.5 pr-1.5 text-sm font-medium"
              >
                <Icon icon={getSkillIcon(s)} className="size-4 text-muted" />
                {s}
                <button
                  onClick={() => setSkills((p) => p.filter((x) => x !== s))}
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
            {achievements.map((a, i) => {
              const titleText = typeof a === "string" ? a : a.title;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-hair px-3.5 py-3"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-ink font-mono text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm">{titleText}</span>
                  <button
                    onClick={() => setAchievements((p) => p.filter((_, idx) => idx !== i))}
                    className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-ink hover:text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={achieveInput}
              onChange={(e) => setAchieveInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && achieveInput.trim()) {
                  setAchievements((p) => [...p, { title: achieveInput.trim(), description: "", date: "" }]);
                  setAchieveInput("");
                }
              }}
              placeholder="e.g. Hackathon finalist 2025"
              className="input flex-1"
            />
            <button
              onClick={() => {
                if (!achieveInput.trim()) return;
                setAchievements((p) => [...p, { title: achieveInput.trim(), description: "", date: "" }]);
                setAchieveInput("");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </Card>

        {saveError && (
          <p className="px-1 text-sm font-medium text-red-600">{saveError}</p>
        )}

        {/* Action bar */}
        <div className="flex gap-3">
          <button
            onClick={() => (onClose ? onClose() : router.push("/dashboard/Userprofile"))}
            className="flex-1 rounded-full border border-hair bg-white px-5 py-3 text-sm font-medium transition hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : saved ? (
              <Check className="size-4" />
            ) : null}
            {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
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
