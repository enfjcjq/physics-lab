import { useToasts } from "../../core/toast.store";

export function ToastContainer() {
  const { toasts, dismiss } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className="pointer-events-auto bg-slate-900 border border-emerald-800/50 rounded-xl p-3 shadow-2xl shadow-emerald-900/20 animate-in slide-in-from-right duration-300 flex items-start gap-3 min-w-[260px] max-w-[340px]"
          onClick={() => dismiss(t.id)}>
          <span className="text-2xl flex-shrink-0">{t.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-400">{t.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}