import type { Idea, TripDay } from '../types'
import { IDEAS_BY_ID } from '../data/ideas'
import { DAY_HOURS, DAY_NAMES, PLANS, type Plan, type PlanSlot } from '../data/plans'

export const LETRAS = ['A', 'B', 'C']

/** Cuántos somos. */
export const GROUP_SIZE = 4

export function formatEuro(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export function slotIdea(s: PlanSlot): Idea | undefined {
  return s.ideaId ? IDEAS_BY_ID.get(s.ideaId) : undefined
}

export function slotPrice(s: PlanSlot): number {
  if (s.price !== undefined) return s.price
  return slotIdea(s)?.price ?? 0
}

function slotHours(s: PlanSlot): number {
  if (s.hours !== undefined) return s.hours
  const idea = slotIdea(s)
  return idea?.scheduleHours ?? idea?.hours ?? 0
}

export interface DaySummary {
  day: TripDay
  title: string
  slots: PlanSlot[]
  cost: number
  hours: number
  /** Horas disponibles de verdad ese día: el jueves se llega, el domingo hay vuelo. */
  available: number
}

export interface PlanSummary {
  plan: Plan
  letra: string
  days: DaySummary[]
  /** Euros por persona: entradas, comidas y transporte. Sin vuelos ni hotel. */
  cost: number
  hours: number
}

export function summarize(plan: Plan, index: number): PlanSummary {
  const days = plan.days.map((d) => ({
    day: d.day,
    title: d.title,
    slots: d.slots,
    cost: d.slots.reduce((a, s) => a + slotPrice(s), 0),
    hours: Math.round(d.slots.reduce((a, s) => a + slotHours(s), 0) * 10) / 10,
    available: DAY_HOURS[d.day],
  }))

  return {
    plan,
    letra: LETRAS[index] ?? String(index + 1),
    days,
    cost: Math.round(days.reduce((a, d) => a + d.cost, 0)),
    hours: Math.round(days.reduce((a, d) => a + d.hours, 0) * 10) / 10,
  }
}

export const PLAN_SUMMARIES: PlanSummary[] = PLANS.map(summarize)

export function daysUntilTrip(): number {
  const start = new Date('2026-09-24T00:00:00+02:00')
  return Math.ceil((start.getTime() - Date.now()) / 86_400_000)
}

/* ───────────────────────── Texto para WhatsApp ───────────────────────── */

/** Nombres cortos: en un móvil, "Copa en una azotea (SkyLounge, Canvas)" sobra. */
const CORTO: Record<string, string> = {
  'free-tour': 'free tour del centro',
  vleminckx: 'patatas de Vleminckx',
  'van-stapele': 'la cookie de Van Stapele',
  bloemenmarkt: 'mercado de flores',
  foodhallen: 'cena en Foodhallen',
  'barrio-rojo': 'Barrio Rojo de noche',
  coffeeshop: 'coffeeshop',
  rooftop: 'copa en azotea',
  brunch: 'brunch',
  'albert-cuyp': 'mercado Albert Cuyp',
  bici: 'bicis',
  vondelpark: 'Vondelpark',
  jordaan: 'Jordaan y las 9 Callecitas',
  'brown-cafe': 'brown cafés',
  'ana-frank': 'ANA FRANK',
  ndsm: 'NDSM + festival (ferry gratis)',
  'adam-lookout': "A'DAM Lookout y el columpio",
  'brouwerij-ij': "cerveza en el molino 't IJ",
  'crucero-canales': 'crucero por los canales',
  moco: 'MOCO (Banksy)',
  'van-gogh': 'VAN GOGH (abre hasta las 21h)',
  nemo: 'NEMO',
  haarlem: 'HAARLEM (medio día)',
}

const DIA_CORTO: Record<TripDay, string> = {
  jue24: 'Jue 24',
  vie25: 'Vie 25',
  sab26: 'Sáb 26',
  dom27: 'Dom 27',
}

export function shortLabel(idea: Idea): string {
  return CORTO[idea.id] ?? idea.title
}

/**
 * El mismo mensaje que muestra la página, en formato WhatsApp: negrita con
 * asteriscos y sin markdown. Se genera de los mismos datos para que no puedan
 * desviarse el uno del otro.
 */
export function whatsappText(): string {
  const dias = daysUntilTrip()

  const cabecera = [
    '*ÁMSTERDAM 24-27 SEPT · tres planes, elegid uno* 🚲',
    '',
    'Con lo que votamos los cuatro he montado tres itinerarios completos. Ninguno mete nada que alguien haya dicho que no. Los precios son por persona sin vuelos ni hotel, e incluyen entradas, comidas y transporte.',
  ].join('\n')

  const bloques = PLAN_SUMMARIES.map((s) => {
    const L = [
      `*PLAN ${s.letra} · ${s.plan.name}*`,
      `${s.plan.tagline} — ${s.cost} €/persona`,
      '',
    ]
    for (const d of s.days) {
      const cosas = d.slots
        .map(slotIdea)
        .filter((i): i is Idea => !!i && !i.decision)
        .map(shortLabel)
      L.push(`*${DIA_CORTO[d.day]}:* ${cosas.join(' · ')}`)
    }
    L.push('')
    L.push(`Se queda fuera: ${s.plan.tradeoffShort}`)
    return L.join('\n')
  })

  const cierre = [
    '*¿A, B o C?* Si os vale uno pero cambiaríais algo, decidlo y lo ajusto.',
    '',
    `⚠️ *Y esto no puede esperar:* Ana Frank está en los tres planes y quedan ${dias} días. Solo se vende en annefrank.org, no hay taquilla ni lista de espera, y las de nuestras fechas salieron el 11 de agosto. Miro hoy y compro lo que quede, aunque sea de noche.`,
    '',
    'El Van Gogh (plan B) también se agota con más de una semana de antelación, así que si vamos a por el B lo digo ya.',
  ].join('\n')

  return [cabecera, ...bloques, cierre].join('\n\n———————————\n\n')
}

export { DAY_NAMES, DIA_CORTO }
