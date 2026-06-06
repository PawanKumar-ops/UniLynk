"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Download, Search, BarChart3, ListChecks, MessageSquareText,
  Users, Clock, ArrowUpRight, Filter, MoreHorizontal, TrendingUp,
} from "lucide-react";
import "./analytics.css";

export default function ResponsesPage() {
  const { formId } = useParams();
  const router = useRouter();

  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("summary");
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");

  useEffect(() => {
    if (!formId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/forms/${formId}/analytics`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to fetch analytics");
        }
        const data = await res.json();
        setForm(data.form);
        setResponses(data.responses);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [formId]);

  const filtered = useMemo(() => {
    return responses.filter(r => {
      const q = query.toLowerCase().trim();
      const name = r.user?.name || "";
      const email = r.userEmail || "";
      
      const matchesQ = !q || 
        name.toLowerCase().includes(q) || 
        email.toLowerCase().includes(q) || 
        Object.values(r.answers || {}).some(val => {
          if (Array.isArray(val)) {
            return val.some(v => typeof v === 'string' && v.toLowerCase().includes(q));
          }
          return typeof val === 'string' && val.toLowerCase().includes(q);
        });
      
      const matchesY = yearFilter === "All" || r.user?.year === yearFilter;
      return matchesQ && matchesY;
    });
  }, [responses, query, yearFilter]);

  const exportExcel = () => {
    if (!form || filtered.length === 0) return;
    const data = filtered.map((r, index) => {
      const row = {
        "Submission No": index + 1,
        "Name": r.user?.name || "N/A",
        "Email": r.userEmail,
        "Year": r.user?.year || "N/A",
        "Department/Branch": r.user?.branch || "N/A",
        "Submitted At": new Date(r.submittedAt).toLocaleString(),
      };
      
      form.questions.forEach(q => {
        const ans = r.answers?.[q.id];
        row[q.question] = Array.isArray(ans) ? ans.join(", ") : (ans ?? "");
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map(k => ({ wch: Math.max(k.length, 18) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
    XLSX.writeFile(wb, `${form.title || "Form"}-responses-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <div className="grid size-12 place-items-center rounded-xl bg-foreground text-background animate-spin mb-4">
          <BarChart3 className="size-6" />
        </div>
        <p className="text-lg font-medium">Loading form analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error Loading Analytics</h1>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <Link href="/dashboard/events/yourform" className="rounded-full bg-foreground px-6 py-2.5 text-sm text-background font-medium hover:opacity-90 transition">
          Back to Forms
        </Link>
      </div>
    );
  }

  return (
    <div className="analytics-theme min-h-screen bg-background text-foreground">
      <Header formTitle={form?.title} onExport={exportExcel} />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-8">
        <TitleBlock form={form} total={responses.length} filtered={filtered.length} />

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs tab={tab} setTab={setTab} />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search responses..."
                className="h-10 w-64 rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition focus:border-foreground"
              />
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-10 rounded-full border border-border bg-card px-4 text-sm outline-none transition focus:border-foreground"
            >
              <option value="All">All Years</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>
        </div>

        <div className="mt-8">
          {tab === "summary" && <SummaryView form={form} rows={filtered} />}
          {tab === "question" && <QuestionView form={form} rows={filtered} />}
          {tab === "individual" && <IndividualView form={form} rows={filtered} />}
        </div>
      </main>
    </div>
  );
}

// ---------- Header ----------
function Header({ formTitle, onExport }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/events/yourform" className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent" title="Back">
            <img className='w-2.5' src="/Postimg/backarrow.svg" alt="back" />
          </Link>
          <div className="grid size-9 place-items-center rounded-lg bg-foreground text-background">
            <BarChart3 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">{formTitle || "ClubConnect"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Form analytics</p>
          </div>
        </div>
        
        <button
          onClick={onExport}
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          <Download className="size-4" />
          Export to Excel
          <ArrowUpRight className="size-3.5 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </header>
  );
}

function TitleBlock({ form, total, filtered }) {
  return (
    <div className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{form?.genre || "Survey"} · Analytics</p>
        <h1 className="font-display mt-3 text-5xl leading-none sm:text-6xl">{form?.title || "Student Interest Survey"}</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          {form?.description || "Live responses from submission flows. Browse summary insights, dig into a single question, or read individual submissions."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border text-sm">
        <Stat label="Total responses" value={total} icon={<Users className="size-4" />} />
        <Stat label="Showing" value={filtered} icon={<ListChecks className="size-4" />} />
      </div>
    </div>
  );
}

function Stat({ label, value, icon, small }) {
  return (
    <div className="flex min-w-[140px] flex-col gap-2 bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`font-display ${small ? "text-2xl" : "text-3xl"} leading-none`}>{value}</div>
    </div>
  );
}

function Tabs({ tab, setTab }) {
  const items = [
    { id: "summary", label: "Summary", icon: BarChart3 },
    { id: "question", label: "Question", icon: ListChecks },
    { id: "individual", label: "Individual", icon: MessageSquareText },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            tab === id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------- Summary view ----------
function SummaryView({ form, rows }) {
  const choiceQuestions = useMemo(() => {
    return (form?.questions || []).filter(q => ['multiple', 'checkbox', 'dropdown'].includes(q.type));
  }, [form]);

  const byYear = useMemo(() => countBy(rows, r => r.user?.year || "N/A"), [rows]);
  const byBranch = useMemo(() => countBy(rows, r => r.user?.branch || "N/A"), [rows]);

  const timeline = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      if (!r.submittedAt) return;
      const d = new Date(r.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      map.set(d, (map.get(d) ?? 0) + 1);
    });
    return Array.from(map, ([date, value]) => ({ date, value }));
  }, [rows]);

  const choiceQ1 = choiceQuestions[0];
  const choiceQ1Data = useMemo(() => {
    if (!choiceQ1) return [];
    return countQuestionResponses(rows, choiceQ1).data;
  }, [rows, choiceQ1]);

  const choiceQ2 = choiceQuestions[1];
  const choiceQ2Data = useMemo(() => {
    if (!choiceQ2) return [];
    return countQuestionResponses(rows, choiceQ2).data;
  }, [rows, choiceQ2]);

  const topBranch = byBranch[0]?.name ?? "—";
  const topBranchCount = byBranch[0]?.value ?? 0;
  
  const topYear = byYear[0]?.name ?? "—";
  const topYearCount = byYear[0]?.value ?? 0;

  const choiceQ1Top = choiceQ1Data[0]?.name ?? "—";
  const choiceQ1TopCount = choiceQ1Data[0]?.value ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Responses over time" subtitle="Submissions across the timeline" span={2}>
        {timeline.length > 0 ? (
          <ResponsiveContainer>
            <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0 0)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="oklch(0.15 0 0)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.15 0 0)" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">No data available</div>
        )}
      </ChartCard>

      <ChartCard title="Year of study" subtitle="Distribution of responder class years">
        {byYear.length > 0 ? (
          <>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byYear} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} stroke="white" strokeWidth={2}>
                  {byYear.map((_, i) => <Cell key={i} fill={GRAYS[i % GRAYS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid oklch(0.92 0 0)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <Legend items={byYear} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">No data available</div>
        )}
      </ChartCard>

      {choiceQ1 ? (
        <ChartCard title={choiceQ1.question} subtitle="Question response distribution" span={2}>
          <ResponsiveContainer>
            <BarChart data={choiceQ1Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "oklch(0.96 0 0)" }} contentStyle={{ background: "white", border: "1px solid oklch(0.92 0 0)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="oklch(0.15 0 0)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <ChartCard title="Department / Branch" subtitle="Student department breakdown" span={2}>
          {byBranch.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={byBranch} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "oklch(0.96 0 0)" }} contentStyle={{ background: "white", border: "1px solid oklch(0.92 0 0)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="oklch(0.15 0 0)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">No data available</div>
          )}
        </ChartCard>
      )}

      <ChartCard title="Department / Branch" subtitle="Submissions by department">
        {byBranch.length > 0 ? (
          <ResponsiveContainer>
            <BarChart data={byBranch} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "oklch(0.96 0 0)" }} contentStyle={{ background: "white", border: "1px solid oklch(0.92 0 0)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="oklch(0.3 0 0)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">No data available</div>
        )}
      </ChartCard>

      {choiceQ2 ? (
        <ChartCard title={choiceQ2.question} subtitle="Question response distribution" span={2}>
          <ResponsiveContainer>
            <BarChart data={choiceQ2Data} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.92 0 0)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="oklch(0.5 0 0)" fontSize={11} tickLine={false} axisLine={false} width={110} />
              <Tooltip cursor={{ fill: "oklch(0.96 0 0)" }} contentStyle={{ background: "white", border: "1px solid oklch(0.92 0 0)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="value" fill="oklch(0.15 0 0)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <ChartCard title="Submissions log" span={2}>
          <div className="overflow-x-auto h-full max-h-56">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Year</th>
                  <th className="py-2">Branch</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map(r => (
                  <tr key={r._id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium text-foreground">{r.user?.name || "N/A"}</td>
                    <td className="py-2.5">{r.userEmail}</td>
                    <td className="py-2.5">{r.user?.year || "N/A"}</td>
                    <td className="py-2.5">{r.user?.branch || "N/A"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center italic">No submissions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="size-4" /> Quick insights
        </div>
        <ul className="space-y-4 text-sm">
          <Insight label="Top Department" value={topBranch} sub={`${topBranchCount} responses`} />
          <Insight label="Most Active Year" value={topYear} sub={`${topYearCount} responses`} />
          {choiceQ1 ? (
            <Insight label={`Top Option (${choiceQ1.question.slice(0, 15)}...)`} value={choiceQ1Top} sub={`${choiceQ1TopCount} picks`} />
          ) : (
            <Insight label="Total Submissions" value={rows.length} sub="Real-time count" />
          )}
          <Insight label="Completion Rate" value="100%" sub="All submitted forms are complete" />
        </ul>
      </div>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <div key={it.name} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: GRAYS[i % GRAYS.length] }} />
          {it.name} <span className="text-foreground/60">· {it.value}</span>
        </div>
      ))}
    </div>
  );
}

function Insight({ label, value, sub }) {
  return (
    <li className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display mt-1 text-xl">{value}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </li>
  );
}

// ---------- Question view ----------
function QuestionView({ form, rows }) {
  return (
    <div className="space-y-4">
      {(form?.questions || []).map((q, idx) => {
        const isChoice = ['multiple', 'checkbox', 'dropdown'].includes(q.type);
        if (isChoice) {
          const { total, data } = countQuestionResponses(rows, q);
          return (
            <div key={q.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Question {idx + 1} ({q.type})</p>
                  <h3 className="mt-1 font-display text-2xl leading-tight">{q.question}</h3>
                  {q.description && <p className="mt-1 text-xs text-muted-foreground">{q.description}</p>}
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{total} responses</span>
              </div>
              <div className="mt-5 space-y-3">
                {data.map((d) => {
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.name}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span>{d.name}</span>
                        <span className="text-muted-foreground tabular-nums">{d.value} · {pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        } else {
          const answers = rows
            .map(r => ({
              id: r._id,
              val: r.answers?.[q.id],
              name: r.user?.name || r.userEmail.split("@")[0],
              year: r.user?.year || "N/A",
              branch: r.user?.branch || "N/A"
            }))
            .filter(item => item.val !== undefined && item.val !== "");

          return (
            <div key={q.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Question {idx + 1} ({q.type})</p>
                  <h3 className="mt-1 font-display text-2xl leading-tight">{q.question}</h3>
                  {q.description && <p className="mt-1 text-xs text-muted-foreground">{q.description}</p>}
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{answers.length} responses</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {answers.length > 0 ? (
                  answers.map(ans => (
                    <blockquote key={ans.id} className="rounded-xl border border-border bg-background p-4 text-sm">
                      <p className="leading-relaxed">"{ans.val}"</p>
                      <footer className="mt-2 text-xs text-muted-foreground">— {ans.name}, {ans.year} yr · {ans.branch}</footer>
                    </blockquote>
                  ))
                ) : (
                  <p className="col-span-2 text-sm text-muted-foreground italic">No answers for this question yet.</p>
                )}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

// ---------- Individual view ----------
function IndividualView({ form, rows }) {
  const [selected, setSelected] = useState(rows[0]?._id);
  
  useEffect(() => {
    if (rows.length > 0 && !rows.some(r => r._id === selected)) {
      setSelected(rows[0]?._id);
    }
  }, [rows, selected]);

  const current = rows.find(r => r._id === selected) ?? rows[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4 text-xs uppercase tracking-wider text-muted-foreground">
          {rows.length} submissions
        </div>
        <div className="max-h-[640px] overflow-y-auto">
          {rows.map(r => (
            <button
              key={r._id}
              onClick={() => setSelected(r._id)}
              className={`flex w-full items-center gap-3 border-b border-border p-4 text-left transition hover:bg-accent ${current?._id === r._id ? "bg-accent" : ""}`}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-xs font-medium text-background">
                {(r.user?.name || r.userEmail).split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.user?.name || r.userEmail.split("@")[0]}</p>
                <p className="truncate text-xs text-muted-foreground">{r.userEmail} · {new Date(r.submittedAt).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
          {rows.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground italic">No respondents found</div>
          )}
        </div>
      </div>

      {current ? (
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-start justify-between gap-6 border-b border-border pb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Email: {current.userEmail}</p>
              <h2 className="font-display mt-2 text-4xl leading-none">{current.user?.name || "Student"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Department: {current.user?.branch || "N/A"} · Year: {current.user?.year || "N/A"}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Submitted</p>
              <p className="mt-1 text-foreground">{new Date(current.submittedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {(form?.questions || []).map((q, index) => {
              const ans = current.answers?.[q.id];
              const displayAns = Array.isArray(ans) ? ans.join(", ") : ans;
              return (
                <div key={q.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-foreground/70">Q{index + 1}: {q.question}</p>
                  <p className="mt-2 text-lg text-foreground font-semibold">
                    {displayAns !== undefined && displayAns !== "" ? (
                      displayAns
                    ) : (
                      <span className="text-muted-foreground italic font-normal text-sm">No response</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center text-muted-foreground italic">
          No responses match the filters.
        </div>
      )}
    </div>
  );
}

// ---------- Helpers ----------
function countBy(rows, key) {
  const m = new Map();
  rows.forEach(r => {
    const k = key(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function countQuestionResponses(rows, question) {
  const counts = {};
  (question.options || []).forEach(opt => {
    counts[opt] = 0;
  });
  let total = 0;
  rows.forEach(r => {
    const answer = r.answers?.[question.id];
    if (Array.isArray(answer)) {
      answer.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
        total++;
      });
    } else if (answer !== undefined && answer !== null && answer !== "") {
      counts[answer] = (counts[answer] || 0) + 1;
      total++;
    }
  });
  return {
    total,
    data: Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  };
}

const GRAYS = ["oklch(0.15 0 0)", "oklch(0.32 0 0)", "oklch(0.5 0 0)", "oklch(0.65 0 0)", "oklch(0.78 0 0)", "oklch(0.88 0 0)", "oklch(0.93 0 0)"];

function ChartCard({ title, subtitle, children, span = 1 }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${span === 2 ? "lg:col-span-2" : ""}`}>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

