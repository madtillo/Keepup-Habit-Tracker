import { useMemo } from 'react'
import { useSettings, useStore } from './store'
import type { Habit, Todo } from './types'
import { currentStreak } from './habits'
import { addDays, startOfWeek, today as todayFn } from './date'

export function useHabits(includeArchived = false): Habit[] {
  const habits = useStore(s => s.habits)
  const entries = useStore(s => s.entries)
  const { habitSort } = useSettings()
  return useMemo(() => {
    const list = Object.values(habits).filter(h => !h.deleted && (includeArchived ? h.archived : !h.archived))
    if (habitSort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    if (habitSort === 'streak') {
      const s = new Map(list.map(h => [h.id, currentStreak(h, entries)]))
      return list.sort((a, b) => s.get(b.id)! - s.get(a.id)! || a.order - b.order)
    }
    return list.sort((a, b) => a.order - b.order)
  }, [habits, entries, habitSort, includeArchived])
}

export function useTodos(): Todo[] {
  const todos = useStore(s => s.todos)
  return useMemo(() => Object.values(todos).filter(t => !t.deleted), [todos])
}

const PRIO = { high: 0, normal: 1, low: 2 }

export function sortTodos(list: Todo[]): Todo[] {
  return [...list].sort((a, b) =>
    Number(a.done) - Number(b.done) ||
    PRIO[a.priority] - PRIO[b.priority] ||
    (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
    a.createdAt - b.createdAt)
}

export const isOverdue = (t: Todo, ref = todayFn()) => !t.done && !!t.dueDate && t.dueDate < ref

/** Ende des Zeitraums "Heute/Woche/Monat" ab dem Anker */
export function whenEnd(t: Todo): string {
  if (t.when === 'today') return t.anchor
  if (t.when === 'week') return addDays(startOfWeek(t.anchor), 6)
  const d = new Date(Number(t.anchor.slice(0, 4)), Number(t.anchor.slice(5, 7)), 0)
  return `${t.anchor.slice(0, 7)}-${String(d.getDate()).padStart(2, '0')}`
}

/** Todos, die an einem Tag auf "Heute" erscheinen */
export function todosForDay(todos: Todo[], day: string, ref = todayFn()): Todo[] {
  return sortTodos(todos.filter(t => {
    if (t.done) return t.doneAt === day
    if (t.dueDate) return t.dueDate === day || (day === ref && t.dueDate < ref)
    if (t.when === 'today') return day === ref ? t.anchor <= ref : t.anchor === day
    return false
  }))
}

/** Fokus: offene Aufgaben, die jetzt dran sind (überfällig, heute, diese Woche, dieser Monat) */
export function focusTodos(todos: Todo[], ref = todayFn()): Todo[] {
  return sortTodos(todos.filter(t => !t.done && t.anchor <= ref && (!t.dueDate || t.dueDate <= addDays(ref, 7) || whenEnd(t) <= addDays(ref, 31))))
}
