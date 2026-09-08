import type { Idea, Tally, TripDay, VoteDoc } from '../types'
import { IDEAS, IDEAS_BY_ID } from '../data/ideas'
import { DAY_HOURS, PLANS } from '../data/plans'

export const TRIP_DAYS: TripDay[] = ['jue24', 'vie25', 'sab26', 'dom27']

/**
 * Horas que se dejan libres cada día a propósito. El grupo pidió no ir
 * ajustado de horario, así que el objetivo no es llenar el día entero: es
 * llenarlo hasta aquí y dejar hueco para perderse, alargar una terraza o que
 * algo salga mal.
 */
export const SLACK_HOURS = 2

/** Tope cómodo: lo que cabe sin ir con prisa. */
export function comfortHours(day: TripDay): number {
  return Math.max(1, DAY_HOURS[day] - SLACK_HOURS)
}

/** Tope real: más de esto ya no cabe en el día, con prisa o sin ella. */
export function hardHours(day: TripDay): number {
  return DAY_HOURS[day]
}

export type Pace = 'vacio' | 'tranquilo' | 'justo' | 'imposible'

export const PACE_META: Record<Pace, { label: string; bar: string; text: string }> = {
  vacio: { label: 'Sin nada', bar: 'bg-slate-600', text: 'text-slate-500' },
  tranquilo: { label: 'Ritmo tranquilo', bar: 'bg-emerald-500', text: 'text-emerald-300' },
  justo: { label: 'Vas justo', bar: 'bg-amber-400', text: 'text-amber-300' },
  imposible: { label: 'No cabe', bar: 'bg-rose-500', text: 'text-rose-300' },
}

export interface DayLoad {
  day: TripDay
  ideas: Idea[]
  hours: number
  cost: number
  comfort: number
  hard: number
  pace: Pace
}

export function dayLoad(day: TripDay, itinerary: Record<string, TripDay>): DayLoad {
  const ideas = Object.entries(itinerary)
    .filter(([, d]) => d === day)
    .map(([id]) => IDEAS_BY_ID.get(id))
    .filter((i): i is Idea => !!i && !i.decision)

  const hours = ideas.reduce((a, i) => a + (i.scheduleHours ?? i.hours ?? 0), 0)
  const cost = ideas.reduce((a, i) => a + (i.price ?? 0), 0)
  const comfort = comfortHours(day)
  const hard = hardHours(day)

  let pace: Pace
  if (ideas.length === 0) pace = 'vacio'
  else if (hours > hard) pace = 'imposible'
  else if (hours > comfort) pace = 'justo'
  else pace = 'tranquilo'

  return {
    day,
    ideas,
    hours: Math.round(hours * 10) / 10,
    cost: Math.round(cost * 100) / 100,
    comfort,
    hard,
    pace,
  }
}

export interface RouteSummary {
  days: DayLoad[]
  totalHours: number
  totalCost: number
  placed: number
  /** Días que se pasan del tope cómodo. */
  tightDays: DayLoad[]
  /** Días que no caben ni forzando. */
  impossibleDays: DayLoad[]
}

export function summarizeRoute(itinerary: Record<string, TripDay>): RouteSummary {
  const days = TRIP_DAYS.map((d) => dayLoad(d, itinerary))
  return {
    days,
    totalHours: Math.round(days.reduce((a, d) => a + d.hours, 0) * 10) / 10,
    totalCost: Math.round(days.reduce((a, d) => a + d.cost, 0) * 100) / 100,
    placed: days.reduce((a, d) => a + d.ideas.length, 0),
    tightDays: days.filter((d) => d.pace === 'justo'),
    impossibleDays: days.filter((d) => d.pace === 'imposible'),
  }
}

/**
 * Lo que la ruta se deja fuera, ordenado por cuánto lo quiere el grupo.
 * Es la otra mitad del problema: no basta con no ir apretado, también hay que
 * ver qué te estás perdiendo por dejar hueco.
 */
export function missingFromRoute(
  itinerary: Record<string, TripDay>,
  tallies: Tally[],
): Tally[] {
  return tallies
    .filter(
      (t) =>
        !t.idea.decision &&
        !itinerary[t.idea.id] &&
        t.no === 0 &&
        (t.yes > 0 || t.maybe > 0),
    )
    .sort((a, b) => b.triageScore - a.triageScore || b.points - a.points)
}

/** El repertorio que se puede colocar: todo lo que nadie ha vetado. */
export function availableIdeas(tallies: Tally[]): Idea[] {
  const byId = new Map(tallies.map((t) => [t.idea.id, t]))
  return IDEAS.filter((i) => !i.decision && (byId.get(i.id)?.no ?? 0) === 0)
}

/** Ideas con algún «no», por si alguien quiere meterlas igual a sabiendas. */
export function vetoedIdeas(tallies: Tally[]): Tally[] {
  return tallies.filter((t) => !t.idea.decision && t.no > 0)
}

/** Convierte uno de los planes propuestos en un punto de partida editable. */
export function itineraryFromPlan(planId: string): Record<string, TripDay> {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) return {}
  const out: Record<string, TripDay> = {}
  for (const day of plan.days) {
    for (const slot of day.slots) {
      const idea = slot.ideaId ? IDEAS_BY_ID.get(slot.ideaId) : undefined
      if (idea && !idea.decision) out[idea.id] = day.day
    }
  }
  return out
}

export interface RouteAgreement {
  idea: Idea
  /** Quiénes la han metido en su ruta. */
  people: string[]
  /** Si además coinciden en el día. null = no hay acuerdo de día. */
  sameDay: TripDay | null
}

/**
 * Dónde coinciden las rutas de todos. Esto es lo que de verdad cierra el
 * debate: lo que aparece en las cuatro rutas ya no hay que discutirlo.
 */
export function compareRoutes(docs: VoteDoc[]): {
  withRoute: VoteDoc[]
  agreement: RouteAgreement[]
} {
  const withRoute = docs.filter((d) => Object.keys(d.itinerary ?? {}).length > 0)

  const map = new Map<string, { people: string[]; days: TripDay[] }>()
  for (const d of withRoute) {
    for (const [id, day] of Object.entries(d.itinerary ?? {})) {
      const entry = map.get(id) ?? { people: [], days: [] }
      entry.people.push(d.name)
      entry.days.push(day)
      map.set(id, entry)
    }
  }

  const agreement: RouteAgreement[] = []
  for (const [id, { people, days }] of map) {
    const idea = IDEAS_BY_ID.get(id)
    if (!idea) continue
    const allSame = days.every((d) => d === days[0])
    agreement.push({ idea, people, sameDay: allSame ? days[0] : null })
  }

  return {
    withRoute,
    agreement: agreement.sort(
      (a, b) => b.people.length - a.people.length || a.idea.title.localeCompare(b.idea.title, 'es'),
    ),
  }
}
