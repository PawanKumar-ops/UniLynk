"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "./UserinfoForm.css";
import { SKILLS } from "@/lib/skillsList";
import { X } from "lucide-react";

export default function UserinfoPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [skillSuggestions, setSkillSuggestions] = useState([]);


  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!skillInput.trim()) {
      setSkillSuggestions([]);
      return;
    }

    const filtered = SKILLS.filter(
      (skill) =>
        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
        !skills.includes(skill)
    ).slice(0, 6); // limit suggestions

    setSkillSuggestions(filtered);
  }, [skillInput, skills]);

  const addSuggestedSkill = (skill) => {
    if (skills.includes(skill)) return;
    setSkills([...skills, skill]);
    setSkillInput("");
    setSkillSuggestions([]);
  };


  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;

    const formatted =
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

    if (skills.includes(formatted)) return;

    setSkills([...skills, formatted]);
    setSkillInput("");
  };



  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };


  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Max size is 5MB");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // UPDATE USER STATE INSTEAD OF RELOADING
      setUser((prev) => ({
        ...(prev || {}),
        img: data.url,
      }));

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !branch || !year) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // REQUIRED for NextAuth
        body: JSON.stringify({ name, branch, year, skills }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Session expired. Please sign in again.");
        router.push("/");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Profile update failed");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) return;

      const data = await res.json();

      setUser(data);

      //  PREFILL FORM VALUES
      setName(data.name || "");
      setBranch(data.branch || "");
      setYear(data.year || "");
      setSkills(data.skills || []);
    };

    fetchUser();
  }, []);

  return (

    <div className="userinfoformbody">
      <form className='userdetailcard' onSubmit={handleSubmit}>
        <div className="detailhead">
          <div className="userprofilepic">
            <div className={`defaultimg ${user?.img ? "has-img" : "no-img"}`} onClick={handleAvatarClick}>
              <img
                key={user?.img} //  forces re-render
                src={
                  user?.img
                    ? `${user.img}?t=${Date.now()}`
                    : "https://res.cloudinary.com/dpzqayckn/image/upload/v1770035267/default-avatar-profile-icon-_d6zcya.avif"
                }
                alt="profile"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </div>

          <div className="plus" onClick={handleAvatarClick}>+</div>
          <div className="headtext">
            <div className="unilynk">Unilynk</div>
            <div className="studentreg">Student Registration</div>
          </div>
        </div>
        <div className="detailmain">
          <div className="name">
            <div className="detailslabel"> <img className='detailsicon' src="/Userprofile/name.svg" alt="" />NAME</div>
            <input className='nameinput' type="text"
              value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="branch-year">
            <div className="branch">
              <div className="detailslabel"><img className='detailsicon' src="/Userprofile/Suitcase.svg" alt="" />BRANCH</div>
              <select required className='branch-yearinput' name="branch" value={branch}
                onChange={(e) => setBranch(e.target.value)}>
                <option value="Select">Select</option>
                <option value="Production and Industrial Engineering">Production and Industrial Engineering(B.Tech)</option>
                <option value="Computer Science and Engineering">Computer Science and Engineering(B.Tech)</option>
                <option value="Computer Science and Engineering (5 Years, (Dual Degree))">Computer Science and Engineering(B.Tech & M.Tech)</option>
                <option value="Information Technology">Information Technology(B.Tech)</option>
                <option value="Mechanical Engineering">Mechanical Engineering(B.Tech)</option>
                <option value="Mechanical Engineering (5 Years, (Dual Degree)) ">Mechanical Engineering(B.Tech & M.Tech)</option>
                <option value="Electrical Engineering">Electrical Engineering(B.Tech)</option>
                <option value="Electrical Engineering (5 Years, (Dual Degree))">Electrical Engineering(B.Tech & M.Tech)</option>
                <option value="Electronics and Communication Engineering">Electronics and Communication Engineering(B.Tech)</option>
                <option value="Electronics and Communication Engineering (5 Years, (Dual Degree))">Electronics and Communication Engineering(B.Tech & M.Tech)</option>
                <option value="Civil Engineering">Civil Engineering(B.Tech)</option>
                <option value="Civil Engineering (5 Years, (Dual Degree))">Civil Engineering(B.Tech & M.Tech)</option>
                <option value="Mathematics and Computing">Mathematics and Computing(B.Tech)</option>
                <option value="Sustainable Energy Technologies">SUSTAINABLE ENERGY TECHNOLOGIES(B.Tech)</option>
                <option value="Robotics & Automation">ROBOTICS & AUTOMATION(B.Tech)</option>
                <option value="Microelectronics & VLSI Engineering">Microelectronics & VLSI Engineering(B.Tech)</option>
                <option value="Industrial Internet of Things">Industrial Internet of Things(B.Tech)</option>
                <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning(B.Tech)</option>
                <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science(B.Tech)</option>
                <option value="Architecture">	Architecture</option>
              </select>
            </div>
            <div className="year">
              <div className="detailslabel"><img className='detailsicon' src="/Userprofile/book.svg" alt="" />YEAR</div>
              <select required className='branch-yearinput' name="year" id="" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="select">Select</option>
                <option value="First Year">First</option>
                <option value="Second Year">Second</option>
                <option value="Third Year">Third</option>
                <option value="Fourth Year">Fourth</option>
                <option value="Fifth Year">Fifth</option>
              </select>
            </div>
          </div>

          <div className="skills">
            <div className="detailslabel">
              <img className="detailsicon" src="/Userprofile/name.svg" alt="" />
              SKILLS
            </div>

            <div className="skill-input-wrapper">
              <input
                className="skillsinput"
                placeholder="Start typing a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />

              {/*  Floating Suggestions */}
              {skillSuggestions.length > 0 && (
                <div className="skill-fab">
                  {skillSuggestions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="skill-fab-item"
                      onClick={() => addSuggestedSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chips */}
            <div className="skill-chips">
              {skills.map((skill, index) => (
                <span key={index} className="skill-chip">
                  {skill}
                  <button type="button" onClick={() => removeSkill(index)}><X /></button>
                </span>
              ))}
            </div>
          </div>



          <button id="submitusr" type="submit" disabled={saving}>
            {saving ? "Saving..." : "SUBMIT PROFILE"}
          </button>

          <hr className='mt-6 mb-2' />

          <div className="pwdbyunilynk">
            <div className="pwd">POWERED BY</div>
            <div className="unilynkt">UNILYNK</div>
          </div>

        </div>
      </form>
    </div>
  )
} 