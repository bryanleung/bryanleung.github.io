import { type LucideProps, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, CornerDownLeft, Mail, Settings, SlidersHorizontal, Users, X } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { Bar, Button, Camera, Collapse, Count, Field, Roll, Stage, States, Window, type Act, type Layout, type Rect } from '../../kit'
import './church.css'

// Church offering batch entry: one typed line becomes a recorded gift.
//   card: homepage thumbnail, 398 x 265.
//   hero: case study hero, 736 x 491, with the card design as its compact
//         layout on phones.
// Beats: a batch with 36 entries (context); the office manager types one line
// and the readback fills in under it, giver, amount, then the split across
// two funds (action); Enter records it, the row drops in at the top of the
// list and the batch total rolls up (payoff). The loop's reset has a seen
// cause: Up opens the new entry for editing and Delete entry removes it, the
// total rolling back.

// The fonts the real screen uses. Loaded once, here, so the scene carries
// them into any host page.
if (typeof document !== 'undefined' && !document.querySelector('link[data-co-fonts]')) {
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.dataset.coFonts = ''
  l.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
  document.head.appendChild(l)
}

type S = { q: string; focus: boolean; rec: boolean; edit: boolean; cam: Rect | null }

const Q = 'grace chen 100 chk 1047 general 75 missions 25'
const initial: S = { q: '', focus: true, rec: false, edit: false, cam: null }
const poster: S = { q: Q, focus: true, rec: false, edit: false, cam: null }
const BASE = 6592
const HOME = { wide: { x: 640, y: 450 }, compact: { x: 340, y: 240 } }

const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Types from where the line is now to `to`, the same uneven rhythm as act.type
async function typeTo(a: Act<S>, from: number, to: number) {
  for (let i = from; i <= to; i++) {
    a.put({ q: Q.slice(0, i) })
    await a.wait(42 * (0.7 + 0.6 * ((i * 7919) % 13) / 13))
  }
}

const makeScript = (card: boolean, full = false) => async function script(a: Act<S>) {
  await a.wait(900)
  a.mark('type')
  if (full) {
    // Push in on the line being typed, then pan right with the readback as
    // the funds go in; pull back out when the gift is recorded
    a.put({ cam: a.rect('cam-a', { layout: true }) })
    await a.wait(800)
    const pan = Q.indexOf('general')
    await typeTo(a, 0, pan)
    a.put({ cam: a.rect('cam-b', { layout: true }) })
    await typeTo(a, pan + 1, Q.length)
  } else {
    await a.type('q', Q, { interval: 42 })
  }
  a.mark('read')
  await a.wait(1300)
  a.mark('record')
  await a.key('enter')
  a.put({ q: '', rec: true, cam: null })
  await a.wait(full ? 3000 : 2600)
  a.mark('hold')
  // Reset, with its cause on screen: Up opens the entry, Delete entry removes it
  a.mark('reset')
  await a.key('up')
  a.put({ edit: true, focus: false })
  await a.wait(500)
  await a.move({ at: 'delete', x: 0.8, y: 0.85 })
  await a.wait(150)
  await a.click({ at: 'delete', x: 0.8, y: 0.85 })
  a.put({ edit: false, rec: false })
  await a.wait(500)
  await a.move(!card && a.layout === 'wide' ? HOME.wide : HOME.compact, { duration: 700 })
  a.put({ focus: true })
  await a.wait(500)
}

const cardScript = makeScript(true)
const heroScript = makeScript(false)
const fullCardScript = makeScript(true, true)
const fullHeroScript = makeScript(false, true)

function I({ as: C, size = 14 }: { as: ComponentType<LucideProps>; size?: number }) {
  return <C size={size} strokeWidth={1.75} />
}

// What the typed line says so far, read back the way the product does.
function read(q: string) {
  return {
    giver: q.length >= 10,
    amount: q.length >= 14,
    check: q.includes('chk 1047'),
    general: q.includes('general'),
    split: q.endsWith('missions 25'),
  }
}

type Old = { no: string; name?: string; env?: string; method?: string; fund?: string; split?: number; amt?: string; w?: number }
const OLD: Old[] = [
  { no: '036', name: 'Joseph Tan 陳約瑟', env: '0144', method: 'Check 881', split: 2, amt: '$500.00' },
  { no: '035', name: 'Grace Liu 劉雅恩', env: '0356', method: 'Check 2231', fund: 'General Fund', amt: '$80.00' },
  { no: '034', w: 92 },
  { no: '033', w: 70 },
  { no: '032', w: 104 },
  { no: '031', w: 64 },
  { no: '030', w: 86 },
  { no: '029', w: 58 },
  { no: '028', w: 98 },
]

function Readback({ q, wide }: { q: string; wide: boolean }) {
  const r = read(q)
  return (
    <div className="co-read">
      <div className="co-read__col">
        <span className="co-lbl">Giver</span>
        <States value={r.giver ? 'on' : 'idle'} align="start" states={{
          idle: <span className="co-val co-val--idle">{wide ? 'Type a name or envelope no.' : 'Name or envelope'}</span>,
          on: <span className="co-val">Grace Chen{wide && ' 陳恩慈'}<span className="co-env">#0412</span></span>,
        }} />
      </div>
      <div className="co-read__col">
        <span className="co-lbl">Amount</span>
        <States value={r.amount ? 'on' : 'idle'} align="start" states={{
          idle: <span className="co-val co-val--idle co-mono">$0.00</span>,
          on: <span className="co-val co-mono">$100.00</span>,
        }} />
        <States value={r.check ? 'on' : 'idle'} align="start" className="co-sub" states={{ idle: <span>Check</span>, on: <span>Check 1047</span> }} />
      </div>
      <div className="co-read__col">
        <span className="co-lbl"><Roll>{r.split ? '2 funds' : 'Fund'}</Roll></span>
        <States value={r.split ? 'split' : r.general ? 'general' : 'idle'} align="start" states={{
          idle: <span className="co-val co-val--idle">General Fund</span>,
          general: <span className="co-val">General Fund</span>,
          split: (
            <span className="co-funds">
              <span><b>{wide ? 'General Fund' : 'General'}</b><i className="co-mono">$75</i></span>
              <span><b>Missions</b><i className="co-mono">$25</i></span>
            </span>
          ),
        }} />
      </div>
    </div>
  )
}

function NewRow({ wide }: { wide: boolean }) {
  return (
          <div className="co-row co-row--fresh">
            <span className="co-no co-mono">037</span>
            <span className="co-name"><b>Grace Chen{wide && ' 陳恩慈'}</b><span className="co-env">0412</span></span>
            {wide && <span className="co-t2">Check 1047</span>}
            <span className="co-t2 co-split"><I as={ChevronRight} size={12} />2 funds</span>
            <span className="co-amt co-mono">$100.00</span>
          </div>
  )
}

function EditRow({ wide }: { wide: boolean }) {
  return (
          <div className="co-ed">
            {wide ? (
              <>
                <div className="co-ed__g">
                  <span className="co-no co-mono co-no--on">037</span>
                  <Field className="co-f" value="Grace Chen 陳恩慈 · 0412" trailing={<I as={ChevronDown} size={12} />} />
                  <Field className="co-f" value="Check" trailing={<I as={ChevronDown} size={12} />} />
                  <Field className="co-f co-mono" value="1047" />
                  <Field className="co-f co-f--num co-mono" value="100.00" />
                  <span />
                </div>
                {[['General Fund', '75.00'], ['Missions', '25.00']].map(([f, v], i) => (
                  <div className="co-ed__g" key={f}>
                    <span />
                    <span className="co-ed__lbl">{i === 0 ? 'Funds' : ''}</span>
                    <Field className="co-f co-f--span" value={f} trailing={<I as={ChevronDown} size={12} />} />
                    <Field className="co-f co-f--num co-mono" value={v} />
                    <span className="co-x"><I as={X} size={12} /></span>
                  </div>
                ))}
              </>
            ) : (
              <div className="co-ed__line">
                <span className="co-no co-mono co-no--on">037</span>
                <b>Grace Chen</b>
                <span className="co-amt co-mono">$100.00</span>
              </div>
            )}
            <div className="co-ed__acts">
              <span className="co-del" data-target="delete" data-cursor="pointer">Delete entry</span>
              <span className="co-grow" />
              <Button size="small">Cancel</Button>
              <Button size="small" variant="primary">Save</Button>
            </div>
          </div>
  )
}

// The window version sits on a ground; the full version is the screen itself,
// edge to edge, with a camera that pushes in on what is being typed.
function Frame({ full, cam, children }: { full: boolean; cam: Rect | null; children: ReactNode }) {
  if (!full) return <Window className="co-win">{children}</Window>
  return (
    <div className="co-full">
      <Camera focus={cam} pad={18} max={2.2} duration={1000}>{children}</Camera>
    </div>
  )
}

function Scene({ s, layout, variant, full = false }: { s: S; layout: Layout; variant: 'card' | 'hero'; full?: boolean }) {
  const wide = variant === 'hero' && layout === 'wide'
  const r = read(s.q)
  const ready = r.giver && r.amount && r.split
  const total = BASE + (s.rec ? 100 : 0)
  const count = 36 + (s.rec ? 1 : 0)
  const rows = wide ? OLD : OLD.slice(0, full ? 6 : 3)
  return (
    <Frame full={full} cam={s.cam}>
      <div className="co-app">
        <nav className="co-rail" aria-hidden="true">
          <span className="co-rail__i"><I as={Users} size={wide ? 17 : 15} /></span>
          <span className="co-rail__i" data-on><I as={Mail} size={wide ? 17 : 15} /></span>
          <span className="co-rail__i"><I as={ClipboardCheck} size={wide ? 17 : 15} /></span>
          <span className="co-grow" />
          <span className="co-rail__i co-rail__last"><I as={Settings} size={wide ? 17 : 15} /></span>
        </nav>
        <div className="co-main">
          <div className="co-head">
            {wide && <span className="co-back"><I as={ChevronLeft} size={16} /></span>}
            <div className="co-ttl">
              <span className="co-name-big">English Worship</span>
              <span className="co-date"><I as={Calendar} size={11} />Sun, Sep 27</span>
            </div>
            <span className="co-grow" />
            <div className="co-tot">
              <Count className="co-total co-mono" value={total} format={money} />
              <span className="co-meta">
                <span className="co-mono"><Count value={count} /> entries</span>
                <span aria-hidden="true">·</span>
                <span className="co-saved"><I as={Check} size={11} />Saved</span>
              </span>
            </div>
            {wide && <Button variant="primary" className="co-submit">Submit batch</Button>}
          </div>

          <div className="co-entry">
            <span className="co-cam co-cam--a" data-target="cam-a" />
            <span className="co-cam co-cam--b" data-target="cam-b" />
            <div className="co-q">
              <Field className="co-field co-mono" data-long={s.q.length > (wide ? 64 : 27) || undefined} value={s.q} focused={s.focus} placeholder="grace chen 100 general" />
              {wide && <span className="co-icon"><I as={SlidersHorizontal} size={15} /></span>}
              <Button variant="primary" size={wide ? 'medium' : 'small'} className="co-record" data-ready={ready || undefined} trailingIcon={<I as={CornerDownLeft} size={12} />}>Record</Button>
            </div>
            <Readback q={s.q} wide={wide} />
          </div>

          <div className="co-list">
            {wide && (
              <div className="co-row co-row--head">
                <span>No.</span><span>Giver</span><span>Method</span><span>Fund</span><span className="co-r">Amount</span>
              </div>
            )}
            <Collapse open={s.rec && !s.edit} reveal="drop">
              <NewRow wide={wide} />
            </Collapse>
            <Collapse open={s.rec && s.edit}>
              <EditRow wide={wide} />
            </Collapse>
            {rows.map((o) => (
              <div className="co-row" key={o.no}>
                {o.name ? <span className="co-no co-mono">{o.no}</span> : <span><Bar w={16} h={5} r={2.5} tone={1} /></span>}
                {o.name ? (
                  <span className="co-name"><b>{wide ? o.name : o.name.split(' ').slice(0, 2).join(' ')}</b><span className="co-env">{o.env}</span></span>
                ) : (
                  <span className="co-name"><Bar w={o.w} h={6} r={3} tone={2} /></span>
                )}
                {wide && (o.method ? <span className="co-t2">{o.method}</span> : <span><Bar w={44} h={5} r={2.5} tone={1} /></span>)}
                {o.split ? <span className="co-t2 co-split"><I as={ChevronRight} size={12} />{o.split} funds</span>
                  : o.fund ? <span className="co-t2">{o.fund}</span>
                  : <span><Bar w={58} h={5} r={2.5} tone={1} /></span>}
                {o.amt ? <span className="co-amt co-mono">{o.amt}</span> : <span className="co-r"><Bar w={40} h={5} r={2.5} tone={2} /></span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  )
}

export function ChurchOfferingsCard({ fill = false }: { fill?: boolean }) {
  return (
    <Stage<S> width={398} height={265} initial={initial} poster={poster} script={cardScript} play="loop" fill={fill} keys="bottom-right"
      cursor={{ at: HOME.compact, ripple: true }} className="co">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="card" />}
    </Stage>
  )
}

export function ChurchOfferingsHero() {
  return (
    <Stage<S> width={736} height={491} compact={{ below: 560, width: 398, height: 265 }} initial={initial} poster={poster} script={heroScript} play="loop" fill
      keys="bottom-right" cursor={{ at: HOME, ripple: true }} className="co co--hero">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="hero" />}
    </Stage>
  )
}

export function ChurchOfferingsFullCard({ fill = false }: { fill?: boolean }) {
  return (
    <Stage<S> width={398} height={265} initial={initial} poster={poster} script={fullCardScript} play="loop" fill={fill} keys="bottom-right"
      cursor={{ at: HOME.compact, ripple: true }} className="co co--full">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="card" full />}
    </Stage>
  )
}

export function ChurchOfferingsFullHero() {
  return (
    <Stage<S> width={736} height={491} compact={{ below: 560, width: 398, height: 265 }} initial={initial} poster={poster} script={fullHeroScript} play="loop" fill
      keys="bottom-right" cursor={{ at: HOME, ripple: true }} className="co co--hero co--full">
      {(s, _r, layout) => <Scene s={s} layout={layout} variant="hero" full />}
    </Stage>
  )
}

export default ChurchOfferingsHero

// The poster frame held still, for making the static poster images the
// pages show before the scene script loads.
const hold = async (a: Act<S>) => { await a.wait(600000) }
export function ChurchOfferingsStill({ variant }: { variant: 'card' | 'hero' }) {
  const card = variant === 'card'
  return (
    <Stage<S> width={card ? 398 : 736} height={card ? 265 : 491} initial={poster} poster={poster} script={hold} play="loop"
      cursor={{ at: card ? HOME.compact : HOME.wide, idle: 1 }} className={`co co--full${card ? '' : ' co--hero'}`}>
      {(s, _r, layout) => <Scene s={s} layout={layout} variant={variant} full />}
    </Stage>
  )
}
