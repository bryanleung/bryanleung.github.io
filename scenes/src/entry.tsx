import { createRoot } from 'react-dom/client'
import type { ReactElement } from 'react'
import { BulkPublishCard, BulkPublishHero } from './bulk-publish'
import { CoursePacingCard, CoursePacingHero } from './course-pacing'
import { SelectiveModulesCard, SelectiveModulesHero } from './selective-modules'
import { ChurchOfferingsFullCard, ChurchOfferingsFullHero } from './church-offerings'

// Mounts the case study scenes into the static site. A host names its scene:
//   <span data-scene="course-pacing-card"></span>   homepage thumbnail
//   <div data-scene="course-pacing-hero"></div>      case study hero
// Each host keeps its static poster image inside until the scene mounts.
const SCENES: Record<string, () => ReactElement> = {
  'course-pacing-card': () => <CoursePacingCard fill />,
  'course-pacing-hero': () => <CoursePacingHero />,
  'bulk-publish-card': () => <BulkPublishCard fill />,
  'bulk-publish-hero': () => <BulkPublishHero />,
  'selective-modules-card': () => <SelectiveModulesCard fill />,
  'selective-modules-hero': () => <SelectiveModulesHero />,
  'church-offerings-card': () => <ChurchOfferingsFullCard fill />,
  'church-offerings-hero': () => <ChurchOfferingsFullHero />,
}

function mount() {
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
    const make = SCENES[el.dataset.scene ?? '']
    if (!make || el.dataset.mounted) return
    el.dataset.mounted = '1'
    createRoot(el).render(make())
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
else mount()
