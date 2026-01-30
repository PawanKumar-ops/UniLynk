 export function submit (names, branch, year, skill) {
    if (names.trim() === "") {
      alert("enter name");
    }
    if (branch.trim() === "") {
      alert("enter a branch");
    }
    if (year.trim() === "") {
      alert("enter year");
    }
    if (skill.trim() === "") {
      alert("enter skills");
    }else {
      


    }



  };

  async function saveName(names) {
  const res = await fetch("/api/user/update-name", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email, // or wherever you stored email
      name: names,
    }),
  });

  const data = await res.json();
  console.log(data);
}