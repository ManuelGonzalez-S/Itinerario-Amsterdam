import type { TripDay } from '../types'

/**
 * Los tres itinerarios, actualizados el 22 de septiembre con los hechos
 * cerrados y las aportaciones del grupo.
 *
 * Hechos que ya no se discuten:
 *  - MUSEO VAN GOGH reservado el viernes 25 a las 11:15. Es el único punto
 *    fijo del viaje y los tres planes se construyen alrededor de él.
 *  - CASA DE ANA FRANK fuera: no quedan entradas para nuestras fechas.
 *  - La copa en la azotea del jueves se cae por decisión del grupo.
 *
 * Reglas que siguen cumpliendo todos los planes:
 *  - Ni una sola idea con un «no» de alguien.
 *  - Respetan los horarios reales: el mercado Albert Cuyp cierra los domingos
 *    y a las 17:00, el festival del NDSM solo es sábado y domingo, y NEMO
 *    cierra a las 17:30.
 */

export interface PlanSlot {
  time: string
  /** Referencia al catálogo: de ahí salen el precio y las horas. */
  ideaId?: string
  /** Para huecos que no son una idea del catálogo (comidas libres, traslados). */
  label?: string
  note?: string
  /** Cuenta para la regla de «máximo 2 actividades de pago al día». */
  ticket?: boolean
  /** Precio propio, solo cuando no viene de ideaId. */
  price?: number
  /** Horas propias, cuando el hueco real es menor que la duración del catálogo. */
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

/**
 * Horas realmente disponibles cada día. No son cuatro días iguales: el jueves
 * se llega a las 11:00 y el domingo hay que estar en el aeropuerto por la
 * tarde.
 */
export const DAY_HOURS: Record<TripDay, number> = {
  jue24: 13,
  vie25: 14,
  sab26: 14,
  dom27: 7,
}

export const TOTAL_HOURS = Object.values(DAY_HOURS).reduce((a, b) => a + b, 0)

/** Llegada, igual en todos los planes. */
const LLEGADA: PlanSlot = {
  time: '11:00',
  ideaId: 'dec-aeropuerto-tren',
  label: 'Tren Schiphol → Centraal',
  note: '17 minutos y unos 6 € por persona. Un taxi son 45-55 € para los cuatro.',
}

/** El punto fijo del viaje: la entrada ya está comprada. */
const VAN_GOGH: PlanSlot = {
  time: '11:15',
  ideaId: 'van-gogh',
  ticket: true,
  note: 'RESERVADO. Entrada con hora comprada para el viernes 25 a las 11:15.',
}

/** Desayuno pegado al museo, para llegar sin prisa a las 11:15. */
const DESAYUNO_VIERNES: PlanSlot = {
  time: '09:15',
  ideaId: 'pantopia',
  note: 'Kerkstraat 163, en la zona de canales. Son unos 12 minutos andando hasta el museo, así que salid con tiempo.',
}

/** La tarde del jueves por el centro, igual en los tres planes. */
const TARDE_JUEVES: PlanSlot[] = [
  { time: '15:00', ideaId: 'vleminckx', note: 'Al lado de la plaza Spui.' },
  {
    time: '15:20',
    ideaId: 'booth-club',
    note: 'Raamsteeg 2, a treinta segundos de las patatas. Cuatro fotos por 6 €.',
  },
  { time: '15:50', ideaId: 'van-stapele', note: 'Cierran cuando se acaban las cookies.' },
  { time: '16:20', ideaId: 'bloemenmarkt' },
  {
    time: '17:00',
    ideaId: 'van-dobben',
    note: 'Croqueta de media tarde en la barra, a dos calles del mercado de flores.',
  },
]

export const PLANS: Plan[] = [
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'plan-consenso',
    name: 'El consenso',
    tagline: 'Calle, bici y canales',
    thesis:
      'Solo lo que votamos que sí los cuatro, más el Van Gogh, que ya está pagado. Ningún otro museo y ninguna cola: mercados, barrios, bici y el crucero. Es el plan que nadie puede discutir porque nadie dijo que no a nada de aquí.',
    tradeoff:
      'Aparte del Van Gogh, ningún museo. Si alguien tenía ganas del Moco o de NEMO, es este plan el que los deja fuera.',
    tradeoffShort: 'ningún museo más allá del Van Gogh, que ya está pagado.',
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
          ...TARDE_JUEVES,
          { time: '18:00', label: 'Vuelta al hotel y descanso', hours: 1 },
          {
            time: '19:30',
            ideaId: 'foodhallen',
            note: 'En Oud-West, unos 15 minutos en tranvía. Cada uno cena lo que quiera.',
          },
          { time: '21:30', ideaId: 'barrio-rojo', note: 'De noche es cuando tiene sentido verlo.' },
          { time: '22:30', ideaId: 'coffeeshop' },
        ],
      },
      {
        day: 'vie25',
        title: 'Van Gogh, De Pijp y Jordaan',
        slots: [
          DESAYUNO_VIERNES,
          { time: '10:15', ideaId: 'vondelpark', hours: 1, note: 'Pegado al museo, para hacer tiempo.' },
          VAN_GOGH,
          { time: '14:00', label: 'Comida por De Pijp', price: 15, hours: 1 },
          {
            time: '15:15',
            ideaId: 'albert-cuyp',
            note: 'Cierra a las 17:00 y los domingos no abre, así que hoy o nunca.',
          },
          { time: '17:00', ideaId: 'bici', ticket: true, note: 'Medio día de alquiler.' },
          { time: '17:30', ideaId: 'jordaan', hours: 2 },
          { time: '19:30', ideaId: 'brown-cafe', hours: 2, note: 'Café Chris y ’t Smalle, en el Jordaan.' },
          { time: '21:30', label: 'Cena por el Jordaan', price: 25, hours: 1.5 },
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
            note: 'Mismo lado del río. Última entrada a las 21:00.',
          },
          { time: '17:30', label: 'Ferry de vuelta', hours: 0.5 },
          { time: '18:30', ideaId: 'brouwerij-ij', note: 'Terraza bajo el molino, en Oost.' },
          { time: '20:30', ideaId: 'de-tros', note: 'A diez minutos del molino, también en Oost.' },
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
          { time: '11:30', ideaId: 'saint-jean', note: 'Café y bollo en el Jordaan al bajar del barco.' },
          { time: '12:30', label: 'Nueve Callecitas y últimas compras', hours: 1.5 },
          { time: '14:00', label: 'Comida de despedida', price: 25, hours: 1.5 },
          { time: '16:00', label: 'Tren a Schiphol', price: 5.9, hours: 0.5 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'plan-museos',
    name: 'Con museos',
    tagline: 'Añade el Moco y NEMO al Van Gogh',
    thesis:
      'El Moco y NEMO se quedaron con cero síes y cuatro quizás: nadie los pedía y nadie los rechazaba. Ya que el viernes estamos en Museumplein por el Van Gogh, el Moco cae al lado; NEMO se hace el sábado por la mañana y la azotea es gratis. También entra el vintage de Millesime, que está en la calle de bajada.',
    tradeoff:
      'Cuesta unos 30 € más por persona y se cae el alquiler de bicis. El sábado queda cargado: museo por la mañana y Noord por la tarde.',
    tradeoffShort: 'las bicis, y un sábado bastante más cargado.',
    days: [
      {
        day: 'jue24',
        title: 'Llegada y centro a pie',
        slots: [
          LLEGADA,
          { time: '12:30', ideaId: 'free-tour', ticket: true },
          ...TARDE_JUEVES,
          { time: '18:00', label: 'Vuelta al hotel y descanso', hours: 1 },
          { time: '19:30', ideaId: 'foodhallen' },
          { time: '21:30', ideaId: 'barrio-rojo' },
          { time: '22:30', ideaId: 'coffeeshop' },
        ],
      },
      {
        day: 'vie25',
        title: 'Museumplein entero y vintage',
        slots: [
          DESAYUNO_VIERNES,
          { time: '10:15', ideaId: 'vondelpark', hours: 1, note: 'Pegado al museo, para hacer tiempo.' },
          VAN_GOGH,
          { time: '14:00', label: 'Comida en Museumplein', price: 18, hours: 1 },
          { time: '15:15', ideaId: 'moco', ticket: true, note: 'En la misma plaza. Se ve en hora y media.' },
          {
            time: '16:50',
            ideaId: 'albert-cuyp',
            hours: 0.75,
            note: 'Cierra a las 17:00: solo da para una vuelta rápida y picar algo.',
          },
          {
            time: '17:45',
            ideaId: 'millesime',
            note: 'Leidsestraat 64-66, en la calle que baja del centro. Tres plantas.',
          },
          { time: '19:30', label: 'Cena por el centro', price: 25, hours: 1.5 },
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
          { time: '17:30', ideaId: 'adam-lookout', ticket: true, note: 'Mismo lado del río.' },
          { time: '19:30', ideaId: 'brouwerij-ij' },
          { time: '21:00', ideaId: 'de-tros', note: 'A diez minutos del molino.' },
        ],
      },
      {
        day: 'dom27',
        title: 'Canales y vuelta',
        slots: [
          { time: '10:00', ideaId: 'crucero-canales', ticket: true },
          { time: '11:30', ideaId: 'saint-jean', note: 'Café y bollo en el Jordaan.' },
          { time: '12:30', label: 'Nueve Callecitas y últimas compras', hours: 1.5 },
          { time: '14:00', label: 'Comida de despedida', price: 25, hours: 1.5 },
          { time: '16:00', label: 'Tren a Schiphol', price: 5.9, hours: 0.5 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: 'plan-escapada',
    name: 'Con escapada',
    tagline: 'Medio día en Haarlem',
    thesis:
      'Haarlem se quedó con cuatro quizás y no choca con el 4-no a «un día entero fuera»: son 15 minutos de tren y se vuelve a cenar. Ámsterdam en pequeño, con canales y sin turistas. El festival del NDSM se mueve al domingo, que también lo tiene.',
    tradeoff:
      'Se cae el crucero por los canales, que tenía dos síes, y el domingo va con el tiempo justo antes del tren.',
    tradeoffShort: 'el crucero por los canales.',
    days: [
      {
        day: 'jue24',
        title: 'Llegada y centro a pie',
        slots: [
          LLEGADA,
          { time: '12:30', ideaId: 'free-tour', ticket: true },
          ...TARDE_JUEVES,
          { time: '18:00', label: 'Vuelta al hotel y descanso', hours: 1 },
          { time: '19:30', ideaId: 'foodhallen' },
          { time: '21:30', ideaId: 'barrio-rojo' },
          { time: '22:30', ideaId: 'coffeeshop' },
        ],
      },
      {
        day: 'vie25',
        title: 'Van Gogh, De Pijp y Jordaan',
        slots: [
          DESAYUNO_VIERNES,
          { time: '10:15', ideaId: 'vondelpark', hours: 1, note: 'Pegado al museo, para hacer tiempo.' },
          VAN_GOGH,
          { time: '14:00', label: 'Comida por De Pijp', price: 15, hours: 1 },
          { time: '15:15', ideaId: 'albert-cuyp', note: 'Cierra a las 17:00 y los domingos no abre.' },
          { time: '17:00', ideaId: 'bici', ticket: true, note: 'Medio día de alquiler.' },
          { time: '17:30', ideaId: 'jordaan', hours: 2 },
          { time: '19:30', ideaId: 'brown-cafe', hours: 2 },
          { time: '21:30', label: 'Cena por el Jordaan', price: 25, hours: 1.5 },
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
          { time: '16:30', ideaId: 'cafe-coos', note: 'En Amsterdam-West, clásicos holandeses al día.' },
          { time: '18:30', ideaId: 'brouwerij-ij', note: 'Terraza bajo el molino, en Oost.' },
          { time: '20:30', ideaId: 'de-tros', note: 'A diez minutos del molino.' },
        ],
      },
      {
        day: 'dom27',
        title: 'NDSM, mirador y vuelta',
        slots: [
          {
            time: '10:00',
            ideaId: 'ndsm',
            hours: 2,
            note: 'El festival Craft in Focus también es hoy, su último día.',
          },
          { time: '12:15', ideaId: 'adam-lookout', ticket: true, note: 'De camino al ferry de vuelta.' },
          { time: '14:00', label: 'Comida de despedida en Noord', price: 22, hours: 1.5 },
          { time: '16:00', label: 'Tren a Schiphol', price: 5.9, hours: 0.5 },
        ],
      },
    ],
  },
]
