import type { Idea, Tally, Vote, VoteDoc } from '../types'
import { IDEAS } from '../data/ideas'

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
