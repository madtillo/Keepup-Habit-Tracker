import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { setOnLocalChange, splitKey, useStore } from './store'
import type { Coll } from './types'
import { refreshSubscription } from './push'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error' | 'offline'

let session: Session | null = null
let status: SyncStatus = 'off'
let lastSync: number | null = null
let running = false
let again = false
const listeners = new Set<() => void>()

function setStatus(s: SyncStatus) {
  status = s
  listeners.forEach(l => l())
}

export async function syncNow(): Promise<void> {
  if (!supabase || !session) return setStatus('off')
  if (!navigator.onLine) return setStatus('offline')
  if (running) {
    again = true
    return
  }
  running = true
  setStatus('syncing')
  try {
    await push()
    await pull()
    lastSync = Date.now()
    setStatus('idle')
  } catch (e) {
    console.warn('Sync fehlgeschlagen', e)
    setStatus('error')
  } finally {
    running = false
    if (again) {
      again = false
      void syncNow()
    }
  }
}

async function push() {
  const st = useStore.getState()
  const keys = Object.keys(st.dirty)
  const userId = session!.user.id
  for (let i = 0; i < keys.length; i += 400) {
    const chunk = keys.slice(i, i + 400)
    const snapshot: Record<string, number> = {}
    const rows = chunk.flatMap(k => {
      const [c, id] = splitKey(k)
      const rec = st[c][id]
      if (!rec) return []
      snapshot[k] = rec.updatedAt
      return [{
        user_id: userId,
        collection: c,
        id,
        data: rec,
        deleted: !!rec.deleted,
        client_updated_at: new Date(rec.updatedAt).toISOString(),
      }]
    })
    if (rows.length) {
      const { error } = await supabase!.from('records').upsert(rows, { onConflict: 'user_id,collection,id' })
      if (error) throw error
    }
    useStore.getState().clearDirty(chunk, snapshot)
  }
}

async function pull() {
  let cursor = useStore.getState().cursor
  for (;;) {
    let q = supabase!
      .from('records')
      .select('collection,data,server_updated_at')
      .order('server_updated_at', { ascending: true })
      .limit(1000)
    // kleine Überlappung, damit gleichzeitige Schreibvorgänge nicht verloren gehen
    if (cursor) q = q.gt('server_updated_at', new Date(new Date(cursor).getTime() - 5000).toISOString())
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    useStore.getState().applyRemote(data.map(r => ({ collection: r.collection as Coll, data: r.data })))
    const last = data[data.length - 1].server_updated_at as string
    const moved = last !== cursor
    cursor = last
    useStore.getState().setCursor(cursor)
    if (data.length < 1000 || !moved) break
  }
}

let timer: number | undefined
function schedule() {
  clearTimeout(timer)
  timer = window.setTimeout(() => void syncNow(), 1200)
}

export function initSync() {
  setOnLocalChange(schedule)
  if (!supabase) return
  supabase.auth.getSession().then(({ data }) => {
    session = data.session
    void syncNow()
    void refreshSubscription().catch(() => {})
  })
  supabase.auth.onAuthStateChange((event, s) => {
    const prevUser = session?.user.id
    session = s
    if (event === 'SIGNED_IN' && s && prevUser !== s.user.id) {
      // Erste Anmeldung: lokale Daten hochladen
      if (!useStore.getState().cursor) useStore.getState().markAllDirty()
      void syncNow()
    }
    if (!s) setStatus('off')
    listeners.forEach(l => l())
  })
  window.addEventListener('online', () => void syncNow())
  window.addEventListener('offline', () => setStatus('offline'))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  setInterval(() => void syncNow(), 60_000)
}

export function useSync() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force(x => x + 1)
    listeners.add(l)
    return () => void listeners.delete(l)
  }, [])
  return { status, session, lastSync }
}
