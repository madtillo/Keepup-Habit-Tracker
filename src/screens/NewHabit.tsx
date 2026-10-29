import { TEMPLATE_GROUPS } from '../lib/templates'
import { nav } from '../lib/nav'
import { OverlayFrame, SheetHeader } from '../components/ui'
import { ChevronRight } from '../components/Icons'

export function NewHabit({ closing, onClose }: { closing?: boolean; onClose: () => void }) {
  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title="Neuer Habit" onClose={onClose} />
      <button className="card row-card" style={{ padding: '26px 22px', marginTop: 10, fontSize: 21, fontWeight: 550, borderRadius: 26 }}
        onClick={() => nav.open({ kind: 'habitForm' })}>
        <span style={{ fontSize: 30 }}>✨</span>
        <span style={{ flex: 1, marginLeft: 8 }}>Eigenes Habit erstellen</span>
        <ChevronRight size={22} className="muted" />
      </button>
      {TEMPLATE_GROUPS.map(g => (
        <div key={g.category}>
          <div className="section-title" style={{ fontSize: 22 }}>{g.category}</div>
          <div className="template-row">
            {g.items.map(t => (
              <button key={t.name} className="card template" onClick={() => nav.open({ kind: 'habitForm', template: { ...t, category: g.category } })}>
                <span className="emoji">{t.emoji}</span>
                <span className="label">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </OverlayFrame>
  )
}
