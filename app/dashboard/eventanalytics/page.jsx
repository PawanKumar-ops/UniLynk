"use client";

import { useRouter } from "next/navigation";
import "@/app/dashboard/dashboard.css";
import "@/components/events-pages.css";
import { Icon } from "@iconify/react";
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
  "multiple-choice": "Multiple choice",
  "multiple-correct": "Multiple correct",
  dropdown: "Dropdown",
  "file-upload": "File upload",
};

const STATS = [
  { label: "Registrations", value: TOTAL_REGISTRANTS.toLocaleString(), trend: 12.4 },
  { label: "Form responses", value: "461", trend: 8.1 },
  { label: "Completion rate", value: "86%", trend: 3.2 },
  { label: "Avg. team size", value: "3.1", trend: -1.4 },
];

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
          className={`mb-0.5 inline-flex shrink-0 items-center gap-0.5 font-mono text-[8px] font-medium tabular-nums sm:text-[10px] ${up ? "text-good" : "text-critical"
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
        {hint ?? "vs last event"}
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
  return (
    <Panel className="animate-fade-up">
      <CardHead
        label={TYPE_LABEL[q.type]}
        title={q.title}
        right={<Chip tone="mint">{q.type === "multiple-correct" ? "multi" : "single"}</Chip>}
      />
      {q.type === "paragraph" && <ParagraphCard q={q} />}
      {q.type === "multiple-choice" && <Donut data={q.options} />}
      {q.type === "dropdown" && <VerticalBars data={q.options} />}
      {q.type === "multiple-correct" && <RadarChartView data={q.options} />}
      {q.type === "file-upload" && <FileGauge q={q} />}
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

export default function EventAnalyticsPage() {
  const teams = INITIAL_TEAMS;
  const solo = SOLO_IDS;
  const completedTeams = teams.filter((t) => t.status === "completed").length;
  return (
    <DashboardEventsShell>
      <TopBar
  title="Analytics"
  backPath="/dashboard/events/yourform"
/>

      <div className="flex flex-col gap-2.5 sm:px-3.5 sm:gap-8">
        <div className="animate-fade-up">
          <div className="mb-4 rounded-3xl border border-line bg-panel p-6 shadow-[0_1px_2px_rgba(16,35,28,0.04)] sm:p-7">
            <SectionLabel>Results &amp; Analytics · {EVENT.window}</SectionLabel>
            <h1 className="mt-2 font-display text-[34px] font-extrabold leading-none tracking-tight text-ink sm:text-[40px]">
              {EVENT.title}
            </h1>
            <p className="mt-2 text-[14px] text-ink-3">{EVENT.subtitle}</p>
            <button
              type="button"
              onClick={() => { }}
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
            {STATS.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                trend={s.trend}
              />
            ))}
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-4">
            <NavCard
              title="Registrants"
              href="./eventanalytics/registrants"
              count={`${REGISTRANTS.length}`}
              icon={
                <Icon icon="solar:user-outline" width="22" height="22" />
              }
            />
            <NavCard
              title="Teams"
              href="./eventanalytics/teams"
              count={`${completedTeams}/${teams.length} · ${solo.length} solo`}
              icon={
                <Icon icon="solar:widget-5-linear" width="22" height="22" />
              }
            />
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
            <Chip>{QUESTIONS.length} questions</Chip>
          </div>
          <div className="grid grid-cols-1 gap-2.5 2xl:grid-cols-2">
            {QUESTIONS.map((q) => (
              <QuestionBlock key={q.id} q={q} />
            ))}
          </div>
        </div>
      </div>
    </DashboardEventsShell>
  );
}
