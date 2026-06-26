export function CollapseHandle({ side, open, onToggle }: {
  side: "left" | "right";
  open: boolean;
  onToggle: () => void;
}) {
  const isLeft = side === "left";
  return (
    <button
      onClick={onToggle}
      className={`absolute top-1/2 -translate-y-1/2 z-20
        w-5 h-12 bg-slate-800 hover:bg-slate-700
        border border-slate-700 rounded-md
        flex items-center justify-center
        text-slate-400 hover:text-white
        transition-all duration-200
        ${isLeft ? "-right-2.5" : "-left-2.5"}`}
      title={open ? "Collapse" : "Expand"}
    >
      <svg className="w-3 h-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d={isLeft ? (open ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7") : (open ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7")} />
      </svg>
    </button>
  );
}
