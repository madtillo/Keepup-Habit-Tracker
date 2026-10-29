// Wochentage: 0 = Montag … 6 = Sonntag
export type Schedule =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] }
  | { type: 'perWeek'; count: number }

interface Base {
  id: string
  updatedAt: number
  deleted?: boolean
}

export interface Habit extends Base {
  name: string
  emoji: string
  category: string
  goal: number
  unit: string
  schedule: Schedule
  reminders: string[] // "HH:MM"
  archived: boolean
  order: number
  createdAt: number
}

export interface Entry extends Base {
  habitId: string
  date: string // YYYY-MM-DD
  count: number
}

export type When = 'today' | 'week' | 'month'
export type Priority = 'low' | 'normal' | 'high'

export interface Todo extends Base {
  title: string
  note: string
  when: When
  anchor: string // Datum, ab dem "Heute/Woche/Monat" gilt
  priority: Priority
  dueDate: string | null
  done: boolean
  doneAt: string | null
  createdAt: number
}

export interface Mood extends Base {
  date: string
  value: number // 1–5
}

export interface FocusSession extends Base {
  todoId: string | null
  date: string
  minutes: number
}

export type Theme = 'dark' | 'light' | 'system'
export type Accent = 'mono' | 'blue' | 'green' | 'orange' | 'pink' | 'purple'

export interface Settings extends Base {
  theme: Theme
  accent: Accent
  showMood: boolean
  habitView: 'list' | 'grid'
  habitSort: 'custom' | 'name' | 'streak'
  focusMinutes: number
  moodReminder: string | null
}

export interface DB {
  habits: Record<string, Habit>
  entries: Record<string, Entry>
  todos: Record<string, Todo>
  moods: Record<string, Mood>
  focus: Record<string, FocusSession>
  settings: Record<string, Settings>
}

export type Coll = keyof DB
export const COLLECTIONS: Coll[] = ['habits', 'entries', 'todos', 'moods', 'focus', 'settings']
