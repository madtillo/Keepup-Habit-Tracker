import { useState } from 'react'
import { useTodos, sortTodos, isOverdue, focusTodos } from '../lib/selectors'
import type { TodoFilter } from '../lib/nav'
import { nav } from '../lib/nav'
import type { Todo } from '../lib/types'
import { deleteTodo } from '../lib/actions'
import { OverlayFrame, SheetHeader, useToday } from '../components/ui'
import { ChevronDown, Plus } from '../components/Icons'
import { TodoRow } from './TodoRow'

const TITLES: Record<TodoFilter, string> = {
  all: 'Alle Aufgaben', high: 'Hohe Priorität', normal: 'Normale Priorität', low: 'Niedrige Priorität',
  overdue: 'Überfällig', dueToday: 'Heute fällig', focus: 'Fokus',
}

export function TodoList({ filter, closing, onClose }: { filter: TodoFilter; closing?: boolean; onClose: () => void }) {
  const today = useToday()
  const todos = useTodos()
  const [when, setWhen] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [showDone, setShowDone] = useState(false)

  const match = (t: Todo) => {
    switch (filter) {
      case 'high': case 'normal': case 'low': return t.priority === filter
      case 'overdue': return isOverdue(t, today)
      case 'dueToday': return t.dueDate === today
      default: return true
    }
  }
  let list = filter === 'focus' ? focusTodos(todos, today) : sortTodos(todos.filter(match))
  if (when !== 'all') list = list.filter(t => t.when === when)
  const open = list.filter(t => !t.done)
  const done = list.filter(t => t.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''))
  const showsDone = !['overdue', 'focus'].includes(filter)

  return (
    <OverlayFrame closing={closing} push>
      <SheetHeader title={TITLES[filter]} onClose={onClose} back right={
        <button className="circle-btn" onClick={() => nav.open({ kind: 'todoForm' })} aria-label="Neues Todo"><Plus size={26} /></button>
      } />
      <div className="segmented" style={{ margin: '6px 0 18px' }}>
        {(['all', 'today', 'week', 'month'] as const).map(w => (
          <button key={w} className={when === w ? 'active' : ''} onClick={() => setWhen(w)}>
            {{ all: 'Alle', today: 'Heute', week: 'Woche', month: 'Monat' }[w]}
          </button>
        ))}
      </div>

      {open.length === 0 && (
        <div className="card empty-state">
          <div style={{ fontSize: 44 }}>🎉</div>
          <h3>Alles erledigt</h3>
          <p>Hier gibt es gerade nichts zu tun.</p>
        </div>
      )}
      {open.map(t => <TodoRow key={t.id} todo={t} />)}

      {showsDone && done.length > 0 && (
        <>
          <button className="section-head" style={{ width: '100%' }} onClick={() => setShowDone(v => !v)}>
            <h2 style={{ fontSize: 20 }}>Erledigt <span className="badge">{done.length}</span></h2>
            <ChevronDown size={22} style={{ transform: showDone ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
          </button>
          {showDone && (
            <>
              {done.map(t => <TodoRow key={t.id} todo={t} />)}
              <button className="btn danger" style={{ marginTop: 16 }} onClick={() => nav.confirm(`${done.length} erledigte Aufgaben löschen?`, 'Löschen', () => done.forEach(deleteTodo))}>
                Erledigte löschen
              </button>
            </>
          )}
        </>
      )}
    </OverlayFrame>
  )
}
