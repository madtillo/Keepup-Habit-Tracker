import { supabase } from './supabase'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

export async function enablePush(): Promise<void> {
  if (!supabase) throw new Error('Supabase ist nicht eingerichtet.')
  if (!VAPID) throw new Error('VITE_VAPID_PUBLIC_KEY fehlt.')
  if (!pushSupported()) {
    throw new Error(isIOS() && !isStandalone()
      ? 'Füge Keepup zuerst über „Teilen → Zum Home-Bildschirm“ hinzu und öffne die App von dort.'
      : 'Dieses Gerät unterstützt keine Push-Benachrichtigungen.')
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('Bitte melde dich zuerst an.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt.')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID) }))
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: sub.endpoint,
    user_id: data.session.user.id,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
  if (error) throw error
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  await supabase?.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

export async function testPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification('Keepup', { body: 'So sehen deine Erinnerungen aus 👋', icon: './icons/icon-192.png' })
}

/** Hält Zeitzone & Schlüssel des Push-Abos aktuell (z. B. nach Reisen) */
export async function refreshSubscription(): Promise<void> {
  if (!supabase) return
  const sub = await currentSubscription()
  const { data } = await supabase.auth.getSession()
  if (!sub || !data.session) return
  const json = sub.toJSON()
  await supabase.from('push_subscriptions').upsert({
    endpoint: sub.endpoint,
    user_id: data.session.user.id,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}
