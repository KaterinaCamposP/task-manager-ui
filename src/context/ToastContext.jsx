import { createContext, useCallback, useContext, useState } from "react";
import "./toast.css";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success") => {
      const id = ++toastId;
      setToasts((current) => [
        ...current,
        { id, message, type, leaving: false },
      ]);
      window.setTimeout(() => {
        setToasts((current) =>
          current.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
        );
        window.setTimeout(() => removeToast(id), 250);
      }, 2750);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}${t.leaving ? " toast-leaving" : ""}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
