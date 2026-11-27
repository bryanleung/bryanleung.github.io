import { ChevronDown, Copy, EllipsisVertical, FilePenLine, FileText, MessagesSquare, Pencil, Plus, Rocket, Trash2, UserRound, UserRoundPlus, X } from 'lucide-react'
import { Avatar, Bar, Popover, Stage, Window, type Act, type Layout } from '../../kit'
import { CourseNav, GlobalNav, I, ModuleItem, PublishMark } from '../canvas-shared/canvas'
import './smr.css'

// Selective Modules Release scene: assign a whole module once, and every
// item inside inherits it.
//   card: homepage thumbnail, 398 x 265.
//   hero: case study hero, 736 x 491, with the card design as its compact
//         layout on phones.
// Beats: the module's menu, Assign To (context and action), the tray slides
// in over the Modules page, "Mel" typed and Melissa Chen picked, Save
// (action), then Melissa's chip lands on the module and on each item inside
// it, top to bottom (payoff: inheritance). The loop's reset is an exit
// around the anchor: the chips leave in a quick reverse stagger.

type S = { menu: boolean; tray: boolean; focus: boolean; typed: string; options: boolean; chip: boolean; assigned: number }

const ITEMS = [
  { icon: FilePenLine, w: 104, s: 30 },
  { icon: FileText, w: 88, s: 30 },
  { icon: MessagesSquare, w: 80, s: 0 },
  { icon: Rocket, w: 96, s: 30 },
  { icon: FilePenLine, w: 110, s: 30 },
]
const ALL = ITEMS.length + 1

const initial: S = { menu: false, tray: false, focus: false, typed: '', options: false, chip: false, assigned: 0 }
const poster: S = { ...initial, assigned: ALL }

async function script(a: Act<S>) {
  await a.wait(1000)
  a.mark('menu')
  await a.move({ at: 'kebab', x: 0.5, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'kebab', x: 0.5, y: 0.5 })
  a.put({ menu: true })
  await a.wait(450)
  await a.move({ at: 'opt-assign', x: 0.1, y: 0.6 })
  await a.wait(200)
  await a.click({ at: 'opt-assign', x: 0.1, y: 0.6 })
  a.mark('tray')
  a.put({ menu: false, tray: true })
  await a.wait(650)
  await a.move({ at: 'field', x: 0.3, y: 0.5 })
  await a.click({ at: 'field', x: 0.3, y: 0.5 })
  a.put({ focus: true })
  await a.wait(200)
  await a.type('typed', 'Mel', { interval: 110 })
  a.put({ options: true })
  await a.wait(500)
  await a.move({ at: 'opt-mel', x: 0.4, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'opt-mel', x: 0.4, y: 0.5 })
  a.put({ options: false, chip: true, typed: '' })
  await a.wait(500)
  a.mark('save')
  await a.move({ at: 'save', x: 0.5, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'save', x: 0.5, y: 0.5 })
  a.put({ tray: false, focus: false })
  await a.wait(380)
  a.mark('inherit')
  for (let i = 1; i <= ALL; i++) {
    a.put({ assigned: i })
    await a.wait(130)
  }
  await a.move({ at: 'rest' }, { duration: 600 })
  a.mark('hold')
  await a.wait(2200)
  // Exit around the anchor: what the story added leaves, last first
  for (let i = ALL - 1; i >= 0; i--) {
    a.put({ assigned: i })
    await a.wait(60)
  }
  a.snap({ chip: false })
  await a.move({ at: 'home' }, { duration: 700 })
  await a.wait(300)
}

function Assigned({ show, head }: { show: boolean; head?: boolean }) {
  return (
    <span className={`smr-tag${head ? ' smr-tag--head' : ''}`} data-show={show || undefined}>
      <I as={UserRound} size={12} />
      Melissa Chen
    </span>
  )
}

function Scene({ s, layout, variant }: { s: S; layout: Layout; variant: 'card' | 'hero' }) {
  const wide = variant === 'hero' && layout === 'wide'
  const items = wide ? ITEMS : ITEMS.slice(0, 4)
  return (
    <Window className="cvs-win">
      <div className="cvs-app">
        <GlobalNav wide={wide} />
        {wide && <CourseNav current="Modules" />}
        <div className="cvs-main">
          {wide && (
            <div className="smr-toolbar">
              <span className="cvs-btn">View Progress</span>
              <span className="cvs-btn cvs-btn--primary"><I as={Plus} size={13} />Module</span>
            </div>
          )}
          <div className="cvs-module smr-module">
            <div className="cvs-module__head">
              <I as={ChevronDown} size={13} />
              <span className="cvs-module__title">Week 3 readings</span>
              <Assigned show={s.assigned >= 1} head />
              {wide && <PublishMark on />}
              <span className="cvs-kebab" data-target="kebab" data-cursor="pointer" data-open={s.menu || undefined}><I as={EllipsisVertical} size={14} /></span>
            </div>
            {items.map((it, i) => (
              <ModuleItem key={i} icon={it.icon} published title={<Bar w={it.w} h={6} r={3} tone={3} />} sub={it.s ? <Bar w={it.s} h={5} r={2.5} tone={2} /> : undefined}>
                <Assigned show={s.assigned >= i + 2} />
                <PublishMark on />
                <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
              </ModuleItem>
            ))}
          </div>
          {wide && (
            <div className="cvs-module smr-module-b">
              <div className="cvs-module__head">
                <I as={ChevronDown} size={13} />
                <span className="cvs-module__title"><Bar w={130} h={7} r={3.5} tone={3} /></span>
                <PublishMark on />
                <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
              </div>
              <ModuleItem icon={FileText} published title={<Bar w={92} h={6} r={3} tone={3} />} sub={<Bar w={30} h={5} r={2.5} tone={2} />}>
                <PublishMark on />
                <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
              </ModuleItem>
            </div>
          )}

          <Popover show={s.menu} origin="top right" className="cvs-menu smr-menu">
            <div className="cvs-menu__item"><I as={Pencil} size={14} /><Bar w={44} h={6} r={3} tone={2} /></div>
            <div className="cvs-menu__item" data-target="opt-assign" data-cursor="pointer"><I as={UserRoundPlus} size={14} />Assign To...</div>
            <div className="cvs-menu__item"><I as={Copy} size={14} /><Bar w={56} h={6} r={3} tone={2} /></div>
            <div className="cvs-menu__item"><I as={Trash2} size={14} /><Bar w={40} h={6} r={3} tone={2} /></div>
          </Popover>
        </div>

        {/* The Assign To tray: Canvas's existing tray, sliding over the page's right side */}
        <div className="smr-tray" data-open={s.tray || undefined} aria-hidden={!s.tray}>
          <div className="smr-tray__in">
          <div className="smr-tray__head">
            <div className="smr-tray__titles">
              <span className="smr-tray__title">Week 3 readings</span>
              {wide && <span className="smr-tray__sub">Module</span>}
            </div>
            <span className="cvs-kebab"><I as={X} size={14} /></span>
          </div>
          <div className="smr-tray__body">
            <div className="smr-label">Assign To</div>
            <div className="smr-field" data-target="field" data-cursor="ibeam" data-focus={s.focus || undefined}>
              <span className="smr-chip" data-show={s.chip || undefined}>Melissa Chen<I as={X} size={12} /></span>
              <span className="smr-typed">{s.typed}</span>
              {s.focus && !s.chip && <span className="smr-caret" key={s.typed} />}
              <span className="smr-placeholder" data-hide={s.focus || s.chip || undefined}>Start typing a name</span>
            </div>
            {wide && (
              <div className="smr-dates">
                <div className="smr-label">Due date</div>
                <div className="smr-field smr-field--quiet"><Bar w={70} h={6} r={3} tone={2} /></div>
                <div className="smr-label">Available from</div>
                <div className="smr-field smr-field--quiet"><Bar w={70} h={6} r={3} tone={2} /></div>
              </div>
            )}
            <div className="smr-actions">
              <span className="cvs-btn">Cancel</span>
              <span className="cvs-btn cvs-btn--primary" data-target="save" data-cursor="pointer">Save</span>
            </div>
            <Popover show={s.options} origin="top left" className="cvs-menu smr-options">
              <div className="smr-options__label">Students</div>
              <div className="cvs-menu__item" data-target="opt-mel" data-cursor="pointer"><Avatar name="Melissa Chen" size={18} />Melissa Chen</div>
              {wide && <div className="cvs-menu__item"><Avatar name="Melvin Park" size={18} />Melvin Park</div>}
            </Popover>
          </div>
          </div>
        </div>
      </div>
      <span className="cvs-spot smr-spot--rest" data-target="rest" />
      <span className="cvs-spot smr-spot--home" data-target="home" />
    </Window>
  )
}

export function SelectiveModulesCard({ fill = false }: { fill?: boolean }) {
  return (
    <Stage<S> width={398} height={265} initial={initial} poster={poster} script={script} play="loop" fill={fill}
      cursor={{ at: { x: 330, y: 236 }, ripple: true }} className="cvs smr">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="card" />}
    </Stage>
  )
}

export function SelectiveModulesHero() {
  return (
    <Stage<S> width={736} height={491} compact={{ below: 560, width: 398, height: 265 }} initial={initial} poster={poster} script={script} play="loop" fill
      cursor={{ at: { wide: { x: 620, y: 440 }, compact: { x: 330, y: 236 } }, ripple: true }} className="cvs cvs--hero smr">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="hero" />}
    </Stage>
  )
}

export default SelectiveModulesHero
