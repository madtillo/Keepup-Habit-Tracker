import { useEffect, useRef, useState } from 'react'
import { useSettings, useStore } from '../lib/store'
import { addFocus, toggleTodo, updateSettings } from '../lib/actions'
import { nav } from '../lib/nav'
import { OverlayFrame, SheetHeader } from '../components/ui'
import { Pause, Play, Refresh } from '../components/Icons'

const PRESETS = [5, 15, 25, 45, 60, 90]

export function Focus({ todoId, closing, onClose }: { todoId?: string; closing?: boolean; onClose: () => void }) {
  const todo = useStore(s => (todoId ? s.todos[todoId] : undefined))
  const { focusMinutes } = useSettings()
  const [minutes, setMinutes] = useState(focusMinutes)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [left, setLeft] = useState(minutes * 60)
  const [finished, setFinished] = useState(false)
  const logged = useRef(false)

  useEffect(() => {
    if (!endAt) return
    const tick = () => {
      const s = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        setEndAt(null)
        setFinished(true)
        if (!logged.current) {
          logged.current = true
          addFocus(todoId ?? null, minutes)
          try { navigator.vibrate?.(400) } catch { /* nicht unterstützt */ }
          void navigator.serviceWorker?.ready.then(r => r.showNotification('Fokus beendet 🎉', { body: `${minutes} Minuten geschafft${todo ? ` – ${todo.title}` : ''}.`, icon: './icons/icon-192.png' })).catch(() => {})
        }
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [endAt, minutes, todoId, todo])

  const total = minutes * 60
  const r = 46
  const c = 2 * Math.PI * r
  const running = endAt !== null

  const start = () => {
    if (finished || left === 0) {
      setLeft(total)
      setFinished(false)
      logged.current = false
      setEndAt(Date.now() + total * 1000)
    } else setEndAt(Date.now() + left * 1000)
  }
  const pause = () => setEndAt(null)
  const reset = () => { setEndAt(null); setLeft(total); setFinished(false); logged.current = false }
  const pick = (m: number) => { setMinutes(m); setLeft(m * 60); setFinished(false); logged.current = false; updateSettings({ focusMinutes: m }) }

  const close = () => {
    if (running && left > 0) {
      nav.confirm('Fokus-Sitzung abbrechen?', 'Abbrechen und schließen', () => {
        const done = Math.floor((total - left) / 60)
        if (done >= 1) addFocus(todoId ?? null, done)
        onClose()
      })
    } else onClose()
  }

  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title="Fokus" onClose={close} />
      {todo && <p style={{ textAlign: 'center', fontSize: 19, fontWeight: 550, margin: '10px 0 0' }}>{todo.title}</p>}
      <div className="focus-ring">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--card-2)" strokeWidth="3.5" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${c * (left / total)} ${c}`} style={{ transition: 'stroke-dasharray .3s linear' }} />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div className="focus-time">{finished ? '🎉' : `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`}</div>
          <div className="muted">{finished ? 'Geschafft!' : running ? 'Bleib dran' : 'Bereit'}</div>
        </div>
      </div>

      {!running && !finished && left === total && (
        <div className="chip-row" style={{ justifyContent: 'center', marginTop: 10 }}>
          {PRESETS.map(m => <button key={m} className={`chip${m === minutes ? ' active' : ''}`} onClick={() => pick(m)}>{m} min</button>)}
        </div>
      )}

      <div className="focus-controls">
        <button className="circle-btn" onClick={reset} aria-label="Zurücksetzen"><Refresh size={28} /></button>
        <button className="circle-btn primary" onClick={running ? pause : start} aria-label={running ? 'Pause' : 'Start'}>
          {running ? <Pause size={30} /> : <Play size={30} />}
        </button>
      </div>

      {finished && todo && !todo.done && (
        <button className="btn primary" style={{ marginTop: 30 }} onClick={() => { toggleTodo(todo); onClose() }}>Aufgabe als erledigt markieren</button>
      )}
      <p className="muted" style={{ textAlign: 'center', fontSize: 14, marginTop: 30 }}>Lass die App geöffnet – am Ende bekommst du eine Benachrichtigung.</p>
    </OverlayFrame>
  )
}
