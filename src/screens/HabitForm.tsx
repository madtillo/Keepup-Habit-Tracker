import { useState } from 'react'
import { useStore } from '../lib/store'
import type { Schedule } from '../lib/types'
import type { Route } from '../lib/nav'
import { nav } from '../lib/nav'
import { createHabit, deleteHabit, updateHabit } from '../lib/actions'
import { CATEGORIES, EMOJIS } from '../lib/templates'
import { WEEKDAYS } from '../lib/date'
import { OverlayFrame, SheetHeader, Stepper } from '../components/ui'
import { Plus, Trash, X } from '../components/Icons'

type Props = Extract<Route, { kind: 'habitForm' }> & { closing?: boolean; onClose: () => void }

export function HabitForm({ habitId, template, closing, onClose }: Props) {
  const existing = useStore(s => (habitId ? s.habits[habitId] : undefined))
  const [name, setName] = useState(existing?.name ?? template?.name ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? template?.emoji ?? '✨')
  const [category, setCategory] = useState(existing?.category ?? template?.category ?? 'Sonstiges')
  const [goal, setGoal] = useState(existing?.goal ?? template?.goal ?? 1)
  const [unit, setUnit] = useState(existing?.unit ?? template?.unit ?? '')
  const [schedule, setSchedule] = useState<Schedule>(existing?.schedule ?? { type: 'daily' })
  const [reminders, setReminders] = useState<string[]>(existing?.reminders ?? [])
  const [newTime, setNewTime] = useState('08:00')
  const [customEmoji, setCustomEmoji] = useState(false)

  const valid = name.trim().length > 0 && (schedule.type !== 'weekdays' || schedule.days.length > 0)

  const save = () => {
    if (!valid) return
    const draft = { name: name.trim(), emoji, category, goal, unit: unit.trim(), schedule, reminders: [...new Set(reminders)].sort() }
    if (existing) updateHabit(existing, draft)
    else {
      createHabit(draft)
      nav.toast(`${emoji} ${draft.name} hinzugefügt`)
    }
    nav.closeKinds('habitForm', 'newHabit')
  }

  const days = schedule.type === 'weekdays' ? schedule.days : [0, 1, 2, 3, 4, 5, 6]

  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title={existing ? 'Habit bearbeiten' : template ? 'Neuer Habit' : 'Eigenes Habit'} onClose={onClose} onDone={save} doneDisabled={!valid} />
      {!valid && !name.trim() && <p className="hint">Gib einen Namen ein.</p>}

      <button className="emoji-preview" onClick={() => setCustomEmoji(v => !v)} aria-label="Emoji wählen">{emoji}</button>

      <div className="field-label">Name</div>
      <input className="input" placeholder="z. B. Lesen" value={name} onChange={e => setName(e.target.value)} maxLength={60} autoFocus={!existing && !template} />

      <div className="field-label">Icon</div>
      {customEmoji && (
        <input className="input" style={{ marginBottom: 12 }} placeholder="Eigenes Emoji eingeben" maxLength={8}
          onChange={e => { const v = [...e.target.value.trim()].slice(0, 2).join(''); if (v) setEmoji(v) }} />
      )}
      <div className="card" style={{ padding: 10 }}>
        <div className="emoji-grid">
          {EMOJIS.map(e => <button key={e} className={e === emoji ? 'active' : ''} onClick={() => setEmoji(e)}>{e}</button>)}
        </div>
        <button className="btn" style={{ marginTop: 10, minHeight: 44, fontSize: 15 }} onClick={() => setCustomEmoji(v => !v)}>Eigenes Emoji …</button>
      </div>

      <div className="field-label">Kategorie</div>
      <div className="chip-row">
        {CATEGORIES.map(c => <button key={c} className={`chip${c === category ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}
      </div>

      <div className="field-label">Tagesziel</div>
      <div className="list-group">
        <div className="list-row static">
          <span className="grow">Anzahl pro Tag</span>
          <Stepper value={goal} min={1} max={100} onChange={setGoal} />
        </div>
        <div className="list-row static">
          <span className="grow">Einheit</span>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="z. B. Gläser, Seiten" maxLength={20}
            style={{ background: 'none', border: 0, outline: 'none', textAlign: 'right', width: 160, fontSize: 16, color: 'var(--text-2)' }} />
        </div>
      </div>

      <div className="field-label">Rhythmus</div>
      <div className="segmented">
        <button className={schedule.type === 'daily' ? 'active' : ''} onClick={() => setSchedule({ type: 'daily' })}>Täglich</button>
        <button className={schedule.type === 'weekdays' ? 'active' : ''} onClick={() => setSchedule({ type: 'weekdays', days: schedule.type === 'weekdays' ? schedule.days : [0, 1, 2, 3, 4] })}>Wochentage</button>
        <button className={schedule.type === 'perWeek' ? 'active' : ''} onClick={() => setSchedule({ type: 'perWeek', count: schedule.type === 'perWeek' ? schedule.count : 3 })}>Pro Woche</button>
      </div>
      {schedule.type === 'weekdays' && (
        <div className="day-picker">
          {WEEKDAYS.map((w, i) => (
            <button key={w} className={days.includes(i) ? 'active' : ''}
              onClick={() => setSchedule({ type: 'weekdays', days: days.includes(i) ? days.filter(d => d !== i) : [...days, i].sort() })}>{w}</button>
          ))}
        </div>
      )}
      {schedule.type === 'perWeek' && (
        <div className="list-group" style={{ marginTop: 12 }}>
          <div className="list-row static">
            <span className="grow">Mal pro Woche</span>
            <Stepper value={schedule.count} min={1} max={7} onChange={count => setSchedule({ type: 'perWeek', count })} />
          </div>
        </div>
      )}

      <div className="field-label">Erinnerungen</div>
      <div className="card" style={{ padding: 14 }}>
        {reminders.length > 0 && (
          <div className="chip-row" style={{ marginBottom: 12 }}>
            {reminders.map(t => (
              <span key={t} className="time-chip">🔔 {t}
                <button onClick={() => setReminders(r => r.filter(x => x !== t))} aria-label="Entfernen"><X size={14} strokeWidth={2.6} /></button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="time" className="time-input" value={newTime} onChange={e => setNewTime(e.target.value)} />
          <button className="btn" style={{ minHeight: 40, width: 'auto', padding: '0 16px', fontSize: 15 }}
            onClick={() => newTime && setReminders(r => (r.includes(newTime) ? r : [...r, newTime].sort()))}>
            <Plus size={18} /> Hinzufügen
          </button>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '10px 2px 0' }}>Push-Benachrichtigungen aktivierst du einmalig in den Einstellungen.</p>
      </div>

      {existing && (
        <>
          <div style={{ height: 30 }} />
          <button className="btn danger" onClick={() => nav.confirm(`„${existing.name}“ und den gesamten Verlauf löschen?`, 'Habit löschen', () => {
            deleteHabit(existing)
            nav.closeKinds('habitForm', 'habitDetail')
          })}><Trash size={20} /> Habit löschen</button>
        </>
      )}
    </OverlayFrame>
  )
}
