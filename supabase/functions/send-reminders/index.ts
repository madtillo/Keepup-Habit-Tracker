// Keepup Erinnerungsdienst (Supabase Edge Function)
// Wird jede Minute per pg_cron aufgerufen und verschickt fällige Push-Erinnerungen.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

interface Sub { endpoint: string; user_id: string; p256dh: string; auth: string; timezone: string }
type Schedule = { type: 'daily' } | { type: 'weekdays'; days: number[] } | { type: 'perWeek'; count: number }
interface Habit { id: string; name: string; emoji: string; goal: number; schedule: Schedule; reminders: string[]; archived: boolean; deleted?: boolean }

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:keepup@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

/** Ortszeit in einer Zeitzone: Datum, Uhrzeit, Wochentag (0 = Mo) */
function localNow(tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
      .formatToParts(new Date()).map(p => [p.type, p.value]),
  )
  const date = `${parts.year}-${parts.month}-${parts.day}`
  const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday)
  return { date, time: `${parts.hour}:${parts.minute}`, wd }
}

function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async req => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('unauthorized', { status: 401 })

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
  if (error) return new Response(error.message, { status: 500 })

  const byUser = new Map<string, Sub[]>()
  for (const s of subs as Sub[]) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s])

  let sent = 0
  for (const [userId, userSubs] of byUser) {
    const { date, time, wd } = localNow(userSubs[0].timezone || 'Europe/Berlin')
    const messages: { title: string; body: string; tag: string }[] = []

    // Habits mit Erinnerung genau jetzt
    const { data: habitRows } = await supabase.from('records').select('data')
      .eq('user_id', userId).eq('collection', 'habits').eq('deleted', false)
    const habits = (habitRows ?? []).map(r => r.data as Habit)
      .filter(h => !h.archived && !h.deleted && h.reminders?.includes(time))
      .filter(h => h.schedule.type !== 'weekdays' || h.schedule.days.includes(wd))

    if (habits.length) {
      const weekStart = addDays(date, -wd)
      const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      const ids = habits.flatMap(h => weekDates.map(d => `${h.id}_${d}`))
      const { data: entryRows } = await supabase.from('records').select('id,data')
        .eq('user_id', userId).eq('collection', 'entries').in('id', ids)
      const count = new Map((entryRows ?? []).filter(r => !r.data.deleted).map(r => [r.id as string, r.data.count as number]))

      for (const h of habits) {
        const today = count.get(`${h.id}_${date}`) ?? 0
        if (today >= h.goal) continue
        if (h.schedule.type === 'perWeek') {
          const doneDays = weekDates.filter(d => (count.get(`${h.id}_${d}`) ?? 0) >= h.goal).length
          if (doneDays >= h.schedule.count) continue
        }
        messages.push({
          title: `${h.emoji} ${h.name}`,
          body: h.goal > 1 ? `Noch ${h.goal - today} bis zu deinem Tagesziel.` : 'Zeit für deine Gewohnheit – bleib dran! 💪',
          tag: `habit-${h.id}`,
        })
      }
    }

    // Tägliche Stimmungsabfrage
    const { data: settingsRow } = await supabase.from('records').select('data')
      .eq('user_id', userId).eq('collection', 'settings').eq('id', 'settings').maybeSingle()
    if (settingsRow?.data?.moodReminder === time) {
      const { data: mood } = await supabase.from('records').select('data')
        .eq('user_id', userId).eq('collection', 'moods').eq('id', date).maybeSingle()
      if (!mood || mood.data.deleted) messages.push({ title: 'Wie fühlst du dich?', body: 'Nimm dir kurz Zeit für deinen Stimmungs-Check-in 🙂', tag: 'mood' })
    }

    for (const msg of messages) {
      // Doppel-Sperre: pro Nutzer, Tag, Uhrzeit und Erinnerung nur einmal
      const { error: dup } = await supabase.from('sent_reminders').insert({ key: `${userId}|${date}|${time}|${msg.tag}` })
      if (dup) continue
      for (const s of userSubs) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ ...msg, url: './' }), { TTL: 3600 })
          sent++
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode
          if (code === 404 || code === 410) await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
          else console.error('Push fehlgeschlagen', code, e)
        }
      }
    }
  }

  return Response.json({ ok: true, sent })
})
