"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#ff3d8b", "#ff7a3d", "#ffc93d", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

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
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Unable to load analytics data");
        setForm(null);
        setResponses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [formId]);

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
            {[["summary","Summary"],["question","Question"],["individual","Individual"]].map(([k,label]) => (
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
  const dept = countBy(rows, "department");
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
    `}</style>
  );
}
