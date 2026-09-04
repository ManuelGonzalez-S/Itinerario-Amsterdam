export type Vote = 'yes' | 'maybe' | 'no'

export type Category =
  | 'museos'
  | 'ciudad'
  | 'excursiones'
  | 'comida'
  | 'noche'
  | 'logistica'

export interface Idea {
  id: string
  title: string
  category: Category
  /** Precio por persona en euros. 0 = gratis. null = variable / no aplica. */
  price: number | null
  /** Duración aproximada en horas. null si no aplica. */
  hours: number | null
  /** Frase corta de por qué merece la pena (o no). */
  pitch: string
  /** Datos duros: horarios, cómo llegar, avisos. */
  notes?: string
  /** Aviso importante que se pinta destacado en la tarjeta. */
  warning?: string
  /** Enlace oficial. */
  url?: string
  /** Solo disponible/recomendable en ciertos días del viaje. */
  onlyDays?: TripDay[]
  /** Se agota o hay que reservar con antelación. */
  needsBooking?: boolean
  /** Marcado como decisión de grupo, no como plan (presupuesto, ritmo...). */
  decision?: boolean
}

export type TripDay = 'jue24' | 'vie25' | 'sab26' | 'dom27'

export interface Voter {
  id: string
  name: string
  emoji: string
}

export interface VoteDoc {
  name: string
  emoji: string
  triage: Record<string, Vote>
  points: Record<string, number>
  updatedAt: number
}

export interface Tally {
  idea: Idea
  yes: number
  maybe: number
  no: number
  votes: number
  points: number
  /** yes=2, maybe=1, no=-1 */
  triageScore: number
  /** Puntuación combinada para ordenar el ranking. */
  score: number
  status: 'fijo' | 'probable' | 'dudoso' | 'descartado' | 'sin-votos'
  vetoedBy: string[]
}
