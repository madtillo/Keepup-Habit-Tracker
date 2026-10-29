import { useEffect } from 'react'
import { useSettings } from './lib/store'
import { useUI, type Tab } from './lib/nav'
import { ActionSheetHost, ToastHost } from './components/ui'
import { Gear, HabitsIcon, StatsIcon, Sun, TodosIcon } from './components/Icons'
import { Today } from './screens/Today'
import { Habits } from './screens/Habits'
import { Todos } from './screens/Todos'
import { Stats } from './screens/Stats'
import { Settings } from './screens/Settings'
import { HabitDetail } from './screens/HabitDetail'
import { NewHabit } from './screens/NewHabit'
import { HabitForm } from './screens/HabitForm'
import { TodoForm } from './screens/TodoForm'
import { TodoList } from './screens/TodoList'
import { ArchiveSheet } from './screens/ArchiveSheet'
import { Focus } from './screens/Focus'
import { Auth } from './screens/Auth'
import { SettingsPageView } from './screens/SettingsPages'

const TABS: { id: Tab; label: string; Icon: typeof Sun }[] = [
  { id: 'today', label: 'Heute', Icon: Sun },
  { id: 'habits', label: 'Habits', Icon: HabitsIcon },
  { id: 'todos', label: 'Aufgaben', Icon: TodosIcon },
  { id: 'stats', label: 'Statistik', Icon: StatsIcon },
  { id: 'settings', label: 'Einstellungen', Icon: Gear },
]

function useTheme() {
  const { theme, accent } = useSettings()
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const t = theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme
      document.documentElement.dataset.theme = t
      document.documentElement.dataset.accent = accent
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'light' ? '#ffffff' : '#000000')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme, accent])
}

export default function App() {
  useTheme()
  const { tab, setTab, stack, close } = useUI()

  // Kein Scrollen der Hauptseite, solange ein Overlay offen ist
  useEffect(() => {
    document.body.style.overflow = stack.length ? 'hidden' : ''
  }, [stack.length])

  return (
    <>
      <div className="app-bg" />
      <main key={tab} aria-hidden={stack.length > 0}>
        {tab === 'today' && <Today />}
        {tab === 'habits' && <Habits />}
        {tab === 'todos' && <Todos />}
        {tab === 'stats' && <Stats />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); window.scrollTo({ top: 0 }) }}>
            <Icon size={24} />
            {label}
          </button>
        ))}
      </nav>

      {stack.map(({ key, route, closing }) => {
        const onClose = () => close(key)
        const p = { closing, onClose }
        switch (route.kind) {
          case 'habitDetail': return <HabitDetail key={key} id={route.id} {...p} />
          case 'newHabit': return <NewHabit key={key} {...p} />
          case 'habitForm': return <HabitForm key={key} {...route} {...p} />
          case 'todoForm': return <TodoForm key={key} {...route} {...p} />
          case 'todoList': return <TodoList key={key} filter={route.filter} {...p} />
          case 'archive': return <ArchiveSheet key={key} {...p} />
          case 'focus': return <Focus key={key} todoId={route.todoId} {...p} />
          case 'auth': return <Auth key={key} {...p} />
          case 'settingsPage': return <SettingsPageView key={key} page={route.page} {...p} />
        }
      })}

      <ActionSheetHost />
      <ToastHost />
    </>
  )
}
