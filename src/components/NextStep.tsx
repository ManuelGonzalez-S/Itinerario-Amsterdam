import type { VoteDoc } from '../types'
import { IDEAS } from '../data/ideas'
import { GROUP_SIZE, POINTS_BUDGET, countIdeaVotes } from '../lib/scoring'

interface Props {
  mine: VoteDoc
  docs: VoteDoc[]
  onGo: (tab: 'ruta' | 'votar' | 'resultados') => void
}

/**
 * Una sola frase con lo que toca hacer ahora, para que nadie tenga que
 * adivinar por dónde empezar entre cuatro pestañas.
 */
export function NextStep({ mine, docs, onGo }: Props) {
  const voted = countIdeaVotes(mine.triage)
  const spent = Object.values(mine.points ?? {}).reduce((a, b) => a + b, 0)
  const hasRoute = Object.keys(mine.itinerary ?? {}).length > 0
  const routesSent = docs.filter((d) => Object.keys(d.itinerary ?? {}).length > 0).length

  let title: string
  let hint: string
  let cta: string
  let tab: 'ruta' | 'votar' | 'resultados'

  if (voted < IDEAS.length) {
    title = `Te quedan ${IDEAS.length - voted} ideas por votar`
    hint = 'Sí, quizás o no. Se hace en cinco minutos.'
    cta = 'Seguir votando'
    tab = 'votar'
  } else if (spent < POINTS_BUDGET) {
    title = `Te sobran ${POINTS_BUDGET - spent} puntos por repartir`
    hint = 'Es lo que decide de verdad, porque en el triaje casi todo acaba en «sí, vale».'
    cta = 'Repartir mis puntos'
    tab = 'votar'
  } else if (!hasRoute) {
    title = 'Te toca mandar tu ruta ideal'
    hint = 'Eliges una base y la retocas. Tres pasos.'
    cta = 'Armar mi ruta'
    tab = 'ruta'
  } else if (routesSent < GROUP_SIZE) {
    title = `Faltan ${GROUP_SIZE - routesSent} por mandar su ruta`
    hint = 'Tú ya la tienes. Con dos o más se empiezan a ver las coincidencias.'
    cta = 'Ver coincidencias'
    tab = 'ruta'
  } else {
    title = 'Ya está todo: las cuatro rutas están dentro'
    hint = 'Lo que aparece en las cuatro ya no hay que discutirlo.'
    cta = 'Ver en qué coincidís'
    tab = 'ruta'
  }

  return (
    <div className="mb-4 rounded-2xl border border-orange-400/25 bg-orange-500/5 p-4">
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{hint}</p>
      <button
        onClick={() => onGo(tab)}
        className="mt-3 min-h-11 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
      >
        {cta}
      </button>
    </div>
  )
}
