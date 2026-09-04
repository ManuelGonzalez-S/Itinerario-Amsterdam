import { useState } from 'react'
import type { Tally, Vote, VoteDoc } from '../types'
import { CATEGORIES } from '../data/ideas'
import { formatEuro } from '../lib/scoring'

const DAY_LABEL: Record<string, string> = {
  jue24: 'jue 24',
  vie25: 'vie 25',
  sab26: 'sáb 26',
  dom27: 'dom 27',
}

const VOTE_BUTTONS: { vote: Vote; label: string; emoji: string; on: string }[] = [
  { vote: 'yes', label: 'Sí', emoji: '👍', on: 'bg-emerald-500 text-slate-950' },
  { vote: 'maybe', label: 'Quizás', emoji: '🤔', on: 'bg-amber-400 text-slate-950' },
  { vote: 'no', label: 'No', emoji: '👎', on: 'bg-rose-500 text-white' },
]

interface Props {
  tally: Tally
  myVote: Vote | undefined
  docs: VoteDoc[]
  onVote: (vote: Vote | null) => void
}

export function IdeaCard({ tally, myVote, docs, onVote }: Props) {
  const [open, setOpen] = useState(false)
  const { idea } = tally
  const cat = CATEGORIES[idea.category]

  const voterMarks = docs
    .map((d) => ({ emoji: d.emoji, name: d.name, vote: d.triage?.[idea.id] }))
    .filter((v) => v.vote)

  return (
    <article
      className={`rounded-2xl border bg-slate-900/50 p-4 backdrop-blur transition ${
        myVote ? 'border-white/10' : 'border-orange-400/25'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold text-white">{idea.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
            <span>
              {cat.emoji} {cat.label}
            </span>
            {idea.price !== null && (
              <span className="font-medium text-slate-300">
                {idea.price === 0 ? 'Gratis' : `${formatEuro(idea.price)} / persona`}
              </span>
            )}
            {idea.hours !== null && <span>≈ {idea.hours} h</span>}
            {idea.needsBooking && (
              <span className="rounded bg-orange-500/15 px-1.5 py-0.5 font-medium text-orange-300">
                hay que reservar
              </span>
            )}
            {idea.onlyDays && (
              <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-medium text-sky-300">
                solo {idea.onlyDays.map((d) => DAY_LABEL[d]).join(' / ')}
              </span>
            )}
          </div>
        </div>
        {voterMarks.length > 0 && (
          <div className="flex shrink-0 -space-x-1">
            {voterMarks.map((v) => (
              <span
                key={v.name}
                title={`${v.name}: ${v.vote === 'yes' ? 'sí' : v.vote === 'maybe' ? 'quizás' : 'no'}`}
                className={`grid size-6 place-items-center rounded-full text-[11px] ring-2 ring-slate-900 ${
                  v.vote === 'yes'
                    ? 'bg-emerald-500/80'
                    : v.vote === 'maybe'
                      ? 'bg-amber-400/80'
                      : 'bg-rose-500/80'
                }`}
              >
                {v.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{idea.pitch}</p>

      {idea.warning && (
        <p className="mt-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-200">
          ⚠️ {idea.warning}
        </p>
      )}

      {(idea.notes || idea.url) && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="mt-2 text-xs font-medium text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-200"
          >
            {open ? 'Ocultar detalles' : 'Ver horarios y detalles'}
          </button>
          {open && (
            <div className="mt-2 space-y-2 rounded-lg bg-black/25 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
              {idea.notes && <p>{idea.notes}</p>}
              {idea.url && (
                <a
                  href={idea.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block font-medium text-sky-300 hover:text-sky-200"
                >
                  Web oficial ↗
                </a>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {VOTE_BUTTONS.map((b) => (
          <button
            key={b.vote}
            onClick={() => onVote(myVote === b.vote ? null : b.vote)}
            aria-pressed={myVote === b.vote}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              myVote === b.vote ? b.on : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span aria-hidden className="mr-1">
              {b.emoji}
            </span>
            {b.label}
          </button>
        ))}
      </div>
    </article>
  )
}
