export function ExportButton({ teams }) {
  return (
    <button
      type="button"
      onClick={() => {}}
      className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-forest-2 active:scale-[0.98]"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
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
  )
}
