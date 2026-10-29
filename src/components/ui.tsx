import { useEffect, useState, type ReactNode } from 'react'
import { useUI } from '../lib/nav'
import { ChevronLeft, ChevronRight, Check, Minus, Plus, X } from './Icons'

export function OverlayFrame({ closing, push, children }: { closing?: boolean; push?: boolean; children: ReactNode }) {
  return (
    <div className={`overlay${push ? ' push' : ''}${closing ? ' closing' : ''}`}>
      <div className="overlay-inner">{children}</div>
    </div>
  )
}

export function SheetHeader({ title, onClose, onDone, doneDisabled, back, right }: {
  title: ReactNode
  onClose: () => void
  onDone?: () => void
  doneDisabled?: boolean
  back?: boolean
  right?: ReactNode
}) {
  return (
    <div className="sheet-header">
      <button className="circle-btn" onClick={onClose} aria-label={back ? 'Zurück' : 'Schließen'}>
        {back ? <ChevronLeft size={22} /> : <X size={22} strokeWidth={1.8} />}
      </button>
      <h1>{title}</h1>
      {onDone ? (
        <button className={`circle-btn${doneDisabled ? '' : ' primary'}`} onClick={onDone} disabled={doneDisabled} aria-label="Speichern">
          <Check size={22} strokeWidth={2} />
        </button>
      ) : (right ?? <span />)}
    </div>
  )
}

export function ActionSheetHost() {
  const { menu, menuClosing, hideMenu } = useUI()
  if (!menu) return null
  return (
    <div className={`backdrop${menuClosing ? ' closing' : ''}`} onClick={hideMenu}>
      <div className="action-sheet" onClick={e => e.stopPropagation()}>
        {menu.sections.map((sec, i) => (
          <div className="panel" key={i}>
            {i === 0 && menu.title && <div className="panel-title">{menu.title}</div>}
            {sec.map(item => (
              <button
                key={item.label}
                className={`item${item.selected ? ' selected' : ''}`}
                style={item.danger ? { color: 'var(--danger)' } : undefined}
                onClick={() => {
                  hideMenu()
                  item.onClick()
                }}
              >
                {item.emoji !== undefined && <span className="emoji">{item.emoji}</span>}
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ToastHost() {
  const toast = useUI(s => s.toast)
  return toast ? <div className="toast" key={toast.id}>{toast.text}</div> : null
}

/** Abhak-Kreis: leer, Teilfortschritt (Ring) oder gefüllt */
export function CheckCircle({ count, goal, size = '', onClick }: { count: number; goal: number; size?: '' | 'sm' | 'xs'; onClick?: (e: React.MouseEvent) => void }) {
  const done = count >= goal
  const [burst, setBurst] = useState(0)
  const partial = !done && count > 0
  return (
    <span
      role="button"
      aria-label={done ? 'Erledigt' : 'Abhaken'}
      className={`check ${size}${done ? ' on' : ''}${partial ? ' partial' : ''}`}
      onClick={e => {
        e.stopPropagation()
        if (count + 1 >= goal && !done) setBurst(b => b + 1)
        onClick?.(e)
      }}
    >
      {done && <Check size={size === "xs" ? 14 : size === "sm" ? 18 : 22} strokeWidth={2.6} />}
      {partial && (
        <>
          <svg className="ring" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16.6" fill="none" stroke="var(--fg)" strokeWidth="2.6" strokeDasharray={`${(count / goal) * 104.3} 104.3`} strokeLinecap="round" />
          </svg>
          <span className="count">{count}</span>
        </>
      )}
      {burst > 0 && <Burst key={burst} />}
    </span>
  )
}

function Burst() {
  return (
    <span className="burst">
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        return <i key={i} style={{ ['--dx' as string]: `${Math.cos(a) * 42}px`, ['--dy' as string]: `${Math.sin(a) * 42}px` }} />
      })}
    </span>
  )
}

export function Ring({ value, size = 76, stroke = 7, children, color = 'var(--fg)' }: { value: number; size?: number; stroke?: number; children?: ReactNode; color?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring-btn" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * Math.min(1, value)} ${c}`} style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.3,1,0.4,1)' }} />
      </svg>
      {children}
    </div>
  )
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={`switch${on ? ' on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on} />
}

export function Stepper({ value, min = 1, max = 999, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="Weniger"><Minus size={18} /></button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="Mehr"><Plus size={18} /></button>
    </div>
  )
}

export function MonthNav({ label, onPrev, onNext, nextDisabled, className = '' }: { label: string; onPrev: () => void; onNext: () => void; nextDisabled?: boolean; className?: string }) {
  return (
    <div className={`month-nav ${className}`}>
      <button onClick={onPrev} aria-label="Vorheriger Monat"><ChevronLeft size={22} /></button>
      <span>{label}</span>
      <button onClick={onNext} disabled={nextDisabled} aria-label="Nächster Monat"><ChevronRight size={22} /></button>
    </div>
  )
}

/** Datum, das sich um Mitternacht automatisch aktualisiert */
export function useToday(): string {
  const get = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const [t, setT] = useState(get)
  useEffect(() => {
    const id = setInterval(() => setT(get()), 30_000)
    const vis = () => setT(get())
    document.addEventListener('visibilitychange', vis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])
  return t
}
