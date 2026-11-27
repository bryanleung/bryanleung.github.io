import { createRoot } from 'react-dom/client'
import { CoursePacingCard, CoursePacingHero } from './course-pacing'

// Mounts the Course Pacing scene into the static site:
//   <span data-scene="course-pacing-card"></span>  homepage thumbnail
//   <div data-scene="course-pacing-hero"></div>     case study hero
// Each host keeps its static poster image inside until the scene mounts.
function mount() {
  document.querySelectorAll<HTMLElement>('[data-scene^="course-pacing-"]').forEach((el) => {
    if (el.dataset.mounted) return
    el.dataset.mounted = '1'
    const kind = el.dataset.scene
    createRoot(el).render(kind === 'course-pacing-hero' ? <CoursePacingHero /> : <CoursePacingCard fill />)
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
else mount()
