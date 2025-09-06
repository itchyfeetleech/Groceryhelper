import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type Toast = { id: number; text: string; actionLabel?: string; onAction?: () => void; durationMs?: number }
type ToastCtx = { show: (t: Omit<Toast, 'id'>) => void }

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(1)
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = idRef.current++
    const toast: Toast = { id, durationMs: 3500, ...t }
    setToasts((arr) => [...arr, toast])
    const timeout = setTimeout(() => {
      setToasts((arr) => arr.filter((x) => x.id !== id))
    }, toast.durationMs)
    return () => clearTimeout(timeout)
  }, [])
  const ctx = useMemo(() => ({ show }), [show])
  return (
    <Ctx.Provider value={ctx}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <div className="toast-text">{t.text}</div>
            {t.onAction && (
              <button className="toast-action" onClick={() => { t.onAction?.(); setToasts((arr) => arr.filter((x) => x.id !== t.id)) }}> {t.actionLabel || 'Undo'} </button>
            )}
            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}

