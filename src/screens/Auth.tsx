import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { nav } from '../lib/nav'
import { OverlayFrame, SheetHeader } from '../components/ui'

export function Auth({ closing, onClose }: { closing?: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (!data.session) {
          nav.toast('Bestätige deine E-Mail und melde dich dann an.')
          setMode('login')
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      }
      nav.toast('Angemeldet – deine Daten werden synchronisiert ☁️')
      onClose()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg.includes('Invalid login') ? 'E-Mail oder Passwort falsch.' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title={mode === 'login' ? 'Anmelden' : 'Konto erstellen'} onClose={onClose} />
      <div className="auth-hero">
        <img className="logo" src="./icons/icon-192.png" alt="" />
        <h2>Keepup Sync</h2>
        <p className="muted" style={{ margin: 0 }}>Deine Habits, Todos und Stimmungen auf allen Geräten.</p>
      </div>
      <div className="field-label">E-Mail</div>
      <input className="input" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="du@beispiel.de" />
      <div className="field-label">Passwort</div>
      <input className="input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password}
        onChange={e => setPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" onKeyDown={e => e.key === 'Enter' && void submit()} />
      {error && <p className="error">{error}</p>}
      <button className="btn primary" style={{ marginTop: 26 }} disabled={busy || !email || password.length < 6} onClick={() => void submit()}>
        {busy ? '…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
      </button>
      <button className="btn" style={{ marginTop: 12, background: 'none' }} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
        {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Schon ein Konto? Anmelden'}
      </button>
    </OverlayFrame>
  )
}
