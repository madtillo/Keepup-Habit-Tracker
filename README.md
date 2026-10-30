# Keepup – Habits, Todos, Stimmung & Fokus

Private Web-App (PWA) nach dem Vorbild von Upwell – mit allen Pro-Funktionen, kostenlos.
Läuft im Browser und lässt sich auf dem iPhone wie eine normale App auf den Home-Bildschirm legen.

## Funktionen

| Bereich | Was drin ist |
|---|---|
| **Heute** | Wochenleiste (wischen für andere Wochen), Tagesfortschritts-Ring, Stimmungsabfrage, Habits & Aufgaben des Tages, ➕-Button |
| **Habits** | Unbegrenzt viele Habits, Listen- und Monatsraster-Ansicht, Sortierung, Archiv, 30+ Vorlagen in 10 Kategorien, eigene Habits mit Emoji, Kategorie, **Mengenzielen** (z. B. 8 Gläser), **Ziel** täglich (mit Wochentagen), wöchentlich oder monatlich (X-mal pro Woche/Monat) und mehreren **Erinnerungszeiten** |
| **Habit-Detail** | Aktuelle Serie, Diesen Monat, Beste Serie, Monatsübersicht (Tag antippen = Status ändern), Erfolgsquote, Bearbeiten, Archivieren, Löschen |
| **Aufgaben** | Übersicht (Überfällig / Offen / Heute fällig), Prioritäts-Karten (Hoch / Normal / Niedrig), Fokus-Liste, Wann (Heute / Diese Woche / Dieser Monat), Fälligkeitsdatum, Notiz, Filter, erledigte Aufgaben |
| **Fokus-Timer** | Pomodoro-Timer (5–90 min), optional an eine Aufgabe gekoppelt, Minuten fließen in die Statistik |
| **Statistik** | Wochen-Verlaufsdiagramm mit Navigation, Kennzahlen (Erfolgsquote, perfekte Tage, beste Serie, Fokus-Minuten, erledigte Todos), Stimmungskalender mit Monatsauswertung, Erfolgsquote je Habit (7/30/90 Tage), 6-Monats-Heatmap |
| **Einstellungen** | Profil, Pro-Karte, Darstellung (Dunkel/Hell/System, Akzentfarbe), Mitteilungen, Cloud-Sync, Sicherung exportieren/wiederherstellen, Datenschutz, Installationshilfe |
| **Technik** | Funktioniert offline, synchronisiert automatisch über alle Geräte (Supabase), echte Push-Benachrichtigungen auch bei geschlossener App |

Nicht möglich als Web-App: iOS-Homescreen-**Widgets** (dafür bräuchte es eine native App).

---

## Einrichtung – Variante A: automatisch per GitHub (empfohlen, auch vom iPhone)

1. **Supabase-Projekt anlegen** auf <https://supabase.com> (Region Frankfurt). Datenbank-Passwort merken.
2. **Authentication → Sign In / Providers → Email:** „Confirm email“ ausschalten.
3. **Zugangstoken erstellen:** <https://supabase.com/dashboard/account/tokens> → *Generate new token* → kopieren.
4. Im GitHub-Repo unter **Settings → Secrets and variables → Actions** eintragen:
   - Reiter **Secrets**: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`
   - Reiter **Variables**: `SUPABASE_PROJECT_REF` (Projekt-ID), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, optional `VAPID_SUBJECT` (`mailto:deine@mail.de`)
5. **Actions → „Supabase einrichten“ → Run workflow.** Erledigt Datenbank, Erinnerungsdienst, Secrets und Zeitplan.
6. Danach **Actions → „Deploy Keepup“ → Run workflow** (siehe Schritt 5 unten zu GitHub Pages).

## Einrichtung – Variante B: manuell im Supabase-Dashboard (ca. 20 Minuten)

### 1. Supabase-Projekt anlegen (kostenlos)

1. Auf <https://supabase.com> registrieren → **New project** (Region z. B. Frankfurt).
2. **SQL Editor** öffnen → Inhalt von [`supabase/migrations/20261029000000_keepup.sql`](supabase/migrations/20261029000000_keepup.sql) einfügen → **Run**.
3. **Authentication → Sign In / Providers → Email**: aktiviert lassen. Tipp: **Confirm email** ausschalten, dann kannst du dich sofort ohne Bestätigungsmail anmelden.
4. **Project Settings → API**: `Project URL` und `anon public` Key notieren.

### 2. Schlüssel für Push-Benachrichtigungen erzeugen

```bash
npx web-push generate-vapid-keys
```

Du bekommst einen **Public Key** und einen **Private Key**. Außerdem brauchst du ein beliebiges Geheimwort für den Zeitplan, z. B. eine lange Zufallszeichenfolge (`CRON_SECRET`).

### 3. Erinnerungsdienst (Edge Function) hochladen

```bash
npx supabase login
npx supabase link --project-ref DEIN-PROJEKT
npx supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:deine@mail.de" CRON_SECRET="..."
npx supabase functions deploy send-reminders --no-verify-jwt
```

*(Alternativ im Dashboard: **Edge Functions → Deploy a new function → Via Editor**, Name `send-reminders`, Code aus [`supabase/functions/send-reminders/index.ts`](supabase/functions/send-reminders/index.ts) einfügen, „Verify JWT“ ausschalten, die vier Secrets unter **Edge Functions → Secrets** eintragen.)*

### 4. Zeitplan aktivieren

In [`supabase/cron.sql`](supabase/cron.sql) `DEIN-PROJEKT` und `DEIN-GEHEIMNIS` (= `CRON_SECRET`) ersetzen, dann im **SQL Editor** ausführen.
Der Dienst prüft nun jede Minute, ob eine Erinnerung fällig ist (nur für Habits, die heute noch nicht erledigt sind).

### 5. App veröffentlichen

**Variante A – GitHub Pages** (Repo öffentlich, oder privat mit GitHub Pro):

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. Repo → **Settings → Secrets and variables → Actions → Variables** → drei Variablen anlegen:
   - `VITE_SUPABASE_URL` – Project URL
   - `VITE_SUPABASE_ANON_KEY` – anon public Key
   - `VITE_VAPID_PUBLIC_KEY` – Public Key aus Schritt 2
3. Auf `main` pushen (oder Workflow „Deploy Keepup“ manuell starten). Die Adresse steht danach unter Settings → Pages.

**Variante B – Netlify / Vercel / Cloudflare Pages** (kostenlos, auch für private Repos):
Repo verbinden, Build-Befehl `npm run build`, Ausgabeordner `dist`, die drei Variablen von oben als Umgebungsvariablen eintragen.

### 6. Auf dem iPhone installieren

1. Die App-Adresse in **Safari** öffnen.
2. **Teilen → Zum Home-Bildschirm**.
3. Keepup **vom Home-Bildschirm** öffnen → **Einstellungen → Cloud-Sync** → Konto erstellen.
4. **Einstellungen → Mitteilungen** einschalten und erlauben (funktioniert auf iOS nur in der installierten App, ab iOS 16.4).
5. Mit „Test-Benachrichtigung“ prüfen.

Auf weiteren Geräten einfach mit demselben Konto anmelden – alles wird synchronisiert.

---

## Lokal entwickeln

```bash
npm install
cp .env.example .env.local   # Werte eintragen (optional – ohne läuft die App rein lokal)
npm run dev
```

- `npm run build` – Produktions-Build nach `dist/`
- `npm run typecheck` – TypeScript-Prüfung

Ohne Supabase-Werte funktioniert die App komplett lokal im Browser (Daten im Gerätespeicher, Backup über Export/Import).

## Aufbau

```
src/
  App.tsx              Tab-Leiste, Overlays, Theme
  styles.css           Komplettes Design (Dunkel/Hell, Akzentfarben)
  lib/
    store.ts           Lokaler Datenspeicher (offline-first)
    sync.ts            Abgleich mit Supabase (neueste Änderung gewinnt)
    habits.ts          Serien, Rhythmen, Erfolgsquoten
    push.ts            Push-Abo verwalten
  screens/             Heute, Habits, Detail, Formulare, Aufgaben, Statistik, Einstellungen, Fokus
public/sw.js           Service Worker (Offline + Push)
supabase/              Datenbank, Zeitplan, Erinnerungsdienst
```
