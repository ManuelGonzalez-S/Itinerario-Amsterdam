import { useState } from 'react'
import type { Tally, Vote, VoteDoc } from '../types'
import { IDEAS } from '../data/ideas'
import { POINTS_BUDGET, countIdeaVotes } from '../lib/scoring'
import { PhaseTriage } from './PhaseTriage'
import { PhasePoints } from './PhasePoints'

interface Props {
  tallies: Tally[]
  mine: VoteDoc
  docs: VoteDoc[]
  spent: number
  onVote: (ideaId: string, vote: Vote | null) => void
  onSetPoints: (ideaId: string, value: number) => void
  onResetPoints: () => void
}

/**
 * Votar y repartir puntos eran dos pestañas separadas, pero son dos pasos de
 * lo mismo, así que van juntas con un selector arriba. Deja la barra inferior
 * en cuatro destinos en vez de seis.
 */
export function PhaseVote({
  tallies,
  mine,
  docs,
  spent,
  onVote,
  onSetPoints,
  onResetPoints,
}: Props) {
  const voted = countIdeaVotes(mine.triage)
  const triageDone = voted === IDEAS.length
  const [sub, setSub] = useState<'triaje' | 'puntos'>(triageDone ? 'puntos' : 'triaje')

  const left = POINTS_BUDGET - spent

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-900/50 p-2">
        <button
          onClick={() => setSub('triaje')}
          aria-pressed={sub === 'triaje'}
          className={`min-h-14 rounded-xl px-3 py-2 transition ${
            sub === 'triaje' ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <span className="block text-sm font-semibold text-white">1. Sí, quizás o no</span>
          <span className={`block text-xs ${triageDone ? 'text-emerald-400' : 'text-slate-500'}`}>
            {triageDone ? '✅ completo' : `${voted} de ${IDEAS.length}`}
          </span>
        </button>
        <button
          onClick={() => setSub('puntos')}
          aria-pressed={sub === 'puntos'}
          className={`min-h-14 rounded-xl px-3 py-2 transition ${
            sub === 'puntos' ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <span className="block text-sm font-semibold text-white">2. Tus 100 puntos</span>
          <span className={`block text-xs ${left === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
            {left === 0 ? '✅ repartidos' : `te quedan ${left}`}
          </span>
        </button>
      </div>

      {sub === 'triaje' ? (
        <PhaseTriage tallies={tallies} mine={mine} docs={docs} onVote={onVote} />
      ) : (
        <PhasePoints
          mine={mine}
          spent={spent}
          onSetPoints={onSetPoints}
          onReset={onResetPoints}
          onGoTriage={() => setSub('triaje')}
        />
      )}
    </div>
  )
}
