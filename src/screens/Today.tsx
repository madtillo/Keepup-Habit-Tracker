import { useMemo, useRef, useState } from 'react'
import { useSettings, useStore } from '../lib/store'
import { useHabits, useTodos, todosForDay } from '../lib/selectors'
import { addDays, MONTHS_SHORT, parse, WEEKDAYS, weekDays } from '../lib/date'
import { countOn, doneOn, habitsForDay, isOpen } from '../lib/habits'
import { setMood, tapHabit } from '../lib/actions'
import { MOODS } from '../lib/templates'
import { nav, useUI } from '../lib/nav'
import { CheckCircle, Ring, useToday } from '../components/ui'
import { ChevronRight, Plus, X } from '../components/Icons'
import { TodoRow } from './TodoRow'

export function Today() {
  const today = useToday()
  const [day, setDay] = useState(today)
  const [weekRef, setWeekRef] = useState(today)
  const habits = useHabits()
  const entries = useStore(s => s.entries)
  const moods = useStore(s => s.moods)
  const dismissed = useStore(s => s.moodDismissed)
  const todos = useTodos()
  const settings = useSettings()
  const setTab = useUI(s => s.setTab)

  const dayHabits = useMemo(() => habitsForDay(habits, entries, day), [habits, entries, day])
  const open = dayHabits.filter(h => isOpen(h, entries, day)).length
  const scheduled = dayHabits.filter(h => isOpen(h, entries, day) || doneOn(h, entries, day))
  const doneCount = scheduled.filter(h => doneOn(h, entries, day)).length
  const dayTodos = useMemo(() => todosForDay(todos, day, today), [todos, day, today])
  const openTodos = dayTodos.filter(t => !t.done).length
  const mood = moods[day] && !moods[day].deleted ? moods[day] : null
  const showMoodCard = settings.showMood && !mood && day <= today && !dismissed.includes(day)

  const days = weekDays(weekRef)
  const d0 = parse(days[0])

  // Wischen zwischen Wochen
  const touch = useRef<number | null>(null)
  const shiftWeek = (n: number) => {
    const next = addDays(weekRef, n * 7)
    setWeekRef(next)
    const sameWd = weekDays(next)[days.indexOf(day)] ?? weekDays(next)[0]
    setDay(sameWd)
  }

  return (
    <div className="page">
      <div
        className="week-header"
        onTouchStart={e => (touch.current = e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touch.current === null) return
          const dx = e.changedTouches[0].clientX - touch.current
          touch.current = null
          if (Math.abs(dx) > 50) shiftWeek(dx < 0 ? 1 : -1)
        }}
      >
        <button className="month" onClick={() => { setWeekRef(today); setDay(today) }} aria-label="Zu heute springen">
          <b>{MONTHS_SHORT[d0.getMonth()].toUpperCase()}</b>
          <span>{d0.getFullYear()}</span>
        </button>
        <div className="week-days">
          {days.map((d, i) => {
            const all = habitsForDay(habits, entries, d).filter(h => isOpen(h, entries, d) || doneOn(h, entries, d))
            const complete = all.length > 0 && all.every(h => doneOn(h, entries, d))
            return (
              <button key={d} className={`week-day${d === day ? ' selected' : ''}${d > today ? ' future' : ''}${d === today ? ' is-today' : ''}`} onClick={() => setDay(d)}>
                {complete && d <= today && <span className="done-dot" />}
                <span className="wd">{WEEKDAYS[i]}</span>
                <span className="num">{parse(d).getDate()}</span>
              </button>
            )
          })}
        </div>
        <Ring size={52} stroke={5} value={scheduled.length ? doneCount / scheduled.length : 0}>
          <b>{doneCount}</b>
        </Ring>
      </div>

      {showMoodCard && (
        <div className="card mood-card">
          <button className="close" onClick={() => useStore.getState().dismissMood(day)} aria-label="Ausblenden"><X size={20} strokeWidth={2.4} /></button>
          <h3>Wie fühlst du dich?</h3>
          <div className="mood-row">
            {MOODS.map((m, i) => (
              <button key={m} className="mood-btn" onClick={() => setMood(day, i + 1)}>{m}</button>
            ))}
          </div>
        </div>
      )}
      {settings.showMood && mood && (
        <button className="card mood-done" onClick={() => nav.menu({
          title: 'Wie fühlst du dich?',
          sections: [MOODS.map((m, i) => ({ label: ['Schlecht', 'Mäßig', 'Okay', 'Gut', 'Super'][i], emoji: m, selected: mood.value === i + 1, onClick: () => setMood(day, i + 1) })),
            [{ label: 'Stimmung entfernen', danger: true, onClick: () => setMood(day, null) }]],
        })}>
          <span className="emoji">{MOODS[mood.value - 1]}</span>
          <span style={{ flex: 1, fontSize: 18, fontWeight: 550 }}>Deine Stimmung {day === today ? 'heute' : 'an diesem Tag'}</span>
          <ChevronRight size={20} className="muted" />
        </button>
      )}

      <div className="section-head">
        <h2>Habits <span className="badge">{open} offen</span></h2>
        <button className="see-all" onClick={() => setTab('habits')}>Alle ansehen <ChevronRight size={18} strokeWidth={2.4} /></button>
      </div>
      {dayHabits.length === 0 ? (
        <button className="card empty-row" onClick={() => nav.open({ kind: 'newHabit' })}>
          <span className="emoji">✨</span><span className="grow">Erstelle ein Habit</span><Plus size={24} className="muted" />
        </button>
      ) : dayHabits.map(h => {
        const c = countOn(entries, h.id, day)
        const done = c >= h.goal
        return (
          <button key={h.id} className={`card habit-row${done ? ' done' : ''}`} onClick={() => nav.open({ kind: 'habitDetail', id: h.id })}>
            <span className="emoji">{h.emoji}</span>
            <span className="name">
              {h.name}
              {h.goal > 1 && <span className="sub">{c} / {h.goal} {h.unit}</span>}
            </span>
            <CheckCircle count={c} goal={h.goal} onClick={() => tapHabit(h, day)} />
          </button>
        )
      })}

      <div className="section-head">
        <h2>Aufgaben <span className="badge">{openTodos} offen</span></h2>
        <button className="see-all" onClick={() => setTab('todos')}>Alle ansehen <ChevronRight size={18} strokeWidth={2.4} /></button>
      </div>
      {dayTodos.map(t => <TodoRow key={t.id} todo={t} />)}
      <button className="card empty-row" style={dayTodos.length ? { marginTop: 10 } : undefined} onClick={() => nav.open({ kind: 'todoForm', when: 'today', anchor: day < today ? today : day })}>
        <span className="emoji">📝</span><span className="grow">Erstelle ein Todo</span><Plus size={24} className="muted" />
      </button>

      <button className="fab" aria-label="Hinzufügen" onClick={() => nav.menu({
        sections: [[
          { label: 'Neuer Habit', emoji: '✨', onClick: () => nav.open({ kind: 'newHabit' }) },
          { label: 'Neues Todo', emoji: '📝', onClick: () => nav.open({ kind: 'todoForm', when: 'today', anchor: day < today ? today : day }) },
          { label: 'Fokus-Timer', emoji: '⏱️', onClick: () => nav.open({ kind: 'focus' }) },
        ], [{ label: 'Abbrechen', onClick: () => {} }]],
      })}>
        <Plus size={28} strokeWidth={2} />
      </button>
    </div>
  )
}
