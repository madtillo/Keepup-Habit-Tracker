import type { Todo } from '../lib/types'
import { toggleTodo } from '../lib/actions'
import { formatDate, today } from '../lib/date'
import { nav } from '../lib/nav'
import { CheckCircle } from '../components/ui'

const WHEN = { today: 'Heute', week: 'Diese Woche', month: 'Dieser Monat' }

export function TodoRow({ todo: t }: { todo: Todo }) {
  const overdue = !t.done && t.dueDate && t.dueDate < today()
  return (
    <button className={`card todo-row${t.done ? ' done' : ''}`} onClick={() => nav.open({ kind: 'todoForm', todoId: t.id })}>
      <span className="prio-bar" style={{ background: `var(--prio-${t.priority})` }} />
      <span className="body">
        <div className="title">{t.title}</div>
        <div className="sub">
          {t.dueDate ? <span className={overdue ? 'overdue' : ''}>📅 {formatDate(t.dueDate)}</span> : <span>{WHEN[t.when]}</span>}
          {t.note && <span>📝</span>}
        </div>
      </span>
      <CheckCircle count={t.done ? 1 : 0} goal={1} size="sm" onClick={() => toggleTodo(t)} />
    </button>
  )
}
