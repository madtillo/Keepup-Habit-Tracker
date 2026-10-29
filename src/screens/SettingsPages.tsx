import { useEffect, useState } from 'react'
import { useSettings, useStore } from '../lib/store'
import { updateSettings } from '../lib/actions'
import { supabase, syncAvailable } from '../lib/supabase'
import { syncNow, useSync } from '../lib/sync'
import { currentSubscription, disablePush, enablePush, isIOS, isStandalone, pushSupported, testPush } from '../lib/push'
import { nav, type SettingsPage } from '../lib/nav'
import type { Accent, Theme } from '../lib/types'
import { OverlayFrame, SheetHeader, Switch } from '../components/ui'

const TITLES: Record<SettingsPage, string> = {
  profile: 'Profil', pro: 'Keepup Pro', appearance: 'Darstellung', notifications: 'Mitteilungen',
  sync: 'Cloud-Sync', privacy: 'Datenschutz', install: 'Zum Home-Bildschirm', whatsnew: 'Was ist neu?',
}

const ACCENTS: { id: Accent; color: string; label: string }[] = [
  { id: 'mono', color: 'var(--fg)', label: 'Monochrom' },
  { id: 'blue', color: '#4b8ef0', label: 'Blau' },
  { id: 'green', color: '#34c77b', label: 'Grün' },
  { id: 'orange', color: '#f59e2c', label: 'Orange' },
  { id: 'pink', color: '#f2558a', label: 'Pink' },
  { id: 'purple', color: '#9b6cf6', label: 'Lila' },
]

export function SettingsPageView({ page, closing, onClose }: { page: SettingsPage; closing?: boolean; onClose: () => void }) {
  return (
    <OverlayFrame closing={closing} push>
      <SheetHeader title={TITLES[page]} onClose={onClose} back />
      <div style={{ marginTop: 10 }}>
        {page === 'profile' && <Profile onClose={onClose} />}
        {page === 'pro' && <Pro />}
        {page === 'appearance' && <Appearance />}
        {page === 'notifications' && <Notifications />}
        {page === 'sync' && <Sync />}
        {page === 'privacy' && <Privacy />}
        {page === 'install' && <Install />}
        {page === 'whatsnew' && <WhatsNew />}
      </div>
    </OverlayFrame>
  )
}

function Profile({ onClose }: { onClose: () => void }) {
  const s = useSettings()
  const [name, setName] = useState(s.name)
  return (
    <>
      <div className="field-label">Name</div>
      <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Wie sollen wir dich nennen?" maxLength={30} autoFocus
        onKeyDown={e => e.key === 'Enter' && (updateSettings({ name: name.trim() }), onClose())} />
      <button className="btn primary" style={{ marginTop: 18 }} onClick={() => { updateSettings({ name: name.trim() }); onClose() }}>Speichern</button>
    </>
  )
}

function Pro() {
  const features = [
    ['♾️', 'Unbegrenzte Habits', 'So viele Gewohnheiten, wie du willst.'],
    ['📊', 'Volle Statistiken', 'Wochenverlauf, Erfolgsquoten, Heatmap, Stimmung.'],
    ['🔔', 'Erinnerungen', 'Mehrere Push-Erinnerungen pro Habit.'],
    ['🎯', 'Flexible Ziele', 'Mengen, Wochentage, X-mal pro Woche oder Monat.'],
    ['☁️', 'Sync', 'Alle Geräte immer auf dem gleichen Stand.'],
    ['🎨', 'Themes', 'Hell, Dunkel und Akzentfarben.'],
  ]
  return (
    <>
      <div className="card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>💎</div>
        <h2 style={{ margin: '8px 0 4px' }}>Pro ist aktiv</h2>
        <p className="muted" style={{ margin: 0 }}>Alle Funktionen sind dauerhaft und kostenlos freigeschaltet.</p>
      </div>
      <div className="set-group" style={{ marginTop: 16 }}>
        {features.map(([e, t, d]) => (
          <div key={t} className="set-row static">
            <span className="set-icon" style={{ fontSize: 20 }}>{e}</span>
            <span className="set-body"><span className="set-label">{t}<span className="muted" style={{ display: 'block', fontSize: 13, fontWeight: 400 }}>{d}</span></span></span>
          </div>
        ))}
      </div>
    </>
  )
}

function Appearance() {
  const s = useSettings()
  return (
    <>
      <div className="section-title set-title" style={{ marginTop: 10 }}>Modus</div>
      <div className="segmented">
        {(['dark', 'light', 'system'] as Theme[]).map(t => (
          <button key={t} className={s.theme === t ? 'active' : ''} onClick={() => updateSettings({ theme: t })}>
            {{ dark: 'Dunkel', light: 'Hell', system: 'System' }[t]}
          </button>
        ))}
      </div>
      <div className="section-title set-title">Akzentfarbe</div>
      <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between' }}>
        {ACCENTS.map(a => (
          <button key={a.id} aria-label={a.label} onClick={() => updateSettings({ accent: a.id })}
            style={{ width: 40, height: 40, borderRadius: '50%', background: a.color, boxShadow: s.accent === a.id ? '0 0 0 3px var(--card), 0 0 0 5px var(--fg)' : undefined, transition: 'box-shadow .2s' }} />
        ))}
      </div>
      <div className="section-title set-title">Heute</div>
      <div className="set-group">
        <div className="set-row static">
          <span className="set-icon" style={{ fontSize: 20 }}>😊</span>
          <span className="set-body"><span className="set-label">Stimmung abfragen</span><Switch on={s.showMood} onChange={v => updateSettings({ showMood: v })} /></span>
        </div>
      </div>
    </>
  )
}

function Notifications() {
  const s = useSettings()
  const { session } = useSync()
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { void currentSubscription().then(sub => setOn(!!sub)) }, [])

  const toggle = async (v: boolean) => {
    if (busy) return
    setBusy(true)
    try {
      if (v) { await enablePush(); setOn(true); nav.toast('Mitteilungen erlaubt 🔔') }
      else { await disablePush(); setOn(false) }
    } catch (e) { nav.toast((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <>
      <div className="set-group">
        <div className="set-row static">
          <span className="set-icon" style={{ fontSize: 20 }}>🔔</span>
          <span className="set-body"><span className="set-label">Push-Mitteilungen</span><Switch on={on} onChange={v => void toggle(v)} /></span>
        </div>
        {on && (
          <button className="set-row" onClick={() => void testPush()}>
            <span className="set-icon" style={{ fontSize: 20 }}>🧪</span>
            <span className="set-body"><span className="set-label">Test-Mitteilung senden</span></span>
          </button>
        )}
        <div className="set-row static">
          <span className="set-icon" style={{ fontSize: 20 }}>🙂</span>
          <span className="set-body">
            <span className="set-label">Tägliche Stimmungsabfrage</span>
            <input type="time" className="time-input" style={{ width: 104 }} value={s.moodReminder ?? ''} onChange={e => updateSettings({ moodReminder: e.target.value || null })} />
          </span>
        </div>
      </div>
      <p className="hint" style={{ fontSize: 14 }}>Erinnerungszeiten für Habits stellst du direkt im jeweiligen Habit ein.</p>
      {!session && <p className="hint" style={{ fontSize: 14 }}>Für Push-Mitteilungen musst du unter Cloud-Sync angemeldet sein.</p>}
      {!pushSupported() && isIOS() && !isStandalone() && (
        <p className="hint" style={{ fontSize: 14 }}>Auf dem iPhone funktionieren Mitteilungen nur, wenn du Keepup über <b>Teilen → Zum Home-Bildschirm</b> hinzufügst und von dort öffnest.</p>
      )}
    </>
  )
}

function Sync() {
  const { status, session, lastSync } = useSync()
  const dirty = useStore(st => Object.keys(st.dirty).length)
  if (!syncAvailable) return <p className="hint">Supabase ist noch nicht eingerichtet – siehe README im Repository.</p>
  if (!session) {
    return (
      <>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>☁️</div>
          <h2 style={{ margin: '8px 0 4px' }}>Auf allen Geräten</h2>
          <p className="muted" style={{ margin: 0 }}>Melde dich an, um Habits, Todos und Stimmungen zu synchronisieren und Erinnerungen zu erhalten.</p>
        </div>
        <button className="btn primary" style={{ marginTop: 16 }} onClick={() => nav.open({ kind: 'auth' })}>Anmelden oder registrieren</button>
      </>
    )
  }
  const statusText = status === 'syncing' ? 'Synchronisiere …' : status === 'error' ? 'Fehler' : status === 'offline' ? 'Offline'
    : dirty ? `${dirty} ausstehend` : lastSync ? `um ${new Date(lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : 'Bereit'
  return (
    <>
      <div className="set-group">
        <div className="set-row static"><span className="set-icon" style={{ fontSize: 20 }}>👤</span><span className="set-body"><span className="set-label">{session.user.email}</span></span></div>
        <button className="set-row" onClick={() => void syncNow()}><span className="set-icon" style={{ fontSize: 20 }}>🔄</span><span className="set-body"><span className="set-label">Jetzt synchronisieren</span><span className="set-value">{statusText}</span></span></button>
      </div>
      <button className="btn danger" style={{ marginTop: 20 }} onClick={() => nav.confirm('Abmelden? Deine Daten bleiben im Konto gespeichert und werden von diesem Gerät entfernt.', 'Abmelden', async () => {
        await disablePush().catch(() => {})
        await supabase?.auth.signOut()
        useStore.getState().reset()
      })}>Abmelden</button>
    </>
  )
}

function Privacy() {
  const { session } = useSync()
  return (
    <>
      <div className="card" style={{ padding: 18, lineHeight: 1.45 }}>
        <p style={{ marginTop: 0 }}>Alle Daten liegen zuerst <b>lokal auf diesem Gerät</b>. Keepup funktioniert vollständig offline.</p>
        <p style={{ marginBottom: 0 }} className="muted">
          {session ? 'Cloud-Sync ist aktiv: Deine Daten werden zusätzlich in deinem eigenen Supabase-Projekt gespeichert. Nur du hast Zugriff.' : 'Cloud-Sync ist aus. Nichts verlässt dieses Gerät.'}
        </p>
      </div>
      <button className="btn danger" style={{ marginTop: 20 }} onClick={() => nav.confirm(
        session ? 'Lokale Daten von diesem Gerät löschen? Beim nächsten Sync werden sie aus der Cloud wiederhergestellt.' : 'Alle Daten auf diesem Gerät endgültig löschen?',
        'Lokale Daten löschen', () => {
          useStore.getState().reset()
          if (session) void syncNow()
          nav.toast('Lokale Daten gelöscht')
        })}>Lokale Daten löschen</button>
    </>
  )
}

function Install() {
  const steps = isIOS()
    ? ['Öffne Keepup in Safari.', 'Tippe unten auf Teilen (□↑).', 'Wähle „Zum Home-Bildschirm“.', 'Öffne Keepup ab jetzt über das neue Icon.']
    : ['Öffne das Browser-Menü (⋮).', 'Wähle „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.', 'Öffne Keepup ab jetzt über das neue Icon.']
  return (
    <>
      {isStandalone() && <div className="card" style={{ padding: 16, marginBottom: 16 }}>✅ Keepup ist bereits installiert.</div>}
      <div className="set-group">
        {steps.map((t, i) => (
          <div key={t} className="set-row static"><span className="set-icon"><b>{i + 1}</b></span><span className="set-body"><span className="set-label" style={{ fontWeight: 500 }}>{t}</span></span></div>
        ))}
      </div>
      <p className="hint" style={{ fontSize: 14 }}>Erst als installierte App bekommst du Push-Mitteilungen und Vollbild ohne Browserleiste.</p>
    </>
  )
}

function WhatsNew() {
  const items = [
    ['1.1', ['Neues „Habit erstellen“: Ziel täglich, wöchentlich oder monatlich', 'Einstellungen im neuen Look mit Profil', 'Monatliche Ziele mit eigenen Serien']],
    ['1.0', ['Habits, Todos, Stimmung und Fokus-Timer', 'Statistiken, Sync und Push-Erinnerungen']],
  ] as const
  return (
    <>
      {items.map(([v, list]) => (
        <div key={v} className="card" style={{ padding: 18, marginBottom: 12 }}>
          <b>Version {v}</b>
          <ul style={{ margin: '10px 0 0', paddingLeft: 20, lineHeight: 1.6 }} className="muted">{list.map(t => <li key={t}>{t}</li>)}</ul>
        </div>
      ))}
    </>
  )
}
