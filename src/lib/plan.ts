import type { Idea, TripDay } from '../types'
import { IDEAS_BY_ID } from '../data/ideas'
import { DAY_HOURS, DAY_NAMES, PLANS, type Plan, type PlanSlot } from '../data/plans'

/**
 * El plan que se va a hacer. Cambiar esta línea es lo único que hace falta
 * para irse al de museos ('plan-museos') o al de Haarlem ('plan-escapada'):
 * el itinerario, el mapa y el mensaje de WhatsApp se regeneran solos.
 */
export const PLAN_ELEGIDO = 'plan-consenso'

/** Un color por día. Es lo que ata el marcador del mapa con su hora. */
export const DAY_COLOR: Record<TripDay, { hex: string; bg: string; text: string }> = {
  jue24: { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-300' },
  vie25: { hex: '#38bdf8', bg: 'bg-sky-400', text: 'text-sky-300' },
  sab26: { hex: '#a78bfa', bg: 'bg-violet-400', text: 'text-violet-300' },
  dom27: { hex: '#34d399', bg: 'bg-emerald-400', text: 'text-emerald-300' },
}

export const DAY_SHORT: Record<TripDay, string> = {
  jue24: 'Jue 24',
  vie25: 'Vie 25',
  sab26: 'Sáb 26',
  dom27: 'Dom 27',
}

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

export function slotTitle(s: PlanSlot): string {
  return s.label ?? slotIdea(s)?.title ?? '—'
}

/**
 * Enlaces de "cómo llegar". Sin parámetro de origen, Google Maps usa la
 * posición de quien abre el enlace, así que sale la ruta desde donde estés.
 * El marcador del mapa orienta; esto es lo que te lleva.
 */
export function comoLlegar(
  s: PlanSlot,
  modo: 'walking' | 'transit',
): string | null {
  const idea = slotIdea(s)
  if (!idea?.address) return null
  const destino = idea.coords
    ? `${idea.coords[0]},${idea.coords[1]}`
    : `${idea.title}, ${idea.address}, Amsterdam`
  return (
    'https://www.google.com/maps/dir/?api=1' +
    `&destination=${encodeURIComponent(destino)}` +
    `&travelmode=${modo}`
  )
}

/** Una parada del itinerario: un hueco con hora y, si la tiene, su posición. */
export interface Parada {
  key: string
  day: TripDay
  /** Número dentro del día, el mismo que lleva el marcador del mapa. */
  n: number
  time: string
  title: string
  note?: string
  price: number
  ticket: boolean
  idea?: Idea
  coords?: [number, number]
  approx: boolean
  /** Ruta andando desde donde esté el usuario. */
  andando: string | null
  /** Ruta en transporte público: en Ámsterdam hay tranvías y ferris de por medio. */
  transporte: string | null
}

export interface DiaItinerario {
  day: TripDay
  title: string
  paradas: Parada[]
  cost: number
  hours: number
  available: number
}

function construir(plan: Plan): DiaItinerario[] {
  return plan.days.map((d) => {
    let n = 0
    const paradas = d.slots.map((s, i): Parada => {
      const idea = slotIdea(s)
      // Solo se numera lo que va al mapa, para que el número del marcador y el
      // de la lista sean siempre el mismo.
      const coords = idea?.coords
      if (coords) n++
      return {
        key: `${d.day}-${i}`,
        day: d.day,
        n: coords ? n : 0,
        time: s.time,
        title: slotTitle(s),
        note: s.note,
        price: slotPrice(s),
        ticket: !!s.ticket,
        idea,
        coords,
        approx: !!idea?.coordsApprox,
        andando: comoLlegar(s, 'walking'),
        transporte: comoLlegar(s, 'transit'),
      }
    })

    return {
      day: d.day,
      title: d.title,
      paradas,
      cost: Math.round(d.slots.reduce((a, s) => a + slotPrice(s), 0)),
      hours: Math.round(d.slots.reduce((a, s) => a + slotHours(s), 0) * 10) / 10,
      available: DAY_HOURS[d.day],
    }
  })
}

const elegido = PLANS.find((p) => p.id === PLAN_ELEGIDO)
if (!elegido) throw new Error(`El plan elegido (${PLAN_ELEGIDO}) no existe en PLANS`)

export const PLAN = elegido
export const ITINERARIO: DiaItinerario[] = construir(elegido)
export const COSTE_TOTAL = ITINERARIO.reduce((a, d) => a + d.cost, 0)

export function daysUntilTrip(): number {
  const start = new Date('2026-09-24T00:00:00+02:00')
  return Math.ceil((start.getTime() - Date.now()) / 86_400_000)
}

/** Qué día del viaje es hoy, si es que ya estamos allí. */
export function diaDeHoy(): TripDay | null {
  const hoy = new Date()
  if (hoy.getFullYear() !== 2026 || hoy.getMonth() !== 8) return null
  const d = hoy.getDate()
  if (d === 24) return 'jue24'
  if (d === 25) return 'vie25'
  if (d === 26) return 'sab26'
  if (d === 27) return 'dom27'
  return null
}

/* ───────────────────────── Texto para WhatsApp ───────────────────────── */

/** Nombres cortos: en un móvil los títulos largos del catálogo sobran. */
const CORTO: Record<string, string> = {
  'dec-aeropuerto-tren': 'tren Schiphol → Centraal',
  'free-tour': 'free tour del centro',
  vleminckx: 'patatas de Vleminckx',
  'van-stapele': 'la cookie de Van Stapele',
  bloemenmarkt: 'mercado de flores',
  foodhallen: 'cena en Foodhallen',
  'barrio-rojo': 'Barrio Rojo de noche',
  coffeeshop: 'coffeeshop',
  brunch: 'brunch',
  'albert-cuyp': 'mercado Albert Cuyp',
  bici: 'alquilar bicis',
  vondelpark: 'Vondelpark',
  jordaan: 'Jordaan y las 9 Callecitas',
  'brown-cafe': 'brown cafés',
  ndsm: 'NDSM + festival (ferry gratis)',
  'adam-lookout': "A'DAM Lookout y el columpio",
  'brouwerij-ij': "cerveza en el molino 't IJ",
  'crucero-canales': 'crucero por los canales',
  'van-gogh': 'VAN GOGH (reservado)',
  pantopia: 'desayuno en Pantopia',
  'saint-jean': 'café en Saint-Jean',
  'van-dobben': 'croquetas de Van Dobben',
  'de-tros': 'cena en De Tros',
  'booth-club': 'fotomatón del Booth Club',
  millesime: 'vintage en Millesime',
  moco: 'MOCO (Banksy)',
  nemo: 'NEMO',
  haarlem: 'HAARLEM (medio día)',
  'cafe-coos': 'Café COOS',
}

/**
 * El itinerario en formato WhatsApp: negrita con asteriscos y sin markdown.
 * Sale de los mismos datos que la página, para que no puedan desviarse.
 */
export function whatsappText(url = 'https://itinerario-amsterdam.vercel.app'): string {
  const L: string[] = [
    '*ÁMSTERDAM · nuestro itinerario* 🚲',
    '_24 al 27 de septiembre_',
    '',
    `Plan cerrado: *${PLAN.name}*. Unos ${COSTE_TOTAL} € por persona sin vuelos ni hotel, con entradas, comidas y transporte.`,
    '',
    '✅ Van Gogh reservado: *viernes 25 a las 11:15*',
    '',
  ]

  for (const d of ITINERARIO) {
    L.push(`*${DAY_NAMES[d.day].toUpperCase()} · ${d.title}*`)
    for (const p of d.paradas) {
      const nombre = p.idea ? (CORTO[p.idea.id] ?? p.idea.title) : p.title
      L.push(`${p.time}  ${nombre}`)
    }
    L.push('')
  }

  L.push(`Mapa con todos los sitios y sus direcciones: ${url}`)
  return L.join('\n')
}

export { DAY_NAMES }
