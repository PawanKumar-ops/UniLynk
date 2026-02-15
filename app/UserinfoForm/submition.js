export async function submit(name, branch, year, skills) {
  if (!name.trim()) {
    alert("Enter name");
    return;
  }

  if (!branch.trim()) {
    alert("Enter a branch");
    return;
  }

  if (!year.trim()) {
    alert("Enter year");
    return;
  }

  if (!Array.isArray(skills) || skills.length === 0) {
    alert("Enter at least one skill");
    return;
  }

  // SEND TO BACKEND
  const res = await fetch("/api/user/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name,
      branch,
      year,
      skills, // ✅ ARRAY
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to save profile");
  }
}
