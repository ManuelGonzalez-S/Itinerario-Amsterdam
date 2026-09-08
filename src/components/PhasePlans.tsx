import { useMemo, useState } from 'react'
import type { Vote, VoteDoc } from '../types'
import { IDEAS_BY_ID } from '../data/ideas'
import { DAY_NAMES, type PlanSlot } from '../data/plans'
import { formatEuro, summarizeAllPlans, type PlanSummary } from '../lib/scoring'

interface Props {
  mine: VoteDoc
  docs: VoteDoc[]
  onVote: (planId: string, vote: Vote | null) => void
}

const VOTE_BUTTONS: { vote: Vote; label: string; emoji: string; on: string }[] = [
  { vote: 'yes', label: 'Me vale', emoji: '👍', on: 'bg-emerald-500 text-slate-950' },
  { vote: 'maybe', label: 'Con cambios', emoji: '🤔', on: 'bg-amber-400 text-slate-950' },
  { vote: 'no', label: 'No', emoji: '👎', on: 'bg-rose-500 text-white' },
]

export function PhasePlans({ mine, docs, onVote }: Props) {
  const summaries = useMemo(() => summarizeAllPlans(docs), [docs])
  const votedPlans = summaries.filter((s) => s.yes + s.maybe + s.no > 0)
  const leader = votedPlans.length > 0 ? summaries[0] : null
  const tie = leader ? summaries.filter((s) => s.score === leader.score).length > 1 : false

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-base font-bold text-white">Cuatro propuestas</h2>
        <p className="mt-1 text-sm text-slate-400">
          Marca las que te valgan. Puedes marcar varias.
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
            Cómo se han hecho
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Salen de vuestros votos y ninguna incluye nada con un solo{' '}
            <strong className="text-rose-300">no</strong>, así que quedan fuera Utrecht y World
            Press Photo además de las 23 descartadas. Respetan los horarios reales: Albert Cuyp
            cierra los domingos, el festival del NDSM solo es sábado y domingo, y el Van Gogh abre
            hasta las 21:00 solo los viernes.
          </p>
        </details>
      </section>

      {leader && (
        <div
          className={`rounded-2xl border p-4 ${
            tie ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {tie ? 'Empate ahora mismo' : 'Va ganando'}
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {tie
              ? summaries
                  .filter((s) => s.score === leader.score)
                  .map((s) => s.plan.name)
                  .join(' y ')
              : leader.plan.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {leader.yes} me vale · {leader.maybe} con cambios · {leader.no} no
            {leader.supportedBy.length > 0 && ` · a favor: ${leader.supportedBy.join(', ')}`}
          </p>
        </div>
      )}

      <div className="grid gap-4 2xl:grid-cols-2">
        {summaries.map((s) => (
          <PlanCard
            key={s.plan.id}
            summary={s}
            myVote={mine.triage[s.plan.id]}
            docs={docs}
            onVote={(v) => onVote(s.plan.id, v)}
          />
        ))}
      </div>
    </div>
  )
}

function PlanCard({
  summary,
  myVote,
  docs,
  onVote,
}: {
  summary: PlanSummary
  myVote: Vote | undefined
  docs: VoteDoc[]
  onVote: (v: Vote | null) => void
}) {
  const [open, setOpen] = useState(false)
  const { plan } = summary
  // Se avisa por día concreto, no contra un total inventado: el jueves se
  // llega a las 11:00 y el domingo hay vuelo, así que los días no son iguales.
  const overTime = summary.hours > summary.availableHours
  const overTickets = summary.maxTickets > 2

  const marks = docs
    .map((d) => ({ emoji: d.emoji, name: d.name, vote: d.triage?.[plan.id] }))
    .filter((m) => m.vote)

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-slate-900/50 p-4 ${
        myVote ? 'border-white/10' : 'border-orange-400/25'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-tight font-bold text-white">{plan.name}</h3>
          <p className="mt-0.5 text-sm text-orange-300">{plan.tagline}</p>
        </div>
        {marks.length > 0 && (
          <div className="flex shrink-0 -space-x-1">
            {marks.map((m) => (
              <span
                key={m.name}
                title={`${m.name}: ${m.vote === 'yes' ? 'me vale' : m.vote === 'maybe' ? 'con cambios' : 'no'}`}
                className={`grid size-6 place-items-center rounded-full text-[11px] ring-2 ring-slate-900 ${
                  m.vote === 'yes'
                    ? 'bg-emerald-500/80'
                    : m.vote === 'maybe'
                      ? 'bg-amber-400/80'
                      : 'bg-rose-500/80'
                }`}
              >
                {m.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Las cuatro cifras que de verdad se comparan entre planes */}
      <div className="mt-3.5 grid grid-cols-4 gap-2 rounded-xl bg-black/25 p-2.5 text-center">
        <Metric label="por persona" value={formatEuro(summary.cost)} />
        <Metric
          label={`de ${summary.availableHours} h`}
          value={`${summary.hours} h`}
          alert={overTime}
        />
        <Metric label="pagos/día" value={String(summary.maxTickets)} alert={overTickets} />
        <Metric label="planes" value={String(summary.ideaCount)} />
      </div>

      <p className="mt-1.5 text-center text-[11px] leading-relaxed text-slate-500">
        {formatEuro(summary.votedCost)} en lo que votasteis + {formatEuro(summary.extraCost)} en
        comidas libres y traslados
      </p>

      <p className="mt-3.5 text-xs leading-relaxed text-slate-300 lg:text-sm">{plan.thesis}</p>

      <p className="mt-2.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-slate-400">
        <strong className="text-slate-200">Qué deja fuera:</strong> {plan.tradeoff}
      </p>

      {plan.warning && (
        <p className="mt-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
          ⚠️ {plan.warning}
        </p>
      )}

      {(overTime || overTickets || summary.overDays.length > 0) && !plan.warning && (
        <p className="mt-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
          ⚠️{' '}
          {overTime &&
            `Se pasa de las ${summary.availableHours} h reales del viaje por ${(summary.hours - summary.availableHours).toFixed(1)} h. `}
          {summary.overDays.length > 0 &&
            `Va apretado el ${summary.overDays
              .map((d) => `${DAY_NAMES[d.day].toLowerCase()} (${d.hours} h de ${d.budget})`)
              .join(' y el ')}. `}
          {overTickets &&
            `Y algún día tiene ${summary.maxTickets} actividades de pago, cuando votasteis un máximo de 2.`}
        </p>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="mt-3 self-start text-xs font-medium text-sky-300 underline decoration-dotted underline-offset-2 hover:text-sky-200"
      >
        {open ? 'Ocultar los cuatro días' : 'Ver los cuatro días hora a hora'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {plan.days.map((day) => {
            const dayCost = day.slots.reduce(
              (a, s) => a + (s.ideaId ? (IDEAS_BY_ID.get(s.ideaId)?.price ?? s.price ?? 0) : (s.price ?? 0)),
              0,
            )
            return (
              <div key={day.day} className="rounded-xl bg-black/25 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    {DAY_NAMES[day.day]}
                    <span className="ml-2 font-normal text-slate-500">{day.title}</span>
                  </p>
                  <p className="shrink-0 text-xs text-slate-500">{formatEuro(dayCost)}</p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {day.slots.map((s, i) => (
                    <SlotRow key={`${day.day}-${i}`} slot={s} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
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

      {summary.vetoedBy.length > 0 && (
        <p className="mt-2 text-center text-xs text-rose-300">
          Descartado por {summary.vetoedBy.join(', ')}
        </p>
      )}
    </article>
  )
}

function SlotRow({ slot }: { slot: PlanSlot }) {
  const idea = slot.ideaId ? IDEAS_BY_ID.get(slot.ideaId) : undefined
  const title = idea?.title ?? slot.label ?? '—'
  const price = idea?.price ?? slot.price ?? 0
  const isIdea = !!idea

  return (
    <li className="flex gap-2.5 text-xs leading-relaxed">
      <span className="w-11 shrink-0 pt-px font-medium tabular-nums text-slate-500">
        {slot.time}
      </span>
      <span className="min-w-0">
        <span className={isIdea ? 'font-medium text-slate-200' : 'text-slate-400'}>{title}</span>
        {price > 0 && <span className="ml-1.5 text-slate-500">{formatEuro(price)}</span>}
        {slot.ticket && (
          <span className="ml-1.5 rounded bg-sky-500/15 px-1 py-px text-[10px] font-medium text-sky-300">
            entrada
          </span>
        )}
        {slot.note && <span className="block text-slate-500">{slot.note}</span>}
      </span>
    </li>
  )
}

function Metric({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <p className={`text-sm font-bold ${alert ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] leading-tight text-slate-500">{label}</p>
    </div>
  )
}
