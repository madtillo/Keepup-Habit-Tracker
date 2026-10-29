import { useEffect, useRef, useState, type ReactNode } from 'react'
import { exportData, importData, useSettings } from '../lib/store'
import { syncAvailable } from '../lib/supabase'
import { useSync } from '../lib/sync'
import { currentSubscription, isStandalone } from '../lib/push'
import { nav, type SettingsPage } from '../lib/nav'
import { ArrowRight, Archive, Check, StatsIcon, BellFill, ChevronRight, Cloud, Download, Hand, HomeAdd, Moon, Pencil, Phone, Sparkle, Timer, Upload, User } from '../components/Icons'

export function SettingRow({ icon, label, value, onClick, danger }: { icon: ReactNode; label: string; value?: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button className="set-row" onClick={onClick} style={danger ? { color: 'var(--danger)' } : undefined}>
      <span className="set-icon">{icon}</span>
      <span className="set-body">
        <span className="set-label">{label}</span>
        {value !== undefined && <span className="set-value">{value}</span>}
        <ChevronRight size={18} strokeWidth={2.4} className="set-chev" />
      </span>
    </button>
  )
}

export function downloadBackup() {
  const blob = new Blob([exportData()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `keepup-sicherung-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function Settings() {
  const s = useSettings()
  const { session } = useSync()
  const [pushOn, setPushOn] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const open = (page: SettingsPage) => nav.open({ kind: 'settingsPage', page })

  useEffect(() => { void currentSubscription().then(sub => setPushOn(!!sub)) }, [])

  const theme = { dark: 'Dunkel', light: 'Hell', system: 'System' }[s.theme]

  return (
    <div className="page">
      <div className="page-header"><h1 className="large-title">Einstellungen</h1></div>

      <div className="card profile-card">
        <div className="avatar">
          <User size={40} />
          <span className="avatar-badge">✓</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="profile-name">{s.name || 'Dein Name'}</div>
          <div className="muted profile-sub">
            {session ? <Cloud size={17} /> : <Phone size={17} />}
            <span className="ellipsis">{session ? session.user.email : 'Lokal · ohne Account'}</span>
          </div>
        </div>
        <button className="circle-btn small" style={{ width: 46, height: 46 }} onClick={() => open('profile')} aria-label="Profil bearbeiten"><Pencil size={20} /></button>
      </div>

      <div className="card pro-card">
        <div className="pro-text">
          <div className="pro-brand">Keepup <span className="pro-pill">PRO</span></div>
          <div className="pro-title">Alles für deine Routinen.</div>
        </div>
        <div className="pro-art" aria-hidden>
          <span className="tile light"><Check size={26} strokeWidth={3} /></span>
          <span className="tile dark"><StatsIcon size={24} /></span>
        </div>
        <p className="muted pro-desc">Unbegrenzte Habits, volle Statistiken und Erinnerungen – dauerhaft freigeschaltet.</p>
        <button className="pro-btn" onClick={() => open('pro')}>Pro ist aktiv <ArrowRight size={20} /></button>
      </div>

      <div className="section-title set-title">Allgemein</div>
      <div className="set-group">
        <SettingRow icon={<Moon size={20} />} label="Darstellung" value={theme} onClick={() => open('appearance')} />
        <SettingRow icon={<BellFill size={20} />} label="Mitteilungen" value={pushOn === null ? '' : pushOn ? 'Erlaubt' : 'Aus'} onClick={() => open('notifications')} />
        <SettingRow icon={<Timer size={20} />} label="Fokus-Timer" value={`${s.focusMinutes} min`} onClick={() => nav.open({ kind: 'focus' })} />
        <SettingRow icon={<Archive size={20} />} label="Archivierte Habits" onClick={() => nav.open({ kind: 'archive' })} />
      </div>

      <div className="section-title set-title">Daten</div>
      <div className="set-group">
        <SettingRow icon={<Cloud size={20} />} label="Cloud-Sync" value={session ? 'An' : syncAvailable ? 'Aus' : ''} onClick={() => open('sync')} />
        <SettingRow icon={<Upload size={20} />} label="Sicherung exportieren" onClick={downloadBackup} />
        <SettingRow icon={<Download size={20} />} label="Sicherung wiederherstellen" onClick={() => fileRef.current?.click()} />
        <SettingRow icon={<Hand size={20} />} label="Datenschutz & lokale Daten" value={session ? 'Cloud' : 'Lokal'} onClick={() => open('privacy')} />
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async e => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        try { importData(await f.text()); nav.toast('Sicherung wiederhergestellt ✅') } catch (err) { nav.toast((err as Error).message) }
      }} />

      <div className="section-title set-title">Hilfe & Info</div>
      <div className="set-group">
        <SettingRow icon={<HomeAdd size={20} />} label="Zum Home-Bildschirm" value={isStandalone() ? 'Installiert' : ''} onClick={() => open('install')} />
        <SettingRow icon={<Sparkle size={20} />} label="Was ist neu?" onClick={() => open('whatsnew')} />
      </div>

      <p className="faint" style={{ textAlign: 'center', fontSize: 13, marginTop: 30 }}>Keepup · Version 1.1</p>
    </div>
  )
}
