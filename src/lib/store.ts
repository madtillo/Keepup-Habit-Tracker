import { create } from 'zustand'
import type { Coll, DB, Settings } from './types'
import { COLLECTIONS } from './types'

const KEY = 'keepup:v1'

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  updatedAt: 0,
  theme: 'dark',
  accent: 'mono',
  showMood: true,
  habitView: 'list',
  habitSort: 'custom',
  focusMinutes: 25,
  moodReminder: null,
}

type AnyRec = DB[Coll][string]

interface Persisted extends DB {
  dirty: Record<string, true> // "collection:id"
  cursor: string | null // letzter Server-Zeitstempel beim Abgleich
  moodDismissed: string[]
}

interface State extends Persisted {
  /** Lokale Änderung: setzt updatedAt, merkt sie für den Sync vor */
  put: <C extends Coll>(c: C, rec: DB[C][string]) => void
  /** Daten vom Server übernehmen (gewinnt nur, wenn neuer) */
  applyRemote: (rows: { collection: Coll; data: AnyRec }[]) => void
  clearDirty: (keys: string[], snapshot: Record<string, number>) => void
  setCursor: (c: string | null) => void
  markAllDirty: () => void
  dismissMood: (date: string) => void
  reset: () => void
}

function empty(): Persisted {
  return { habits: {}, entries: {}, todos: {}, moods: {}, focus: {}, settings: {}, dirty: {}, cursor: null, moodDismissed: [] }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return empty()
}

let onLocalChange: () => void = () => {}
export function setOnLocalChange(fn: () => void) {
  onLocalChange = fn
}

export const useStore = create<State>((set, get) => ({
  ...load(),
  put: (c, rec) => {
    const r = { ...rec, updatedAt: Math.max(Date.now(), (rec.updatedAt ?? 0) + 1) }
    set(s => ({
      [c]: { ...s[c], [r.id]: r },
      dirty: { ...s.dirty, [`${c}:${r.id}`]: true },
    }) as Partial<State>)
    onLocalChange()
  },
  applyRemote: rows => {
    if (!rows.length) return
    const s = get()
    const next: Partial<DB> = {}
    for (const { collection, data } of rows) {
      if (!COLLECTIONS.includes(collection)) continue
      const coll = (next[collection] ??= { ...s[collection] } as never) as Record<string, AnyRec>
      const local = coll[data.id]
      if (!local || data.updatedAt > local.updatedAt) coll[data.id] = data
    }
    set(next as Partial<State>)
  },
  clearDirty: (keys, snapshot) =>
    set(s => {
      const dirty = { ...s.dirty }
      for (const k of keys) {
        const [c, id] = splitKey(k)
        // nur entfernen, wenn seit dem Upload nicht erneut geändert
        if (s[c][id]?.updatedAt === snapshot[k]) delete dirty[k]
      }
      return { dirty }
    }),
  setCursor: cursor => set({ cursor }),
  markAllDirty: () =>
    set(s => {
      const dirty: Record<string, true> = {}
      for (const c of COLLECTIONS) for (const id of Object.keys(s[c])) dirty[`${c}:${id}`] = true
      return { dirty }
    }),
  dismissMood: date => set(s => ({ moodDismissed: [...s.moodDismissed.slice(-30), date] })),
  reset: () => set(empty()),
}))

export function splitKey(k: string): [Coll, string] {
  const i = k.indexOf(':')
  return [k.slice(0, i) as Coll, k.slice(i + 1)]
}

// Speichern (gebündelt)
let saveTimer: number | undefined
useStore.subscribe(s => {
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    const { habits, entries, todos, moods, focus, settings, dirty, cursor, moodDismissed } = s
    try {
      localStorage.setItem(KEY, JSON.stringify({ habits, entries, todos, moods, focus, settings, dirty, cursor, moodDismissed }))
    } catch {
      /* Speicher voll – ignorieren */
    }
  }, 150)
})

export function useSettings(): Settings {
  const s = useStore(st => st.settings.settings)
  return s ? { ...DEFAULT_SETTINGS, ...s } : DEFAULT_SETTINGS
}

export function getSettings(): Settings {
  const s = useStore.getState().settings.settings
  return s ? { ...DEFAULT_SETTINGS, ...s } : DEFAULT_SETTINGS
}

export function exportData(): string {
  const { habits, entries, todos, moods, focus, settings } = useStore.getState()
  return JSON.stringify({ app: 'keepup', version: 1, exportedAt: new Date().toISOString(), habits, entries, todos, moods, focus, settings }, null, 2)
}

export function importData(json: string) {
  const data = JSON.parse(json)
  if (data.app !== 'keepup') throw new Error('Keine Keepup-Sicherung')
  const rows: { collection: Coll; data: AnyRec }[] = []
  for (const c of COLLECTIONS) for (const rec of Object.values(data[c] ?? {})) rows.push({ collection: c, data: rec as AnyRec })
  useStore.getState().applyRemote(rows)
  useStore.getState().markAllDirty()
  onLocalChange()
}
