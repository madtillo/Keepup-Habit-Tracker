import { useState } from 'react'
import { useSettings, useStore } from '../lib/store'
import { useHabits } from '../lib/selectors'
import { addMonths, iso, MONTHS, monthDays, weekday } from '../lib/date'
import { countOn, currentStreak, doneOn, isScheduled } from '../lib/habits'
import { tapHabit, updateSettings } from '../lib/actions'
import { nav } from '../lib/nav'
import { CheckCircle, MonthNav, useToday } from '../components/ui'
import { Archive, Filter, Plus } from '../components/Icons'

export function Habits() {
  const today = useToday()
  const habits = useHabits()
  const entries = useStore(s => s.entries)
  const settings = useSettings()
  const now = new Date()
  const [[y, m], setYM] = useState<[number, number]>([now.getFullYear(), now.getMonth()])

  const openFilter = () => nav.menu({
    title: 'Ansicht & Sortierung',
    sections: [
      [
        { label: 'Liste', emoji: '☰', selected: settings.habitView === 'list', onClick: () => updateSettings({ habitView: 'list' }) },
        { label: 'Monatsraster', emoji: '⠿', selected: settings.habitView === 'grid', onClick: () => updateSettings({ habitView: 'grid' }) },
      ],
      [
        { label: 'Eigene Reihenfolge', emoji: '↕️', selected: settings.habitSort === 'custom', onClick: () => updateSettings({ habitSort: 'custom' }) },
        { label: 'Nach Name', emoji: '🔤', selected: settings.habitSort === 'name', onClick: () => updateSettings({ habitSort: 'name' }) },
        { label: 'Nach Serie', emoji: '🔥', selected: settings.habitSort === 'streak', onClick: () => updateSettings({ habitSort: 'streak' }) },
      ],
    ],
  })

  const days = monthDays(y, m)
  const lead = weekday(days[0])
  const isCurrent = y === now.getFullYear() && m === now.getMonth()

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="large-title">Habits</h1>
        <div className="pill-group">
          <button onClick={openFilter} aria-label="Filter"><Filter size={22} strokeWidth={2} /></button>
          <button onClick={() => nav.open({ kind: 'archive' })} aria-label="Archiv"><Archive size={22} strokeWidth={1.9} /></button>
          <button onClick={() => nav.open({ kind: 'newHabit' })} aria-label="Neuer Habit"><Plus size={24} strokeWidth={2} /></button>
        </div>
      </div>

      {habits.length === 0 && (
        <div className="card empty-state">
          <div style={{ fontSize: 48 }}>🌱</div>
          <h3>Noch keine Habits</h3>
          <p>Kleine Schritte, jeden Tag. Starte mit deiner ersten Gewohnheit.</p>
          <button className="btn" onClick={() => nav.open({ kind: 'newHabit' })}><Plus size={22} /> Habit hinzufügen</button>
        </div>
      )}

      {settings.habitView === 'list' ? habits.map(h => {
        const c = countOn(entries, h.id, today)
        const streak = currentStreak(h, entries, today)
        return (
          <button key={h.id} className="card habit-card" onClick={() => nav.open({ kind: 'habitDetail', id: h.id })}>
            <div className="top">
              <span className="emoji">{h.emoji}</span>
              <span className="name">{h.name}</span>
              <CheckCircle count={c} goal={h.goal} size="sm" onClick={() => tapHabit(h, today)} />
            </div>
            <div className="progress-num">{c} / {h.goal}{h.unit && h.goal > 1 ? <span className="muted" style={{ fontSize: 18 }}> {h.unit}</span> : null}</div>
            <div className="meta">
              <span>{isScheduled(h, today) ? 'Heutiges Ziel' : 'Heute frei'}</span>
              <span className="streak">🔥 {streak}</span>
            </div>
            <div className="bar"><div style={{ width: `${Math.min(100, (c / h.goal) * 100)}%` }} /></div>
          </button>
        )
      }) : habits.length > 0 && (
        <>
          <div className="card" style={{ borderRadius: 18, marginBottom: 14 }}>
            <MonthNav label={`${MONTHS[m]} ${y}`} onPrev={() => setYM(addMonths(y, m, -1))} onNext={() => setYM(addMonths(y, m, 1))} nextDisabled={isCurrent} className="flat" />
          </div>
          <div className="habit-grid">
            {habits.map(h => (
              <button key={h.id} className="card grid-card" onClick={() => nav.open({ kind: 'habitDetail', id: h.id })}>
                <div className="title"><span>{h.emoji}</span><span>{h.name}</span></div>
                <div className="dots">
                  {Array.from({ length: lead }, (_, i) => <i key={'b' + i} className="blank" />)}
                  {days.map(d => <i key={d} className={doneOn(h, entries, d) ? 'on' : d > iso(now) ? 'future' : ''} />)}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
