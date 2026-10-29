import { useState } from 'react'
import { useStore } from '../lib/store'
import { addMonths, MONTHS, monthDays, WEEKDAYS, weekday } from '../lib/date'
import { bestStreak, countOn, currentStreak, doneInRange, isScheduled, scheduleLabel, streakUnit, successRate } from '../lib/habits'
import { setCount, toggleHabitDay, updateHabit } from '../lib/actions'
import { CATEGORY_EMOJI } from '../lib/templates'
import { nav } from '../lib/nav'
import { MonthNav, OverlayFrame, SheetHeader, Stepper, useToday } from '../components/ui'

export function HabitDetail({ id, closing, onClose }: { id: string; closing?: boolean; onClose: () => void }) {
  const h = useStore(s => s.habits[id])
  const entries = useStore(s => s.entries)
  const today = useToday()
  const now = new Date()
  const [[y, m], setYM] = useState<[number, number]>([now.getFullYear(), now.getMonth()])
  if (!h || h.deleted) return null

  const days = monthDays(y, m)
  const thisMonth = monthDays(now.getFullYear(), now.getMonth())
  const streak = currentStreak(h, entries, today)
  const best = bestStreak(h, entries, today)
  const isCurrent = y === now.getFullYear() && m === now.getMonth()
  const todayCount = countOn(entries, h.id, today)

  return (
    <OverlayFrame closing={closing} push>
      <SheetHeader title={h.name} onClose={onClose} back right={
        <button className="circle-btn" style={{ fontSize: 24 }} onClick={() => nav.open({ kind: 'habitForm', habitId: h.id })} aria-label="Bearbeiten">{h.emoji}</button>
      } />

      <div className="stat-tiles" style={{ marginTop: 8 }}>
        <div className="card stat-tile"><div className="icon">🔥</div><b>{streak} {streakUnit(h, streak)}</b><span>Aktuelle Serie</span></div>
        <div className="card stat-tile"><div className="icon">📅</div><b>{doneInRange(h, entries, thisMonth)}</b><span>Diesen Monat</span></div>
        <div className="card stat-tile"><div className="icon">🏆</div><b>{best} {streakUnit(h, best)}</b><span>Beste Serie</span></div>
      </div>

      <div className="row-card" style={{ marginTop: 14 }}>
        <span className="circle-btn small" style={{ fontSize: 20 }}>{CATEGORY_EMOJI[h.category] ?? '✨'}</span>
        <div style={{ flex: 1 }}>
          <div className="muted" style={{ fontSize: 13 }}>Kategorie</div>
          <div style={{ fontSize: 18, fontWeight: 550 }}>{h.category}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="muted" style={{ fontSize: 13 }}>Rhythmus</div>
          <div style={{ fontSize: 15, fontWeight: 550 }}>{scheduleLabel(h)}</div>
        </div>
      </div>

      {h.goal > 1 && (
        <div className="row-card" style={{ marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <div className="muted" style={{ fontSize: 13 }}>Heute</div>
            <div style={{ fontSize: 18, fontWeight: 550 }}>{todayCount} / {h.goal} {h.unit}</div>
          </div>
          <Stepper value={todayCount} min={0} max={Math.max(h.goal * 3, 99)} onChange={v => setCount(h.id, today, v)} />
        </div>
      )}

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <h3 style={{ margin: 0, fontSize: 21, fontWeight: 600 }}>Monatsübersicht</h3>
        <p className="muted" style={{ margin: '6px 0 12px', fontSize: 15 }}>Tippe auf einen Tag, um den Status zu ändern.</p>
        <MonthNav label={`${MONTHS[m]} ${y}`} onPrev={() => setYM(addMonths(y, m, -1))} onNext={() => setYM(addMonths(y, m, 1))} nextDisabled={isCurrent} />
        <div className="cal">
          {WEEKDAYS.map(w => <div key={w} className="wd">{w}</div>)}
          {Array.from({ length: weekday(days[0]) }, (_, i) => <span key={'b' + i} className="blank" />)}
          {days.map(d => {
            const done = countOn(entries, h.id, d) >= h.goal
            const cls = [done && 'on', d > today && 'future', d === today && 'today', !done && !isScheduled(h, d) && 'off'].filter(Boolean).join(' ')
            return (
              <button key={d} className={cls} disabled={d > today} onClick={() => toggleHabitDay(h, d)}>
                {Number(d.slice(8))}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
        <span className="muted">Erfolgsquote (30 Tage)</span>
        <b>{Math.round(successRate(h, entries, Array.from({ length: 30 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - i)
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        })) * 100)} %</b>
      </div>

      <div className="action-tiles">
        <button className="card action-tile" onClick={() => nav.open({ kind: 'habitForm', habitId: h.id })}><span className="icon">✏️</span>Bearbeiten</button>
        <button className="card action-tile" onClick={() => {
          updateHabit(h, { archived: true })
          nav.toast(`„${h.name}“ archiviert`)
          onClose()
        }}><span className="icon">🏛️</span>Archivieren</button>
      </div>
    </OverlayFrame>
  )
}
