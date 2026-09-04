import { useMemo, useState } from 'react'
import type { Category, Tally, Vote, VoteDoc } from '../types'
import { CATEGORIES, IDEAS } from '../data/ideas'
import { IdeaCard } from './IdeaCard'

interface Props {
  tallies: Tally[]
  mine: VoteDoc
  docs: VoteDoc[]
  onVote: (ideaId: string, vote: Vote | null) => void
}

const CATEGORY_ORDER = Object.keys(CATEGORIES) as Category[]

/** Fase 1: pasar por todas las ideas con Sí / Quizás / No. */
export function PhaseTriage({ tallies, mine, docs, onVote }: Props) {
  const [category, setCategory] = useState<Category | 'todo'>('todo')
  const [onlyPending, setOnlyPending] = useState(false)

  const voted = Object.keys(mine.triage).length
  const total = IDEAS.length
  const pct = Math.round((voted / total) * 100)

  // En la fase de triaje mantenemos el orden del catálogo, no el del ranking:
  // así la lista no baila bajo el dedo cada vez que alguien vota.
  const list = useMemo(() => {
    const byId = new Map(tallies.map((t) => [t.idea.id, t]))
    return IDEAS.map((i) => byId.get(i.id)!).filter((t) => {
      if (category !== 'todo' && t.idea.category !== category) return false
      if (onlyPending && mine.triage[t.idea.id]) return false
      return true
    })
  }, [tallies, category, onlyPending, mine.triage])

  const pendingCount = total - voted

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        {/* En escritorio el progreso ya vive en la barra lateral. */}
        <div className="lg:hidden">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium text-slate-300">
              Has votado <span className="text-white">{voted}</span> de {total}
            </p>
            <p className="text-2xl font-bold text-orange-300">{pct}%</p>
          </div>
          <div className="mt-2 mb-2.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-slate-500 lg:text-sm">
          Pasa por todas y marca sin pensarlo mucho. Un <strong className="text-rose-300">No</strong>{' '}
          es un veto real: lo que alguien no quiere, no se hace. Puedes cambiar tu voto cuando
          quieras.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          <Chip active={category === 'todo'} onClick={() => setCategory('todo')}>
            Todo ({total})
          </Chip>
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORIES[c].emoji} {CATEGORIES[c].label}
            </Chip>
          ))}
        </div>
      </div>

      {pendingCount > 0 && (
        <label className="flex items-center gap-2.5 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
            className="size-4 accent-orange-500"
          />
          Ver solo las {pendingCount} que me quedan
        </label>
      )}

      {/* Una columna en móvil, rejilla en cuanto hay sitio. */}
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {list.map((t) => (
          <IdeaCard
            key={t.idea.id}
            tally={t}
            myVote={mine.triage[t.idea.id]}
            docs={docs}
            onVote={(v) => onVote(t.idea.id, v)}
          />
        ))}
      </div>

      {list.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">
          Nada por aquí. Has votado todo en esta categoría 🎉
        </p>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition ${
        active ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
