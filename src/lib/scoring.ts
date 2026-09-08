import type { Idea, Tally, TripDay, Vote, VoteDoc } from '../types'
import { IDEAS, IDEAS_BY_ID } from '../data/ideas'
import { PLANS, DAY_HOURS, TOTAL_HOURS } from '../data/plans'
import type { Plan, PlanSlot } from '../data/plans'

/** Puntos que reparte cada persona en la fase 2. */
export const POINTS_BUDGET = 100

/** Incremento de los botones de la fase 2. */
export const POINTS_STEP = 5

/** Cuántos somos. Se usa para decidir qué es unanimidad. */
export const GROUP_SIZE = 4

const VOTE_WEIGHT: Record<Vote, number> = { yes: 2, maybe: 1, no: -1 }

export function tallyIdea(idea: Idea, docs: VoteDoc[]): Tally {
  let yes = 0
  let maybe = 0
  let no = 0
  let points = 0
  const vetoedBy: string[] = []

  for (const d of docs) {
    const v = d.triage?.[idea.id]
    if (v === 'yes') yes++
    else if (v === 'maybe') maybe++
    else if (v === 'no') {
      no++
      vetoedBy.push(d.name)
    }
    points += d.points?.[idea.id] ?? 0
  }

  const votes = yes + maybe + no
  const triageScore = yes * VOTE_WEIGHT.yes + maybe * VOTE_WEIGHT.maybe + no * VOTE_WEIGHT.no

  let status: Tally['status']
  if (votes === 0) status = 'sin-votos'
  else if (no > yes && no >= Math.ceil(votes / 2)) status = 'descartado'
  else if (yes === votes && votes >= 3) status = 'fijo'
  else if (yes >= 2 && no === 0) status = 'probable'
  else status = 'dudoso'

  // El triaje manda sobre los puntos: 500 > el máximo de puntos posible (4 x 100).
  const score = triageScore * 500 + points

  return { idea, yes, maybe, no, votes, points, triageScore, score, status, vetoedBy }
}

export function tallyAll(docs: VoteDoc[]): Tally[] {
  return IDEAS.map((idea) => tallyIdea(idea, docs)).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.idea.title.localeCompare(b.idea.title, 'es')
  })
}

export const STATUS_META: Record<Tally['status'], { label: string; classes: string }> = {
  fijo: { label: 'Fijo', classes: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  probable: { label: 'Muy probable', classes: 'bg-sky-500/15 text-sky-300 ring-sky-500/30' },
  dudoso: { label: 'En el aire', classes: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  descartado: { label: 'Descartado', classes: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
  'sin-votos': { label: 'Sin votos', classes: 'bg-slate-500/15 text-slate-400 ring-slate-500/30' },
}

/**
 * Estimación de gasto por persona con lo que va ganando la votación.
 * Solo cuenta lo que está "fijo" o "muy probable" y excluye las decisiones
 * de grupo, que no son actividades con precio propio.
 */
export function estimateBudget(tallies: Tally[]): { perPerson: number; group: number; items: number } {
  const winners = tallies.filter(
    (t) => !t.idea.decision && (t.status === 'fijo' || t.status === 'probable') && t.idea.price,
  )
  const perPerson = winners.reduce((sum, t) => sum + (t.idea.price ?? 0), 0)
  return { perPerson, group: perPerson * GROUP_SIZE, items: winners.length }
}

/** Horas totales de lo que va ganando, para ver si cabe en 4 días. */
export function estimateHours(tallies: Tally[]): number {
  return tallies
    .filter((t) => !t.idea.decision && (t.status === 'fijo' || t.status === 'probable'))
    .reduce((sum, t) => sum + (t.idea.hours ?? 0), 0)
}

export function formatEuro(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
}

// ─────────────────────── Planes completos ───────────────────────

/**
 * Cuenta solo los votos de ideas del catálogo. Los votos de planes viven en el
 * mismo mapa `triage` (para no tener que cambiar las reglas de Firestore), así
 * que hay que filtrarlos o el progreso pasaría de 64.
 */
export function countIdeaVotes(triage: Record<string, Vote> | undefined): number {
  if (!triage) return 0
  return Object.keys(triage).filter((k) => IDEAS_BY_ID.has(k)).length
}

export interface PlanSummary {
  plan: Plan
  /** Euros por persona en total: actividades votadas + comidas y traslados. */
  cost: number
  /** Solo lo que sale del catálogo votado (entradas, mercados, bares...). */
  votedCost: number
  /** Comidas libres y traslados, que no se votaron pero hay que pagar. */
  extraCost: number
  /** Horas ocupadas en total. */
  hours: number
  /** Horas realmente disponibles en los cuatro días. */
  availableHours: number
  /** Días concretos que se pasan de su propia ventana horaria. */
  overDays: { day: TripDay; hours: number; budget: number }[]
  /** El día más cargado de entradas, para comparar con la regla de 2 al día. */
  maxTickets: number
  /** Cuántas ideas del catálogo mete el plan. */
  ideaCount: number
  yes: number
  maybe: number
  no: number
  score: number
  vetoedBy: string[]
  supportedBy: string[]
}

// Lo que el slot declara manda sobre el catalogo. Sirve para casos como el
// alquiler de bicis: son 4 h de alquiler, pero esas horas ya las ocupan el
// Vondelpark y el Jordaan, asi que en la agenda solo cuenta ir a recogerlas.
function slotPrice(s: PlanSlot): number {
  return s.price ?? (s.ideaId ? IDEAS_BY_ID.get(s.ideaId)?.price ?? 0 : 0)
}

function slotHours(s: PlanSlot): number {
  if (s.hours !== undefined) return s.hours
  const idea = s.ideaId ? IDEAS_BY_ID.get(s.ideaId) : undefined
  return idea?.scheduleHours ?? idea?.hours ?? 0
}

export function summarizePlan(plan: Plan, docs: VoteDoc[]): PlanSummary {
  let votedCost = 0
  let extraCost = 0
  let hours = 0
  let maxTickets = 0
  const ideas = new Set<string>()
  const overDays: { day: TripDay; hours: number; budget: number }[] = []

  for (const day of plan.days) {
    let tickets = 0
    let dayHours = 0
    for (const s of day.slots) {
      if (s.ideaId && IDEAS_BY_ID.has(s.ideaId)) {
        votedCost += slotPrice(s)
        ideas.add(s.ideaId)
      } else {
        extraCost += slotPrice(s)
      }
      dayHours += slotHours(s)
      if (s.ticket) tickets++
    }
    hours += dayHours
    maxTickets = Math.max(maxTickets, tickets)
    const budget = DAY_HOURS[day.day]
    if (dayHours > budget) overDays.push({ day: day.day, hours: Math.round(dayHours * 10) / 10, budget })
  }

  let yes = 0
  let maybe = 0
  let no = 0
  const vetoedBy: string[] = []
  const supportedBy: string[] = []
  for (const d of docs) {
    const v = d.triage?.[plan.id]
    if (v === 'yes') {
      yes++
      supportedBy.push(d.name)
    } else if (v === 'maybe') maybe++
    else if (v === 'no') {
      no++
      vetoedBy.push(d.name)
    }
  }

  return {
    plan,
    cost: Math.round((votedCost + extraCost) * 100) / 100,
    votedCost: Math.round(votedCost * 100) / 100,
    extraCost: Math.round(extraCost * 100) / 100,
    hours: Math.round(hours * 10) / 10,
    availableHours: TOTAL_HOURS,
    overDays,
    maxTickets,
    ideaCount: ideas.size,
    yes,
    maybe,
    no,
    score: yes * 2 + maybe - no,
    vetoedBy,
    supportedBy,
  }
}

export function summarizeAllPlans(docs: VoteDoc[]): PlanSummary[] {
  return PLANS.map((p) => summarizePlan(p, docs)).sort((a, b) => b.score - a.score)
}
