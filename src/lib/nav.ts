import { create } from 'zustand'
import type { ReactNode } from 'react'
import type { Template } from './templates'
import type { When } from './types'

export type Tab = 'today' | 'habits' | 'todos' | 'stats' | 'settings'

export type SettingsPage = 'profile' | 'pro' | 'appearance' | 'notifications' | 'sync' | 'privacy' | 'install' | 'whatsnew'

export type TodoFilter = 'all' | 'high' | 'normal' | 'low' | 'overdue' | 'dueToday' | 'focus'

export type Route =
  | { kind: 'habitDetail'; id: string }
  | { kind: 'newHabit' }
  | { kind: 'habitForm'; habitId?: string; template?: Template & { category?: string } }
  | { kind: 'todoForm'; todoId?: string; when?: When; anchor?: string }
  | { kind: 'todoList'; filter: TodoFilter }
  | { kind: 'archive' }
  | { kind: 'focus'; todoId?: string }
  | { kind: 'auth' }
  | { kind: 'settingsPage'; page: SettingsPage }

export interface MenuItem {
  label: string
  emoji?: ReactNode
  selected?: boolean
  danger?: boolean
  onClick: () => void
}

export interface Menu {
  title?: string
  sections: MenuItem[][]
}

interface Entry {
  key: number
  route: Route
  closing?: boolean
}

interface UI {
  tab: Tab
  setTab: (t: Tab) => void
  stack: Entry[]
  open: (r: Route) => void
  close: (key?: number) => void
  menu: Menu | null
  menuClosing: boolean
  showMenu: (m: Menu) => void
  hideMenu: () => void
  toast: { id: number; text: string } | null
  showToast: (text: string) => void
}

let n = 0
const ANIM = 280

export const useUI = create<UI>((set, get) => ({
  tab: 'today',
  setTab: tab => set({ tab }),
  stack: [],
  open: route => set(s => ({ stack: [...s.stack, { key: ++n, route }] })),
  close: key => {
    const top = key ?? get().stack.at(-1)?.key
    if (top === undefined) return
    set(s => ({ stack: s.stack.map(e => (e.key === top ? { ...e, closing: true } : e)) }))
    setTimeout(() => set(s => ({ stack: s.stack.filter(e => e.key !== top) })), ANIM)
  },
  menu: null,
  menuClosing: false,
  showMenu: menu => set({ menu, menuClosing: false }),
  hideMenu: () => {
    set({ menuClosing: true })
    setTimeout(() => set({ menu: null, menuClosing: false }), 220)
  },
  toast: null,
  showToast: text => {
    const id = ++n
    set({ toast: { id, text } })
    setTimeout(() => get().toast?.id === id && set({ toast: null }), 2700)
  },
}))

export const nav = {
  open: (r: Route) => useUI.getState().open(r),
  close: (key?: number) => useUI.getState().close(key),
  closeKinds: (...kinds: Route['kind'][]) => {
    for (const e of useUI.getState().stack) if (kinds.includes(e.route.kind)) useUI.getState().close(e.key)
  },
  menu: (m: Menu) => useUI.getState().showMenu(m),
  toast: (t: string) => useUI.getState().showToast(t),
  confirm: (title: string, label: string, onConfirm: () => void) =>
    useUI.getState().showMenu({ title, sections: [[{ label, danger: true, onClick: onConfirm }], [{ label: 'Abbrechen', onClick: () => {} }]] }),
}
