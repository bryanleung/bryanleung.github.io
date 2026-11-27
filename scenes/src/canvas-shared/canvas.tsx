import { BookOpen, Calendar, CircleCheck, CircleUserRound, Gauge, GripVertical, Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Bar } from '../../kit'
import './canvas.css'

// Shared Canvas chrome for the Bulk Publish and Selective Modules scenes:
// the slate global nav, the course nav, Modules rows and the publish status
// icon. One icon family (Lucide), one stroke, opaque colors from the parent.

// Each glyph sits in a box exactly its size, so it lands on whole pixels
// whatever the width of the chip or row around it
export const I = ({ as: C, size = 16, className }: { as: LucideIcon; size?: number; className?: string }) => (
  <span className="cvs-ico" style={{ width: size, height: size }}>
    <C size={size} strokeWidth={1.75} className={`ss-icon${className ? ` ${className}` : ''}`} aria-hidden />
  </span>
)

const NAV: [LucideIcon, string][] = [
  [CircleUserRound, 'Account'],
  [Gauge, 'Dashboard'],
  [BookOpen, 'Courses'],
  [Calendar, 'Calendar'],
  [Inbox, 'Inbox'],
]

export function GlobalNav({ wide }: { wide: boolean }) {
  return (
    <nav className="cvs-nav" aria-hidden>
      {NAV.map(([icon, label]) => (
        <span key={label} className="cvs-nav__item" data-on={label === 'Courses' || undefined}>
          <I as={icon} size={wide ? 18 : 16} />
          {wide && <span className="cvs-nav__label">{label}</span>}
        </span>
      ))}
    </nav>
  )
}

/** The course's own nav: bars, with the current page as the one real word */
export function CourseNav({ current }: { current: string }) {
  return (
    <div className="cvs-course" aria-hidden>
      {[52, 84, 70, 58, 62].map((w, i) => <Bar key={i} w={w} h={6} r={3} tone={2} />)}
      <span className="cvs-course__on">{current}</span>
      {[48, 66].map((w, i) => <Bar key={`b${i}`} w={w} h={6} r={3} tone={2} />)}
    </div>
  )
}

/** Canvas's publish mark: a solid green disc with a white tick, or a gray
    circle-slash when unpublished. Both drawn in one 16px box and crossfaded. */
export function PublishMark({ on, size = 16, target }: { on: boolean; size?: number; target?: string }) {
  return (
    <span className="cvs-pub" data-on={on || undefined} data-target={target} style={{ width: size, height: size }}>
      <svg className="cvs-pub__off" viewBox="0 0 16 16" width={size} height={size} aria-hidden>
        <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.6 3.6 12.4 12.4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <CircleCheck className="cvs-pub__on" size={size} strokeWidth={2} fill="currentColor" color="#fff" aria-hidden />
    </span>
  )
}

/** One Modules item: grip, type icon, title over points, trailing status */
export function ModuleItem({ icon, title, sub, published, children }: { icon: LucideIcon; title: ReactNode; sub?: ReactNode; published?: boolean; children?: ReactNode }) {
  return (
    <div className="cvs-item" data-published={published || undefined}>
      <span className="cvs-item__grip"><I as={GripVertical} size={14} /></span>
      <span className="cvs-item__icon"><I as={icon} size={15} /></span>
      <span className="cvs-item__text">
        <span className="cvs-item__title">{title}</span>
        {sub && <span className="cvs-item__sub">{sub}</span>}
      </span>
      <span className="cvs-item__end">{children}</span>
    </div>
  )
}
