export default function DashboardHomeLoading() {
  return (
    <div className="flex w-full flex-col gap-3" role="status" aria-label="Loading home feed">
      {[0, 1, 2].map((item) => (
        <article key={item} className="userpost animate-pulse !cursor-default">
          <div className="h-11 w-11 shrink-0 rounded-full bg-neutral-200" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-36 max-w-[60%] rounded bg-neutral-200" />
              <div className="h-3 w-12 rounded bg-neutral-100" />
            </div>
            <div className="mt-3 h-3 w-full rounded bg-neutral-100" />
            <div className="mt-2 h-3 w-4/5 rounded bg-neutral-100" />
            {item === 0 && <div className="mt-4 h-44 w-full rounded-xl bg-neutral-100" />}
            <div className="mt-4 flex gap-8 border-t border-neutral-100 pt-3">
              <div className="h-3 w-10 rounded bg-neutral-100" />
              <div className="h-3 w-10 rounded bg-neutral-100" />
              <div className="h-3 w-10 rounded bg-neutral-100" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
