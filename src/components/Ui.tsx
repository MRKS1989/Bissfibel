// Kleine wiederverwendbare Bausteine: Pegellatte, Blatt von unten, Bestätigen mit zweitem Tipp, Meldungen.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt1 } from '../lib/zeit';

export function Pegellatte({ score, gross = true }: { score: number; gross?: boolean }) {
  const p = Math.max(0, Math.min(100, score * 10));
  return (
    <div className="gauge">
      {gross && (
        <div className="score">
          {fmt1(score)}
          <small> /10</small>
        </div>
      )}
      <div className="staff" role="img" aria-label={`Bisswert ${fmt1(score)} von 10`}>
        <i style={{ width: `${p}%` }} />
        <b style={{ left: `${p}%` }} />
      </div>
    </div>
  );
}

/** Blatt von unten. Schließen mit „Schließen“, Tippen daneben oder Escape. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (prev?.isConnected) prev.focus();
    };
  }, [onClose]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mcard">
        <div className="row between">
          <h2>{title}</h2>
          <button ref={closeRef} type="button" className="ghost" onClick={onClose}>Schließen</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Button, der erst beim zweiten Tipp auslöst (z. B. Löschen). */
export function ArmButton({ label, confirm = 'Wirklich?', onConfirm, className }: { label: string; confirm?: string; onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={className} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? confirm : label}
    </button>
  );
}

type Meld = (text: string) => void;
const MeldungCtx = createContext<Meld>(() => {});
export const useMeldung = () => useContext(MeldungCtx);

export function MeldungProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const show = useCallback((t: string) => {
    setText(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(''), 6000);
  }, []);
  return (
    <MeldungCtx.Provider value={show}>
      {children}
      <div className="meldung" role="status" aria-live="polite" hidden={!text} onClick={() => setText('')}>{text}</div>
    </MeldungCtx.Provider>
  );
}
