export type Category = 'museos' | 'ciudad' | 'excursiones' | 'comida' | 'noche' | 'logistica'

export type TripDay = 'jue24' | 'vie25' | 'sab26' | 'dom27'

export interface Idea {
  id: string
  title: string
  category: Category
  /** Precio por persona en euros. 0 = gratis. null = variable / no aplica. */
  price: number | null
  /** Duración aproximada en horas. null si no aplica. */
  hours: number | null
  /**
   * Horas que bloquea de verdad en la agenda del día, cuando no coinciden con
   * su duración. El alquiler de bicis son 4 h, pero esas horas las ocupan el
   * Vondelpark y el Jordaan, que se hacen justamente en bici.
   */
  scheduleHours?: number
  /** Frase corta de por qué merece la pena. */
  pitch: string
  /** Datos duros: horarios, cómo llegar, avisos. */
  notes?: string
  /** Aviso importante que se pinta destacado. */
  warning?: string
  /** Enlace oficial, para comprar o consultar horarios. */
  url?: string
  /** Solo disponible o recomendable en ciertos días del viaje. */
  onlyDays?: TripDay[]
  /** Se agota o hay que reservar con antelación. */
  needsBooking?: boolean
  /** Decisión de grupo (abonos, presupuesto), no una actividad. */
  decision?: boolean
}
