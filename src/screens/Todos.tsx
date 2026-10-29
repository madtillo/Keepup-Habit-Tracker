import { useTodos, focusTodos, isOverdue } from '../lib/selectors'
import { nav } from '../lib/nav'
import type { Priority } from '../lib/types'
import { useToday } from '../components/ui'
import { ChevronRight, HabitsIcon, Plus, PriorityDot } from '../components/Icons'
import { TodoRow } from './TodoRow'

const PRIOS: { p: Priority; label: string }[] = [
  { p: 'high', label: 'Hoch' },
  { p: 'normal', label: 'Normal' },
  { p: 'low', label: 'Niedrig' },
]

export function Todos() {
  const today = useToday()
  const todos = useTodos()
  const open = todos.filter(t => !t.done)
  const overdue = open.filter(t => isOverdue(t, today)).length
  const dueToday = open.filter(t => t.dueDate === today).length
  const focus = focusTodos(todos, today).slice(0, 5)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="large-title">Todos</h1>
        <button className="circle-btn" onClick={() => nav.open({ kind: 'todoForm' })} aria-label="Neues Todo"><Plus size={26} strokeWidth={2} /></button>
      </div>

      <div className="card overview">
        <h3>Übersicht</h3>
        <div className="cols">
          <button className={overdue ? 'overdue' : ''} onClick={() => nav.open({ kind: 'todoList', filter: 'overdue' })}><b>{overdue}</b><span>Überfällig</span></button>
          <div className="sep" />
          <button onClick={() => nav.open({ kind: 'todoList', filter: 'all' })}><b>{open.length}</b><span>Offen</span></button>
          <div className="sep" />
          <button onClick={() => nav.open({ kind: 'todoList', filter: 'dueToday' })}><b>{dueToday}</b><span>Heute fällig</span></button>
        </div>
      </div>

      <div className="prio-cards">
        {PRIOS.map(({ p, label }) => (
          <button key={p} className={`prio-card ${p}`} onClick={() => nav.open({ kind: 'todoList', filter: p })}>
            <span className="tl"><PriorityDot p={p} size={22} /></span>
            <span className="tr"><ChevronRight size={20} /></span>
            <b>{open.filter(t => t.priority === p).length}</b>
            <span className="label">{label}</span>
          </button>
        ))}
      </div>

      <div className="section-head">
        <h2>Fokus</h2>
        <button className="see-all" onClick={() => nav.open({ kind: 'todoList', filter: 'focus' })}>Alle ansehen <ChevronRight size={18} strokeWidth={2.4} /></button>
      </div>

      {focus.length === 0 ? (
        <div className="card empty-state">
          <HabitsIcon size={54} strokeWidth={2.2} style={{ ['--icon-cut' as string]: 'var(--card)' }} />
          <h3>Noch keine Aufgaben</h3>
          <p>Hier ist Platz für das, was als Nächstes kommt.</p>
          <button className="btn" onClick={() => nav.open({ kind: 'todoForm' })}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fg)', color: 'var(--on-fg)', display: 'grid', placeItems: 'center' }}><Plus size={18} strokeWidth={3} /></span>
            Aufgabe hinzufügen
          </button>
        </div>
      ) : focus.map(t => <TodoRow key={t.id} todo={t} />)}
    </div>
  )
}
