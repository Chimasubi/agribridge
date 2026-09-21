import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const Ctx = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((msg, kind = "ok") => {
    setToast({ msg, kind });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {toast && (
        <div className={`toast ${toast.kind === "err" ? "err" : toast.kind === "info" ? "" : "ok"}`}>
          <div style={{ flex: "none", marginTop: 1 }}>
            {toast.kind === "ok" && <CheckCircle2 size={16} style={{ color: "var(--success)" }} />}
            {toast.kind === "err" && <AlertCircle size={16} style={{ color: "var(--danger)" }} />}
            {toast.kind === "info" && <Info size={16} style={{ color: "var(--info)" }} />}
          </div>
          <div>
            <div className="t-title">{toast.kind === "ok" ? "Success" : toast.kind === "err" ? "Action blocked" : "Notice"}</div>
            <div className="t-body">{toast.msg}</div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}