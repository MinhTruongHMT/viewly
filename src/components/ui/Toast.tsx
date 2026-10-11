import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";

export function Toast() {
  const toast = useUIStore((state) => state.toast);
  const notify = useUIStore((state) => state.notify);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => notify(null), 4500);
    return () => clearTimeout(timer);
  }, [toast, notify]);
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => notify(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
