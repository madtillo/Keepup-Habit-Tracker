import type { Entry, Habit } from './types'
import { addDays, iso, parse, startOfWeek, today, weekday, weekDays } from './date'

type Entries = Record<string, Entry>

export const entryId = (habitId: string, date: string) => `${habitId}_${date}`

export function countOn(entries: Entries, habitId: string, date: string): number {
  const e = entries[entryId(habitId, date)]
  return e && !e.deleted ? e.count : 0
}

export function doneOn(h: Habit, entries: Entries, date: string): boolean {
  return countOn(entries, h.id, date) >= h.goal
}

export function isScheduled(h: Habit, date: string): boolean {
  if (h.schedule.type === 'weekdays') return h.schedule.days.includes(weekday(date))
  return true
}

export function weekDoneCount(h: Habit, entries: Entries, date: string): number {
  return weekDays(date).filter(d => doneOn(h, entries, d)).length
}

function monthDates(date: string): string[] {
  const d = parse(date)
  const n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return Array.from({ length: n }, (_, i) => `${date.slice(0, 8)}${String(i + 1).padStart(2, '0')}`)
}

export function monthDoneCount(h: Habit, entries: Entries, date: string): number {
  return monthDates(date).filter(d => doneOn(h, entries, d)).length
}

/** Fortschritt im Zeitraum (Woche/Monat) für "Nx pro Woche/Monat" */
export function periodProgress(h: Habit, entries: Entries, date: string): { done: number; target: number } | null {
  if (h.schedule.type === 'perWeek') return { done: weekDoneCount(h, entries, date), target: h.schedule.count }
  if (h.schedule.type === 'perMonth') return { done: monthDoneCount(h, entries, date), target: h.schedule.count }
  return null
}

/** Muss der Habit an diesem Tag noch erledigt werden? */
export function isOpen(h: Habit, entries: Entries, date: string): boolean {
  if (!isScheduled(h, date) || doneOn(h, entries, date)) return false
  if (h.schedule.type === 'perWeek') return weekDoneCount(h, entries, date) < h.schedule.count
  if (h.schedule.type === 'perMonth') return monthDoneCount(h, entries, date) < h.schedule.count
  return true
}

/** Habits, die an einem Tag angezeigt werden */
export function habitsForDay(habits: Habit[], entries: Entries, date: string): Habit[] {
  return habits.filter(h => isScheduled(h, date) || countOn(entries, h.id, date) > 0)
}

function firstDay(h: Habit, entries: Entries): string {
  let first = iso(new Date(h.createdAt))
  for (const e of Object.values(entries)) if (e.habitId === h.id && !e.deleted && e.count > 0 && e.date < first) first = e.date
  return first
}

function prevMonth(date: string): string {
  const d = parse(date)
  const p = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-01`
}

export function currentStreak(h: Habit, entries: Entries, ref = today()): number {
  const start = firstDay(h, entries)
  if (h.schedule.type === 'perMonth') {
    const target = h.schedule.count
    let m = ref.slice(0, 8) + '01'
    let n = 0
    if (monthDoneCount(h, entries, m) < target) m = prevMonth(m)
    while (m >= start.slice(0, 8) + '01' && monthDoneCount(h, entries, m) >= target) {
      n++
      m = prevMonth(m)
    }
    return n
  }
  if (h.schedule.type === 'perWeek') {
    const target = h.schedule.count
    let wk = startOfWeek(ref)
    let n = 0
    if (weekDoneCount(h, entries, wk) < target) wk = addDays(wk, -7)
    while (wk >= startOfWeek(start) && weekDoneCount(h, entries, wk) >= target) {
      n++
      wk = addDays(wk, -7)
    }
    return n
  }
  let d = ref
  if (isScheduled(h, d) && !doneOn(h, entries, d)) d = addDays(d, -1)
  let n = 0
  while (d >= start) {
    if (isScheduled(h, d)) {
      if (!doneOn(h, entries, d)) break
      n++
    }
    d = addDays(d, -1)
  }
  return n
}

export function bestStreak(h: Habit, entries: Entries, ref = today()): number {
  const start = firstDay(h, entries)
  let best = 0
  let run = 0
  if (h.schedule.type === 'perMonth') {
    const target = h.schedule.count
    const months: string[] = []
    for (let m = ref.slice(0, 8) + '01'; m >= start.slice(0, 8) + '01'; m = prevMonth(m)) months.unshift(m)
    for (const m of months) {
      if (monthDoneCount(h, entries, m) >= target) best = Math.max(best, ++run)
      else if (m !== ref.slice(0, 8) + '01') run = 0
    }
    return best
  }
  if (h.schedule.type === 'perWeek') {
    const target = h.schedule.count
    for (let wk = startOfWeek(start); wk <= ref; wk = addDays(wk, 7)) {
      if (weekDoneCount(h, entries, wk) >= target) best = Math.max(best, ++run)
      else if (wk !== startOfWeek(ref)) run = 0
    }
    return best
  }
  for (let d = start; d <= ref; d = addDays(d, 1)) {
    if (!isScheduled(h, d)) continue
    if (doneOn(h, entries, d)) best = Math.max(best, ++run)
    else if (d !== ref) run = 0
  }
  return best
}

export function streakUnit(h: Habit, n: number): string {
  if (h.schedule.type === 'perWeek') return n === 1 ? 'Woche' : 'Wochen'
  if (h.schedule.type === 'perMonth') return n === 1 ? 'Monat' : 'Monate'
  return n === 1 ? 'Tag' : 'Tage'
}

export function doneInRange(h: Habit, entries: Entries, days: string[]): number {
  return days.filter(d => doneOn(h, entries, d)).length
}

/** Erfolgsquote 0–1 über die geplanten Tage eines Zeitraums (bis heute) */
export function successRate(h: Habit, entries: Entries, days: string[]): number {
  const t = today()
  const start = firstDay(h, entries)
  if (h.schedule.type === 'perMonth') {
    const target = h.schedule.count
    const months = [...new Set(days.filter(d => d <= t && d >= start).map(d => d.slice(0, 8) + '01'))]
    if (!months.length) return 0
    return months.reduce((sum, m) => sum + Math.min(1, monthDoneCount(h, entries, m) / target), 0) / months.length
  }
  if (h.schedule.type === 'perWeek') {
    const weeks = [...new Set(days.filter(d => d <= t && d >= start).map(startOfWeek))]
    if (!weeks.length) return 0
    const target = h.schedule.count
    return weeks.reduce((sum, wk) => sum + Math.min(1, weekDoneCount(h, entries, wk) / target), 0) / weeks.length
  }
  const planned = days.filter(d => d <= t && d >= start && isScheduled(h, d))
  if (!planned.length) return 0
  return planned.filter(d => doneOn(h, entries, d)).length / planned.length
}

export function scheduleLabel(h: Pick<Habit, 'schedule'>): string {
  const s = h.schedule
  if (s.type === 'daily') return 'Täglich'
  if (s.type === 'perWeek') return `${s.count}× pro Woche`
  if (s.type === 'perMonth') return `${s.count}× pro Monat`
  if (s.days.length === 7) return 'Täglich'
  if (s.days.length === 5 && [0, 1, 2, 3, 4].every(d => s.days.includes(d))) return 'Werktags'
  if (s.days.length === 2 && s.days.includes(5) && s.days.includes(6)) return 'Am Wochenende'
  return [...s.days].sort().map(d => ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][d]).join(', ')
}
