import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { useHabits, useTodos } from '../lib/selectors'
import { addDays, addMonths, MONTHS, monthDays, parse, startOfWeek, WEEKDAYS, weekday, weekDays } from '../lib/date'
import { bestStreak, currentStreak, doneOn, habitsForDay, isOpen, successRate } from '../lib/habits'
import { setMood } from '../lib/actions'
import { MOOD_LABELS, MOODS } from '../lib/templates'
import { nav, useUI } from '../lib/nav'
import { MonthNav, useToday } from '../components/ui'
import { ChevronLeft, ChevronRight, Gear } from '../components/Icons'

export function Stats() {
  const today = useToday()
  const habits = useHabits()
  const archived = useHabits(true)
  const entries = useStore(s => s.entries)
  const moods = useStore(s => s.moods)
  const focus = useStore(s => s.focus)
  const todos = useTodos()
  const setTab = useUI(s => s.setTab)
  const all = useMemo(() => [...habits, ...archived], [habits, archived])

  // ---- Woche ----
  const [weekOffset, setWeekOffset] = useState(0)
  const wkStart = addDays(startOfWeek(today), weekOffset * 7)
  const wk = weekDays(wkStart)
  const perDay = wk.map(d => all.filter(h => doneOn(h, entries, d)).length)
  const weekTotal = perDay.reduce((a, b) => a + b, 0)
  const weekLabel = weekOffset === 0 ? 'Diese Woche' : weekOffset === -1 ? 'Letzte Woche' : `${parse(wk[0]).getDate()}.${parse(wk[0]).getMonth() + 1}. – ${parse(wk[6]).getDate()}.${parse(wk[6]).getMonth() + 1}.`

  // ---- Kennzahlen ----
  const last = (n: number) => Array.from({ length: n }, (_, i) => addDays(today, -i))
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const rangeDays = last(range)
  const rates = habits.map(h => ({ h, rate: successRate(h, entries, rangeDays), streak: currentStreak(h, entries, today), best: bestStreak(h, entries, today) }))
  const avg = rates.length ? rates.reduce((s, r) => s + r.rate, 0) / rates.length : 0
  const bestAll = rates.reduce((m, r) => Math.max(m, r.best), 0)
  const focusWeek = Object.values(focus).filter(f => !f.deleted && f.date >= startOfWeek(today)).reduce((s, f) => s + f.minutes, 0)
  const todosWeek = todos.filter(t => t.done && t.doneAt && t.doneAt >= startOfWeek(today)).length
  const perfectDays = last(30).filter(d => {
    const list = habitsForDay(habits, entries, d).filter(h => isOpen(h, entries, d) || doneOn(h, entries, d))
    return list.length > 0 && list.every(h => doneOn(h, entries, d))
  }).length

  // ---- Stimmung ----
  const now = new Date()
  const [[y, m], setYM] = useState<[number, number]>([now.getFullYear(), now.getMonth()])
  const mDays = monthDays(y, m)
  const lead = weekday(mDays[0])
  const prevMonthDays = Array.from({ length: lead }, (_, i) => addDays(mDays[0], i - lead))
  const trail = (7 - ((lead + mDays.length) % 7)) % 7
  const nextMonthDays = Array.from({ length: trail }, (_, i) => addDays(mDays[mDays.length - 1], i + 1))
  const moodOf = (d: string) => (moods[d] && !moods[d].deleted ? moods[d].value : 0)
  const monthMoods = mDays.map(moodOf).filter(Boolean)
  const counts = [1, 2, 3, 4, 5].map(v => monthMoods.filter(x => x === v).length)
  const top = monthMoods.length ? counts.indexOf(Math.max(...counts)) : -1
  const daysSoFar = mDays.filter(d => d <= today).length

  // ---- Heatmap (letzte 26 Wochen) ----
  const heatStart = addDays(startOfWeek(today), -25 * 7)
  const heat = Array.from({ length: 26 * 7 }, (_, i) => addDays(heatStart, i)).map(d => {
    if (d > today) return { d, v: -1 }
    const list = habitsForDay(all, entries, d).filter(h => isOpen(h, entries, d) || doneOn(h, entries, d))
    return { d, v: list.length ? list.filter(h => doneOn(h, entries, d)).length / list.length : 0 }
  })

  const pickMood = (d: string) => nav.menu({
    title: `Stimmung am ${parse(d).getDate()}. ${MONTHS[parse(d).getMonth()]}`,
    sections: [
      MOODS.map((e, i) => ({ label: MOOD_LABELS[i], emoji: e, selected: moodOf(d) === i + 1, onClick: () => setMood(d, i + 1) })),
      moodOf(d) ? [{ label: 'Entfernen', danger: true, onClick: () => setMood(d, null) }] : [{ label: 'Abbrechen', onClick: () => {} }],
    ],
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="large-title">Statistik</h1>
        <button className="circle-btn" onClick={() => setTab('settings')} aria-label="Einstellungen"><Gear size={26} /></button>
      </div>

      <div className="card chart-card">
        <div className="chart-head">
          <div>
            <h3>{weekLabel}</h3>
            <p>{weekTotal} {weekTotal === 1 ? 'Erledigung' : 'Erledigungen'}</p>
          </div>
          <div className="chart-nav">
            <button onClick={() => setWeekOffset(o => o - 1)} aria-label="Vorherige Woche"><ChevronLeft size={18} /></button>
            <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} aria-label="Nächste Woche"><ChevronRight size={18} /></button>
          </div>
        </div>
        <WeekChart values={perDay} days={wk} today={today} />
        <div className="chart-labels">
          {WEEKDAYS.map((w, i) => <div key={w}><b>{w}</b>{wk[i] <= today ? perDay[i] : '–'}</div>)}
        </div>
      </div>

      <div className="kpis" style={{ marginTop: 14 }}>
        <div className="card kpi"><b>{Math.round(avg * 100)} %</b><span>Erfolgsquote ({range} Tage)</span></div>
        <div className="card kpi"><b>{perfectDays}</b><span>Perfekte Tage (30 T.)</span></div>
        <div className="card kpi"><b>🏆 {bestAll}</b><span>Beste Serie</span></div>
        <div className="card kpi"><b>{habits.length}</b><span>Aktive Habits</span></div>
        <div className="card kpi"><b>{focusWeek} min</b><span>Fokus diese Woche</span></div>
        <div className="card kpi"><b>{todosWeek}</b><span>Todos erledigt (Woche)</span></div>
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>Stimmung</div>
      <div className="card" style={{ padding: 16 }}>
        <MonthNav label={`${MONTHS[m]} ${y}`} onPrev={() => setYM(addMonths(y, m, -1))} onNext={() => setYM(addMonths(y, m, 1))}
          nextDisabled={y === now.getFullYear() && m === now.getMonth()} />
        <div className="mood-stats">
          <div><b>{monthMoods.length}</b><span>Einträge</span></div>
          <div><b>{top >= 0 ? MOODS[top] : '–'}</b><span>Top</span></div>
          <div><b>{monthMoods.length}/{daysSoFar || mDays.length}</b><span>Check-ins</span></div>
        </div>
        <div className="mood-cal">
          {WEEKDAYS.map(w => <div key={w} className="wd">{w}</div>)}
          {[...prevMonthDays, ...mDays, ...nextMonthDays].map(d => {
            const v = moodOf(d)
            const other = !d.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)
            return (
              <button key={d} className={`${other ? 'other' : ''}${d === today ? ' today' : ''}${v ? ' has' : ''}`} disabled={d > today} onClick={() => pickMood(d)}>
                {Number(d.slice(8))}
                {v ? <span className="e">{MOODS[v - 1]}</span> : null}
              </button>
            )
          })}
        </div>
        {monthMoods.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 16, height: 10, borderRadius: 5, overflow: 'hidden' }}>
            {counts.map((c, i) => c > 0 && (
              <div key={i} title={MOOD_LABELS[i]} style={{ flex: c, background: ['#ff6b6b', '#ff9f5a', '#f5c84c', '#8fd16a', '#4cc38a'][i] }} />
            ))}
          </div>
        )}
      </div>

      <div className="section-head" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20 }}>Habits</h2>
        <div className="segmented" style={{ width: 170 }}>
          {([7, 30, 90] as const).map(r => <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r} T.</button>)}
        </div>
      </div>
      {rates.length === 0 ? (
        <div className="card empty-state"><p style={{ margin: 0 }}>Noch keine Daten – erstelle dein erstes Habit.</p></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {rates.map(({ h, rate, streak, best }) => (
            <button key={h.id} className="rate-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.open({ kind: 'habitDetail', id: h.id })}>
              <span className="emoji">{h.emoji}</span>
              <div className="grow">
                <div className="name"><span>{h.name}</span><span>{Math.round(rate * 100)} %</span></div>
                <div className="bar"><div style={{ width: `${rate * 100}%` }} /></div>
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>🔥 {streak} · 🏆 {best}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="section-title" style={{ marginTop: 32 }}>Letzte 6 Monate</div>
      <div className="card" style={{ padding: 16 }}>
        <div className="heat">
          {heat.map(({ d, v }) => (
            <i key={d} title={d} style={v < 0 ? { opacity: 0.25 } : v > 0 ? { background: 'var(--fg)', opacity: 0.25 + v * 0.75 } : undefined} />
          ))}
        </div>
        <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8 }}>
          <span>{MONTHS[parse(heatStart).getMonth()]}</span><span>Heute</span>
        </div>
      </div>
    </div>
  )
}

function WeekChart({ values, days, today }: { values: number[]; days: string[]; today: string }) {
  const W = 700
  const H = 190
  const top = 22
  const bottom = 8
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => ({
    x: (W / 7) * (i + 0.5),
    y: top + (1 - v / max) * (H - top - bottom),
    future: days[i] > today,
  })).filter(p => !p.future)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  const area = pts.length ? `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z` : ''
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', margin: '16px 0 6px' }}>
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--fg)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--fg)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" x2={W} y1={H - 1} y2={H - 1} stroke="var(--border-strong)" strokeDasharray="4 6" />
      {area && <path d={area} fill="url(#area)" />}
      {pts.length > 1 && <path d={line} fill="none" stroke="var(--fg)" strokeWidth="3.5" strokeLinejoin="round" />}
      {pts.map(p => <circle key={p.x} cx={p.x} cy={p.y} r="7" fill="var(--fg)" />)}
    </svg>
  )
}

