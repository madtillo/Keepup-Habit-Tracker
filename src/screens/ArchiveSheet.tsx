import { useHabits } from '../lib/selectors'
import { deleteHabit, updateHabit } from '../lib/actions'
import { nav } from '../lib/nav'
import { OverlayFrame, SheetHeader } from '../components/ui'

export function ArchiveSheet({ closing, onClose }: { closing?: boolean; onClose: () => void }) {
  const archived = useHabits(true)
  return (
    <OverlayFrame closing={closing}>
      <SheetHeader title="Archiv" onClose={onClose} />
      {archived.length === 0 ? (
        <div className="card empty-state" style={{ marginTop: 10 }}>
          <div style={{ fontSize: 46 }}>🏛️</div>
          <h3>Archiv ist leer</h3>
          <p>Archivierte Habits behalten ihren Verlauf und tauchen hier auf.</p>
        </div>
      ) : (
        <div className="list-group" style={{ marginTop: 10 }}>
          {archived.map(h => (
            <button key={h.id} className="list-row" onClick={() => nav.menu({
              title: `${h.emoji} ${h.name}`,
              sections: [
                [
                  { label: 'Wiederherstellen', emoji: '↩️', onClick: () => { updateHabit(h, { archived: false }); nav.toast('Wiederhergestellt') } },
                  { label: 'Statistik ansehen', emoji: '📊', onClick: () => nav.open({ kind: 'habitDetail', id: h.id }) },
                  { label: 'Endgültig löschen', emoji: '🗑️', danger: true, onClick: () => nav.confirm(`„${h.name}“ endgültig löschen?`, 'Löschen', () => deleteHabit(h)) },
                ],
                [{ label: 'Abbrechen', onClick: () => {} }],
              ],
            })}>
              <span style={{ fontSize: 24 }}>{h.emoji}</span>
              <span className="grow">{h.name}</span>
              <span className="value">{h.category}</span>
            </button>
          ))}
        </div>
      )}
    </OverlayFrame>
  )
}
