import { useCallback, useState } from 'react'
import type { Voter } from '../types'

const STORAGE_KEY = 'ams2026.voter'

export const AVATARS = ['🦊', '🐼', '🦉', '🐙', '🦩', '🐢', '🦆', '🐝']

/** Convierte "Manu García" en "manu-garcia" para usarlo como id de documento. */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes y diéresis
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function read(): Voter | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Voter
    if (!parsed?.id || !parsed?.name) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Quién soy yo. Se guarda en el navegador para no tener que identificarse
 * cada vez. El id sale del nombre, así que si alguien borra los datos del
 * navegador y vuelve a poner su nombre, recupera sus votos.
 */
export function useIdentity() {
  const [voter, setVoter] = useState<Voter | null>(read)

  const identify = useCallback((name: string, emoji: string) => {
    const clean = name.trim()
    if (!clean) return
    const next: Voter = { id: slugify(clean), name: clean, emoji }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Modo incógnito o almacenamiento bloqueado: seguimos solo en memoria.
    }
    setVoter(next)
  }, [])

  const forget = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Da igual: lo que manda es el estado en memoria.
    }
    setVoter(null)
  }, [])

  return { voter, identify, forget }
}
