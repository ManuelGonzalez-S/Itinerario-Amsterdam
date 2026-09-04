import { useMemo } from 'react'
import type { VoteDoc } from '../types'
import { IDEAS, CATEGORIES } from '../data/ideas'
import { POINTS_BUDGET, POINTS_STEP, formatEuro } from '../lib/scoring'

interface Props {
  mine: VoteDoc
  spent: number
  onSetPoints: (ideaId: string, value: number) => void
  onReset: () => void
  onGoTriage: () => void
}

/**
 * Fase 2: repartir 100 puntos entre lo que cada uno ha marcado como Sí o
 * Quizás. Obliga a priorizar de verdad, que es lo que el triaje no consigue.
 */
export function PhasePoints({ mine, spent, onSetPoints, onReset, onGoTriage }: Props) {
  const left = POINTS_BUDGET - spent

  const shortlist = useMemo(() => {
    const rank = { yes: 0, maybe: 1 } as const
    return IDEAS.filter((i) => {
      const v = mine.triage[i.id]
      return v === 'yes' || v === 'maybe'
    }).sort((a, b) => {
      const ra = rank[mine.triage[a.id] as 'yes' | 'maybe']
      const rb = rank[mine.triage[b.id] as 'yes' | 'maybe']
      if (ra !== rb) return ra - rb
      return (mine.points[b.id] ?? 0) - (mine.points[a.id] ?? 0)
    })
  }, [mine.triage, mine.points])

  if (shortlist.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center">
        <p className="text-3xl">🗳️</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Aquí repartes tus 100 puntos, pero primero hay que marcar cosas como{' '}
          <strong className="text-emerald-300">Sí</strong> o{' '}
          <strong className="text-amber-300">Quizás</strong> en la pestaña de votar.
        </p>
        <button
          onClick={onGoTriage}
          className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-orange-400"
        >
          Ir a votar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        // En móvil se pega bajo la cabecera; en escritorio no hay cabecera arriba.
        className={`sticky top-[3.75rem] z-10 rounded-2xl border p-4 backdrop-blur-md transition lg:top-4 ${
          left < 0
            ? 'border-rose-500/40 bg-rose-950/70'
            : left === 0
              ? 'border-emerald-500/40 bg-emerald-950/60'
              : 'border-white/10 bg-slate-900/80'
        }`}
      >
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-slate-300">Puntos que te quedan</p>
          <p
            className={`text-3xl font-bold ${
              left < 0 ? 'text-rose-300' : left === 0 ? 'text-emerald-300' : 'text-white'
            }`}
          >
            {left}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              left < 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-emerald-400'
            }`}
            style={{ width: `${Math.min(100, (spent / POINTS_BUDGET) * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {left < 0
              ? `Te has pasado por ${-left}. Quita puntos de algo.`
              : left === 0
                ? '¡Perfecto! Has repartido los 100.'
                : 'Dale más puntos a lo que de verdad quieres hacer.'}
          </p>
          {spent > 0 && (
            <button
              onClick={onReset}
              className="shrink-0 text-xs font-medium text-slate-500 underline decoration-dotted hover:text-slate-300"
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        {shortlist.map((idea) => {
          const value = mine.points[idea.id] ?? 0
          const cat = CATEGORIES[idea.category]
          return (
            <div
              key={idea.id}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                value > 0 ? 'border-sky-500/30 bg-sky-500/5' : 'border-white/10 bg-slate-900/40'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {mine.triage[idea.id] === 'maybe' && <span className="mr-1 text-amber-400">🤔</span>}
                  {idea.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {cat.emoji} {idea.price ? formatEuro(idea.price) : 'Gratis'}
                  {idea.hours ? ` · ${idea.hours} h` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => onSetPoints(idea.id, Math.max(0, value - POINTS_STEP))}
                  disabled={value === 0}
                  aria-label={`Quitar puntos a ${idea.title}`}
                  className="grid size-9 place-items-center rounded-lg bg-white/5 text-lg text-slate-300 hover:bg-white/10 disabled:opacity-25"
                >
                  −
                </button>
                <span
                  className={`w-9 text-center text-sm font-bold tabular-nums ${
                    value > 0 ? 'text-sky-300' : 'text-slate-600'
                  }`}
                >
                  {value}
                </span>
                <button
                  onClick={() => onSetPoints(idea.id, value + POINTS_STEP)}
                  aria-label={`Dar puntos a ${idea.title}`}
                  className="grid size-9 place-items-center rounded-lg bg-white/5 text-lg text-slate-300 hover:bg-white/10"
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
