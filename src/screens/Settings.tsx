import { useEffect, useRef, useState } from 'react'
import { exportData, importData, useSettings, useStore } from '../lib/store'
import { updateSettings } from '../lib/actions'
import { supabase, syncAvailable } from '../lib/supabase'
import { syncNow, useSync } from '../lib/sync'
import { currentSubscription, disablePush, enablePush, isIOS, isStandalone, pushSupported, testPush } from '../lib/push'
import { nav } from '../lib/nav'
import type { Accent, Theme } from '../lib/types'
import { Switch } from '../components/ui'
import { ChevronRight } from '../components/Icons'

const ACCENTS: { id: Accent; color: string; label: string }[] = [
  { id: 'mono', color: 'var(--fg)', label: 'Monochrom' },
  { id: 'blue', color: '#4b8ef0', label: 'Blau' },
  { id: 'green', color: '#34c77b', label: 'Grün' },
  { id: 'orange', color: '#f59e2c', label: 'Orange' },
  { id: 'pink', color: '#f2558a', label: 'Pink' },
  { id: 'purple', color: '#9b6cf6', label: 'Lila' },
]

export function Settings() {
  const s = useSettings()
  const { status, session, lastSync } = useSync()
  const dirty = useStore(st => Object.keys(st.dirty).length)
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { void currentSubscription().then(sub => setPushOn(!!sub)) }, [])

  const togglePush = async (on: boolean) => {
    setBusy(true)
    try {
      if (on) { await enablePush(); setPushOn(true); nav.toast('Erinnerungen aktiviert 🔔') }
      else { await disablePush(); setPushOn(false) }
    } catch (e) {
      nav.toast((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const statusText = !syncAvailable ? 'Nicht eingerichtet'
    : !session ? 'Nicht angemeldet'
    : status === 'syncing' ? 'Synchronisiere …'
    : status === 'error' ? 'Fehler – erneut versuchen'
    : status === 'offline' ? 'Offline'
    : dirty ? `${dirty} Änderungen ausstehend`
    : lastSync ? `Synchronisiert ${new Date(lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : 'Bereit'

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `keepup-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  return (
    <div className="page">
      <div className="page-header"><h1 className="large-title">Einstellungen</h1></div>

      <div className="card pro-banner">
        <span className="emoji">💎</span>
        <div><b>Keepup Pro</b><div className="muted" style={{ fontSize: 14, marginTop: 2 }}>Alle Funktionen freigeschaltet – unbegrenzte Habits, Statistiken, Erinnerungen.</div></div>
      </div>

      <div className="section-title">Konto & Sync</div>
      <div className="list-group">
        {session ? (
          <>
            <div className="list-row static"><span>☁️</span><span className="grow">{session.user.email}</span></div>
            <button className="list-row" onClick={() => void syncNow()}><span>🔄</span><span className="grow">Jetzt synchronisieren</span><span className="value">{statusText}</span></button>
            <button className="list-row" style={{ color: 'var(--danger)' }} onClick={() => nav.confirm('Abmelden? Die Daten bleiben in deinem Konto gespeichert und werden von diesem Gerät entfernt.', 'Abmelden', async () => {
              await disablePush().catch(() => {})
              await supabase?.auth.signOut()
              useStore.getState().reset()
            })}><span>🚪</span><span className="grow">Abmelden</span></button>
          </>
        ) : (
          <button className="list-row" onClick={() => syncAvailable ? nav.open({ kind: 'auth' }) : nav.toast('Supabase ist noch nicht eingerichtet (siehe README).')}>
            <span>☁️</span><span className="grow">Anmelden & synchronisieren</span><span className="value">{statusText}</span><ChevronRight size={18} className="faint" />
          </button>
        )}
      </div>

      <div className="section-title">Erinnerungen</div>
      <div className="list-group">
        <div className="list-row static">
          <span>🔔</span>
          <span className="grow">Push-Benachrichtigungen</span>
          <Switch on={pushOn} onChange={v => !busy && void togglePush(v)} />
        </div>
        {pushOn && <button className="list-row" onClick={() => void testPush()}><span>🧪</span><span className="grow">Test-Benachrichtigung</span></button>}
        <div className="list-row static">
          <span>🙂</span>
          <span className="grow">Tägliche Stimmungsabfrage</span>
          <input type="time" className="time-input" value={s.moodReminder ?? ''} onChange={e => updateSettings({ moodReminder: e.target.value || null })} />
        </div>
      </div>
      {!pushSupported() && isIOS() && !isStandalone() && (
        <p className="hint" style={{ fontSize: 14 }}>Auf dem iPhone funktionieren Benachrichtigungen nur, wenn du Keepup über <b>Teilen → Zum Home-Bildschirm</b> hinzufügst und von dort öffnest.</p>
      )}
      {!session && syncAvailable && <p className="hint" style={{ fontSize: 14 }}>Für Erinnerungen musst du angemeldet sein.</p>}

      <div className="section-title">Darstellung</div>
      <div className="segmented">
        {(['dark', 'light', 'system'] as Theme[]).map(t => (
          <button key={t} className={s.theme === t ? 'active' : ''} onClick={() => updateSettings({ theme: t })}>
            {{ dark: 'Dunkel', light: 'Hell', system: 'System' }[t]}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: '16px 18px', marginTop: 12 }}>
        <div className="muted" style={{ fontSize: 14, marginBottom: 12 }}>Akzentfarbe</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {ACCENTS.map(a => (
            <button key={a.id} aria-label={a.label} onClick={() => updateSettings({ accent: a.id })}
              style={{ width: 40, height: 40, borderRadius: '50%', background: a.color, boxShadow: s.accent === a.id ? '0 0 0 3px var(--card), 0 0 0 5px var(--fg)' : undefined, transition: 'box-shadow .2s' }} />
          ))}
        </div>
      </div>

      <div className="section-title">Allgemein</div>
      <div className="list-group">
        <div className="list-row static"><span>😊</span><span className="grow">Stimmung auf „Heute“ abfragen</span><Switch on={s.showMood} onChange={v => updateSettings({ showMood: v })} /></div>
        <button className="list-row" onClick={() => nav.open({ kind: 'archive' })}><span>🏛️</span><span className="grow">Archivierte Habits</span><ChevronRight size={18} className="faint" /></button>
        <button className="list-row" onClick={() => nav.open({ kind: 'focus' })}><span>⏱️</span><span className="grow">Fokus-Timer</span><span className="value">{s.focusMinutes} min</span><ChevronRight size={18} className="faint" /></button>
      </div>

      <div className="section-title">Daten</div>
      <div className="list-group">
        <button className="list-row" onClick={download}><span>📤</span><span className="grow">Backup exportieren</span></button>
        <button className="list-row" onClick={() => fileRef.current?.click()}><span>📥</span><span className="grow">Backup importieren</span></button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async e => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        try { importData(await f.text()); nav.toast('Backup importiert ✅') } catch (err) { nav.toast((err as Error).message) }
      }} />

      <p className="faint" style={{ textAlign: 'center', fontSize: 13, marginTop: 34 }}>Keepup · Version 1.0</p>
    </div>
  )
}
