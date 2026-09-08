import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, TRIP_ID } from '../firebase'
import type { TripDay, Vote, VoteDoc, Voter } from '../types'

const LOCAL_MIRROR = 'ams2026.mirror'

function votesCollection() {
  return collection(db, 'trips', TRIP_ID, 'votes')
}

function readMirror(): VoteDoc | null {
  try {
    const raw = localStorage.getItem(LOCAL_MIRROR)
    return raw ? (JSON.parse(raw) as VoteDoc) : null
  } catch {
    return null
  }
}

function writeMirror(d: VoteDoc) {
  try {
    localStorage.setItem(LOCAL_MIRROR, JSON.stringify(d))
  } catch {
    // Sin almacenamiento local seguimos funcionando, solo perdemos la copia.
  }
}

const EMPTY: Omit<VoteDoc, 'name' | 'emoji'> = {
  triage: {},
  points: {},
  itinerary: {},
  updatedAt: 0,
}

/**
 * Estado compartido de la votación. Escucha Firestore en tiempo real, así que
 * los cuatro vemos los votos de los demás al momento. Los votos propios se
 * aplican de forma optimista y se guardan también en el navegador, para que un
 * corte de red no borre el trabajo de nadie.
 */
export function useVotes(voter: Voter | null) {
  const [remote, setRemote] = useState<Record<string, VoteDoc>>({})
  // Lectura y escritura se llevan por separado a propósito. Firestore aplica
  // las escrituras en local antes de confirmarlas y, cuando el servidor las
  // rechaza, las revierte: esa reversión dispara otro snapshot. Con un solo
  // estado de error, ese snapshot borraba el aviso de "no se ha guardado" a
  // los milisegundos y el fallo pasaba desapercibido.
  const [readError, setReadError] = useState<string | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mine, setMine] = useState<VoteDoc | null>(null)
  const flushTimer = useRef<number | null>(null)
  const pending = useRef<VoteDoc | null>(null)

  // Suscripción en tiempo real a todos los votos del viaje.
  useEffect(() => {
    const unsub = onSnapshot(
      votesCollection(),
      (snap) => {
        const next: Record<string, VoteDoc> = {}
        snap.forEach((d) => {
          next[d.id] = d.data() as VoteDoc
        })
        setRemote(next)
        setReadError(null)
        setLoading(false)
      },
      (err) => {
        setReadError(
          err.code === 'permission-denied'
            ? 'Firestore ha rechazado la lectura. Hay que publicar las reglas de firestore.rules en la consola de Firebase.'
            : `No se puede conectar con Firestore (${err.code}). Tus votos se guardan en este navegador mientras tanto.`,
        )
        setLoading(false)
      },
    )
    return unsub
  }, [])

  // Al identificarnos, partimos de lo que haya en la nube o de la copia local.
  useEffect(() => {
    if (!voter) {
      setMine(null)
      return
    }
    const fromCloud = remote[voter.id]
    const mirror = readMirror()
    const base = fromCloud ?? (mirror?.name === voter.name ? mirror : null)
    setMine((current) => {
      if (current) return current
      return {
        name: voter.name,
        emoji: voter.emoji,
        triage: base?.triage ?? {},
        points: base?.points ?? {},
        itinerary: base?.itinerary ?? {},
        updatedAt: base?.updatedAt ?? 0,
      }
    })
    // Solo queremos rehidratar al identificarnos o al llegar el primer snapshot,
    // no en cada cambio remoto: eso pisaría lo que estemos votando ahora mismo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voter?.id, loading])

  const flush = useCallback(
    (next: VoteDoc) => {
      if (!voter) return
      pending.current = next
      if (flushTimer.current) window.clearTimeout(flushTimer.current)
      flushTimer.current = window.setTimeout(() => {
        const payload = pending.current
        if (!payload) return

        // Reemplazo completo, no merge. Con merge los mapas se fusionan, así
        // que quitar un voto o sacar algo del itinerario no se propagaba: la
        // clave desaparecía en local y seguía viva en Firestore.
        // Si no hay ruta, el campo `itinerary` ni se manda: así la votación
        // normal sigue funcionando aunque las reglas nuevas no estén publicadas.
        const hasRoute = Object.keys(payload.itinerary ?? {}).length > 0
        const { itinerary, ...rest } = payload
        const body = hasRoute ? { ...rest, itinerary } : rest

        setDoc(doc(votesCollection(), voter.id), body)
          .then(() => setWriteError(null))
          .catch((err) => {
            setWriteError(
              err.code === 'permission-denied' && hasRoute
                ? 'Tu ruta NO se está guardando: Firestore rechaza el campo del itinerario porque faltan por publicar las reglas actualizadas de firestore.rules. De momento solo vive en este navegador.'
                : `No se ha podido guardar en Firestore (${err.code ?? 'error'}). Tus cambios siguen en este navegador.`,
            )
          })
      }, 350)
    },
    [voter],
  )

  const apply = useCallback(
    (mutate: (d: VoteDoc) => VoteDoc) => {
      setMine((current) => {
        if (!current) return current
        const next = { ...mutate(current), updatedAt: Date.now() }
        writeMirror(next)
        flush(next)
        return next
      })
    },
    [flush],
  )

  const setTriage = useCallback(
    (ideaId: string, vote: Vote | null) => {
      apply((d) => {
        const triage = { ...d.triage }
        const points = { ...d.points }
        if (vote === null || vote === 'no') {
          // Un "no" o un voto retirado no debe arrastrar puntos asignados antes.
          delete points[ideaId]
        }
        if (vote === null) delete triage[ideaId]
        else triage[ideaId] = vote
        return { ...d, triage, points }
      })
    },
    [apply],
  )

  const setPoints = useCallback(
    (ideaId: string, value: number) => {
      apply((d) => {
        const points = { ...d.points }
        if (value <= 0) delete points[ideaId]
        else points[ideaId] = value
        return { ...d, points }
      })
    },
    [apply],
  )

  const resetPoints = useCallback(() => {
    apply((d) => ({ ...d, points: {} }))
  }, [apply])

  /** Coloca una idea en un día, o la saca de la ruta si day es null. */
  const setItineraryDay = useCallback(
    (ideaId: string, day: TripDay | null) => {
      apply((d) => {
        const itinerary = { ...(d.itinerary ?? {}) }
        if (day === null) delete itinerary[ideaId]
        else itinerary[ideaId] = day
        return { ...d, itinerary }
      })
    },
    [apply],
  )

  /** Sustituye la ruta entera, para arrancar desde uno de los planes. */
  const replaceItinerary = useCallback(
    (next: Record<string, TripDay>) => {
      apply((d) => ({ ...d, itinerary: { ...next } }))
    },
    [apply],
  )

  // Todos los votos, con los míos siempre en su versión más fresca.
  const allDocs = useMemo(() => {
    const merged: Record<string, VoteDoc> = { ...remote }
    if (voter && mine) merged[voter.id] = mine
    return Object.values(merged)
  }, [remote, voter, mine])

  const pointsSpent = useMemo(
    () => Object.values(mine?.points ?? {}).reduce((a, b) => a + b, 0),
    [mine],
  )

  return {
    allDocs,
    voters: allDocs.map((d) => ({ name: d.name, emoji: d.emoji, updatedAt: d.updatedAt })),
    mine: mine ?? { name: voter?.name ?? '', emoji: voter?.emoji ?? '', ...EMPTY },
    pointsSpent,
    loading,
    // La escritura manda: si no se está guardando, eso es lo urgente de saber.
    error: writeError ?? readError,
    setTriage,
    setPoints,
    resetPoints,
    setItineraryDay,
    replaceItinerary,
  }
}
