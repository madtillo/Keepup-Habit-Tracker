import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const S = ({ size = 24, children, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
)

export const Sun = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <line key={a} x1="12" y1="2.6" x2="12" y2="4.6" transform={`rotate(${a} 12 12)`} strokeWidth={2.2} />
    ))}
  </S>
)

export const HabitsIcon = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="7" r="3.6" fill="currentColor" stroke="none" />
    <path d="M4.4 7l1.1 1.1 2-2.1" stroke="var(--icon-cut, #000)" strokeWidth={1.6} />
    <circle cx="6" cy="17" r="3" />
    <line x1="13" y1="7" x2="21" y2="7" />
    <line x1="13" y1="17" x2="21" y2="17" />
  </S>
)

export const TodosIcon = (p: P) => (
  <S {...p}>
    <rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" stroke="none" />
    {[8.5, 12, 15.5].map(y => (
      <g key={y} stroke="var(--icon-cut, #000)" strokeWidth={1.5}>
        <line x1="6.5" y1={y} x2="7" y2={y} />
        <line x1="9.5" y1={y} x2="17.5" y2={y} />
      </g>
    ))}
  </S>
)

export const StatsIcon = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <rect x="2.5" y="11" width="5.4" height="10" rx="1.6" />
    <rect x="9.3" y="7.5" width="5.4" height="13.5" rx="1.6" />
    <rect x="16.1" y="3" width="5.4" height="18" rx="1.6" />
  </S>
)

function gearPath() {
  const teeth = 8
  const pts: string[] = []
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2 - Math.PI / 2
    const r = i % 4 === 0 || i % 4 === 1 ? 10.6 : 8.2
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z M12 8.4a3.6 3.6 0 1 0 0.001 0Z`
}
const GEAR = gearPath()
export const Gear = (p: P) => (
  <S {...p} stroke="none">
    <path d={GEAR} fill="currentColor" fillRule="evenodd" strokeLinejoin="round" />
  </S>
)

export const Plus = (p: P) => (
  <S {...p}>
    <line x1="12" y1="4.5" x2="12" y2="19.5" />
    <line x1="4.5" y1="12" x2="19.5" y2="12" />
  </S>
)

export const X = (p: P) => (
  <S {...p}>
    <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
    <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
  </S>
)

export const Check = (p: P) => (
  <S {...p}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </S>
)

export const ChevronRight = (p: P) => (
  <S {...p}>
    <path d="M9 5l7 7-7 7" />
  </S>
)

export const ChevronLeft = (p: P) => (
  <S {...p}>
    <path d="M15 5l-7 7 7 7" />
  </S>
)

export const ChevronDown = (p: P) => (
  <S {...p}>
    <path d="M5 9l7 7 7-7" />
  </S>
)

export const Archive = (p: P) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1.5" />
    <path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9" />
    <line x1="10" y1="13" x2="14" y2="13" />
  </S>
)

export const Filter = (p: P) => (
  <S {...p}>
    <line x1="3.5" y1="6" x2="20.5" y2="6" />
    <line x1="6.5" y1="12" x2="17.5" y2="12" />
    <line x1="9.5" y1="18" x2="14.5" y2="18" />
  </S>
)

export const Calendar = (p: P) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <line x1="3" y1="9.5" x2="21" y2="9.5" />
    {[7.5, 10.5, 13.5, 16.5].map(x => [13, 16.5].map(y => <circle key={`${x}${y}`} cx={x} cy={y} r="0.5" fill="currentColor" />))}
  </S>
)

export const CalendarClock = (p: P) => (
  <S {...p}>
    <path d="M13 20.5H5.5A2.5 2.5 0 0 1 3 18V7a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 7v5" />
    <line x1="3" y1="9.5" x2="21" y2="9.5" />
    {[7, 10, 13].map(x => <circle key={x} cx={x} cy="13.5" r="0.5" fill="currentColor" />)}
    <circle cx="18" cy="18" r="4" fill="currentColor" stroke="none" />
    <path d="M18 16.2V18l1.2 1" stroke="var(--icon-cut, #000)" strokeWidth={1.4} />
  </S>
)

export const XCircle = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <line x1="15" y1="9" x2="9" y2="15" />
  </S>
)

export const Trash = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5L18.5 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
  </S>
)

export const Bell = (p: P) => (
  <S {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0" />
  </S>
)

export const Play = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l12-7.2a1 1 0 0 0 0-1.72l-12-7.2A1 1 0 0 0 7 4.8z" />
  </S>
)

export const Pause = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
  </S>
)

export const Refresh = (p: P) => (
  <S {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
  </S>
)

export const Minus = (p: P) => (
  <S {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </S>
)

/** Farbige Prioritäts-Kreise (Niedrig / Normal / Hoch) */
export function PriorityDot({ p, size = 22 }: { p: 'low' | 'normal' | 'high'; size?: number }) {
  const color = { low: 'var(--prio-low)', normal: 'var(--prio-normal)', high: 'var(--prio-high)' }[p]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill={color} />
      <g stroke="#000" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {p === 'normal' && <line x1="7" y1="12" x2="17" y2="12" />}
        {p === 'low' && <path d="M12 6.5v10.5M7.5 12.5l4.5 4.5 4.5-4.5" />}
        {p === 'high' && <path d="M12 17.5V7M7.5 11.5L12 7l4.5 4.5" />}
      </g>
    </svg>
  )
}

export const Tag = (p: P) => (
  <S {...p}>
    <path d="M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6a1.5 1.5 0 0 1 1.06.44l6.9 6.9a1.5 1.5 0 0 1 0 2.12l-7.6 7.6a1.5 1.5 0 0 1-2.12 0l-6.9-6.9a1.5 1.5 0 0 1-.44-1.06z" transform="rotate(90 12 12)" />
    <circle cx="16" cy="8" r="1.4" fill="currentColor" />
  </S>
)

export const Pencil = (p: P) => (
  <S {...p}>
    <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5 4 20z" />
  </S>
)

export const User = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <circle cx="12" cy="8" r="4.2" />
    <path d="M3.5 20.5c0-4 3.8-6.5 8.5-6.5s8.5 2.5 8.5 6.5c0 .55-.45 1-1 1h-15a1 1 0 0 1-1-1z" />
  </S>
)

export const Phone = (p: P) => (
  <S {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <line x1="10.5" y1="18.5" x2="13.5" y2="18.5" />
  </S>
)

export const Cloud = (p: P) => (
  <S {...p}>
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.9 9.6 4.5 4.5 0 0 1 17.5 18.5z" />
  </S>
)

export const Upload = (p: P) => (
  <S {...p}>
    <path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16" fill="currentColor" />
    <path d="M12 14V3M8.5 6.5L12 3l3.5 3.5" />
  </S>
)

export const Download = (p: P) => (
  <S {...p}>
    <path d="M8 6H6.5A1.5 1.5 0 0 0 5 7.5v12A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 17.5 6H16" fill="currentColor" />
    <path d="M12 3v11M8.5 10.5L12 14l3.5-3.5" stroke="var(--icon-cut, #000)" />
  </S>
)

export const Hand = (p: P) => (
  <S {...p} strokeWidth={1.8}>
    <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v7M14 10.5V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7-2.6 0-4.2-1.3-5.6-3.6L3.4 14.6a1.5 1.5 0 0 1 2.4-1.8L8 15" fill="currentColor" />
  </S>
)

export const Sparkle = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8z" />
    <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" />
  </S>
)

export const Moon = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </S>
)

export const HomeAdd = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <line x1="12" y1="8.5" x2="12" y2="15.5" />
    <line x1="8.5" y1="12" x2="15.5" y2="12" />
  </S>
)

export const Timer = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4l2.5 2M10 2.5h4" />
  </S>
)

export const ArrowRight = (p: P) => (
  <S {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </S>
)

export const BellFill = (p: P) => (
  <S {...p} stroke="none" fill="currentColor">
    <path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5v4.3L3.8 16a1 1 0 0 0 .85 1.5h14.7a1 1 0 0 0 .85-1.5l-1.7-2.7V9A6.5 6.5 0 0 0 12 2.5zM9.5 19a2.5 2.5 0 0 0 5 0z" />
  </S>
)
