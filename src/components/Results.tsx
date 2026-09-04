import { useMemo, useState } from 'react'
import type { Tally, VoteDoc } from '../types'
import { CATEGORIES } from '../data/ideas'
import {
  GROUP_SIZE,
  STATUS_META,
  estimateBudget,
  estimateHours,
  formatEuro,
} from '../lib/scoring'

interface Props {
  tallies: Tally[]
  docs: VoteDoc[]
}

/** Horas útiles reales del viaje: 4 días, unas 10 h de actividad al día. */
const AVAILABLE_HOURS = 4 * 10

export function Results({ tallies, docs }: Props) {
  const [copied, setCopied] = useState(false)

  const plans = useMemo(() => tallies.filter((t) => !t.idea.decision), [tallies])
  const decisions = useMemo(() => tallies.filter((t) => t.idea.decision), [tallies])

  const budget = estimateBudget(plans)
  const hours = estimateHours(plans)
  const ranked = plans.filter((t) => t.votes > 0)
  const vetoed = plans.filter((t) => t.no > 0)

  const summary = useMemo(() => {
    const lines = ['🚲 ÁMSTERDAM 24-27 SEPT — cómo va la votación', '']
    const groups: [string, Tally[]][] = [
      ['✅ FIJO (todos decimos sí)', plans.filter((t) => t.status === 'fijo')],
      ['🔵 MUY PROBABLE', plans.filter((t) => t.status === 'probable')],
      ['🟠 EN EL AIRE', plans.filter((t) => t.status === 'dudoso')],
      ['❌ DESCARTADO', plans.filter((t) => t.status === 'descartado')],
    ]
    for (const [title, items] of groups) {
      if (!items.length) continue
      lines.push(title)
      for (const t of items) {
        lines.push(`  · ${t.idea.title} (${t.yes}/${t.maybe}/${t.no} · ${t.points} pts)`)
      }
      lines.push('')
    }
    lines.push(
      `Gasto estimado con lo que va ganando: ${formatEuro(budget.perPerson)} por persona (${formatEuro(budget.group)} entre los ${GROUP_SIZE}).`,
    )
    lines.push(`Tiempo que ocupa: ${hours.toFixed(1)} h de las ~${AVAILABLE_HOURS} h útiles.`)
    lines.push(`Han votado: ${docs.map((d) => d.name).join(', ') || 'nadie todavía'}.`)
    return lines.join('\n')
  }, [plans, budget, hours, docs])

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  if (docs.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        Todavía no hay ningún voto. En cuanto alguien empiece, esto se llena solo.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen numérico */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Gasto por persona"
          value={formatEuro(budget.perPerson)}
          hint={`${budget.items} planes · ${formatEuro(budget.group)} en total`}
        />
        <Stat
          label="Tiempo ocupado"
          value={`${hours.toFixed(0)} h`}
          hint={`de ~${AVAILABLE_HOURS} h útiles`}
          alert={hours > AVAILABLE_HOURS}
        />
      </div>

      {hours > AVAILABLE_HOURS && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          ⏳ Lo que va ganando no cabe en cuatro días. Habrá que recortar en la fase de puntos:
          mirad qué tiene menos puntos aunque nadie lo haya vetado.
        </p>
      )}

      {/* Quién ha votado */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Han votado {docs.length} de {GROUP_SIZE}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {docs.map((d) => (
            <span
              key={d.name}
              className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300"
            >
              {d.emoji} {d.name}
              <span className="ml-1.5 text-slate-500">
                {Object.keys(d.triage ?? {}).length} votos
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Ranking */}
      <Section title="El ranking" subtitle="Manda el consenso; los puntos deshacen los empates">
        <ol className="space-y-2">
          {ranked.map((t, i) => (
            <li
              key={t.idea.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-3"
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-slate-600">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{t.idea.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="text-emerald-400">{t.yes} sí</span>
                  {' · '}
                  <span className="text-amber-400">{t.maybe} quizás</span>
                  {t.no > 0 && (
                    <>
                      {' · '}
                      <span className="text-rose-400">{t.no} no</span>
                    </>
                  )}
                  {t.points > 0 && ` · ${t.points} pts`}
                  {t.idea.price ? ` · ${formatEuro(t.idea.price)}` : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_META[t.status].classes}`}
              >
                {STATUS_META[t.status].label}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Decisiones de grupo */}
      {decisions.some((d) => d.votes > 0) && (
        <Section title="Decisiones de grupo" subtitle="Presupuesto, abonos y ritmo del viaje">
          <ul className="space-y-2">
            {decisions
              .filter((d) => d.votes > 0)
              .map((t) => (
                <li
                  key={t.idea.id}
                  className="rounded-xl border border-white/10 bg-slate-900/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{t.idea.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_META[t.status].classes}`}
                    >
                      {STATUS_META[t.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.yes} sí · {t.maybe} quizás · {t.no} no
                  </p>
                </li>
              ))}
          </ul>
        </Section>
      )}

      {/* Vetos */}
      {vetoed.length > 0 && (
        <Section title="Con algún no" subtitle="Un solo no ya es motivo para hablarlo">
          <ul className="space-y-1.5">
            {vetoed.map((t) => (
              <li key={t.idea.id} className="text-sm text-slate-400">
                <span className="text-slate-200">{t.idea.title}</span>
                <span className="text-rose-400"> — no: {t.vetoedBy.join(', ')}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Por categoría, solo lo que gana */}
      <Section title="Lo que va ganando, por bloques" subtitle="Fijo y muy probable">
        <div className="space-y-3">
          {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((c) => {
            const items = plans.filter(
              (t) =>
                t.idea.category === c && (t.status === 'fijo' || t.status === 'probable'),
            )
            if (!items.length) return null
            return (
              <div key={c}>
                <p className="text-xs font-semibold text-slate-400">
                  {CATEGORIES[c].emoji} {CATEGORIES[c].label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  {items.map((t) => t.idea.title).join(' · ')}
                </p>
              </div>
            )
          })}
        </div>
      </Section>

      <button
        onClick={copySummary}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
      >
        {copied ? '✅ Copiado, pégalo en el grupo' : '📋 Copiar resumen para WhatsApp'}
      </button>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  alert,
}: {
  label: string
  value: string
  hint: string
  alert?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        alert ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-slate-900/50'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 mb-3 text-xs text-slate-500">{subtitle}</p>}
      {children}
    </section>
  )
}
