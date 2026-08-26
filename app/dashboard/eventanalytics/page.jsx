"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import {
  BarList,
  Donut,
  FileGauge,
  Heatmap,
  ParagraphCard,
  RadarChartView,
  RegisteredChart,
  VerticalBars,
} from "@/components/eventAnalytics/charts";
import {
  BRANCH_DATA,
  EVENT,
  QUESTIONS,
  REGISTRANTS,
  TOTAL_REGISTRANTS,
  YEAR_DATA,
  INITIAL_TEAMS,
  SOLO_IDS,
} from "@/data/analytics";
import { Chip, Panel, SectionLabel, TrendChip } from "@/components/eventAnalytics/ui";
import { TopBar } from "@/components/TopBarEvents";

const TYPE_LABEL = {
  paragraph: "Paragraph",
  long: "Paragraph",
  short: "Short answer",
  "multiple-choice": "Multiple choice",
  multiple: "Multiple choice",
  dropdown: "Dropdown",
  "multiple-correct": "Multiple correct",
  checkbox: "Checkboxes",
  "file-upload": "File upload",
};

function StatCard({ label, value, trend, hint }) {
  const up = trend >= 0;

  return (
    <div className="flex min-w-0 flex-col justify-between px-1 py-1 sm:px-5">
      <span className="truncate font-mono text-[7px] uppercase tracking-[0.12em] text-ink-4 sm:text-[10px] sm:tracking-[0.14em]">
        {label}
      </span>

      <div className="mt-2 flex min-w-0 flex-wrap items-end gap-1 sm:mt-3 sm:gap-2">
        <span className="min-w-0 truncate font-display text-[18px] font-bold leading-none tracking-tight text-ink tabular-nums sm:text-[32px]">
          {value}
        </span>

        <span
          className={`mb-0.5 inline-flex shrink-0 items-center gap-0.5 font-mono text-[8px] font-medium tabular-nums sm:text-[10px] ${
            up ? "text-good" : "text-critical"
          }`}
        >
          <svg
            className="shrink-0"
            width="7"
            height="7"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d={
                up
                  ? "M6 10V2m0 0L2.5 5.5M6 2l3.5 3.5"
                  : "M6 2v8m0 0 3.5-3.5M6 10 2.5 6.5"
              }
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {Math.abs(trend).toFixed(1)}%
        </span>
      </div>

      <span className="mt-1 hidden text-[10px] text-ink-4 sm:mt-1.5 sm:block sm:text-[11px]">
        {hint ?? "vs yesterday"}
      </span>
    </div>
  );
}

function CardHead({ label, title, right }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h3 className="mt-1.5 font-display text-[17px] font-bold leading-snug text-ink">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function QuestionBlock({ q }) {
  const type = q.type || "short";
  const typeLabel = TYPE_LABEL[type] || type;

  return (
    <Panel className="animate-fade-up">
      <CardHead
        label={typeLabel}
        title={q.title || q.question}
        right={
          <Chip tone="mint">
            {["multiple-correct", "checkbox"].includes(type) ? "multi" : "single"}
          </Chip>
        }
      />
      {["paragraph", "long"].includes(type) && <ParagraphCard q={q} />}
      {["multiple-choice", "multiple"].includes(type) && <Donut data={q.options || []} />}
      {type === "dropdown" && <VerticalBars data={q.options || []} />}
      {["multiple-correct", "checkbox"].includes(type) && <RadarChartView data={q.options || []} />}
      {["file-upload", "file"].includes(type) && <FileGauge q={q} />}
      {["short", "email", "phone"].includes(type) && (
        <div className="flex flex-col gap-2">
          {(q.sampleResponses || []).slice(0, 6).map((resp, idx) => (
            <div key={idx} className="rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink-2">
              {resp}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function NavCard({ title, count, icon, href }) {
  return (
    <a
      href={href}
      className="flex min-w-0 items-center gap-2 rounded-[20px] border border-[#e7e7e7] bg-white px-2.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:gap-4 sm:p-5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f3f3f3] text-[#111111] sm:h-10 sm:w-10 sm:rounded-xl">
        {icon}
      </span>

      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block whitespace-nowrap font-display text-[12px] font-bold leading-none text-[#111111] sm:text-[17px]">
          {title}
        </span>

        <span className="mt-1 block truncate font-mono text-[7px] uppercase tracking-wider text-[#999999] sm:mt-1.5 sm:text-[10px]">
          {count}
        </span>
      </span>

      <span className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full border border-[#e7e7e7] bg-[#fafafa] px-2 py-1.5 font-mono text-[8px] uppercase tracking-wider text-[#444444] transition duration-200 hover:bg-[#ededed] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[10px]">
        Open

        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M5 12h14m-6-6 6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  );
}

function EventAnalyticsContent() {
  const searchParams = useSearchParams();
  const formIdParam = searchParams.get("formId");

  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamFinder, setTeamFinder] = useState({ incompleteTeams: [], soloStudents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      let targetFormId = formIdParam;

      if (!targetFormId) {
        try {
          const mineRes = await fetch("/api/forms/MINE");
          if (mineRes.ok) {
            const mineData = await mineRes.json();
            const list = Array.isArray(mineData) ? mineData : mineData.forms || [];
            if (list.length > 0) {
              targetFormId = list[0]._id || list[0].id;
            }
          }
        } catch (e) {
          console.error("Error fetching user forms:", e);
        }
      }

      if (targetFormId) {
        try {
          const res = await fetch(`/api/forms/${targetFormId}/analytics`);
          if (res.ok) {
            const data = await res.json();
            if (active) {
              setForm(data.form || null);
              setResponses(data.responses || []);
              setTeams(data.teams || []);
              setTeamFinder({
                incompleteTeams: data.teamFinder?.incompleteTeams || [],
                soloStudents: data.teamFinder?.soloStudents || [],
              });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error("Error fetching analytics:", e);
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [formIdParam]);

  const isTeamEvent = useMemo(() => {
    if (!form) return true; // Default to true if not loaded
    return Boolean(form.isTeamEvent || form.isTeam || form.teamConfig?.enabled);
  }, [form]);

  // Dynamic stats computation with 1-day ago trend calculation
  const stats = useMemo(() => {
    const totalResponses = responses.length || REGISTRANTS.length;

    // Filter responses submitted until 1 day ago (24 hours prior)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const prevResponses = responses.filter((r) => {
      const date = new Date(r.submittedAt || r.createdAt);
      return !isNaN(date.getTime()) && date < oneDayAgo;
    });

    const prevCount = prevResponses.length;
    const regTrend = prevCount > 0 ? ((totalResponses - prevCount) / prevCount) * 100 : 12.4;

    const completed = responses.filter((r) => r.isSubmitted || r.submittedAt).length || totalResponses;
    const prevCompleted = prevResponses.filter((r) => r.isSubmitted || r.submittedAt).length || prevCount;
    const formRespTrend = prevCompleted > 0 ? ((completed - prevCompleted) / prevCompleted) * 100 : 8.1;

    const currentCompletionRate = totalResponses ? Math.round((completed / totalResponses) * 100) : 86;
    const prevCompletionRate = prevCount ? Math.round((prevCompleted / prevCount) * 100) : 83;
    const rateTrend = currentCompletionRate - prevCompletionRate;

    const currentTeams = teams.length || INITIAL_TEAMS.length;
    const totalMembers = teams.reduce((s, t) => s + (t.members?.length || 0), 0) || 15;
    const avgTeamSize = currentTeams ? (totalMembers / currentTeams).toFixed(1) : "3.1";
    const teamTrend = -1.4;

    return [
      { label: "Registrations", value: totalResponses.toLocaleString(), trend: regTrend },
      { label: "Form responses", value: completed.toString(), trend: formRespTrend },
      { label: "Completion rate", value: `${currentCompletionRate}%`, trend: rateTrend },
      { label: "Avg. team size", value: avgTeamSize, trend: teamTrend },
    ];
  }, [responses, teams]);

  // Questions formatted with allotted graphs
  const questionBlocks = useMemo(() => {
    if (form && Array.isArray(form.questions) && form.questions.length > 0) {
      return form.questions.map((q) => {
        const type = q.type || "short";
        const answerList = responses
          .map((r) => r.answers?.[q.id])
          .filter((v) => v !== undefined && v !== null && v !== "");

        if (["paragraph", "long"].includes(type)) {
          return {
            id: q.id,
            title: q.question || q.title || "Paragraph question",
            type: "paragraph",
            responses: answerList.length,
            avgWords: answerList.length
              ? Math.round(
                  answerList.reduce((s, a) => s + String(a).split(/\s+/).length, 0) /
                    answerList.length
                )
              : 0,
            sampleResponses: answerList.map((a) => String(a)).slice(0, 5),
          };
        }

        if (["multiple-choice", "multiple", "dropdown", "multiple-correct", "checkbox"].includes(type)) {
          const counts = {};
          answerList.forEach((ans) => {
            const arr = Array.isArray(ans) ? ans : [ans];
            arr.forEach((val) => {
              const key = String(val);
              counts[key] = (counts[key] || 0) + 1;
            });
          });
          const options = (q.options || Object.keys(counts)).map((opt) => {
            const label = typeof opt === "object" ? opt.label || opt.text : String(opt);
            return { label, count: counts[label] || 0 };
          });

          return {
            id: q.id,
            title: q.question || q.title || "Question",
            type: type === "dropdown" ? "dropdown" : type === "checkbox" ? "multiple-correct" : "multiple-choice",
            options,
          };
        }

        if (["file-upload", "file"].includes(type)) {
          return {
            id: q.id,
            title: q.question || q.title || "File upload",
            type: "file-upload",
            submitted: answerList.length,
            missing: Math.max(0, responses.length - answerList.length),
            fileKinds: [
              { label: "PDF", count: Math.round(answerList.length * 0.8) },
              { label: "DOCX", count: Math.round(answerList.length * 0.2) },
            ],
          };
        }

        return {
          id: q.id,
          title: q.question || q.title || "Short answer",
          type: "short",
          sampleResponses: answerList.map((a) => String(a)).slice(0, 6),
        };
      });
    }

    return QUESTIONS;
  }, [form, responses]);

  const exportExcel = () => {
    const eventTitle = form?.title || EVENT.title;
    const questionsList = form?.questions || QUESTIONS;

    const dataRows = (responses.length > 0 ? responses : REGISTRANTS).map((r, i) => {
      const userTeam = teams.find((t) =>
        t.members?.some((m) => m.email === r.email || m.name === r.name)
      );

      const row = {
        ID: r.id || `R-${i + 1}`,
        Name: r.name || r.user?.name || "Participant",
        Email: r.email || r.userEmail || "—",
        Branch: r.branch || r.user?.branch || r.department || "N/A",
        Year: r.year || r.user?.year || "N/A",
        Team: userTeam ? userTeam.name : "Solo",
        "Team Status": userTeam ? (userTeam.status || "Registered") : "Solo",
        "Submitted At": r.submittedAt ? new Date(r.submittedAt).toLocaleString() : r.registeredAt || "—",
      };

      questionsList.forEach((q) => {
        const val = r.answers?.[q.id];
        row[q.question || q.title || q.id] = Array.isArray(val) ? val.join(", ") : val || "—";
      });

      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, ws, "Responses & Teams");
    XLSX.writeFile(
      wb,
      `${eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const completedTeamsCount = teams.filter((t) => t.status === "complete" || t.status === "completed").length;
  const soloCount = teamFinder.soloStudents?.length || SOLO_IDS.length;
  const activeFormId = form?._id || formIdParam || "";

  return (
    <DashboardEventsShell>
      <TopBar title="Analytics" backPath="/dashboard/events/yourform" />

      <div className="flex flex-col gap-2.5 sm:px-3.5 sm:gap-8">
        <div className="animate-fade-up">
          <div className="mb-4 rounded-3xl border border-line bg-panel p-6 shadow-[0_1px_2px_rgba(16,35,28,0.04)] sm:p-7">
            <SectionLabel>Results &amp; Analytics · {EVENT.window}</SectionLabel>
            <h1 className="mt-2 font-display text-[34px] font-extrabold leading-none tracking-tight text-ink sm:text-[40px]">
              {form?.title || EVENT.title}
            </h1>
            <p className="mt-2 text-[14px] text-ink-3">{form?.description || EVENT.subtitle}</p>
            <button
              type="button"
              onClick={exportExcel}
              className="mt-5 flex w-full items-center justify-center cursor-pointer gap-2 rounded-2xl bg-black px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-[#2a2a2a] active:scale-[0.99]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export Excel
            </button>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-2 sm:gap-0">
            {stats.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                trend={s.trend}
              />
            ))}
          </div>

          <div className={`mb-6 grid gap-2.5 sm:gap-4 ${isTeamEvent ? "grid-cols-2" : "grid-cols-1"}`}>
            <NavCard
              title="Registrants"
              href={`./eventanalytics/registrants${activeFormId ? `?formId=${activeFormId}` : ""}`}
              count={`${responses.length || REGISTRANTS.length} registrants`}
              icon={<Icon icon="solar:user-outline" width="22" height="22" />}
            />
            {isTeamEvent && (
              <NavCard
                title="Teams"
                href={`./eventanalytics/teams${activeFormId ? `?formId=${activeFormId}` : ""}`}
                count={`${completedTeamsCount}/${teams.length || INITIAL_TEAMS.length} · ${soloCount} solo`}
                icon={<Icon icon="solar:widget-5-linear" width="22" height="22" />}
              />
            )}
          </div>

          <Panel className="mb-2.5 animate-fade-up">
            <CardHead label="Registered users" title="Sign-up momentum" right={<Chip>Daily</Chip>} />
            <RegisteredChart />
          </Panel>

          <div className="mb-2.5 grid grid-cols-1 gap-2.5 2xl:grid-cols-2">
            <Panel className="animate-fade-up">
              <CardHead label="Distribution" title="By Branch" right={<Chip>{BRANCH_DATA.length} branches</Chip>} />
              <BarList data={BRANCH_DATA} />
            </Panel>
            <Panel className="animate-fade-up">
              <CardHead label="Distribution" title="By Year" right={<Chip>{YEAR_DATA.length} cohorts</Chip>} />
              <Donut data={YEAR_DATA} centerLabel={YEAR_DATA.reduce((s, y) => s + y.count, 0).toString()} />
            </Panel>
          </div>

          <Panel className="mb-6 animate-fade-up">
            <CardHead label="Cross analysis" title="Branch × Year enrolment" />
            <Heatmap />
          </Panel>

          <div className="mb-5 flex items-center gap-3 pt-1">
            <h2 className="font-display text-xl font-bold text-ink">Question-level responses</h2>
            <div className="h-px flex-1 bg-line" />
            <Chip>{questionBlocks.length} questions</Chip>
          </div>
          <div className="grid grid-cols-1 gap-2.5 2xl:grid-cols-2">
            {questionBlocks.map((q) => (
              <QuestionBlock key={q.id} q={q} />
            ))}
          </div>
        </div>
      </div>
    </DashboardEventsShell>
  );
}

export default function EventAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono">Loading analytics...</div>}>
      <EventAnalyticsContent />
    </Suspense>
  );
}
