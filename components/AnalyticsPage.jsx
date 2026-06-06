import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* =========================================================================
   ClubConnect — Event Responses & Analytics (standalone JSX)
   Purpose: a college-club admin views responses to event / hackathon
   registration forms here. One file, no utility classes, copy-paste ready.
   Deps: react, recharts, xlsx
   ========================================================================= */

const EVENTS = ["HackVerse 2026", "Robo Wars", "Cultural Night", "Photo Walk", "Startup Pitch", "Open Mic"];
const DEPTS = ["CSE", "ECE", "ME", "EE", "Civil", "BBA", "Design"];
const YEARS = ["1st", "2nd", "3rd", "4th"];
const SKILLS = ["Frontend", "Backend", "AI/ML", "Design", "Hardware", "Pitching", "Video", "Writing"];
const HEAR = ["Instagram", "Friends", "Posters", "WhatsApp", "Notice board"];
const FIRSTS = ["Aarav","Diya","Ishaan","Ananya","Vihaan","Saanvi","Kabir","Myra","Arjun","Aisha","Rohan","Zara","Neel","Tara","Veer","Anika","Reyansh","Kiara","Aryan","Mira"];
const LASTS = ["Sharma","Patel","Reddy","Khan","Mehta","Iyer","Nair","Gupta","Joshi","Verma"];

const COLORS = ["#ff3d8b", "#ff7a3d", "#ffc93d", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

function seeded(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32; }
const rnd = seeded(42);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pickN = (a, n) => {
  const c = [...a]; const out = [];
  for (let i = 0; i < n && c.length; i++) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]);
  return out;
};

const RESPONSES = Array.from({ length: 142 }, (_, i) => {
  const fn = pick(FIRSTS); const ln = pick(LASTS);
  const d = new Date(Date.now() - Math.floor(rnd() * 1000 * 60 * 60 * 24 * 21));
  const future = new Date(Date.now() + Math.floor(rnd() * 1000 * 60 * 60 * 24 * 30));
  const hour = 9 + Math.floor(rnd() * 11);
  return {
    id: `R-${1000 + i}`,
    name: `${fn} ${ln}`,                                  // Short answer
    email: `${fn}.${ln}`.toLowerCase() + "@college.edu",  // Short answer
    year: pick(YEARS),                                    // Dropdown
    department: pick(DEPTS),                              // Dropdown
    event: pick(EVENTS),                                  // Multiple choice
    teamSize: 1 + Math.floor(rnd() * 5),                  // Linear scale 1–5
    skills: pickN(SKILLS, 1 + Math.floor(rnd() * 4)),     // Checkboxes
    experience: 1 + Math.floor(rnd() * 5),                // Rating 1–5
    hearAbout: pick(HEAR),                                // Multiple choice
    eventDate: future.toISOString().slice(0, 10),         // Date
    arrivalTime: `${String(hour).padStart(2,"0")}:00`,    // Time
    expectations: pick([                                  // Paragraph
      "Excited to learn and meet new people.",
      "Hoping to build a strong project with my team.",
      "Looking for mentorship from seniors.",
      "Want to win and have fun.",
      "First hackathon — nervous but ready!",
      "Need a team — happy to collaborate.",
      "Just here for the food and the demos.",
    ]),
    resume: rnd() > 0.5 ? `${fn.toLowerCase()}-resume.pdf` : "", // File upload
    submittedAt: d.toISOString(),
  };
});

const countBy = (rows, key) => {
  const m = new Map();
  rows.forEach((r) => {
    const v = typeof key === "function" ? key(r) : r[key];
    if (Array.isArray(v)) v.forEach((x) => m.set(x, (m.get(x) || 0) + 1));
    else m.set(v, (m.get(v) || 0) + 1);
  });
  return Array.from(m, ([name, value]) => ({ name: String(name), value }));
};

/* ----------------------------- Page ----------------------------- */
export default function ResponsesPage() {
  const [tab, setTab] = useState("summary");
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("All");

  const filtered = useMemo(() => RESPONSES.filter((r) => {
    const q = query.toLowerCase().trim();
    const matchesQ = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.event.toLowerCase().includes(q);
    const matchesE = eventFilter === "All" || r.event === eventFilter;
    return matchesQ && matchesE;
  }), [query, eventFilter]);

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      ID: r.id, Name: r.name, Email: r.email, Year: r.year, Department: r.department,
      Event: r.event, "Team Size": r.teamSize, Skills: r.skills.join(", "),
      "Experience (1-5)": r.experience, "Heard Via": r.hearAbout,
      "Event Date": r.eventDate, "Arrival Time": r.arrivalTime,
      Expectations: r.expectations, Resume: r.resume || "—",
      "Submitted At": new Date(r.submittedAt).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map((k) => ({ wch: Math.max(k.length, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `clubconnect-responses-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="cc-root">
      <Styles />

      <header className="cc-header">
        <div className="cc-header-inner">
          <div className="cc-brand">
            <div className="cc-logo">CC</div>
            <div>
              <div className="cc-brand-name">ClubConnect</div>
              <div className="cc-brand-sub">Event Responses</div>
            </div>
          </div>
          <nav className="cc-nav">
            <span className="cc-nav-item">Questions</span>
            <span className="cc-nav-item cc-nav-active">Responses</span>
            <span className="cc-nav-item">Settings</span>
          </nav>
          <button className="cc-btn cc-btn-primary" onClick={exportExcel}>
            <DownloadIcon /> Export Excel
          </button>
        </div>
      </header>

      <main className="cc-main">
        <section className="cc-title">
          <h1>Responses</h1>
          <p><b>{filtered.length}</b> of {RESPONSES.length} registrations</p>
        </section>

        <div className="cc-toolbar">
          <div className="cc-tabs">
            {[["summary","Summary"],["question","Question"],["individual","Individual"]].map(([k,label]) => (
              <button key={k} className={"cc-tab " + (tab === k ? "cc-tab-active" : "")} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="cc-filters">
            <div className="cc-search">
              <SearchIcon />
              <input placeholder="Search name, email, event…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="cc-select">
              <option>All</option>
              {EVENTS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="cc-content">
          {tab === "summary" && <SummaryView rows={filtered} />}
          {tab === "question" && <QuestionView rows={filtered} />}
          {tab === "individual" && <IndividualView rows={filtered} />}
        </div>
      </main>
    </div>
  );
}

/* ----------------------------- Summary ----------------------------- */
/* Only what an event organizer actually needs:
   - Headline stats
   - Registrations over time
   - Top events (which forms are pulling in students)
   - Year of study (audience seniority)
   - Department mix (donut)
*/
function SummaryView({ rows }) {
  const timeline = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const d = r.submittedAt.slice(0, 10);
      m.set(d, (m.get(d) || 0) + 1);
    });
    return Array.from(m, ([date, count]) => ({ date: date.slice(5), count })).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const events = countBy(rows, "event").sort((a, b) => b.value - a.value);
  const year = countBy(rows, "year").sort((a, b) => a.name.localeCompare(b.name));
  const dept = countBy(rows, "department");

  const avgTeam = rows.length ? (rows.reduce((s, r) => s + r.teamSize, 0) / rows.length).toFixed(1) : "0";
  const topEvent = events[0]?.name || "—";

  return (
    <div className="cc-grid">
      <StatCard label="Total registrations" value={rows.length} sub="across all events" color={COLORS[0]} />
      <StatCard label="Active events" value={new Set(rows.map((r) => r.event)).size} sub={`of ${EVENTS.length} live`} color={COLORS[3]} />
      <StatCard label="Avg team size" value={avgTeam} sub="students per entry" color={COLORS[5]} />
      <StatCard label="Top event" value={topEvent} sub={`${events[0]?.value || 0} signups`} color={COLORS[1]} small />

      <Card title="Registrations over time" wide>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS[5]} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={COLORS[0]} />
                  <stop offset="100%" stopColor={COLORS[5]} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="url(#gLine)" strokeWidth={3} fill="url(#gArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Department mix">
        <PieBlock data={dept} />
      </Card>

      <Card title="Top events" wide>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={events} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {events.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Year of study">
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={year} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {year.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------- Question ----------------------------- */
/* One card per Google-Forms question type, with a chart that fits it. */
function QuestionView({ rows }) {
  const events = countBy(rows, "event");
  const hear = countBy(rows, "hearAbout");
  const dept = countBy(rows, "department");
  const year = countBy(rows, "year").sort((a,b)=>a.name.localeCompare(b.name));
  const skills = countBy(rows, "skills").sort((a, b) => b.value - a.value);

  const teamScale = useMemo(() => {
    const m = new Map([[1,0],[2,0],[3,0],[4,0],[5,0]]);
    rows.forEach((r) => m.set(r.teamSize, (m.get(r.teamSize) || 0) + 1));
    return Array.from(m, ([name, value]) => ({ name: String(name), value }));
  }, [rows]);
  const avgTeam = rows.length ? (rows.reduce((s, r) => s + r.teamSize, 0) / rows.length).toFixed(2) : "0";

  const ratingDist = useMemo(() => {
    const m = new Map([[1,0],[2,0],[3,0],[4,0],[5,0]]);
    rows.forEach((r) => m.set(r.experience, (m.get(r.experience) || 0) + 1));
    return Array.from(m, ([name, value]) => ({ name: name + "★", value }));
  }, [rows]);
  const avgRating = rows.length ? (rows.reduce((s, r) => s + r.experience, 0) / rows.length).toFixed(2) : "0";

  const dateDist = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.eventDate, (m.get(r.eventDate) || 0) + 1));
    return Array.from(m, ([name, value]) => ({ name: name.slice(5), value })).sort((a,b)=>a.name.localeCompare(b.name));
  }, [rows]);

  const timeDist = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => m.set(r.arrivalTime, (m.get(r.arrivalTime) || 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a,b)=>a.name.localeCompare(b.name));
  }, [rows]);

  const filesCount = rows.filter((r) => r.resume).length;

  return (
    <div className="cc-qcol">
      <QCard q="Q1 · Your full name" type="Short answer">
        <ShortAnswerList items={rows.slice(0, 8).map((r) => r.name)} total={rows.length} />
      </QCard>

      <QCard q="Q2 · Email address" type="Short answer">
        <ShortAnswerList items={rows.slice(0, 8).map((r) => r.email)} total={rows.length} />
      </QCard>

      <QCard q="Q3 · Which event are you registering for?" type="Multiple choice">
        <PieBlock data={events} />
      </QCard>

      <QCard q="Q4 · Year of study" type="Dropdown">
        <BarsList data={year} />
      </QCard>

      <QCard q="Q5 · Department" type="Dropdown">
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dept} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10,10,0,0]}>
                {dept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </QCard>

      <QCard q="Q6 · Skills you bring (select all that apply)" type="Checkboxes">
        <BarsList data={skills} />
      </QCard>

      <QCard q="Q7 · Preferred team size" type={`Linear scale 1–5 · avg ${avgTeam}`}>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamScale} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10,10,0,0]}>
                {teamScale.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </QCard>

      <QCard q="Q8 · How experienced are you?" type={`Rating · avg ${avgRating} / 5`}>
        <RatingBlock data={ratingDist} avg={+avgRating} />
      </QCard>

      <QCard q="Q9 · Preferred event date" type="Date">
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dateDist} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={COLORS[4]} strokeWidth={3} dot={{ r: 3, fill: COLORS[4] }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </QCard>

      <QCard q="Q10 · Preferred arrival time" type="Time">
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeDist} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10,10,0,0]}>
                {timeDist.map((_, i) => <Cell key={i} fill={COLORS[(i+1) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </QCard>

      <QCard q="Q11 · How did you hear about us?" type="Multiple choice">
        <BarsList data={hear} />
      </QCard>

      <QCard q="Q12 · What do you hope to get out of this event?" type="Paragraph">
        <div className="cc-quotes">
          {rows.slice(0, 6).map((r) => (
            <blockquote key={r.id} className="cc-quote">
              <p>“{r.expectations}”</p>
              <cite>— {r.name}</cite>
            </blockquote>
          ))}
        </div>
      </QCard>

      <QCard q="Q13 · Upload your resume" type="File upload">
        <FileBlock total={rows.length} count={filesCount} files={rows.filter(r=>r.resume).slice(0,6)} />
      </QCard>
    </div>
  );
}

/* ----------------------------- Individual ----------------------------- */
function IndividualView({ rows }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const selected = rows.find((r) => r.id === selectedId) || rows[0];

  return (
    <div className="cc-indiv">
      <aside className="cc-indiv-list">
        <div className="cc-indiv-list-head">Submissions</div>
        <div className="cc-indiv-list-scroll">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={"cc-indiv-item " + (r.id === selected?.id ? "cc-indiv-item-active" : "")}
            >
              <div className="cc-indiv-name">{r.name}</div>
              <div className="cc-indiv-meta">{r.event} · {new Date(r.submittedAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="cc-indiv-detail">
        {selected && (
          <>
            <header className="cc-indiv-header">
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.email}</p>
              </div>
              <span className="cc-pill">{selected.id}</span>
            </header>

            <div className="cc-fields">
              <Field label="Event">{selected.event}</Field>
              <Field label="Year">{selected.year}</Field>
              <Field label="Department">{selected.department}</Field>
              <Field label="Team size">{selected.teamSize}</Field>
              <Field label="Skills">{selected.skills.join(", ")}</Field>
              <Field label="Experience">{"★".repeat(selected.experience)}{"☆".repeat(5 - selected.experience)}</Field>
              <Field label="Heard via">{selected.hearAbout}</Field>
              <Field label="Event date">{selected.eventDate}</Field>
              <Field label="Arrival time">{selected.arrivalTime}</Field>
              <Field label="Resume">{selected.resume || "—"}</Field>
            </div>

            <div className="cc-feedback">
              <div className="cc-feedback-label">Expectations</div>
              <p>{selected.expectations}</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ----------------------------- Building blocks ----------------------------- */
function Card({ title, wide, children }) {
  return (
    <div className={"cc-card " + (wide ? "cc-card-wide" : "")}>
      <div className="cc-card-title">{title}</div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color, small }) {
  return (
    <div className="cc-stat">
      <div className="cc-stat-dot" style={{ background: color }} />
      <div className="cc-stat-label">{label}</div>
      <div className={"cc-stat-value " + (small ? "cc-stat-value-sm" : "")}>{value}</div>
      <div className="cc-stat-sub">{sub}</div>
    </div>
  );
}

function QCard({ q, type, children }) {
  return (
    <div className="cc-card">
      <div className="cc-q-head">
        <div className="cc-q-title">{q}</div>
        <span className="cc-pill">{type}</span>
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

function BarsList({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <ul className="cc-bars">
      {sorted.map((d, i) => {
        const pct = Math.round((d.value / total) * 100);
        return (
          <li key={d.name} className="cc-bar-row">
            <div className="cc-bar-label">
              <span>{d.name}</span>
              <span className="cc-bar-count">{d.value} · {pct}%</span>
            </div>
            <div className="cc-bar-track">
              <div className="cc-bar-fill" style={{ width: pct + "%", background: COLORS[i % COLORS.length] }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PieBlock({ data }) {
  return (
    <div style={{ height: 280, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius="48%" outerRadius="78%" paddingAngle={2} stroke="#fff" strokeWidth={2}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: "#444" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function RatingBlock({ data, avg }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <div className="cc-rating-head">
        <div className="cc-rating-num">{avg.toFixed(1)}</div>
        <div>
          <div className="cc-rating-stars">
            {[1,2,3,4,5].map((i) => (
              <span key={i} style={{ color: i <= Math.round(avg) ? COLORS[2] : "#e5e5e5" }}>★</span>
            ))}
          </div>
          <div className="cc-rating-sub">{total} responses</div>
        </div>
      </div>
      <ul className="cc-bars" style={{ marginTop: 14 }}>
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <li key={d.name} className="cc-bar-row">
              <div className="cc-bar-label">
                <span>{d.name}</span>
                <span className="cc-bar-count">{d.value} · {pct}%</span>
              </div>
              <div className="cc-bar-track">
                <div className="cc-bar-fill" style={{ width: pct + "%", background: COLORS[i % COLORS.length] }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ShortAnswerList({ items, total }) {
  return (
    <div>
      <div className="cc-sa-meta">{total} responses · showing latest {items.length}</div>
      <ul className="cc-sa-list">
        {items.map((t, i) => (
          <li key={i} className="cc-sa-item">{t}</li>
        ))}
      </ul>
    </div>
  );
}

function FileBlock({ total, count, files }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="cc-file-stats">
        <div>
          <div className="cc-file-num">{count}</div>
          <div className="cc-file-sub">files uploaded · {pct}% of registrants</div>
        </div>
        <div className="cc-file-bar">
          <div className="cc-file-fill" style={{ width: pct + "%" }} />
        </div>
      </div>
      <ul className="cc-sa-list" style={{ marginTop: 14 }}>
        {files.map((r) => (
          <li key={r.id} className="cc-sa-item cc-file-item">
            <FileIcon /> <span>{r.resume}</span> <em>— {r.name}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="cc-field">
      <div className="cc-field-label">{label}</div>
      <div className="cc-field-value">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #ececec",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  padding: "8px 12px",
};

/* ----------------------------- Icons ----------------------------- */
function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

/* ----------------------------- Styles ----------------------------- */
function Styles() {
  return (
    <style>{`
      .cc-root {
        --bg: #fafafa;
        --fg: #0a0a0a;
        --muted: #6b7280;
        --border: #ececec;
        --card: #ffffff;
        --accent: #f4f4f5;
        font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: var(--bg);
        color: var(--fg);
        min-height: 100vh;
      }
      .cc-root *, .cc-root *::before, .cc-root *::after { box-sizing: border-box; }

      /* Header */
      .cc-header {
        position: sticky; top: 0; z-index: 50;
        background: rgba(250,250,250,0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border);
      }
      .cc-header-inner {
        max-width: 1200px; margin: 0 auto;
        padding: 14px 20px;
        display: flex; align-items: center; gap: 20px;
      }
      .cc-brand { display: flex; align-items: center; gap: 12px; }
      .cc-logo {
        width: 38px; height: 38px; border-radius: 12px;
        background: #0a0a0a; color: #fff;
        display: grid; place-items: center;
        font-weight: 700; font-size: 14px; letter-spacing: 0.5px;
      }
      .cc-brand-name { font-weight: 600; font-size: 15px; }
      .cc-brand-sub { font-size: 12px; color: var(--muted); }
      .cc-nav { display: none; margin-left: auto; gap: 6px; }
      @media (min-width: 768px) { .cc-nav { display: flex; } }
      .cc-nav-item {
        padding: 8px 14px; font-size: 13px; color: var(--muted);
        border-radius: 999px; cursor: pointer;
      }
      .cc-nav-active { background: #0a0a0a; color: #fff; }
      .cc-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 9px 16px; border-radius: 999px;
        font-size: 13px; font-weight: 500;
        border: 1px solid var(--border);
        background: #fff; color: var(--fg);
        cursor: pointer; transition: all 0.15s;
        margin-left: auto;
      }
      @media (min-width: 768px) { .cc-btn { margin-left: 0; } }
      .cc-btn:hover { background: var(--accent); }
      .cc-btn-primary { background: #0a0a0a; color: #fff; border-color: #0a0a0a; }
      .cc-btn-primary:hover { background: #222; }

      /* Main */
      .cc-main { max-width: 1200px; margin: 0 auto; padding: 32px 20px 80px; }
      .cc-title h1 {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: clamp(40px, 6vw, 64px);
        margin: 0; letter-spacing: -0.02em; font-weight: 400; line-height: 1;
      }
      .cc-title p { margin: 10px 0 0; color: var(--muted); font-size: 14px; }
      .cc-title b { color: var(--fg); font-weight: 600; }

      /* Toolbar */
      .cc-toolbar {
        display: flex; flex-direction: column; gap: 12px;
        margin-top: 28px;
      }
      @media (min-width: 768px) {
        .cc-toolbar { flex-direction: row; align-items: center; justify-content: space-between; }
      }
      .cc-tabs {
        display: inline-flex; padding: 4px;
        background: var(--accent); border-radius: 999px;
        gap: 2px; width: fit-content;
      }
      .cc-tab {
        padding: 8px 18px; border: 0; background: transparent;
        font-size: 13px; color: var(--muted); cursor: pointer;
        border-radius: 999px; font-weight: 500;
      }
      .cc-tab-active { background: #fff; color: var(--fg); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
      .cc-filters { display: flex; gap: 8px; flex-wrap: wrap; }
      .cc-search {
        position: relative; display: flex; align-items: center;
        background: #fff; border: 1px solid var(--border);
        border-radius: 999px; padding: 0 14px; flex: 1;
      }
      .cc-search svg { color: var(--muted); flex-shrink: 0; }
      .cc-search input {
        border: 0; outline: 0; background: transparent;
        padding: 10px 8px; font-size: 13px; width: 100%;
        font-family: inherit; color: var(--fg);
      }
      @media (min-width: 640px) { .cc-search { min-width: 280px; flex: 0 1 auto; } }
      .cc-select {
        border: 1px solid var(--border); border-radius: 999px;
        padding: 0 14px; height: 40px; background: #fff;
        font-size: 13px; font-family: inherit; outline: 0; cursor: pointer;
      }

      /* Content grid */
      .cc-content { margin-top: 24px; }
      .cc-grid {
        display: grid; gap: 16px;
        grid-template-columns: repeat(1, 1fr);
      }
      @media (min-width: 640px) { .cc-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (min-width: 1024px) { .cc-grid { grid-template-columns: repeat(4, 1fr); } }
      .cc-card {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 18px; padding: 20px;
        transition: box-shadow 0.2s;
      }
      .cc-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.04); }
      .cc-card-wide { grid-column: 1 / -1; }
      @media (min-width: 1024px) { .cc-card-wide { grid-column: span 2; } }
      .cc-card-title { font-size: 13px; font-weight: 600; color: var(--fg); margin-bottom: 12px; letter-spacing: -0.01em; }

      /* Stat card */
      .cc-stat {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 18px; padding: 20px; position: relative; overflow: hidden;
      }
      .cc-stat-dot {
        width: 10px; height: 10px; border-radius: 50%; margin-bottom: 12px;
        box-shadow: 0 0 0 4px rgba(0,0,0,0.04);
      }
      .cc-stat-label { font-size: 12px; color: var(--muted); }
      .cc-stat-value {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: 40px; font-weight: 400; line-height: 1; margin: 8px 0 6px;
        letter-spacing: -0.02em;
      }
      .cc-stat-value-sm { font-size: 22px; line-height: 1.2; }
      .cc-stat-sub { font-size: 11px; color: var(--muted); }

      /* Question view */
      .cc-qcol { display: flex; flex-direction: column; gap: 16px; }
      .cc-q-head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 12px; flex-wrap: wrap;
      }
      .cc-q-title { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
      .cc-pill {
        font-size: 11px; padding: 4px 10px; border-radius: 999px;
        background: var(--accent); color: var(--muted); white-space: nowrap;
      }

      /* Bars list */
      .cc-bars { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
      .cc-bar-row { display: flex; flex-direction: column; gap: 6px; }
      .cc-bar-label { display: flex; justify-content: space-between; font-size: 13px; }
      .cc-bar-count { color: var(--muted); font-variant-numeric: tabular-nums; }
      .cc-bar-track {
        height: 10px; background: var(--accent); border-radius: 999px; overflow: hidden;
      }
      .cc-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }

      /* Rating */
      .cc-rating-head { display: flex; align-items: center; gap: 16px; }
      .cc-rating-num {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: 52px; line-height: 1; letter-spacing: -0.02em;
      }
      .cc-rating-stars { font-size: 20px; letter-spacing: 2px; }
      .cc-rating-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

      /* Short answer / file lists */
      .cc-sa-meta { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
      .cc-sa-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .cc-sa-item {
        padding: 10px 14px; background: var(--accent);
        border-radius: 10px; font-size: 13px;
      }
      .cc-file-item { display: flex; align-items: center; gap: 8px; }
      .cc-file-item svg { color: var(--muted); flex-shrink: 0; }
      .cc-file-item em { color: var(--muted); font-style: normal; font-size: 12px; margin-left: auto; }
      .cc-file-stats {
        display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        padding: 14px; background: var(--accent); border-radius: 12px;
      }
      .cc-file-num {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: 36px; line-height: 1;
      }
      .cc-file-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
      .cc-file-bar {
        flex: 1; min-width: 120px; height: 8px;
        background: #fff; border-radius: 999px; overflow: hidden;
      }
      .cc-file-fill {
        height: 100%;
        background: linear-gradient(90deg, ${COLORS[0]}, ${COLORS[5]});
        border-radius: 999px;
      }

      /* Quotes */
      .cc-quotes { display: grid; gap: 12px; grid-template-columns: 1fr; }
      @media (min-width: 768px) { .cc-quotes { grid-template-columns: 1fr 1fr; } }
      .cc-quote {
        margin: 0; padding: 14px 16px; background: var(--accent);
        border-radius: 12px; border-left: 3px solid ${COLORS[0]};
      }
      .cc-quote p { margin: 0; font-size: 14px; line-height: 1.5; }
      .cc-quote cite {
        display: block; margin-top: 8px; font-size: 12px;
        color: var(--muted); font-style: normal;
      }

      /* Individual */
      .cc-indiv {
        display: grid; gap: 16px;
        grid-template-columns: 1fr;
      }
      @media (min-width: 900px) {
        .cc-indiv { grid-template-columns: 300px 1fr; }
      }
      .cc-indiv-list {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 18px; overflow: hidden;
        max-height: 640px; display: flex; flex-direction: column;
      }
      .cc-indiv-list-head {
        padding: 14px 16px; font-size: 12px; font-weight: 600;
        color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border);
      }
      .cc-indiv-list-scroll { overflow-y: auto; flex: 1; }
      .cc-indiv-item {
        display: block; width: 100%; text-align: left;
        padding: 12px 16px; background: transparent;
        border: 0; border-bottom: 1px solid var(--border);
        cursor: pointer; transition: background 0.12s;
        font-family: inherit;
      }
      .cc-indiv-item:hover { background: var(--accent); }
      .cc-indiv-item-active { background: #0a0a0a; color: #fff; }
      .cc-indiv-item-active .cc-indiv-meta { color: rgba(255,255,255,0.7); }
      .cc-indiv-name { font-size: 13px; font-weight: 500; }
      .cc-indiv-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }

      .cc-indiv-detail {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 18px; padding: 24px;
      }
      .cc-indiv-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 20px;
      }
      .cc-indiv-header h2 {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: 32px; margin: 0; font-weight: 400; letter-spacing: -0.02em;
      }
      .cc-indiv-header p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }

      .cc-fields {
        display: grid; gap: 12px;
        grid-template-columns: 1fr;
      }
      @media (min-width: 640px) { .cc-fields { grid-template-columns: 1fr 1fr; } }
      @media (min-width: 900px) { .cc-fields { grid-template-columns: 1fr 1fr 1fr; } }
      .cc-field {
        padding: 12px 14px; background: var(--accent);
        border-radius: 12px;
      }
      .cc-field-label {
        font-size: 11px; color: var(--muted);
        text-transform: uppercase; letter-spacing: 0.05em;
      }
      .cc-field-value { font-size: 13px; margin-top: 4px; word-break: break-word; }

      .cc-feedback {
        margin-top: 18px; padding: 16px;
        border: 1px solid var(--border); border-radius: 14px;
      }
      .cc-feedback-label {
        font-size: 11px; color: var(--muted); margin-bottom: 8px;
        text-transform: uppercase; letter-spacing: 0.05em;
      }
      .cc-feedback p { margin: 0; font-size: 14px; line-height: 1.55; }
    `}</style>
  );
}
