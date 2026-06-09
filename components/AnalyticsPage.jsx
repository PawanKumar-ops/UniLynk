"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Avatar from "./Avatar";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "#5B8FF9",
  "#9270CA",
  "#5AD8A6",
  "#F6BD16",
  "#E8684A",
  "#6DC8EC",
  "#269A99",
  "#F6903D",
];

const QUESTION_TYPE_LABELS = {
  short: "Short answer",
  long: "Paragraph",
  multiple: "Multiple choice",
  checkbox: "Checkboxes",
  dropdown: "Dropdown",
  date: "Date",
  time: "Time",
  email: "Email",
  phone: "Phone",
};

const countBy = (rows, key) => {
  const m = new Map();
  rows.forEach((r) => {
    const v = typeof key === "function" ? key(r) : r[key];
    if (Array.isArray(v)) v.forEach((x) => x !== undefined && x !== null && x !== "" && m.set(x, (m.get(x) || 0) + 1));
    else if (v !== undefined && v !== null && v !== "") m.set(v, (m.get(v) || 0) + 1);
  });
  return Array.from(m, ([name, value]) => ({ name: String(name), value }));
};

const clean = (value) => {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && String(item).trim() !== "");
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const includesAny = (text, words) => words.some((word) => text.includes(word));

const getAnswer = (response, questionId) => clean(response.answers?.[questionId]);

const findAnswer = (response, questions, matcher) => {
  const question = questions.find((q) => matcher(q));
  return question ? getAnswer(response, question.id) : "";
};

const isFilled = (value) => Array.isArray(value) ? value.length > 0 : Boolean(value);

const getInitials = (name) => {
  const parts = name.trim().split(/\s+/).filter(p => p.toLowerCase() !== "and");
  return parts.map(p => p[0].toUpperCase()).join("");
};

const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const AVATAR_COLORS = [
  { bg: "#e8e3f7", fg: "#6e56cf" },
  { bg: "#fde8e8", fg: "#c0392b" },
  { bg: "#e3f0fd", fg: "#2b7bc0" },
  { bg: "#e6f7ee", fg: "#27ae60" },
  { bg: "#fdf3e3", fg: "#d68910" },
  { bg: "#fde8f5", fg: "#8e44ad" },
  { bg: "#e3fdf9", fg: "#16a085" },
  { bg: "#fdf5e3", fg: "#ca6f1e" },
];


const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const toShortDate = (value) => {
  const key = toDateKey(value);
  return key ? key.slice(5) : String(value || "—");
};

const formatDisplayValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return value || "—";
};

const normalizeResponses = (responses, form) => {
  const questions = form?.questions || [];
  const formTitle = form?.title || "Event";

  return (responses || []).map((response, index) => {
    const answers = response.answers || {};
    const emailAnswer = findAnswer(response, questions, (q) => q.type === "email" || includesAny((q.question || "").toLowerCase(), ["email", "e-mail"]));
    const nameAnswer = findAnswer(response, questions, (q) => includesAny((q.question || "").toLowerCase(), ["name", "full name"]));
    const yearAnswer = findAnswer(response, questions, (q) => includesAny((q.question || "").toLowerCase(), ["year", "semester"]));
    const departmentAnswer = findAnswer(response, questions, (q) => includesAny((q.question || "").toLowerCase(), ["department", "branch", "course"]));
    const teamSizeAnswer = findAnswer(response, questions, (q) => includesAny((q.question || "").toLowerCase(), ["team", "group size", "members"]));
    const numericTeamSize = Number.parseFloat(Array.isArray(teamSizeAnswer) ? teamSizeAnswer[0] : teamSizeAnswer);
    const longAnswerQuestion = questions.find((q) => q.type === "long");
    const firstTextQuestion = questions.find((q) => ["short", "long", "phone"].includes(q.type));

    return {
      id: response._id || `R-${index + 1}`,
      name: nameAnswer || response.user?.name || response.userEmail?.split("@")[0] || `Response ${index + 1}`,
      email: emailAnswer || response.userEmail || "—",
      year: yearAnswer || response.user?.year || "N/A",
      department: departmentAnswer || response.user?.branch || "N/A",
      event: formTitle,
      teamSize: Number.isFinite(numericTeamSize) && numericTeamSize > 0 ? numericTeamSize : 1,
      expectations: longAnswerQuestion ? getAnswer(response, longAnswerQuestion.id) : (firstTextQuestion ? getAnswer(response, firstTextQuestion.id) : ""),
      submittedAt: response.submittedAt || new Date().toISOString(),
      answers,
      user: response.user,
      raw: response,
    };
  });
};

/* ----------------------------- Page ----------------------------- */
export default function AnalyticsPage({ formId: formIdProp }) {
  const params = useParams();
  const formId = formIdProp || params?.formId;
  const [tab, setTab] = useState("summary");
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamFinder, setTeamFinder] = useState({ incompleteTeams: [], soloStudents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!formId) return;

    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/forms/${formId}/analytics`)
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load analytics data");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setForm(data.form || null);
        setResponses(data.responses || []);
        // Teams API contract (optional fields — safe defaults if backend doesn't return them yet):
        //   data.teams: [{ _id, name, status: 'complete'|'incomplete', members: [{name,email,...}], createdAt, ...customFields }]
        //   data.teamFinder: {
        //     incompleteTeams: [{ _id, name, members:[...], lookingForCount, createdAt }],
        //     soloStudents:    [{ _id, name, email, year, branch, skills:[], lookingFor, joinedAt }]
        //   }
        setTeams(Array.isArray(data.teams) ? data.teams : []);
        setTeamFinder({
          incompleteTeams: data?.teamFinder?.incompleteTeams || [],
          soloStudents: data?.teamFinder?.soloStudents || [],
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Unable to load analytics data");
        setForm(null);
        setResponses([]);
        setTeams([]);
        setTeamFinder({ incompleteTeams: [], soloStudents: [] });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [formId]);

  const isTeamEvent = Boolean(form?.isTeamEvent);

  const rows = useMemo(() => normalizeResponses(responses, form), [responses, form]);
  const questions = useMemo(() => form?.questions || [], [form]);
  const eventOptions = useMemo(() => (form?.title ? [form.title] : []), [form]);

  const filtered = useMemo(() => rows.filter((r) => {
    const q = query.toLowerCase().trim();
    const answerText = Object.values(r.answers || {}).flat().join(" ").toLowerCase();
    const matchesQ = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.event.toLowerCase().includes(q) || answerText.includes(q);
    const matchesE = eventFilter === "All" || r.event === eventFilter;
    return matchesQ && matchesE;
  }), [rows, query, eventFilter]);

  const exportExcel = () => {
    const data = filtered.map((r) => {
      const row = {
        ID: r.id,
        Name: r.name,
        Email: r.email,
        Year: r.year,
        Department: r.department,
        Event: r.event,
        "Submitted At": new Date(r.submittedAt).toLocaleString(),
      };
      questions.forEach((question) => {
        row[question.question || question.id] = formatDisplayValue(getAnswer(r, question.id));
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ Message: "No responses found" }]);
    ws["!cols"] = Object.keys(data[0] ?? { Message: "No responses found" }).map((k) => ({ wch: Math.max(k.length, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `${(form?.title || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-responses-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="cc-root">
      <Styles />

      <header className="cc-header">
        <div className="cc-header-inner">
          <div className="cc-brand">
            <div className="cc-logo">U</div>
            <div>
              <div className="cc-brand-name">Unilynk</div>
              <div className="cc-brand-sub">Event Responses</div>
            </div>
          </div>
          <nav className="cc-nav">
            
          </nav>
          <button className="cc-btn cc-btn-primary" onClick={exportExcel} disabled={loading}>
            <DownloadIcon /> Export Excel
          </button>
        </div>
      </header>

      <main className="cc-main">
        <section className="cc-title">
          <h1>Responses</h1>
          <p><b>{filtered.length}</b> of {rows.length} registrations{form?.title ? ` · ${form.title}` : ""}</p>
        </section>

        <div className="cc-toolbar">
          <div className="cc-tabs">
            {[
              ["summary","Summary"],
              ["question","Question"],
              ["individual","Individual"],
              ...(isTeamEvent ? [["teams","Teams"]] : []),
            ].map(([k,label]) => (
              <button key={k} className={"cc-tab " + (tab === k ? "cc-tab-active" : "")} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </div>
          <div className="cc-filters">
            <div className="cc-search">
              <SearchIcon />
              <input placeholder="Search name, email, answers…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="cc-select">
              <option>All</option>
              {eventOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="cc-content">
          {loading && <Card title="Loading responses"><div className="cc-sa-meta">Fetching latest responses from MongoDB…</div></Card>}
          {!loading && error && <Card title="Analytics unavailable"><div className="cc-sa-meta">{error}</div></Card>}
          {!loading && !error && tab === "summary" && <SummaryView rows={filtered} allRows={rows} form={form} questions={questions} />}
          {!loading && !error && tab === "question" && <QuestionView rows={filtered} questions={questions} />}
          {!loading && !error && tab === "individual" && <IndividualView rows={filtered} questions={questions} />}
          {!loading && !error && tab === "teams" && (
            <TeamsView
              query={query}
              teams={teams}
              teamFinder={teamFinder}
              teamConfig={form?.teamConfig}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ----------------------------- Summary ----------------------------- */
function SummaryView({ rows, allRows, form, questions }) {
  const timeline = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const d = toDateKey(r.submittedAt);
      if (d) m.set(d, (m.get(d) || 0) + 1);
    });
    return Array.from(m, ([date, count]) => ({ date: date.slice(5), count })).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const answerCoverage = useMemo(() => questions.map((question) => ({
    name: question.question || question.id,
    value: rows.filter((r) => isFilled(getAnswer(r, question.id))).length,
  })).filter((item) => item.value > 0), [rows, questions]);

  const year = countBy(rows, "year").sort((a, b) => a.name.localeCompare(b.name));
  const dept = countBy(rows, "department").map(d => ({ name: getInitials(d.name).toUpperCase(), value: d.value }));
  const latest = rows.reduce((latestRow, row) => !latestRow || new Date(row.submittedAt) > new Date(latestRow.submittedAt) ? row : latestRow, null);

  return (
    <div className="cc-grid">
      <StatCard label="Total responses" value={rows.length} sub={`${allRows.length} stored for this event`} color={COLORS[0]} />
      <StatCard label="Form questions" value={questions.length} sub="published for this event" color={COLORS[3]} />
      <StatCard label="Event date" value={form?.date ? new Date(form.date).toLocaleDateString() : "—"} sub={form?.time || "time not set"} color={COLORS[5]} small />
      <StatCard label="Latest response" value={latest ? new Date(latest.submittedAt).toLocaleDateString() : "—"} sub={latest?.name || "no submissions yet"} color={COLORS[1]} small />

      <Card title="Responses over time" className="cc-card-span-3">
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

      <Card title="Answered questions" wide>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={answerCoverage} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {answerCoverage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Year of study" className="cc-card-span-2">
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
function QuestionView({ rows, questions }) {
  return (
    <div className="cc-qcol">
      {questions.length === 0 && (
        <QCard q="No questions found" type="Empty">
          <div className="cc-sa-meta">This form does not have any published questions.</div>
        </QCard>
      )}
      {questions.map((question, index) => (
        <QuestionAnalyticsCard key={question.id || index} question={question} index={index} rows={rows} />
      ))}
    </div>
  );
}

function QuestionAnalyticsCard({ question, index, rows }) {
  const type = question.type || "short";
  const values = rows.map((r) => ({ row: r, value: getAnswer(r, question.id) })).filter(({ value }) => isFilled(value));
  const qTitle = `Q${index + 1} · ${question.question || "Untitled question"}`;
  const typeLabel = QUESTION_TYPE_LABELS[type] || type;

  if (["multiple", "dropdown"].includes(type)) {
    const data = countBy(rows, (r) => getAnswer(r, question.id));
    return <QCard q={qTitle} type={typeLabel}><PieBlock data={data} /></QCard>;
  }

  if (type === "checkbox") {
    const data = countBy(rows, (r) => getAnswer(r, question.id)).sort((a, b) => b.value - a.value);
    return <QCard q={qTitle} type={typeLabel}><BarsList data={data} /></QCard>;
  }

  if (type === "date") {
    const data = countBy(rows, (r) => toShortDate(getAnswer(r, question.id))).sort((a,b)=>a.name.localeCompare(b.name));
    return (
      <QCard q={qTitle} type={typeLabel}>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={COLORS[4]} strokeWidth={3} dot={{ r: 3, fill: COLORS[4] }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </QCard>
    );
  }

  if (type === "time") {
    const data = countBy(rows, (r) => getAnswer(r, question.id)).sort((a,b)=>a.name.localeCompare(b.name));
    return (
      <QCard q={qTitle} type={typeLabel}>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10,10,0,0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[(i+1) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </QCard>
    );
  }

  if (type === "long") {
    return (
      <QCard q={qTitle} type={typeLabel}>
        <div className="cc-quotes">
          {values.slice(0, 6).map(({ row, value }) => (
            <blockquote key={row.id} className="cc-quote">
              <p>“{value}”</p>
              <cite>— {row.name}</cite>
            </blockquote>
          ))}
        </div>
      </QCard>
    );
  }

  return (
    <QCard q={qTitle} type={typeLabel}>
      <ShortAnswerList items={values.slice(0, 8).map(({ value }) => formatDisplayValue(value))} total={values.length} />
    </QCard>
  );
}

/* ----------------------------- Individual ----------------------------- */
function IndividualView({ rows, questions }) {
  const [selectedId, setSelectedId] = useState(rows[0]?.id);
  const selected = rows.find((r) => r.id === selectedId) || rows[0];

  useEffect(() => {
    if (!rows.find((r) => r.id === selectedId)) setSelectedId(rows[0]?.id);
  }, [rows, selectedId]);

  const isProfileQuestion = (question) => {
    const label = (question.question || "").toLowerCase();
    return question.type === "email" || includesAny(label, ["name", "full name", "email", "e-mail", "year", "semester", "department", "branch", "course"]);
  };

  const responseQuestions = selected
    ? questions
        .map((question) => ({
          ...question,
          answer: getAnswer(selected, question.id),
        }))
        .filter((question) => isFilled(question.answer) && !isProfileQuestion(question))
    : [];
  const bottomQuestions = responseQuestions.filter((question) => ["short", "long"].includes(question.type));
  const detailQuestions = responseQuestions.filter((question) => !["short", "long"].includes(question.type));

  return (
    <div className="cc-indiv">
      <aside className="cc-indiv-list">
        <div className="cc-indiv-list-head">
          <span>Submissions</span>
          <span className="cc-indiv-list-badge">{rows.length}</span>
        </div>
        <div className="cc-indiv-list-scroll">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={"cc-indiv-item " + (r.id === selected?.id ? "cc-indiv-item-active" : "")}
            >
              <Avatar name={r.name} src={r.user?.img || r.user?.profilePicture} />
              <div className="cc-indiv-info">
                <div className="cc-indiv-name">{r.name}</div>
                <div className="cc-indiv-meta">{r.event} · {new Date(r.submittedAt).toLocaleDateString()}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="cc-indiv-detail">
        {selected ? (
          <>
            <header className="cc-indiv-header">
              <div>
                <p className="cc-response-id">Response {selected.id}</p>
                <h2>{selected.name}</h2>
                <p className="cc-indiv-email">{selected.email}</p>
              </div>
              <div className="cc-submitted">
                <p>Submitted</p>
                <p>{new Date(selected.submittedAt).toLocaleString()}</p>
              </div>
            </header>

            <dl className="cc-fields">
              <Field label="Year of study">{selected.year}</Field>
              <Field label="Department">{selected.department}</Field>
              {detailQuestions.map((question) => (
                <Field key={question.id} label={question.question || question.id}>{formatDisplayValue(question.answer)}</Field>
              ))}
            </dl>

            {bottomQuestions.map((question) => (
              <div key={question.id} className="cc-feedback">
                <div className="cc-feedback-box">
                  <div className="cc-feedback-label">{question.question || QUESTION_TYPE_LABELS[question.type] || question.id}</div>
                  <p>{formatDisplayValue(question.answer)}</p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="cc-sa-meta">No submissions found.</div>
        )}
      </section>
    </div>
  );
}


/* ----------------------------- Teams ----------------------------- */
function TeamsView({ teams, teamFinder, teamConfig, query }) {
  const q = (query || "").toLowerCase().trim();

  const matchTeam = (t) => {
    if (!q) return true;
    const hay = [
      t.name,
      ...(t.members || []).flatMap((m) => [m.name, m.email, m.rollNo, m.branch]),
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  };
  const matchStudent = (s) => {
    if (!q) return true;
    const hay = [s.name, s.email, s.branch, s.year, s.lookingFor, ...(s.skills || [])]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  };

  // Split complete vs incomplete (registered teams from the form)
  const minSize = teamConfig?.minSize ?? 2;
  const maxSize = teamConfig?.maxSize ?? 5;
  const completeRegistered = teams.filter((t) => {
    if (t.status) return t.status === "complete";
    return (t.members?.length || 0) >= minSize;
  }).filter(matchTeam);
  const incompleteFromFinder = (teamFinder.incompleteTeams || []).filter(matchTeam);
  const soloStudents = (teamFinder.soloStudents || []).filter(matchStudent);

  const totalTeams = teams.length;
  const totalMembers = teams.reduce((s, t) => s + (t.members?.length || 0), 0);
  const avgSize = totalTeams ? (totalMembers / totalTeams).toFixed(1) : "0.0";

  const sizeBuckets = useMemo(() => {
    const map = new Map();
    for (let i = 1; i <= Math.max(maxSize, 1); i++) map.set(i, 0);
    teams.forEach((t) => {
      const n = t.members?.length || 0;
      if (n > 0) map.set(n, (map.get(n) || 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name: `${name}`, value }));
  }, [teams, maxSize]);

  const completionData = [
    { name: "Complete", value: completeRegistered.length },
    { name: "Incomplete", value: incompleteFromFinder.length },
    { name: "Solo / Unmatched", value: soloStudents.length },
  ].filter((d) => d.value > 0);

  return (
    <div className="cc-grid">
      <StatCard label="Registered teams" value={totalTeams} sub={`${totalMembers} members total · avg ${avgSize}`} color={COLORS[0]} />
      <StatCard label="Complete teams" value={completeRegistered.length} sub={`min ${minSize} · max ${maxSize}`} color={COLORS[2]} />
      <StatCard label="Incomplete in TeamFinder" value={incompleteFromFinder.length} sub="still looking for members" color={COLORS[3]} />
      <StatCard label="Solo students" value={soloStudents.length} sub="not yet in any team" color={COLORS[4]} />

      <Card title="Team size distribution" className="cc-card-span-2">
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sizeBuckets} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10,10,0,0]}>
                {sizeBuckets.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Team status" className="cc-card-span-2">
        {completionData.length ? <PieBlock data={completionData} /> : <div className="cc-sa-meta">No team data yet.</div>}
      </Card>

      <Card title={`Registered teams · ${completeRegistered.length}`} wide>
        {completeRegistered.length === 0 ? (
          <div className="cc-sa-meta">No complete teams registered yet.</div>
        ) : (
          <div className="cc-teamgrid">
            {completeRegistered.map((t, i) => (
              <TeamCard key={t._id || i} team={t} accent={COLORS[i % COLORS.length]} variant="complete" />
            ))}
          </div>
        )}
      </Card>

      <Card title={`Incomplete teams in TeamFinder · ${incompleteFromFinder.length}`} wide>
        {incompleteFromFinder.length === 0 ? (
          <div className="cc-sa-meta">No incomplete teams in TeamFinder.</div>
        ) : (
          <div className="cc-teamgrid">
            {incompleteFromFinder.map((t, i) => (
              <TeamCard key={t._id || i} team={t} accent={COLORS[3]} variant="incomplete" minSize={minSize} />
            ))}
          </div>
        )}
      </Card>

      <Card title={`Solo students in TeamFinder · ${soloStudents.length}`} wide>
        {soloStudents.length === 0 ? (
          <div className="cc-sa-meta">No solo students currently in TeamFinder.</div>
        ) : (
          <div className="cc-solo-grid">
            {soloStudents.map((s, i) => (
              <SoloCard key={s._id || s.email || i} student={s} accent={COLORS[(i + 1) % COLORS.length]} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TeamCard({ team, accent, variant, minSize }) {
  const members = team.members || [];
  const need = variant === "incomplete" ? Math.max(0, Number(team.needed ?? team.lookingForCount ?? (minSize ? minSize - members.length : 0))) : 0;
  return (
    <div className="cc-team-card">
      <div className="cc-team-card-head">
        <div className="cc-team-accent" style={{ background: accent }} />
        <div className="cc-team-card-titles">
          <div className="cc-team-name">{team.name || `Team ${(team._id || "").toString().slice(-4) || "—"}`}</div>
          <div className="cc-team-meta">
            {members.length} {members.length === 1 ? "member" : "members"}
            {variant === "incomplete" && need > 0 ? ` · needs ${need} more` : ""}
            {team.createdAt ? ` · ${new Date(team.createdAt).toLocaleDateString()}` : ""}
          </div>
        </div>
        <span className={"cc-team-status " + (variant === "complete" ? "cc-team-status-ok" : "cc-team-status-warn")}>
          {variant === "complete" ? "Complete" : "Open"}
        </span>
      </div>
      <ul className="cc-team-members">
        {members.map((m, idx) => (
          <li key={m.email || m._id || idx} className="cc-team-member">
            <div className="cc-team-avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length].bg, color: AVATAR_COLORS[idx % AVATAR_COLORS.length].fg }}>
              {getInitials(m.name || m.email || "?")}
            </div>
            <div className="cc-team-member-info">
              <div className="cc-team-member-name">{m.name || "—"}</div>
              <div className="cc-team-member-sub">{[m.email, m.rollNo, m.branch, m.year].filter(Boolean).join(" · ") || "—"}</div>
            </div>
            {idx === 0 && <span className="cc-team-pill">Lead</span>}
          </li>
        ))}
        {variant === "incomplete" && need > 0 && Array.from({ length: need }).map((_, i) => (
          <li key={`empty-${i}`} className="cc-team-member cc-team-member-empty">
            <div className="cc-team-avatar cc-team-avatar-empty">+</div>
            <div className="cc-team-member-info">
              <div className="cc-team-member-name">Open slot</div>
              <div className="cc-team-member-sub">Looking for a member</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SoloCard({ student, accent }) {
  return (
    <div className="cc-solo-card">
      <div className="cc-solo-avatar" style={{ background: accent + "22", color: accent }}>
        {getInitials(student.name || student.email || "?")}
      </div>
      <div className="cc-solo-info">
        <div className="cc-solo-name">{student.name || "—"}</div>
        <div className="cc-solo-meta">{[student.email, student.branch, student.year].filter(Boolean).join(" · ") || "—"}</div>
        {student.lookingFor && <div className="cc-solo-looking">Looking for: {student.lookingFor}</div>}
        {Array.isArray(student.skills) && student.skills.length > 0 && (
          <div className="cc-solo-skills">
            {student.skills.slice(0, 6).map((s, i) => <span key={i} className="cc-solo-skill">{s}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Building blocks ----------------------------- */
function Card({ title, wide, className = "", children }) {
  return (
    <div className={`cc-card ${wide ? "cc-card-wide" : ""} ${className}`}>
      <div className="cc-card-title">{title}</div>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color, small }) {
  return (
    <div className="cc-stat">
      <div className="cc-stat-label">
        {label}
      </div>
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
      <dt className="cc-field-label">{label}</dt>
      <dd className="cc-field-value">{children}</dd>
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
        background: #fff;
        border: 1px solid #e9e9e7;
        border-radius: 14px;
        padding: 20px 22px 18px;
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.15s;
      }
      .cc-stat:hover {
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      }
      .cc-stat-label {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 12px;
        color: #9b9a97;
        font-weight: 500;
      }
      .cc-stat-value {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: 38px;
        font-weight: 400;
        line-height: 1;
        margin: 12px 0 10px;
        letter-spacing: -0.02em;
        color: #37352f;
      }
      .cc-stat-value-sm {
        font-size: 22px;
        line-height: 1.25;
        letter-spacing: -0.01em;
      }
      .cc-stat-sub {
        font-size: 11.5px;
        color: #9b9a97;
        margin-top: auto;
      }

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
        border-radius: 12px;
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
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
        max-height: 640px;
        display: flex;
        flex-direction: column;
      }
      .cc-indiv-list-head {
        padding: 14px 16px 10px;
        font-size: 11px;
        font-weight: 600;
        color: var(--muted);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .cc-indiv-list-badge {
        font-size: 11px;
        font-weight: 500;
        color: var(--muted);
        background: var(--accent);
        border-radius: 5px;
        padding: 1px 6px;
        letter-spacing: 0;
      }
      .cc-indiv-list-scroll {
        overflow-y: auto;
        flex: 1;
        padding: 4px 6px 6px;
        scrollbar-width: none;
      }
      .cc-indiv-list-scroll::-webkit-scrollbar { display: none; }
      .cc-indiv-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        text-align: left;
        padding: 8px 10px;
        background: transparent;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.1s;
        font-family: inherit;
        margin-bottom: 1px;
      }
      .cc-indiv-item:hover { background: #f1f1ef; }
      .cc-indiv-item-active { background: #ebebea; }
      .cc-indiv-item-active:hover { background: #ebebea; }
      .cc-indiv-item-active .cc-indiv-meta { color: #9b9a97; }
      .cc-indiv-avatar {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .cc-indiv-info { flex: 1; min-width: 0; }
      .cc-indiv-name {
        font-size: 13.5px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #37352f;
      }
      .cc-indiv-meta {
        font-size: 11.5px;
        color: #9b9a97;
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .cc-indiv-detail {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 24px; padding: 32px 40px;
      }
      .cc-indiv-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); margin-bottom: 24px;
      }
      .cc-response-id {
        margin: 0; font-size: 12px; color: var(--muted);
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .cc-indiv-header h2 {
        font-family: 'Instrument Serif', Georgia, serif;
        font-size: var(--text-4xl); margin: 8px 0 0;
        font-weight: 400; letter-spacing: -0.04em; line-height: 1;
      }
      .cc-indiv-email { margin: 8px 0 0; color: var(--muted); font-size: var(--text-sm); }
      .cc-submitted {
        color: var(--muted); flex: 0 0 auto; font-size: var(--text-sm);
        line-height: 1.45; text-align: right;
      }
      .cc-submitted p { margin: 0; }
      .cc-submitted p + p { color: var(--fg); margin-top: 4px; }

      .cc-fields {
        display: grid;
gap: calc(var(--spacing) * 5) calc(var(--spacing) * 8);
        grid-template-columns: 1fr; margin: 0;
      }

      @media (min-width: 1024px) {
  .cc-card-span-2 {
    grid-column: span 2;
  }

  .cc-card-span-3 {
    grid-column: span 3;
  }
}
      
      @media (min-width: 640px) { .cc-fields { grid-template-columns: 1fr 1fr; } }
      .cc-field { min-width: 0; }
      .cc-field-label {
        font-size: 0.75rem; color: var(--muted);
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .cc-field-value {
        font-size: var(--text-base); margin: 6px 0 0; word-break: break-word;
        line-height: 1.2;
      }

      .cc-feedback {
        margin-top: 24px; padding-top: 24px;
        border-top: 1px solid var(--border);
      }
      
      .cc-feedback-box{
      padding: 12px 14px; background: var(--accent);
        border-radius: 12px;
      }

      .cc-feedback-label {
        font-size: var(--text-xs); color: var(--muted); margin-bottom: 12px;
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .cc-feedback p {
        margin: 0; font-size: var(--text-sm);
      }
      @media (max-width: 640px) {
        .cc-indiv-detail { padding: 24px; border-radius: 18px; }
        .cc-indiv-header { flex-direction: column; padding-bottom: 24px; margin-bottom: 24px; }
        .cc-submitted { text-align: left; padding-top: 0; }
      }

      /* Teams view */
      .cc-teamgrid {
        display: grid; gap: 14px;
        grid-template-columns: repeat(1, 1fr);
      }
      @media (min-width: 720px) { .cc-teamgrid { grid-template-columns: repeat(2, 1fr); } }
      @media (min-width: 1100px) { .cc-teamgrid { grid-template-columns: repeat(3, 1fr); } }

      .cc-team-card {
        position: relative;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px 16px 12px;
        overflow: hidden;
        transition: box-shadow .2s, transform .2s;
      }
      .cc-team-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.05); transform: translateY(-1px); }
      .cc-team-card-head {
        display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
      }
      .cc-team-accent {
        width: 4px; height: 36px; border-radius: 4px; flex-shrink: 0;
      }
      .cc-team-card-titles { flex: 1; min-width: 0; }
      .cc-team-name {
        font-size: 14.5px; font-weight: 600; color: #37352f;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        letter-spacing: -0.01em;
      }
      .cc-team-meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
      .cc-team-status {
        font-size: 10.5px; font-weight: 600; padding: 4px 9px;
        border-radius: 999px; letter-spacing: 0.04em; text-transform: uppercase;
        white-space: nowrap;
      }
      .cc-team-status-ok { background: #e6f7ee; color: #0f8a4a; }
      .cc-team-status-warn { background: #fff4e0; color: #b56b00; }

      .cc-team-members { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
      .cc-team-member {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 10px; border-radius: 10px;
        background: #fafaf9;
      }
      .cc-team-member-empty { background: repeating-linear-gradient(45deg, #fafaf9, #fafaf9 6px, #f2f2f0 6px, #f2f2f0 12px); }
      .cc-team-avatar {
        width: 30px; height: 30px; border-radius: 8px;
        display: grid; place-items: center;
        font-size: 11.5px; font-weight: 600;
        flex-shrink: 0;
      }
      .cc-team-avatar-empty {
        background: #fff; color: #9b9a97; border: 1px dashed #d3d3d0;
      }
      .cc-team-member-info { flex: 1; min-width: 0; }
      .cc-team-member-name {
        font-size: 13px; font-weight: 500; color: #37352f;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cc-team-member-sub {
        font-size: 11px; color: #9b9a97; margin-top: 1px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cc-team-pill {
        font-size: 10px; font-weight: 600; padding: 2px 7px;
        border-radius: 999px; background: #0a0a0a; color: #fff;
        letter-spacing: 0.04em;
      }

      /* Solo students grid */
      .cc-solo-grid {
        display: grid; gap: 12px;
        grid-template-columns: repeat(1, 1fr);
      }
      @media (min-width: 720px) { .cc-solo-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (min-width: 1100px) { .cc-solo-grid { grid-template-columns: repeat(3, 1fr); } }
      .cc-solo-card {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 14px; background: #fff;
        border: 1px solid var(--border); border-radius: 14px;
        transition: box-shadow .2s, transform .2s;
      }
      .cc-solo-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.04); transform: translateY(-1px); }
      .cc-solo-avatar {
        width: 40px; height: 40px; border-radius: 12px;
        display: grid; place-items: center;
        font-size: 13px; font-weight: 700;
        flex-shrink: 0;
      }
      .cc-solo-info { flex: 1; min-width: 0; }
      .cc-solo-name { font-size: 14px; font-weight: 600; color: #37352f; letter-spacing: -0.01em; }
      .cc-solo-meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
      .cc-solo-looking {
        margin-top: 8px; font-size: 12px; color: #37352f;
        padding: 6px 10px; background: var(--accent); border-radius: 8px;
      }
      .cc-solo-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
      .cc-solo-skill {
        font-size: 10.5px; padding: 3px 8px; border-radius: 999px;
        background: #f4f4f5; color: #555; font-weight: 500;
      }
    `}</style>
  );
}
