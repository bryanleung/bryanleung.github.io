import { Check, ChevronDown, EllipsisVertical, FilePenLine, FileText, MessagesSquare, Plus, Rocket } from 'lucide-react'
import { Bar, Collapse, Popover, Stage, States, Window, type Act, type Layout } from '../../kit'
import { CourseNav, GlobalNav, I, ModuleItem, PublishMark } from '../canvas-shared/canvas'
import './bulk.css'

// Bulk Publish scene: a 120-item course published in two clicks.
//   card: homepage thumbnail, 398 x 265.
//   hero: case study hero, 736 x 491, with the card design as its compact
//         layout on phones.
// Beats: a Modules page with every item unpublished (context), Publish All
// opens its menu (action), "Publish all modules and items" runs and every
// status mark turns green down the page (payoff); in the hero a progress
// alert fills and becomes "Modules updated". The loop's reset has a seen
// cause: the same menu's "Unpublish all", the marks going back bottom up.

type Alert = 'none' | 'progress' | 'done'
type S = { menu: boolean; pub: number; alert: Alert; progress: number }

// Every publishable row in page order: module A's header, its five items,
// module B's header, its first item. The card shows the first five.
const ROWS = 8
const initial: S = { menu: false, pub: 0, alert: 'none', progress: 0 }
const poster: S = { menu: false, pub: ROWS, alert: 'done', progress: 100 }

const ITEMS_A = [
  { icon: FilePenLine, w: 132, s: 30 },
  { icon: FileText, w: 108, s: 30 },
  { icon: MessagesSquare, w: 96, s: 0 },
  { icon: FilePenLine, w: 124, s: 30 },
  { icon: Rocket, w: 116, s: 30 },
]

async function script(a: Act<S>) {
  await a.wait(1000)
  a.mark('menu')
  await a.move({ at: 'publish-all', x: 0.9, y: 0.55 })
  await a.wait(150)
  await a.click({ at: 'publish-all', x: 0.9, y: 0.55 })
  a.put({ menu: true })
  await a.wait(450)
  await a.move({ at: 'opt-publish', x: 0.4, y: 0.5 })
  await a.wait(200)
  await a.click({ at: 'opt-publish', x: 0.4, y: 0.5 })
  a.mark('publish')
  a.put({ menu: false, alert: 'progress' })
  await a.wait(60)
  a.put({ progress: 100 })
  await a.move({ at: 'rest' }, { duration: 650 })
  for (let i = 1; i <= ROWS; i++) {
    a.put({ pub: i })
    await a.wait(120)
  }
  await a.wait(350)
  a.put({ alert: 'done' })
  a.mark('hold')
  await a.wait(2300)
  // Reset, with its cause on screen: the same menu, Unpublish all
  a.mark('reset')
  await a.move({ at: 'publish-all', x: 0.9, y: 0.55 })
  await a.wait(120)
  await a.click({ at: 'publish-all', x: 0.9, y: 0.55 })
  a.put({ menu: true })
  await a.wait(400)
  await a.move({ at: 'opt-unpublish', x: 0.4, y: 0.5 })
  await a.wait(150)
  await a.click({ at: 'opt-unpublish', x: 0.4, y: 0.5 })
  a.put({ menu: false, alert: 'none' })
  for (let i = ROWS - 1; i >= 0; i--) {
    a.put({ pub: i })
    await a.wait(60)
  }
  a.snap({ progress: 0 })
  await a.move({ at: 'home' }, { duration: 700 })
  await a.wait(300)
}

function Scene({ s, layout, variant }: { s: S; layout: Layout; variant: 'card' | 'hero' }) {
  const wide = variant === 'hero' && layout === 'wide'
  const items = wide ? ITEMS_A : ITEMS_A.slice(0, 4)
  const all = s.pub >= ROWS
  return (
    <Window className="cvs-win">
      <div className="cvs-app">
        <GlobalNav wide={wide} />
        {wide && <CourseNav current="Modules" />}
        <div className="cvs-main">
          <div className="bp-toolbar">
            {!wide && <span className="bp-page">Modules</span>}
            {wide && <span className="cvs-btn">Collapse All</span>}
            <span className="cvs-btn" data-target="publish-all" data-cursor="pointer" data-open={s.menu || undefined}>
              <PublishMark on={all} size={14} />
              Publish All
              <I as={ChevronDown} size={12} />
            </span>
            <span className="cvs-btn cvs-btn--primary"><I as={Plus} size={13} />Module</span>
          </div>

          <Popover show={s.menu} origin="top right" className="cvs-menu bp-menu">
            <div className="cvs-menu__item" data-target="opt-publish" data-cursor="pointer"><PublishMark on size={14} />Publish all modules and items</div>
            <div className="cvs-menu__item"><PublishMark on size={14} />Publish all modules</div>
            <div className="cvs-menu__item" data-target="opt-unpublish" data-cursor="pointer"><PublishMark on={false} size={14} />Unpublish all</div>
          </Popover>

          {wide && (
            <Collapse open={s.alert !== 'none'} reveal="drop" className="bp-alert-wrap">
              <div className="bp-alert" data-done={s.alert === 'done' || undefined}>
                <States
                  value={s.alert === 'done' ? 'done' : 'progress'}
                  align="start"
                  states={{
                    progress: (
                      <span className="bp-alert__row">
                        <span className="bp-alert__text">Publishing 120 items</span>
                        <span className="bp-progress"><span style={{ transform: `scaleX(${s.progress / 100})` }} /></span>
                      </span>
                    ),
                    done: (
                      <span className="bp-alert__row">
                        <span className="bp-alert__check"><I as={Check} size={12} /></span>
                        <span className="bp-alert__text">Modules updated</span>
                      </span>
                    ),
                  }}
                />
              </div>
            </Collapse>
          )}

          <div className="cvs-module">
            <div className="cvs-module__head">
              <I as={ChevronDown} size={13} />
              <span className="cvs-module__title">9.1 | Monday</span>
              <PublishMark on={s.pub >= 1} />
              <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
            </div>
            {items.map((it, i) => (
              <ModuleItem
                key={i}
                icon={it.icon}
                published={s.pub >= i + 2}
                title={<Bar w={it.w} h={6} r={3} tone={3} />}
                sub={it.s ? <Bar w={it.s} h={5} r={2.5} tone={2} /> : undefined}
              >
                <PublishMark on={s.pub >= i + 2} />
                <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
              </ModuleItem>
            ))}
          </div>
          {wide && (
            <div className="cvs-module bp-module-b">
              <div className="cvs-module__head">
                <I as={ChevronDown} size={13} />
                <span className="cvs-module__title"><Bar w={150} h={7} r={3.5} tone={3} /></span>
                <PublishMark on={s.pub >= 7} />
                <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
              </div>
              <ModuleItem icon={MessagesSquare} published={s.pub >= 8} title={<Bar w={100} h={6} r={3} tone={3} />} sub={<Bar w={30} h={5} r={2.5} tone={2} />}>
                <PublishMark on={s.pub >= 8} />
                <span className="cvs-kebab"><I as={EllipsisVertical} size={14} /></span>
              </ModuleItem>
            </div>
          )}
        </div>
      </div>
      <span className="cvs-spot bp-spot--rest" data-target="rest" />
      <span className="cvs-spot bp-spot--home" data-target="home" />
    </Window>
  )
}

export function BulkPublishCard({ fill = false }: { fill?: boolean }) {
  return (
    <Stage<S> width={398} height={265} initial={initial} poster={poster} script={script} play="loop" fill={fill}
      cursor={{ at: { x: 330, y: 236 }, ripple: true }} className="cvs bp">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="card" />}
    </Stage>
  )
}

export function BulkPublishHero() {
  return (
    <Stage<S> width={736} height={491} compact={{ below: 560, width: 398, height: 265 }} initial={initial} poster={poster} script={script} play="loop" fill
      cursor={{ at: { wide: { x: 620, y: 440 }, compact: { x: 330, y: 236 } }, ripple: true }} className="cvs cvs--hero bp">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="hero" />}
    </Stage>
  )
}

export default BulkPublishHero
