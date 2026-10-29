import { useState } from 'react'
import { useStore } from '../lib/store'
import type { Priority, When } from '../lib/types'
import { createTodo, deleteTodo, updateTodo } from '../lib/actions'
import { nav } from '../lib/nav'
import { formatDate, today } from '../lib/date'
import { OverlayFrame, SheetHeader } from '../components/ui'
import { Calendar, CalendarClock, PriorityDot, Sun, Trash, XCircle } from '../components/Icons'

interface Props {
  todoId?: string
  when?: When
  anchor?: string
  closing?: boolean
  onClose: () => void
}

export function TodoForm({ todoId, when: presetWhen, anchor, closing, onClose }: Props) {
  const existing = useStore(s => (todoId ? s.todos[todoId] : undefined))
  const [title, setTitle] = useState(existing?.title ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [when, setWhen] = useState<When>(existing?.when ?? presetWhen ?? 'today')
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'normal')
  const [dueDate, setDueDate] = useState<string | null>(existing?.dueDate ?? null)
  const [picking, setPicking] = useState(!!existing?.dueDate)
  const valid = title.trim().length > 0

  const save = () => {
    if (!valid) return
    const draft = { title: title.trim(), note: note.trim(), when, priority, dueDate: picking ? dueDate : null }
    if (existing) updateTodo(existing, { ...draft, anchor: existing.when !== when ? today() : existing.anchor })
    else createTodo(draft, anchor)
    onClose()
  }

  const opt = (active: boolean) => `option${active ? ' active' : ''}`

  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title={existing ? 'Todo bearbeiten' : 'Neues Todo'} onClose={onClose} onDone={save} doneDisabled={!valid} />
      {!valid && <p className="hint" style={{ marginTop: 18 }}>Gib einen Titel ein.</p>}

      <div className="field-label">Titel</div>
      <input className="input" placeholder="Titel" value={title} onChange={e => setTitle(e.target.value)} autoFocus={!existing} maxLength={120}
        onKeyDown={e => e.key === 'Enter' && save()} />

      <div className="field-label">Wann</div>
      <div className="option-grid">
        <button className={opt(when === 'today')} onClick={() => setWhen('today')}><Sun size={24} />Heute</button>
        <button className={opt(when === 'week')} onClick={() => setWhen('week')}><CalendarClock size={24} />Diese Woche</button>
        <button className={opt(when === 'month')} onClick={() => setWhen('month')}><Calendar size={24} />Dieser Monat</button>
      </div>

      <div className="field-label">Priorität</div>
      <div className="option-grid">
        <button className={opt(priority === 'low')} onClick={() => setPriority('low')}><PriorityDot p="low" size={22} />Niedrig</button>
        <button className={opt(priority === 'normal')} onClick={() => setPriority('normal')}><PriorityDot p="normal" size={22} />Normal</button>
        <button className={opt(priority === 'high')} onClick={() => setPriority('high')}><PriorityDot p="high" size={22} />Hoch</button>
      </div>

      <div className="field-label">Fälligkeitsdatum</div>
      <div className="option-grid two">
        <button className={opt(!picking)} onClick={() => setPicking(false)}><XCircle size={24} />Kein Fälligkeitsdatum</button>
        <button className={opt(picking)} onClick={() => { setPicking(true); if (!dueDate) setDueDate(today()) }}>
          <Calendar size={24} />{picking && dueDate ? formatDate(dueDate) : 'Datum wählen'}
        </button>
      </div>
      {picking && (
        <input type="date" className="input" style={{ marginTop: 12 }} value={dueDate ?? ''} onChange={e => setDueDate(e.target.value || null)} />
      )}

      <div className="field-label">Notiz</div>
      <textarea className="input" placeholder="Optional" value={note} onChange={e => setNote(e.target.value)} rows={3} />

      {existing && (
        <>
          <div style={{ height: 26 }} />
          <button className="btn" onClick={() => nav.open({ kind: 'focus', todoId: existing.id })}>⏱️ Fokus-Timer starten</button>
          <div style={{ height: 12 }} />
          <button className="btn danger" onClick={() => { deleteTodo(existing); onClose() }}><Trash size={20} /> Todo löschen</button>
        </>
      )}
    </OverlayFrame>
  )
}
