export const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
export const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

const pad = (n: number) => String(n).padStart(2, '0')

export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const today = () => iso(new Date())

export function addDays(s: string, n: number): string {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}

/** 0 = Montag … 6 = Sonntag */
export function weekday(s: string): number {
  return (parse(s).getDay() + 6) % 7
}

export function startOfWeek(s: string): string {
  return addDays(s, -weekday(s))
}

export function weekDays(s: string): string[] {
  const start = startOfWeek(s)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function startOfMonth(s: string): string {
  return s.slice(0, 8) + '01'
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function monthDays(year: number, month: number): string[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, i) => iso(new Date(year, month, i + 1)))
}

export function addMonths(year: number, month: number, n: number): [number, number] {
  const d = new Date(year, month + n, 1)
  return [d.getFullYear(), d.getMonth()]
}

export function diffDays(a: string, b: string): number {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000)
}

export function formatDate(s: string): string {
  const d = parse(s)
  const t = today()
  if (s === t) return 'Heute'
  if (s === addDays(t, 1)) return 'Morgen'
  if (s === addDays(t, -1)) return 'Gestern'
  return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}${d.getFullYear() !== parse(t).getFullYear() ? ' ' + d.getFullYear() : ''}`
}

export function formatLong(s: string): string {
  const d = parse(s)
  return `${WEEKDAYS_LONG[weekday(s)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}
