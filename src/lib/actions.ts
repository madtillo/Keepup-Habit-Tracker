import { getSettings, useStore } from './store'
import type { Habit, Priority, Settings, Todo, When } from './types'
import { today } from './date'
import { countOn, entryId } from './habits'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

const put = () => useStore.getState().put

export type HabitDraft = Omit<Habit, 'id' | 'updatedAt' | 'archived' | 'order' | 'createdAt'>

export function createHabit(d: HabitDraft): Habit {
  const habits = Object.values(useStore.getState().habits)
  const h: Habit = {
    ...d,
    id: uid(),
    updatedAt: 0,
    archived: false,
    order: habits.reduce((m, x) => Math.max(m, x.order), 0) + 1,
    createdAt: Date.now(),
  }
  put()('habits', h)
  return h
}

export function updateHabit(h: Habit, patch: Partial<Habit>) {
  put()('habits', { ...h, ...patch })
}

export function deleteHabit(h: Habit) {
  put()('habits', { ...h, deleted: true })
}

export function setCount(habitId: string, date: string, count: number) {
  const id = entryId(habitId, date)
  const prev = useStore.getState().entries[id]
  put()('entries', { id, habitId, date, count: Math.max(0, count), updatedAt: prev?.updatedAt ?? 0 })
}

/** Tippen auf den Kreis: +1 bis zum Ziel, danach zurück auf 0 */
export function tapHabit(h: Habit, date: string) {
  const c = countOn(useStore.getState().entries, h.id, date)
  setCount(h.id, date, c >= h.goal ? 0 : c + 1)
}

export function toggleHabitDay(h: Habit, date: string) {
  const c = countOn(useStore.getState().entries, h.id, date)
  setCount(h.id, date, c >= h.goal ? 0 : h.goal)
}

export interface TodoDraft {
  title: string
  note: string
  when: When
  priority: Priority
  dueDate: string | null
}

export function createTodo(d: TodoDraft, anchor = today()): Todo {
  const t: Todo = { ...d, id: uid(), updatedAt: 0, anchor, done: false, doneAt: null, createdAt: Date.now() }
  put()('todos', t)
  return t
}

export function updateTodo(t: Todo, patch: Partial<Todo>) {
  put()('todos', { ...t, ...patch })
}

export function toggleTodo(t: Todo) {
  put()('todos', { ...t, done: !t.done, doneAt: t.done ? null : today() })
}

export function deleteTodo(t: Todo) {
  put()('todos', { ...t, deleted: true })
}

export function setMood(date: string, value: number | null) {
  const prev = useStore.getState().moods[date]
  if (value === null) {
    if (prev) put()('moods', { ...prev, deleted: true })
    return
  }
  put()('moods', { id: date, date, value, updatedAt: prev?.updatedAt ?? 0 })
}

export function addFocus(todoId: string | null, minutes: number) {
  put()('focus', { id: uid(), todoId, minutes, date: today(), updatedAt: 0 })
}

export function updateSettings(patch: Partial<Settings>) {
  put()('settings', { ...getSettings(), ...patch, id: 'settings' })
}
