import { useCallback, useEffect, useRef, useState } from 'react'

export interface Ubicacion {
  coords: [number, number]
  /** Radio de incertidumbre en metros, tal y como lo da el navegador. */
  precision: number
}

export type EstadoUbicacion = 'apagado' | 'buscando' | 'activo' | 'error'

const MENSAJES: Record<number, string> = {
  1: 'Has bloqueado el permiso de ubicación. Actívalo en los ajustes del navegador para este sitio.',
  2: 'No se ha podido determinar tu posición. Dentro de un edificio suele costar; prueba a salir a la calle.',
  3: 'La ubicación ha tardado demasiado. Inténtalo otra vez.',
}

/**
 * Posición del usuario, solo cuando la pide.
 *
 * A propósito no se arranca sola al cargar: soltarle a alguien el aviso de
 * permisos nada más entrar es de mala educación, y encima el navegador
 * recuerda un "no" dado a la ligera.
 */
export function useUbicacion() {
  const [estado, setEstado] = useState<EstadoUbicacion>('apagado')
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)

  const parar = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setEstado('apagado')
    setUbicacion(null)
    setError(null)
  }, [])

  const arrancar = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setEstado('error')
      setError('Este navegador no permite compartir la ubicación.')
      return
    }

    setEstado('buscando')
    setError(null)

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUbicacion({
          coords: [pos.coords.latitude, pos.coords.longitude],
          precision: pos.coords.accuracy,
        })
        setEstado('activo')
        setError(null)
      },
      (err) => {
        setEstado('error')
        setError(MENSAJES[err.code] ?? 'No se ha podido obtener tu ubicación.')
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current)
          watchId.current = null
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    )
  }, [])

  // Si se sale de la página, se deja de consumir GPS y batería.
  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  return { estado, ubicacion, error, arrancar, parar }
}

/** Distancia en metros entre dos puntos (fórmula del haversine). */
export function distancia(a: [number, number], b: [number, number]): number {
  const R = 6_371_000
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** "350 m" o "1,2 km", que es como lo lee una persona. */
export function formatDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`
  return `${(metros / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} km`
}

/** Minutos andando, a 4,5 km/h que es un paso normal por ciudad. */
export function minutosAndando(metros: number): number {
  return Math.max(1, Math.round(metros / 75))
}
