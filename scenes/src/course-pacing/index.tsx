import { ArrowRight, BookOpen, CalendarDays, Calendar, ChevronDown, ChevronUp, CircleUserRound, Clock, FilePenLine, FileText, Gauge, Inbox, ListChecks, MessagesSquare, Rocket, Search, X, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, Bar, Roll, Row, Stage, Tabs, Text, Window, type Act, type Layout } from '../../kit'
import './pacing.css'

// Course Pacing scene, two variants of one story: every student can have
// their own pace.
//   card: the homepage thumbnail, 398 x 265, the card's own size.
//   hero: the case study's hero, 736 x 491 (the figure's 3:2 at its shown
//         width), with the card design as its compact layout on phones.
// Beats: the Students tab of Physics 101 (context), a click on Terry Bothman
// opens their pace full screen (action), two clicks on one assignment's Days
// stepper push its due date, then the pace's end date (and, in the hero, its
// duration) later (payoff). The loop closes the pace with its own x; the days
// snap back while it is closed, so data never rewinds in view.

type S = { open: boolean; days: number }

const initial: S = { open: false, days: 2 }
const poster: S = { open: true, days: 4 }

// One family (Lucide), one stroke, opaque color from the parent
const I = ({ as: C, size = 16, className }: { as: LucideIcon; size?: number; className?: string }) => (
  <C size={size} strokeWidth={1.75} className={`ss-icon${className ? ` ${className}` : ''}`} aria-hidden />
)

// The last row runs off the crop, so it is filler: a plain disc and a bar
const STUDENTS: { name: string; sec: number; pick?: boolean; w?: number }[] = [
  { name: 'Carla Dias', sec: 58 },
  { name: 'Terry Bothman', sec: 64, pick: true },
  { name: 'Allison Torff', sec: 52 },
  { name: 'Emery Diaz', sec: 60 },
  { name: '', sec: 56, w: 76 },
]

const ITEMS = [
  { icon: FileText, w: 74, days: 2, due: 38 },
  { icon: MessagesSquare, name: 'Group Discussion', edit: true },
  { icon: FilePenLine, w: 88, days: 3, due: 42 },
  { icon: Rocket, w: 62, days: 2, due: 36 },
  { icon: FileText, w: 80, days: 2, due: 40 },
] as const

// Group Discussion is due Sep 20 plus its days; the pace ends 9 days after.
// Sep 13 to Oct 1 is 18 days.
const due = (days: number) => `Sep ${20 + days}`
const end = (days: number) => `Oct ${days - 1}`
const duration = (days: number) => `2 weeks, ${days + 2} days`

const NAV: [LucideIcon, string][] = [
  [CircleUserRound, 'Account'],
  [Gauge, 'Dashboard'],
  [BookOpen, 'Courses'],
  [Calendar, 'Calendar'],
  [Inbox, 'Inbox'],
]

async function script(a: Act<S>) {
  await a.wait(1000)
  a.mark('pick')
  await a.move({ at: 'terry', x: 0.35, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'terry', x: 0.35, y: 0.5 })
  a.put({ open: true })
  await a.wait(700)
  a.mark('bump')
  await a.move({ at: 'up', x: 0.5, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'up', x: 0.5, y: 0.5 })
  a.put({ days: 3 })
  await a.wait(320)
  await a.click({ at: 'up', x: 0.5, y: 0.5 })
  a.put({ days: 4 })
  // Off the stepper so the new dates read clear of the pointer
  await a.wait(250)
  await a.move({ at: 'rest' })
  a.mark('hold')
  await a.wait(2300)
  a.mark('close')
  await a.move({ at: 'close', x: 0.5, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'close', x: 0.5, y: 0.5 })
  a.put({ open: false })
  await a.wait(450)
  a.snap({ days: 2 })
  await a.move({ at: 'home' }, { duration: 700 })
  await a.wait(300)
}

function Stepper({ n, target }: { n: ReactNode; target?: boolean }) {
  return (
    <span className="cp-step">
      <span className="cp-step__n">{n}</span>
      <span className="cp-step__btns">
        <span data-target={target ? 'up' : undefined} data-cursor="pointer"><I as={ChevronUp} size={10} /></span>
        <span><I as={ChevronDown} size={10} /></span>
      </span>
    </span>
  )
}

function Scene({ s, layout, variant }: { s: S; layout: Layout; variant: 'card' | 'hero' }) {
  const wide = variant === 'hero' && layout === 'wide'
  const items = wide ? ITEMS : ITEMS.slice(0, 4)
  return (
    <Window className="cp-win">
      <div className="cp-app">
        <nav className="cp-nav" aria-hidden data-covered={s.open || undefined}>
          {NAV.map(([icon, label]) => (
            <span key={label} className="cp-nav__item" data-on={label === 'Courses' || undefined}>
              <I as={icon} size={wide ? 18 : 16} />
              {wide && <span className="cp-nav__label">{label}</span>}
            </span>
          ))}
        </nav>

        {wide && (
          <div className="cp-course" data-covered={s.open || undefined}>
            {[52, 84, 70, 58, 62].map((w, i) => <Bar key={i} w={w} h={6} r={3} tone={2} />)}
            <span className="cp-course__on">Course Pacing</span>
            {[48, 66].map((w, i) => <Bar key={`b${i}`} w={w} h={6} r={3} tone={2} />)}
          </div>
        )}

        <div className="cp-page" data-covered={s.open || undefined}>
          <div className="cp-title">Physics 101</div>
          {wide && (
            <>
              <div className="cp-desc">
                <Bar w={340} h={6} r={3} tone={1} />
                <Bar w={250} h={6} r={3} tone={1} />
              </div>
              <div className="cp-stats">
                <div className="cp-stat"><span className="cp-stat__label">Students</span><span className="cp-stat__value">3,204</span></div>
                <div className="cp-stat"><span className="cp-stat__label">Sections</span><span className="cp-stat__value">200</span></div>
                <div className="cp-stat"><span className="cp-stat__label">Pace duration</span><span className="cp-stat__value">3 weeks</span></div>
              </div>
            </>
          )}
          <Tabs className="cp-tabs" items={['Sections', 'Students']} value={1} />
          {wide && (
            <div className="cp-search">
              <span className="cp-search__field"><I as={Search} size={14} /><span>Search 3,204 students</span></span>
              <span className="cp-search__btn">Search</span>
            </div>
          )}
          <div className="cp-list">
            {STUDENTS.map((st) => (
              <Row
                key={st.name || 'filler'}
                pad={0}
                className="cp-row"
                lead={<Avatar name={st.name} plain={!st.name} size={wide ? 24 : 20} />}
                title={!st.name ? <Bar w={st.w!} h={6} r={3} tone={2} /> : <Text className="cp-name" data-target={st.pick ? 'terry' : undefined} data-cursor={st.pick ? 'pointer' : undefined}>{st.name}</Text>}
              >
                <span className="cp-row__meta">
                  {wide && <Bar w={st.sec} h={6} r={3} tone={2} />}
                  <Bar w={wide ? 40 : 44} h={6} r={3} tone={2} />
                </span>
              </Row>
            ))}
          </div>
        </div>

        <div className="cp-pace" data-open={s.open || undefined} aria-hidden={!s.open}>
          <div className="cp-pace__in">
            <div className="cp-pace__head">
              <span className="cp-pace__title">Student Pace: Terry Bothman</span>
              <span className="cp-close" data-target="close" data-cursor="pointer"><I as={X} size={wide ? 16 : 14} /></span>
            </div>
            <div className="cp-pace__body">
              {wide && (
                <div className="cp-who">
                  <Avatar name="Terry Bothman" size={28} />
                  <span>Terry Bothman</span>
                </div>
              )}
              <div className="cp-cards">
                <div className="cp-card cp-dates">
                  <I as={CalendarDays} size={wide ? 18 : 16} />
                  <div className="cp-date">
                    <span className="cp-date__label">Start</span>
                    <span className="cp-date__value">Sep 13</span>
                  </div>
                  <I as={ArrowRight} size={14} className="cp-dates__arrow" />
                  <div className="cp-date">
                    <span className="cp-date__label">End</span>
                    <span className="cp-date__value"><Roll delay={350}>{end(s.days)}</Roll></span>
                  </div>
                </div>
                {wide && (
                  <>
                    <div className="cp-card cp-card--blue">
                      <I as={ListChecks} size={18} />
                      <div className="cp-date">
                        <span className="cp-date__label">Assignments</span>
                        <span className="cp-date__value">7</span>
                      </div>
                    </div>
                    <div className="cp-card cp-card--green">
                      <I as={Clock} size={18} />
                      <div className="cp-date">
                        <span className="cp-date__label">Duration</span>
                        <span className="cp-date__value"><Roll delay={500}>{duration(s.days)}</Roll></span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="cp-table">
                {wide && (
                  <>
                    <div className="cp-module"><I as={ChevronDown} size={12} /><span>Module 1</span></div>
                    <div className="cp-item cp-item--head"><span /><span>Assignments</span><span>Days</span><span className="cp-item__due">Due date</span></div>
                  </>
                )}
                {items.map((it, i) => (
                  <div key={i} className="cp-item" data-edit={'edit' in it || undefined}>
                    <I as={it.icon} size={14} />
                    {'edit' in it ? <Text className="cp-item__name">{it.name}</Text> : <Bar w={it.w} h={6} r={3} tone={2} />}
                    <Stepper n={'edit' in it ? <Roll>{String(s.days)}</Roll> : it.days} target={'edit' in it} />
                    <span className="cp-item__due">{'edit' in it ? <Roll>{due(s.days)}</Roll> : <Bar w={it.due} h={6} r={3} tone={2} />}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <span className="cp-spot cp-spot--rest" data-target="rest" />
      <span className="cp-spot cp-spot--home" data-target="home" />
    </Window>
  )
}

export function CoursePacingCard({ fill = false }: { fill?: boolean }) {
  return (
    <Stage<S>
      width={398}
      height={265}
      initial={initial}
      poster={poster}
      script={script}
      play="loop"
      fill={fill}
      cursor={{ at: { x: 330, y: 236 }, ripple: true }}
      className="cp cp--card"
    >
      {(s, _rect, layout) => <Scene s={s} layout={layout} variant="card" />}
    </Stage>
  )
}

export function CoursePacingHero() {
  return (
    <Stage<S>
      width={736}
      height={491}
      compact={{ below: 560, width: 398, height: 265 }}
      initial={initial}
      poster={poster}
      script={script}
      play="loop"
      fill
      cursor={{ at: { wide: { x: 620, y: 440 }, compact: { x: 330, y: 236 } }, ripple: true }}
      className="cp cp--hero"
    >
      {(s, _rect, layout) => <Scene s={s} layout={layout} variant="hero" />}
    </Stage>
  )
}

export default CoursePacingHero
