import { useState } from 'react'
import { useStore } from '../lib/store'
import type { Schedule } from '../lib/types'
import type { Route } from '../lib/nav'
import { nav } from '../lib/nav'
import { createHabit, deleteHabit, updateHabit } from '../lib/actions'
import { CATEGORIES, CATEGORY_EMOJI, EMOJIS } from '../lib/templates'
import { WEEKDAYS } from '../lib/date'
import { BottomSheet, OverlayFrame, SheetHeader, Stepper } from '../components/ui'
import { ChevronRight, Plus, Tag, Trash, X } from '../components/Icons'

type Props = Extract<Route, { kind: 'habitForm' }> & { closing?: boolean; onClose: () => void }
type Period = 'daily' | 'weekly' | 'monthly'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function periodOf(s: Schedule): Period {
  return s.type === 'perWeek' ? 'weekly' : s.type === 'perMonth' ? 'monthly' : 'daily'
}

export function HabitForm({ habitId, template, closing, onClose }: Props) {
  const existing = useStore(s => (habitId ? s.habits[habitId] : undefined))
  const init = existing?.schedule ?? { type: 'daily' as const }
  const [name, setName] = useState(existing?.name ?? template?.name ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? template?.emoji ?? '🙂')
  const [category, setCategory] = useState<string | null>(existing?.category ?? template?.category ?? null)
  const [period, setPeriod] = useState<Period>(periodOf(init))
  // Täglich: Anzahl pro Tag; Wöchentlich/Monatlich: Anzahl Tage im Zeitraum
  const [daily, setDaily] = useState(existing?.goal ?? template?.goal ?? 1)
  const [weekly, setWeekly] = useState(init.type === 'perWeek' ? init.count : 3)
  const [monthly, setMonthly] = useState(init.type === 'perMonth' ? init.count : 10)
  const [days, setDays] = useState<number[]>(init.type === 'weekdays' ? init.days : ALL_DAYS)
  const [unit, setUnit] = useState(existing?.unit ?? template?.unit ?? '')
  const [reminders, setReminders] = useState<string[]>(existing?.reminders ?? [])
  const [sheet, setSheet] = useState<null | 'emoji' | 'time'>(null)
  const [newTime, setNewTime] = useState('08:00')
  const [customEmoji, setCustomEmoji] = useState('')

  const valid = name.trim().length > 0 && (period !== 'daily' || days.length > 0)

  const save = () => {
    if (!valid) return
    const schedule: Schedule =
      period === 'weekly' ? { type: 'perWeek', count: weekly }
      : period === 'monthly' ? { type: 'perMonth', count: monthly }
      : days.length === 7 ? { type: 'daily' } : { type: 'weekdays', days }
    const draft = {
      name: name.trim(), emoji, category: category ?? 'Sonstiges',
      goal: period === 'daily' ? daily : 1, unit: period === 'daily' && daily > 1 ? unit.trim() : '',
      schedule, reminders: [...new Set(reminders)].sort(),
    }
    if (existing) updateHabit(existing, draft)
    else {
      createHabit(draft)
      nav.toast(`${emoji} ${draft.name} hinzugefügt`)
    }
    nav.closeKinds('habitForm', 'newHabit')
  }

  const pickCategory = () => nav.menu({
    title: 'Kategorie',
    sections: [CATEGORIES.map(c => ({ label: c, emoji: CATEGORY_EMOJI[c], selected: c === category, onClick: () => setCategory(c) })), [{ label: 'Abbrechen', onClick: () => {} }]],
  })

  const count = period === 'daily' ? daily : period === 'weekly' ? weekly : monthly
  const setCount = period === 'daily' ? setDaily : period === 'weekly' ? setWeekly : setMonthly
  const max = period === 'daily' ? 100 : period === 'weekly' ? 7 : 31
  const per = { daily: 'pro Tag', weekly: 'pro Woche', monthly: 'pro Monat' }[period]

  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title={existing ? 'Habit bearbeiten' : 'Habit erstellen'} onClose={onClose} onDone={save} doneDisabled={!valid} />
      {!name.trim() && <p className="hint" style={{ marginTop: 18 }}>Gib einen Titel ein.</p>}

      <div className="title-row">
        <button className="emoji-btn" onClick={() => setSheet('emoji')} aria-label="Icon wählen">{emoji}</button>
        <input className="input" placeholder="Titel" value={name} onChange={e => setName(e.target.value)} maxLength={60}
          autoFocus={!existing && !template} onKeyDown={e => e.key === 'Enter' && save()} />
      </div>

      <div className="card form-card">
        <h3>Ziel</h3>
        <div className="period-pills">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
              {{ daily: 'Täglich', weekly: 'Wöchentlich', monthly: 'Monatlich' }[p]}
            </button>
          ))}
        </div>
        <div className="goal-line">
          <span className="muted">{count}x {per}</span>
          <Stepper value={count} min={1} max={max} onChange={setCount} />
        </div>
        {period === 'daily' && daily > 1 && (
          <input className="unit-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="Einheit (optional), z. B. Gläser" maxLength={20} />
        )}
        {period === 'daily' && (
          <>
            <div className="muted" style={{ fontSize: 14, margin: '16px 0 0' }}>An diesen Tagen</div>
            <div className="day-picker">
              {WEEKDAYS.map((w, i) => (
                <button key={w} className={days.includes(i) ? 'active' : ''}
                  onClick={() => setDays(d => (d.includes(i) ? d.filter(x => x !== i) : [...d, i].sort()))}>{w}</button>
              ))}
            </div>
          </>
        )}
      </div>

      <button className="card row-card cat-row" onClick={pickCategory}>
        <span className="icon-circle"><Tag size={22} /></span>
        <span style={{ flex: 1 }}>
          <span className="muted" style={{ fontSize: 13, display: 'block' }}>Kategorie</span>
          <span style={{ fontSize: 18, fontWeight: 550, color: category ? 'var(--text)' : 'var(--text-2)' }}>
            {category ? `${CATEGORY_EMOJI[category] ?? ''} ${category}` : 'Kategorie auswählen'}
          </span>
        </span>
        <ChevronRight size={20} className="muted" />
      </button>

      <div className="card form-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Erinnerungen</h3>
          <button className="plus-light" onClick={() => setSheet('time')} aria-label="Erinnerung hinzufügen"><Plus size={20} strokeWidth={2.4} /></button>
        </div>
        {reminders.length === 0 ? (
          <div className="inner-box"><span style={{ fontSize: 24 }}>⏰</span>Noch keine Erinnerungen.</div>
        ) : reminders.map(t => (
          <div key={t} className="inner-box">
            <span style={{ fontSize: 24 }}>⏰</span>
            <span style={{ flex: 1, fontVariantNumeric: 'tabular-nums' }}>{t} Uhr</span>
            <button className="muted" onClick={() => setReminders(r => r.filter(x => x !== t))} aria-label="Entfernen"><X size={18} strokeWidth={2.4} /></button>
          </div>
        ))}
      </div>

      {existing && (
        <button className="btn danger" style={{ marginTop: 28 }} onClick={() => nav.confirm(`„${existing.name}“ und den gesamten Verlauf löschen?`, 'Habit löschen', () => {
          deleteHabit(existing)
          nav.closeKinds('habitForm', 'habitDetail')
        })}><Trash size={20} /> Habit löschen</button>
      )}

      {sheet === 'emoji' && (
        <BottomSheet title="Icon wählen" onClose={() => setSheet(null)}>
          <div className="emoji-grid">
            {EMOJIS.map(e => <button key={e} className={e === emoji ? 'active' : ''} onClick={() => { setEmoji(e); setSheet(null) }}>{e}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <input className="input" style={{ height: 50 }} placeholder="Eigenes Emoji" value={customEmoji} maxLength={8} onChange={e => setCustomEmoji(e.target.value)} />
            <button className="btn primary" style={{ width: 110 }} disabled={!customEmoji.trim()}
              onClick={() => { setEmoji([...customEmoji.trim()].slice(0, 2).join('')); setSheet(null) }}>Übernehmen</button>
          </div>
        </BottomSheet>
      )}
      {sheet === 'time' && (
        <BottomSheet title="Erinnerung hinzufügen" onClose={() => setSheet(null)}>
          <input type="time" className="input" style={{ textAlign: 'center', fontSize: 28, height: 70 }} value={newTime} onChange={e => setNewTime(e.target.value)} />
          <button className="btn primary" style={{ marginTop: 14 }} disabled={!newTime} onClick={() => {
            setReminders(r => (r.includes(newTime) ? r : [...r, newTime].sort()))
            setSheet(null)
          }}>Hinzufügen</button>
          <p className="muted" style={{ fontSize: 13, textAlign: 'center', margin: '12px 0 0' }}>Push-Benachrichtigungen aktivierst du einmalig unter Einstellungen → Mitteilungen.</p>
        </BottomSheet>
      )}
    </OverlayFrame>
  )
}
