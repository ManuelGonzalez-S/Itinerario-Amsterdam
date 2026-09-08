import type { TripDay } from '../types'

/**
 * Planes completos generados a partir de la votación real de los cuatro.
 *
 * Reglas que cumplen TODOS los planes:
 *  - Ni una sola idea con un «no» de alguien. Eso descarta Utrecht (no de Pau)
 *    y World Press Photo (no de Manu), además de las 23 ya descartadas.
 *  - Respetan los horarios reales: el mercado Albert Cuyp cierra los domingos,
 *    el festival del NDSM solo es sábado y domingo, el Van Gogh abre hasta las
 *    21:00 solo los viernes y NEMO cierra a las 17:30.
 *  - Museos en jueves y viernes, que son laborables; barrios y calle el fin de
 *    semana, cuando los museos se llenan.
 *
 * Lo que cambia de un plan a otro es la apuesta: solo consenso, museos,
 * escapada fuera, o todo.
 */

export interface PlanSlot {
  time: string
  /** Referencia al catálogo: de ahí salen el precio y las horas. */
  ideaId?: string
  /** Para huecos que no son una idea votada (comidas libres, traslados). */
  label?: string
  note?: string
  /** Cuenta para la regla de «máximo 2 actividades de pago al día». */
  ticket?: boolean
  /** Precio propio, solo cuando no viene de ideaId. */
  price?: number
  /** Horas propias, solo cuando no viene de ideaId. */
  hours?: number
}

export interface PlanDay {
  day: TripDay
  title: string
  slots: PlanSlot[]
}

export interface Plan {
  id: string
  name: string
  tagline: string
  /** Por qué tiene sentido este plan. */
  thesis: string
  /** Qué se sacrifica al elegirlo. Sin esto no hay debate honesto. */
  tradeoff: string
  /** La misma idea en una línea, para el mensaje de WhatsApp. */
  tradeoffShort: string
  days: PlanDay[]
  warning?: string
}

export const DAY_NAMES: Record<TripDay, string> = {
  jue24: 'Jueves 24',
  vie25: 'Viernes 25',
  sab26: 'Sábado 26',
  dom27: 'Domingo 27',
}

/** Llegada y vuelta, iguales en todos los planes. */
const LLEGADA: PlanSlot = {
  time: '11:00',
  ideaId: 'dec-aeropuerto-tren',
  label: 'Tren Schiphol → Centraal',
  note: '17 minutos y unos 6 € por persona. Un taxi son 45-55 € para los cuatro.',
}

export const PLANS: Plan[] = [
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'plan-consenso',
    name: 'El consenso',
    tagline: 'Solo lo que nadie discute',
    thesis:
      'Únicamente los 8 planes con cuatro síes y los 11 que tienen dos o más síes y ningún no. Nadie puede quejarse de nada porque nadie ha dicho no a nada de aquí. Es la línea de salida: si no os ponéis de acuerdo en otra cosa, este plan ya está aprobado.',
    tradeoff:
      'Cero museos salvo Ana Frank. Si alguien se arrepiente luego de no haber visto el Van Gogh, es este plan el que lo deja fuera.',
    tradeoffShort: 'ningún museo salvo Ana Frank.',
    days: [
      {
        day: 'jue24',
        title: 'Llegada y centro a pie',
        slots: [
          LLEGADA,
          {
            time: '12:30',
            ideaId: 'free-tour',
            ticket: true,
            note: 'El primer día es cuando sirve: ordena la ciudad para los otros tres.',
          },
          { time: '15:00', ideaId: 'vleminckx', note: 'Está al lado de Spui, de paso.' },
          { time: '15:30', ideaId: 'van-stapele', note: 'Cierran cuando se acaban las cookies.' },
          { time: '16:00', ideaId: 'bloemenmarkt' },
          { time: '17:00', label: 'Vuelta al hotel y descanso', hours: 1 },
          { time: '19:30', ideaId: 'foodhallen', note: 'Cada uno cena lo que quiera y no se discute.' },
          { time: '21:30', ideaId: 'barrio-rojo', note: 'De noche es cuando tiene sentido verlo.' },
          { time: '22:30', ideaId: 'coffeeshop' },
          { time: '23:30', ideaId: 'rooftop' },
        ],
      },
      {
        day: 'vie25',
        title: 'De Pijp, bici y Ana Frank de noche',
        slots: [
          { time: '09:00', ideaId: 'brunch', note: 'Sin reserva y con cola: llegar antes de las 10.' },
          {
            time: '10:30',
            ideaId: 'albert-cuyp',
            note: 'Mismo barrio que el brunch. Cierra a las 17:00 y los domingos no abre, así que hoy.',
          },
          {
            time: '12:00',
            ideaId: 'bici',
            ticket: true,
            note: 'Medio día de alquiler. Las horas las cuentan el Vondelpark y el Jordaan, que se hacen en bici.',
          },
          { time: '12:30', ideaId: 'vondelpark', note: 'En bici y a dos calles del mercado.' },
          { time: '14:00', label: 'Comida por el barrio', price: 15, hours: 1 },
          { time: '15:30', ideaId: 'jordaan' },
          { time: '18:00', ideaId: 'brown-cafe', note: 'Café Chris y ’t Smalle están en el Jordaan.' },
          { time: '20:30', label: 'Cena por el Jordaan', price: 25, hours: 1.5 },
          {
            time: '21:30',
            ideaId: 'ana-frank',
            ticket: true,
            note: 'Slot de noche: es lo que más probablemente quede libre. Abren hasta las 22:00.',
          },
        ],
      },
      {
        day: 'sab26',
        title: 'Noord: el día del ferry',
        slots: [
          {
            time: '10:00',
            ideaId: 'ndsm',
            note: 'Ferry gratis desde Centraal. El festival Craft in Focus cae justo hoy.',
          },
          { time: '13:30', label: 'Comida en Noord (Pllek o De Ceuvel)', price: 20, hours: 1.5 },
          {
            time: '15:30',
            ideaId: 'adam-lookout',
            ticket: true,
            note: 'Mismo lado del río. Última entrada a las 21:00, vamos sobrados.',
          },
          { time: '17:30', label: 'Ferry de vuelta', hours: 0.5 },
          { time: '18:30', ideaId: 'brouwerij-ij', note: 'Terraza bajo el molino, en Oost.' },
          { time: '21:00', label: 'Cena tranquila', price: 25, hours: 1.5 },
        ],
      },
      {
        day: 'dom27',
        title: 'Canales y vuelta',
        slots: [
          {
            time: '10:00',
            ideaId: 'crucero-canales',
            ticket: true,
            note: 'A primera hora hay menos gente y mejor luz.',
          },
          { time: '11:30', label: 'Dam, Nueve Callecitas y últimas compras', hours: 2 },
          { time: '13:30', label: 'Comida de despedida', price: 25, hours: 1.5 },
          { time: '15:30', label: 'Tren a Schiphol', price: 5.9, hours: 0.5 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'plan-museos',
    name: 'Con museos',
    tagline: 'Rompe el empate de los cuatro «quizás»',
    thesis:
      'El Van Gogh, el Moco y NEMO están los tres con cero síes y cuatro quizás: nadie los quiere lo bastante para pedirlos y nadie los rechaza. Este plan decide por vosotros y los mete, aprovechando que el Van Gogh abre hasta las 21:00 los viernes, que es su mejor momento y el más vacío.',
    tradeoff:
      'Solo cuesta unos 13 € más por persona que el plan del consenso, pero hay que sacrificar el alquiler de bicis y algo de calle. El Rijksmuseum sigue fuera porque salió descartado en la votación.',
    tradeoffShort: 'las bicis, y algo de calle por meter tres museos.',
    days: [
      {
        day: 'jue24',
        title: 'Llegada, centro y Ana Frank',
        slots: [
          LLEGADA,
          { time: '12:30', ideaId: 'free-tour', ticket: true },
          { time: '15:00', ideaId: 'vleminckx' },
          { time: '15:30', ideaId: 'bloemenmarkt' },
          {
            time: '17:00',
            ideaId: 'ana-frank',
            ticket: true,
            note: 'Aquí en vez del viernes, porque el viernes es la noche del Van Gogh.',
          },
          { time: '19:30', ideaId: 'foodhallen' },
          { time: '21:30', ideaId: 'barrio-rojo' },
          { time: '22:30', ideaId: 'rooftop' },
        ],
      },
      {
        day: 'vie25',
        title: 'Museumplein de arriba abajo',
        slots: [
          { time: '09:00', ideaId: 'brunch' },
          { time: '10:30', ideaId: 'albert-cuyp', note: 'Hoy o nunca: los domingos cierra.' },
          { time: '12:00', ideaId: 'moco', ticket: true, note: 'Banksy y Kusama. Se ve en hora y media.' },
          { time: '13:45', label: 'Comida en Museumplein', price: 18, hours: 1.25 },
          { time: '15:00', ideaId: 'vondelpark', note: 'Pegado al museo, a pie.' },
          { time: '16:30', ideaId: 'jordaan' },
          {
            time: '19:00',
            ideaId: 'van-gogh',
            ticket: true,
            note: 'Viernes hasta las 21:00. Es el hueco con menos gente de toda la semana.',
          },
          { time: '21:30', label: 'Cena tardía', price: 25, hours: 1.5 },
        ],
      },
      {
        day: 'sab26',
        title: 'Ciencia por la mañana, Noord por la tarde',
        slots: [
          {
            time: '10:00',
            ideaId: 'nemo',
            ticket: true,
            note: 'Abre de martes a domingo hasta las 17:30. La azotea es gratis.',
          },
          { time: '12:45', label: 'Comida en Oosterdok', price: 20, hours: 1.25 },
          { time: '14:30', ideaId: 'ndsm', note: 'Ferry gratis. El festival es hoy y mañana.' },
          { time: '17:30', ideaId: 'adam-lookout', ticket: true, note: 'Mismo lado del río que el NDSM.' },
          { time: '19:30', ideaId: 'brouwerij-ij' },
          { time: '21:30', ideaId: 'coffeeshop' },
        ],
      },
      {
        day: 'dom27',
        title: 'Canales y vuelta',
        slots: [
          { time: '10:00', ideaId: 'crucero-canales', ticket: true },
          { time: '11:30', ideaId: 'van-stapele' },
          { time: '12:00', label: 'Nueve Callecitas y compras', hours: 1.5 },
          { time: '13:30', label: 'Comida de despedida', price: 25, hours: 1.5 },
          { time: '15:30', label: 'Tren a Schiphol', price: 5.9, hours: 0.5 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'plan-escapada',
    name: 'Con escapada',
    tagline: 'Medio día en Haarlem, sin perder un día entero',
    thesis:
      'Dijisteis 4 no a «dedicar un día entero fuera», pero Haarlem sigue viva con cuatro quizás. Y es que Haarlem no es un día: son 15 minutos de tren y cabe en media jornada. Ámsterdam en pequeño, con canales y sin turistas. El festival del NDSM se mueve al domingo, que también lo tiene.',
    tradeoff:
      'Se cae el crucero por los canales, que tenía dos síes. Y sigue sin haber museos más allá de Ana Frank.',
    tradeoffShort: 'el crucero por los canales, y tampoco hay museos aparte de Ana Frank.',
    days: [
      {
        day: 'jue24',
        title: 'Llegada y centro a pie',
        slots: [
          LLEGADA,
          { time: '12:30', ideaId: 'free-tour', ticket: true },
          { time: '15:00', ideaId: 'vleminckx' },
          { time: '15:30', ideaId: 'van-stapele' },
          { time: '16:00', ideaId: 'bloemenmarkt' },
          { time: '17:30', ideaId: 'brown-cafe' },
          { time: '20:00', ideaId: 'foodhallen' },
          { time: '22:00', ideaId: 'barrio-rojo' },
          { time: '23:00', ideaId: 'rooftop' },
        ],
      },
      {
        day: 'vie25',
        title: 'De Pijp, bici y Ana Frank de noche',
        slots: [
          { time: '09:00', ideaId: 'brunch' },
          { time: '10:30', ideaId: 'albert-cuyp', note: 'Hoy: los domingos cierra.' },
          { time: '12:00', ideaId: 'bici', ticket: true },
          { time: '12:30', ideaId: 'vondelpark' },
          { time: '14:00', label: 'Comida por el barrio', price: 15, hours: 1 },
          { time: '15:30', ideaId: 'jordaan' },
          { time: '19:00', label: 'Cena por el Jordaan', price: 25, hours: 1.5 },
          { time: '21:00', ideaId: 'ana-frank', ticket: true, note: 'Slot de noche.' },
        ],
      },
      {
        day: 'sab26',
        title: 'Haarlem',
        slots: [
          {
            time: '09:30',
            ideaId: 'haarlem',
            ticket: true,
            note: 'Tren directo, 15 minutos. Plaza mayor, canales y el museo Frans Hals si apetece.',
          },
          { time: '15:00', label: 'Vuelta a Ámsterdam', hours: 0.5 },
          { time: '16:30', ideaId: 'brouwerij-ij', note: 'Terraza bajo el molino.' },
          { time: '19:00', label: 'Cena', price: 25, hours: 1.5 },
          { time: '21:00', ideaId: 'coffeeshop' },
        ],
      },
      {
        day: 'dom27',
        title: 'NDSM, mirador y vuelta',
        slots: [
          {
            time: '10:00',
            ideaId: 'ndsm',
            note: 'El festival Craft in Focus también es hoy, su último día.',
          },
          { time: '12:30', ideaId: 'adam-lookout', ticket: true, note: 'De camino al ferry de vuelta.' },
          { time: '14:00', label: 'Comida de despedida en Noord', price: 22, hours: 1.5 },
          { time: '16:00', label: 'Tren a Schiphol', price: 5.9, hours: 0.5 },
        ],
      },
    ],
  },

]


/**
 * Horas realmente disponibles cada día. No son cuatro días iguales: el jueves
 * se llega a las 11:00 y el domingo hay que estar en el aeropuerto por la
 * tarde. Sirve para avisar cuando un plan no cabe de verdad, en vez de
 * comparar contra un "40 h" inventado.
 */
export const DAY_HOURS: Record<TripDay, number> = {
  jue24: 13,
  vie25: 14,
  sab26: 14,
  dom27: 7,
}

export const TOTAL_HOURS = Object.values(DAY_HOURS).reduce((a, b) => a + b, 0)
