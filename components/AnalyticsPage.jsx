"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#ff3d8b", "#ff7a3d", "#ffc93d", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
const CHOICE_TYPES = new Set(["multiple", "dropdown"]);
const TEXT_TYPES = new Set(["short", "long", "email", "phone"]);

const tooltipStyle = {
  border: "1px solid #e5e5e5",
  borderRadius: 14,
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
};

const questionTypeLabels = {
  short: "Short answer",
  long: "Paragraph",
  email: "Email",
  phone: "Phone",
  date: "Date",
  time: "Time",
  multiple: "Multiple choice",
  checkbox: "Checkboxes",
  dropdown: "Dropdown",
};

function asDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatDate(value, fallback = "—") {
  const date = asDate(value);
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : fallback;
}

function formatDateTime(value, fallback = "—") {
  const date = asDate(value);
  return date ? date.toLocaleString() : fallback;
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function hasAnswer(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function responseId(response, index) {
  return response?._id?.toString?.() || response?._id || `response-${index + 1}`;
}

function respondentName(response) {
  return response?.user?.name || response?.userEmail?.split("@")[0] || "Unknown student";
}

function respondentBranch(response) {
  return response?.user?.branch || response?.user?.department || "Not provided";
}

function respondentYear(response) {
  return response?.user?.year || "Not provided";
}

function countBy(rows, getValue) {
  const counts = new Map();
  rows.forEach((row) => {
    const rawValue = typeof getValue === "function" ? getValue(row) : row?.[getValue];
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => {
      if (!hasAnswer(value)) return;
      const key = String(value);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function buildTimeline(rows) {
  const counts = countBy(rows, (row) => {
    const date = asDate(row.submittedAt);
    return date ? date.toISOString().slice(0, 10) : null;
  }).sort((a, b) => a.name.localeCompare(b.name));

  let cumulative = 0;
  return counts.map((item) => {
    cumulative += item.value;
    return {
      date: formatDate(item.name, item.name),
      count: item.value,
      cumulative,
    };
  });
}

function getQuestionAnswer(response, question) {
  return response?.answers?.[question.id];
}

function getQuestionCompletion(rows, questions) {
  return questions.map((question, index) => {
    const answered = rows.filter((row) => hasAnswer(getQuestionAnswer(row, question))).length;
    return {
      name: `Q${index + 1}`,
      question: question.question || "Untitled question",
      value: answered,
      pct: rows.length ? Math.round((answered / rows.length) * 100) : 0,
    };
  });
}

function getSubmissionHours(rows) {
  return countBy(rows, (row) => {
    const date = asDate(row.submittedAt);
    if (!date) return null;
    const hour = date.getHours();
    const labelHour = hour % 12 || 12;
    return `${labelHour}${hour >= 12 ? "PM" : "AM"}`;
  }).sort((a, b) => {
    const parse = (label) => {
      const match = label.match(/^(\d+)(AM|PM)$/);
      if (!match) return 0;
      let hour = Number(match[1]) % 12;
      if (match[2] === "PM") hour += 12;
      return hour;
    };
    return parse(a.name) - parse(b.name);
  });
}


export default function AnalyticsPage({ formId }) {
  const [tab, setTab] = useState("summary");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!formId) return;

    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/forms/${formId}/analytics`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load analytics");
        }

        if (!cancelled) {
          setForm(data.form || null);
          setResponses(Array.isArray(data.responses) ? data.responses : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [formId]);

  const questions = useMemo(() => form?.questions || [], [form]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return responses;

    return responses.filter((response, index) => {
      const searchable = [
        responseId(response, index),
        respondentName(response),
        response.userEmail,
        respondentBranch(response),
        respondentYear(response),
        ...Object.values(response.answers || {}).map(normalizeAnswer),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [query, responses]);

  const exportExcel = () => {
    const data = filtered.map((response, index) => {
      const row = {
        ID: responseId(response, index),
        Name: respondentName(response),
        Email: response.userEmail || "—",
        Year: respondentYear(response),
        Branch: respondentBranch(response),
        "Submitted At": formatDateTime(response.submittedAt),
      };

      questions.forEach((question, questionIndex) => {
        row[`Q${questionIndex + 1}: ${question.question || "Untitled question"}`] = normalizeAnswer(getQuestionAnswer(response, question));
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ Message: "No responses to export" }]);
    ws["!cols"] = Object.keys(data[0] ?? { Message: "" }).map((key) => ({ wch: Math.max(key.length, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `${form?.title || "event"}-responses-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="cc-root">
      <Styles />

      <header className="cc-header">
        <div className="cc-header-inner">
          <div className="cc-brand">
            <div className="cc-logo">UL</div>
            <div>
              <div className="cc-brand-name">UniLynk</div>
              <div className="cc-brand-sub">Event Analytics</div>
            </div>
          </div>
          <nav className="cc-nav">
            <button type="button" onClick={() => setTab("summary")} className={`cc-nav-item ${tab === "summary" ? "cc-nav-active" : ""}`}>Summary</button>
            <button type="button" onClick={() => setTab("questions")} className={`cc-nav-item ${tab === "questions" ? "cc-nav-active" : ""}`}>Questions</button>
            <button type="button" onClick={() => setTab("individual")} className={`cc-nav-item ${tab === "individual" ? "cc-nav-active" : ""}`}>Individual</button>
          </nav>
        </div>
      </header>

      <main className="cc-main">
        <section className="cc-hero">
          <div>
            <p className="cc-kicker">Live response dashboard</p>
            <h1>{form?.title || (loading ? "Loading analytics..." : "Event analytics")}</h1>
            <p>{form?.description || "Track event registrations, question answers, and student participation from MongoDB responses."}</p>
            <div className="cc-hero-meta">
              {form?.date && <span>{formatDate(form.date, form.date)}</span>}
              {form?.time && <span>{form.time}</span>}
              {form?.location && <span>{form.location}</span>}
              {form?.genre && <span>{form.genre}</span>}
            </div>
          </div>
          <div className="cc-actions">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="cc-search"
              placeholder="Search responses..."
            />
            <button type="button" className="cc-export" onClick={exportExcel} disabled={loading}>Export Excel</button>
            <p><b>{filtered.length}</b> of {responses.length} registrations</p>
          </div>
        </section>

        {loading && <StateCard title="Loading analytics" message="Fetching form responses from MongoDB..." />}
        {!loading && error && <StateCard title="Could not load analytics" message={error} tone="error" />}
        {!loading && !error && (
          <>
            {tab === "summary" && <SummaryView rows={filtered} allRows={responses} form={form} questions={questions} />}
            {tab === "questions" && <QuestionsView rows={filtered} questions={questions} />}
            {tab === "individual" && <IndividualView rows={filtered} questions={questions} />}
          </>
        )}
      </main>
    </div>
  );
}

function SummaryView({ rows, allRows, form, questions }) {
  const timeline = useMemo(() => buildTimeline(rows), [rows]);
  const branch = useMemo(() => countBy(rows, respondentBranch), [rows]);
  const year = useMemo(() => countBy(rows, respondentYear), [rows]);
  const hours = useMemo(() => getSubmissionHours(rows), [rows]);
  const completion = useMemo(() => getQuestionCompletion(rows, questions), [rows, questions]);
  const avgCompletion = completion.length ? Math.round(completion.reduce((sum, item) => sum + item.pct, 0) / completion.length) : 0;
  const latest = rows.reduce((latestRow, row) => {
    if (!latestRow) return row;
    return (asDate(row.submittedAt)?.getTime() || 0) > (asDate(latestRow.submittedAt)?.getTime() || 0) ? row : latestRow;
  }, null);
  const seats = Number(form?.seats) || 0;
  const seatsLeft = seats ? Math.max(seats - allRows.length, 0) : null;

  return (
    <div className="cc-grid cc-summary-grid">
      <StatCard label="Total registrations" value={rows.length} sub="matching current filters" color={COLORS[0]} />
      <StatCard label="Avg completion" value={`${avgCompletion}%`} sub={`${questions.length} form questions`} color={COLORS[3]} />
      <StatCard label="Newest response" value={latest ? respondentName(latest) : "—"} sub={latest ? formatDateTime(latest.submittedAt) : "No responses yet"} color={COLORS[5]} small />
      <StatCard label={seats ? "Seats left" : "Event capacity"} value={seats ? seatsLeft : "Open"} sub={seats ? `${allRows.length} of ${seats} seats filled` : "No seat limit set"} color={COLORS[1]} />

      <Card title="Registrations over time" wide>
        <ChartFrame empty={!timeline.length} emptyText="No registration timeline yet.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS[5]} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" name="Daily registrations" stroke={COLORS[0]} strokeWidth={3} fill="url(#gArea)" />
              <Area type="monotone" dataKey="cumulative" name="Total registrations" stroke={COLORS[5]} strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Card>

      <Card title="Question completion" wide>
        <div className="cc-completion-list">
          {completion.length ? completion.map((item, index) => (
            <div className="cc-completion-row" key={`${item.name}-${item.question}`}>
              <div className="cc-completion-head">
                <span>{item.name} · {item.question}</span>
                <b>{item.pct}%</b>
              </div>
              <div className="cc-bar-track"><div className="cc-bar-fill" style={{ width: `${item.pct}%`, background: COLORS[index % COLORS.length] }} /></div>
              <small>{item.value} of {rows.length} responses answered</small>
            </div>
          )) : <EmptyText>No questions available for completion analytics.</EmptyText>}
        </div>
      </Card>

      <Card title="Branch mix">
        <PieBlock data={branch} />
      </Card>

      <Card title="Year of study">
        <ChartFrame empty={!year.length} emptyText="No year data found on respondent profiles.">
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
        </ChartFrame>
      </Card>

      <Card title="Submission time of day" wide>
        <ChartFrame empty={!hours.length} emptyText="No submission time data yet.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hours} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {hours.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Card>
    </div>
  );
}

function QuestionsView({ rows, questions }) {
  if (!questions.length) {
    return <StateCard title="No questions" message="This form does not have any questions yet." />;
  }

  return (
    <div className="cc-q-grid">
      {questions.map((question, index) => (
        <QuestionCard key={question.id || index} question={question} index={index} rows={rows} />
      ))}
    </div>
  );
}

function QuestionCard({ question, index, rows }) {
  const answers = rows.map((row) => ({ row, answer: getQuestionAnswer(row, question) })).filter(({ answer }) => hasAnswer(answer));
  const typeLabel = questionTypeLabels[question.type] || question.type || "Question";

  if (CHOICE_TYPES.has(question.type) || question.type === "checkbox") {
    const data = countBy(rows, (row) => getQuestionAnswer(row, question));
    return (
      <QCard q={`Q${index + 1} · ${question.question || "Untitled question"}`} type={typeLabel}>
        <BarsList data={data} totalResponses={rows.length} />
      </QCard>
    );
  }

  if (question.type === "date" || question.type === "time") {
    const data = countBy(rows, (row) => getQuestionAnswer(row, question));
    return (
      <QCard q={`Q${index + 1} · ${question.question || "Untitled question"}`} type={typeLabel}>
        <ChartFrame empty={!data.length} emptyText="No answers for this question yet.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </QCard>
    );
  }

  if (TEXT_TYPES.has(question.type)) {
    return (
      <QCard q={`Q${index + 1} · ${question.question || "Untitled question"}`} type={typeLabel}>
        <ShortAnswers answers={answers} total={rows.length} />
      </QCard>
    );
  }

  return (
    <QCard q={`Q${index + 1} · ${question.question || "Untitled question"}`} type={typeLabel}>
      <ShortAnswers answers={answers} total={rows.length} />
    </QCard>
  );
}

function IndividualView({ rows, questions }) {
  const [selectedId, setSelectedId] = useState("");
  const selected = useMemo(() => {
    if (!rows.length) return null;
    return rows.find((row, index) => responseId(row, index) === selectedId) || rows[0];
  }, [rows, selectedId]);

  useEffect(() => {
    if (rows.length && !selectedId) setSelectedId(responseId(rows[0], 0));
  }, [rows, selectedId]);

  if (!rows.length) {
    return <StateCard title="No matching responses" message="Try removing the search filter or wait for students to submit responses." />;
  }

  return (
    <div className="cc-indiv">
      <aside className="cc-indiv-list">
        <div className="cc-indiv-list-head">Submissions</div>
        <div className="cc-indiv-list-scroll">
          {rows.map((row, index) => {
            const id = responseId(row, index);
            return (
              <button
                type="button"
                key={id}
                onClick={() => setSelectedId(id)}
                className={`cc-indiv-item ${id === responseId(selected, rows.indexOf(selected)) ? "cc-indiv-item-active" : ""}`}
              >
                <div className="cc-indiv-name">{respondentName(row)}</div>
                <div className="cc-indiv-meta">{row.userEmail} · {formatDate(row.submittedAt)}</div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="cc-indiv-detail">
        {selected && (
          <>
            <header className="cc-indiv-header">
              <div>
                <h2>{respondentName(selected)}</h2>
                <p>{selected.userEmail}</p>
              </div>
              <span className="cc-pill">{formatDateTime(selected.submittedAt)}</span>
            </header>

            <div className="cc-fields">
              <Field label="Year">{respondentYear(selected)}</Field>
              <Field label="Branch">{respondentBranch(selected)}</Field>
              <Field label="Submitted at">{formatDateTime(selected.submittedAt)}</Field>
            </div>

            <div className="cc-answer-list">
              {questions.map((question, index) => (
                <Field key={question.id || index} label={`Q${index + 1} · ${question.question || "Untitled question"}`} wide>
                  {normalizeAnswer(getQuestionAnswer(selected, question))}
                </Field>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Card({ title, wide, children }) {
  return (
    <div className={`cc-card ${wide ? "cc-card-wide" : ""}`}>
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
      <div className={`cc-stat-value ${small ? "cc-stat-value-sm" : ""}`}>{value}</div>
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
      <div className="cc-q-body">{children}</div>
    </div>
  );
}

function BarsList({ data, totalResponses }) {
  const total = totalResponses || data.reduce((sum, item) => sum + item.value, 0) || 1;

  if (!data.length) return <EmptyText>No answers for this question yet.</EmptyText>;

  return (
    <ul className="cc-bars">
      {data.map((item, index) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <li key={item.name} className="cc-bar-row">
            <div className="cc-bar-label">
              <span>{item.name}</span>
              <span className="cc-bar-count">{item.value} · {pct}%</span>
            </div>
            <div className="cc-bar-track">
              <div className="cc-bar-fill" style={{ width: `${pct}%`, background: COLORS[index % COLORS.length] }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PieBlock({ data }) {
  if (!data.length) return <EmptyText>No profile data available yet.</EmptyText>;

  return (
    <div className="cc-pie-wrap">
      <div className="cc-pie-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <BarsList data={data} />
    </div>
  );
}

function ShortAnswers({ answers, total }) {
  if (!answers.length) return <EmptyText>No text answers yet.</EmptyText>;

  return (
    <div>
      <div className="cc-sa-meta">{answers.length} of {total} responses answered · showing latest {Math.min(answers.length, 8)}</div>
      <ul className="cc-sa-list">
        {answers.slice(0, 8).map(({ row, answer }, index) => (
          <li key={`${responseId(row, index)}-${index}`} className="cc-sa-item">
            <span>{normalizeAnswer(answer)}</span>
            <em>{respondentName(row)}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, wide, children }) {
  return (
    <div className={`cc-field ${wide ? "cc-field-wide" : ""}`}>
      <div className="cc-field-label">{label}</div>
      <div className="cc-field-value">{children}</div>
    </div>
  );
}

function ChartFrame({ empty, emptyText, children }) {
  return <div className="cc-chart-frame">{empty ? <EmptyText>{emptyText}</EmptyText> : children}</div>;
}

function EmptyText({ children }) {
  return <div className="cc-empty">{children}</div>;
}

function StateCard({ title, message, tone }) {
  return (
    <div className={`cc-state ${tone === "error" ? "cc-state-error" : ""}`}>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .cc-root {
        --bg: #fbfaf8;
        --card: #ffffff;
        --ink: #171717;
        --muted: #737373;
        --border: #e8e2da;
        --accent: #f5efe8;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(255, 61, 139, 0.08), transparent 30rem),
          radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 26rem),
          var(--bg);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .cc-header {
        position: sticky; top: 0; z-index: 20;
        backdrop-filter: blur(18px);
        background: rgba(251,250,248,0.78);
        border-bottom: 1px solid var(--border);
      }
      .cc-header-inner {
        max-width: 1200px; margin: 0 auto; padding: 14px 22px;
        display: flex; align-items: center; justify-content: space-between; gap: 18px;
      }
      .cc-brand { display: flex; align-items: center; gap: 12px; }
      .cc-logo {
        width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center;
        color: #fff; font-weight: 800; background: linear-gradient(135deg, ${COLORS[0]}, ${COLORS[5]});
        box-shadow: 0 14px 30px rgba(255,61,139,0.24);
      }
      .cc-brand-name { font-weight: 750; letter-spacing: -0.03em; }
      .cc-brand-sub { color: var(--muted); font-size: 12px; }
      .cc-nav { display: flex; gap: 8px; padding: 5px; background: var(--accent); border-radius: 999px; }
      .cc-nav-item {
        border: 0; background: transparent; color: var(--muted); cursor: pointer;
        font: inherit; font-size: 13px; padding: 9px 14px; border-radius: 999px; transition: 0.16s ease;
      }
      .cc-nav-active { color: var(--ink); background: #fff; box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
      .cc-main { max-width: 1200px; margin: 0 auto; padding: 28px 22px 48px; }
      .cc-hero {
        display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 24px; align-items: end;
        margin-bottom: 22px; padding: 26px; border: 1px solid var(--border); border-radius: 28px;
        background: rgba(255,255,255,0.78); box-shadow: 0 18px 60px rgba(0,0,0,0.06);
      }
      .cc-kicker { margin: 0 0 7px; color: ${COLORS[0]}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      .cc-hero h1 { margin: 0; font-size: clamp(34px, 5vw, 68px); line-height: 0.94; letter-spacing: -0.06em; font-weight: 760; }
      .cc-hero p { margin: 12px 0 0; color: var(--muted); max-width: 720px; line-height: 1.55; }
      .cc-hero-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
      .cc-hero-meta span, .cc-pill {
        font-size: 12px; padding: 6px 11px; border-radius: 999px; background: var(--accent); color: var(--muted); white-space: nowrap;
      }
      .cc-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; min-width: 250px; }
      .cc-search, .cc-export {
        width: 100%; border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; font: inherit; background: #fff;
      }
      .cc-export {
        cursor: pointer; border-color: transparent; color: #fff; font-weight: 720;
        background: linear-gradient(135deg, ${COLORS[0]}, ${COLORS[5]});
      }
      .cc-export:disabled { cursor: not-allowed; opacity: 0.65; }
      .cc-actions p { margin: 0; font-size: 13px; align-self: center; }
      .cc-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
      .cc-card, .cc-stat, .cc-state {
        background: rgba(255,255,255,0.9); border: 1px solid var(--border); border-radius: 22px;
        box-shadow: 0 14px 40px rgba(0,0,0,0.05);
      }
      .cc-card { padding: 18px; min-height: 0; }
      .cc-card-wide { grid-column: span 2; }
      .cc-card-title { font-size: 15px; font-weight: 760; margin-bottom: 14px; letter-spacing: -0.02em; }
      .cc-stat { min-height: 136px; padding: 18px; position: relative; overflow: hidden; }
      .cc-stat-dot { width: 10px; height: 10px; border-radius: 999px; margin-bottom: 14px; }
      .cc-stat-label { color: var(--muted); font-size: 12px; font-weight: 650; text-transform: uppercase; letter-spacing: 0.05em; }
      .cc-stat-value { margin-top: 8px; font-size: 38px; font-weight: 780; letter-spacing: -0.06em; line-height: 1; }
      .cc-stat-value-sm { font-size: 23px; letter-spacing: -0.04em; line-height: 1.1; }
      .cc-stat-sub { margin-top: 8px; color: var(--muted); font-size: 12px; line-height: 1.35; }
      .cc-chart-frame { height: 260px; min-height: 260px; }
      .cc-pie-wrap { display: grid; grid-template-columns: 200px minmax(0,1fr); gap: 16px; align-items: center; }
      .cc-pie-chart { height: 220px; min-width: 0; }
      .cc-bars { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
      .cc-bar-row, .cc-completion-row { display: flex; flex-direction: column; gap: 6px; }
      .cc-bar-label, .cc-completion-head { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
      .cc-bar-count, .cc-completion-row small { color: var(--muted); font-variant-numeric: tabular-nums; }
      .cc-bar-track { height: 10px; background: var(--accent); border-radius: 999px; overflow: hidden; }
      .cc-bar-fill { height: 100%; border-radius: 999px; transition: width 0.35s ease; }
      .cc-completion-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px; }
      .cc-q-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; }
      .cc-q-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .cc-q-title { font-size: 15px; font-weight: 700; line-height: 1.35; }
      .cc-q-body { margin-top: 14px; }
      .cc-sa-meta { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
      .cc-sa-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
      .cc-sa-item { padding: 11px 13px; background: var(--accent); border-radius: 12px; font-size: 13px; display: flex; justify-content: space-between; gap: 10px; }
      .cc-sa-item em { color: var(--muted); font-style: normal; white-space: nowrap; }
      .cc-indiv { display: grid; gap: 16px; grid-template-columns: 310px 1fr; }
      .cc-indiv-list, .cc-indiv-detail { background: rgba(255,255,255,0.9); border: 1px solid var(--border); border-radius: 22px; overflow: hidden; }
      .cc-indiv-list { max-height: 690px; display: flex; flex-direction: column; }
      .cc-indiv-list-head { padding: 14px 16px; font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
      .cc-indiv-list-scroll { overflow-y: auto; flex: 1; }
      .cc-indiv-item { display: block; width: 100%; text-align: left; padding: 12px 16px; background: transparent; border: 0; border-bottom: 1px solid var(--border); cursor: pointer; font: inherit; }
      .cc-indiv-item:hover { background: var(--accent); }
      .cc-indiv-item-active { background: #171717; color: #fff; }
      .cc-indiv-item-active .cc-indiv-meta { color: rgba(255,255,255,0.68); }
      .cc-indiv-name { font-size: 13px; font-weight: 700; }
      .cc-indiv-meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
      .cc-indiv-detail { padding: 22px; }
      .cc-indiv-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 18px; }
      .cc-indiv-header h2 { font-size: 34px; margin: 0; letter-spacing: -0.05em; line-height: 1; }
      .cc-indiv-header p { margin: 6px 0 0; color: var(--muted); }
      .cc-fields, .cc-answer-list { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
      .cc-answer-list { grid-template-columns: repeat(2, minmax(0,1fr)); margin-top: 12px; }
      .cc-field { padding: 13px 14px; background: var(--accent); border-radius: 14px; }
      .cc-field-wide { grid-column: span 1; }
      .cc-field-label { color: var(--muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
      .cc-field-value { margin-top: 5px; font-size: 13px; line-height: 1.45; word-break: break-word; }
      .cc-empty { height: 100%; min-height: 120px; display: grid; place-items: center; text-align: center; color: var(--muted); background: var(--accent); border-radius: 16px; padding: 18px; font-size: 14px; }
      .cc-state { padding: 30px; text-align: center; }
      .cc-state h2 { margin: 0; font-size: 28px; letter-spacing: -0.04em; }
      .cc-state p { margin: 8px auto 0; color: var(--muted); max-width: 560px; }
      .cc-state-error { border-color: rgba(239,68,68,0.35); }
      @media (max-width: 1050px) {
        .cc-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .cc-card-wide { grid-column: span 2; }
        .cc-pie-wrap { grid-template-columns: 1fr; }
      }
      @media (max-width: 760px) {
        .cc-header-inner, .cc-hero, .cc-indiv-header { align-items: stretch; flex-direction: column; }
        .cc-header-inner { flex-direction: column; }
        .cc-nav { width: 100%; justify-content: center; }
        .cc-hero { grid-template-columns: 1fr; padding: 20px; }
        .cc-actions { align-items: stretch; min-width: 0; }
        .cc-grid, .cc-q-grid, .cc-indiv, .cc-fields, .cc-answer-list, .cc-completion-list { grid-template-columns: 1fr; }
        .cc-card-wide { grid-column: span 1; }
      }
    `}</style>
  );
}
