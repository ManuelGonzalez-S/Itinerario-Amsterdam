import { useMemo, useState } from 'react'
import type { Idea, Tally, TripDay, VoteDoc } from '../types'
import { DAY_NAMES, PLANS } from '../data/plans'
import { formatEuro, summarizePlan } from '../lib/scoring'
import {
  PACE_META,
  TRIP_DAYS,
  availableIdeas,
  compareRoutes,
  itineraryFromPlan,
  missingFromRoute,
  summarizeRoute,
  type DayLoad,
} from '../lib/itinerary'

interface Props {
  mine: VoteDoc
  docs: VoteDoc[]
  tallies: Tally[]
  onSetDay: (ideaId: string, day: TripDay | null) => void
  onReplace: (itinerary: Record<string, TripDay>) => void
}

const DAY_SHORT: Record<TripDay, string> = {
  jue24: 'Jue',
  vie25: 'Vie',
  sab26: 'Sáb',
  dom27: 'Dom',
}

type Step = 'inicio' | 'repasar' | 'ruta'

/**
 * Asistente para armar la ruta propia. Va por pasos y con una sola decisión a
 * la vez: la versión anterior ponía 173 botones en la misma pantalla, 148 de
 * ellos de 27x21 px, muy por debajo del mínimo táctil de 44 px.
 */
export function PhaseMyRoute({ mine, docs, tallies, onSetDay, onReplace }: Props) {
  const itinerary = mine.itinerary ?? {}
  const placedCount = Object.keys(itinerary).length
  const [step, setStep] = useState<Step>(placedCount > 0 ? 'ruta' : 'inicio')
  const [skipped, setSkipped] = useState<string[]>([])

  const pool = useMemo(() => availableIdeas(tallies), [tallies])
  const route = useMemo(() => summarizeRoute(itinerary), [itinerary])

  // Cola de repaso: lo que aún no está en la ruta y no se ha saltado.
  const queue = useMemo(
    () => pool.filter((i) => !itinerary[i.id] && !skipped.includes(i.id)),
    [pool, itinerary, skipped],
  )

  function startFrom(planId: string | null) {
    onReplace(planId ? itineraryFromPlan(planId) : {})
    setSkipped([])
    setStep('repasar')
  }

  if (step === 'inicio') {
    return <StepInicio onStart={startFrom} tallies={tallies} docs={docs} />
  }

  if (step === 'repasar') {
    return (
      <StepRepasar
        queue={queue}
        tallies={tallies}
        route={route}
        onPick={(ideaId, day) => onSetDay(ideaId, day)}
        onSkip={(ideaId) => setSkipped((s) => [...s, ideaId])}
        onFinish={() => setStep('ruta')}
      />
    )
  }

  return (
    <StepRuta
      itinerary={itinerary}
      route={route}
      tallies={tallies}
      docs={docs}
      onSetDay={onSetDay}
      onReview={() => {
        setSkipped([])
        setStep('repasar')
      }}
      onRestart={() => setStep('inicio')}
    />
  )
}

/* ─────────────────────────── Paso 1: de dónde partimos ─────────────────── */

function StepInicio({
  onStart,
  tallies,
  docs,
}: {
  onStart: (planId: string | null) => void
  tallies: Tally[]
  docs: VoteDoc[]
}) {
  const { withRoute } = useMemo(() => compareRoutes(docs), [docs])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Paso 1 de 3</p>
        <h2 className="mt-1 text-xl font-bold text-white">¿De dónde partimos?</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Elige una base y luego la cambias a tu gusto. Nada es definitivo.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {PLANS.map((p) => {
          const s = summarizePlan(p, docs)
          return (
            <button
              key={p.id}
              onClick={() => onStart(p.id)}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left transition hover:border-orange-400/40 hover:bg-slate-900"
            >
              <p className="text-base font-bold text-white">{p.name}</p>
              <p className="mt-0.5 text-sm text-orange-300">{p.tagline}</p>
              <p className="mt-2 text-xs text-slate-500">
                {s.ideaCount} planes · {formatEuro(s.cost)} · {s.hours} h
              </p>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => onStart(null)}
        className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
      >
        Empezar de cero, sin nada puesto
      </button>

      <p className="text-center text-xs text-slate-500">
        Hay {availableIdeas(tallies).length} cosas que nadie ha vetado.
        {withRoute.length > 0 && ` Ya han mandado su ruta ${withRoute.length} de 4.`}
      </p>
    </div>
  )
}

/* ─────────────────── Paso 2: una decisión a la vez ─────────────────────── */

function StepRepasar({
  queue,
  tallies,
  route,
  onPick,
  onSkip,
  onFinish,
}: {
  queue: Idea[]
  tallies: Tally[]
  route: ReturnType<typeof summarizeRoute>
  onPick: (ideaId: string, day: TripDay) => void
  onSkip: (ideaId: string) => void
  onFinish: () => void
}) {
  const idea = queue[0]

  if (!idea) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <p className="text-3xl">🎉</p>
          <h2 className="mt-2 text-lg font-bold text-white">Has repasado todo</h2>
          <p className="mt-1 text-sm text-slate-400">
            Ya tienes {route.placed} cosas colocadas. Mira cómo queda.
          </p>
        </div>
        <button
          onClick={onFinish}
          className="min-h-12 w-full rounded-2xl bg-orange-500 px-4 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-orange-400"
        >
          Ver mi ruta
        </button>
      </div>
    )
  }

  const tally = tallies.find((t) => t.idea.id === idea.id)
  const done = route.placed
  const total = done + queue.length

  return (
    <div className="space-y-4">
      {/* Progreso del repaso */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
            Paso 2 de 3
          </p>
          <p className="text-xs text-slate-500">{queue.length} por repasar</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* La pregunta */}
      <div className="rounded-2xl border border-orange-400/25 bg-slate-900/50 p-5">
        <h2 className="text-xl leading-tight font-bold text-white">{idea.title}</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          {idea.price ? formatEuro(idea.price) : 'Gratis'} · {idea.scheduleHours ?? idea.hours ?? 0}{' '}
          h
          {tally && (tally.yes > 0 || tally.maybe > 0) && (
            <>
              {' · '}
              <span className="text-emerald-400">{tally.yes} sí</span>
              {tally.maybe > 0 && <span className="text-amber-400"> · {tally.maybe} quizás</span>}
            </>
          )}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{idea.pitch}</p>

        {idea.warning && (
          <p className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-200">
            ⚠️ {idea.warning}
          </p>
        )}
        {idea.onlyDays && (
          <p className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-200">
            Solo puede ser {idea.onlyDays.map((d) => DAY_NAMES[d].toLowerCase()).join(' o ')}.
          </p>
        )}

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          ¿Qué día lo harías?
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TRIP_DAYS.map((d) => {
            const load = route.days.find((x) => x.day === d)!
            const blocked = idea.onlyDays && !idea.onlyDays.includes(d)
            const meta = PACE_META[load.pace]
            return (
              <button
                key={d}
                onClick={() => onPick(idea.id, d)}
                disabled={blocked}
                className={`min-h-14 rounded-xl px-1 py-2.5 transition ${
                  blocked
                    ? 'cursor-not-allowed bg-white/5 opacity-30'
                    : 'bg-white/10 hover:bg-orange-500 hover:text-slate-950'
                }`}
              >
                <span className="block text-sm font-bold text-white">{DAY_SHORT[d]}</span>
                <span className={`block text-[10px] ${meta.text}`}>{load.hours} h</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onSkip(idea.id)}
          className="mt-2 min-h-12 w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/10"
        >
          Paso, no lo quiero
        </button>
      </div>

      <button
        onClick={onFinish}
        className="w-full py-2 text-xs font-medium text-slate-500 underline decoration-dotted hover:text-slate-300"
      >
        Dejar el repaso y ver mi ruta
      </button>
    </div>
  )
}

/* ─────────────────────── Paso 3: la ruta montada ───────────────────────── */

function StepRuta({
  itinerary,
  route,
  tallies,
  docs,
  onSetDay,
  onReview,
  onRestart,
}: {
  itinerary: Record<string, TripDay>
  route: ReturnType<typeof summarizeRoute>
  tallies: Tally[]
  docs: VoteDoc[]
  onSetDay: (ideaId: string, day: TripDay | null) => void
  onReview: () => void
  onRestart: () => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<TripDay | null>(null)
  const missing = useMemo(() => missingFromRoute(itinerary, tallies), [itinerary, tallies])
  const { withRoute, agreement } = useMemo(() => compareRoutes(docs), [docs])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Paso 3 de 3</p>
        <h2 className="mt-1 text-xl font-bold text-white">Tu ruta</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Se guarda sola y los otros tres ya la ven. Toca cualquier cosa para cambiarla de día.
        </p>
        <p className="mt-1 hidden text-xs text-slate-500 lg:block">
          En ordenador también puedes arrastrarlas de un día a otro.
        </p>
        <div className="mt-3 flex gap-3 text-sm">
          <span className="font-bold text-white">{formatEuro(route.totalCost)}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{route.totalHours} h</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{route.placed} cosas</span>
        </div>
      </div>

      {route.impossibleDays.length > 0 ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-relaxed text-rose-200">
          🚫 No cabe el{' '}
          {route.impossibleDays.map((d) => DAY_NAMES[d.day].toLowerCase()).join(' ni el ')}. Mueve
          algo a otro día.
        </p>
      ) : route.tightDays.length > 0 ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
          ⚠️ Vas con prisa el{' '}
          {route.tightDays.map((d) => DAY_NAMES[d.day].toLowerCase()).join(' y el ')}, sin margen
          para que nada se alargue.
        </p>
      ) : (
        route.placed > 0 && (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            ✅ Los cuatro días van a ritmo tranquilo.
          </p>
        )
      )}

      {/* Los cuatro días */}
      <div className="grid gap-3 md:grid-cols-2">
        {route.days.map((d) => (
          <DayCard
            key={d.day}
            load={d}
            editing={editing}
            dragOver={dragOver === d.day}
            onEdit={setEditing}
            onSetDay={onSetDay}
            onDragOverDay={setDragOver}
          />
        ))}
      </div>

      {/* Lo que se queda fuera, en corto */}
      {missing.length > 0 && (
        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
          <h3 className="text-sm font-bold text-white">Te dejas fuera {missing.length} cosas</h3>
          <p className="mt-1 text-xs text-slate-400">
            Las tres que más quiere el grupo: {missing.slice(0, 3).map((t) => t.idea.title).join(', ')}.
          </p>
          <button
            onClick={onReview}
            className="mt-3 min-h-12 w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Repasar las {missing.length} que faltan
          </button>
        </div>
      )}

      {/* Coincidencias */}
      {withRoute.length >= 2 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <h3 className="text-sm font-bold text-white">En qué coincidís</h3>
          <p className="mt-1 text-xs text-slate-400">
            Han mandado ruta {withRoute.length} de 4. Lo que sale en todas ya no hay que discutirlo.
          </p>
          <ul className="mt-3 space-y-1.5">
            {agreement
              .filter((a) => a.people.length >= 2)
              .slice(0, 12)
              .map((a) => (
                <li key={a.idea.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-slate-200">{a.idea.title}</span>
                  <span className="shrink-0">
                    {a.people.length === withRoute.length ? (
                      <span className="font-medium text-emerald-300">
                        en las {withRoute.length}
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {a.people.length} de {withRoute.length}
                      </span>
                    )}
                    {a.sameDay && <span className="ml-1.5 text-sky-300">{DAY_SHORT[a.sameDay]}</span>}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <button
        onClick={onRestart}
        className="w-full py-2 text-xs font-medium text-slate-500 underline decoration-dotted hover:text-slate-300"
      >
        Empezar de nuevo desde otro plan
      </button>
    </div>
  )
}

function DayCard({
  load,
  editing,
  dragOver,
  onEdit,
  onSetDay,
  onDragOverDay,
}: {
  load: DayLoad
  editing: string | null
  dragOver: boolean
  onEdit: (id: string | null) => void
  onSetDay: (ideaId: string, day: TripDay | null) => void
  onDragOverDay: (day: TripDay | null) => void
}) {
  const meta = PACE_META[load.pace]
  const pct = Math.min(100, (load.hours / load.hard) * 100)
  const comfortPct = (load.comfort / load.hard) * 100

  return (
    <div
      // Arrastrar y soltar es un extra de escritorio: en móvil todo se hace
      // con toques, que es más fiable con el dedo.
      onDragOver={(e) => {
        e.preventDefault()
        onDragOverDay(load.day)
      }}
      onDragLeave={() => onDragOverDay(null)}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        if (id) onSetDay(id, load.day)
        onDragOverDay(null)
      }}
      className={`rounded-2xl border p-4 transition ${
        dragOver ? 'border-orange-400 bg-orange-500/10' : 'border-white/10 bg-slate-900/50'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-base font-bold text-white">{DAY_NAMES[load.day]}</p>
        <p className={`text-xs font-medium ${meta.text}`}>{meta.label}</p>
      </div>

      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${meta.bar}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 h-full w-px bg-white/50"
          style={{ left: `${comfortPct}%` }}
          title={`Tope cómodo: ${load.comfort} h`}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {load.hours} h de {load.comfort} cómodas
        {load.cost > 0 && ` · ${formatEuro(load.cost)}`}
      </p>

      <ul className="mt-3 space-y-1.5">
        {load.ideas.map((i) => (
          <li key={i.id}>
            <button
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', i.id)}
              onClick={() => onEdit(editing === i.id ? null : i.id)}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition lg:cursor-grab ${
                editing === i.id ? 'bg-orange-500/20' : 'bg-black/25 hover:bg-black/40'
              }`}
            >
              <span className="min-w-0 text-sm text-slate-200">{i.title}</span>
              <span className="shrink-0 text-xs text-slate-500">
                {i.scheduleHours ?? i.hours ?? 0} h
              </span>
            </button>

            {editing === i.id && (
              <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                {TRIP_DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      onSetDay(i.id, d)
                      onEdit(null)
                    }}
                    className={`min-h-11 rounded-lg text-xs font-semibold transition ${
                      d === load.day
                        ? 'bg-orange-500 text-slate-950'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {DAY_SHORT[d]}
                  </button>
                ))}
                <button
                  onClick={() => {
                    onSetDay(i.id, null)
                    onEdit(null)
                  }}
                  aria-label={`Quitar ${i.title}`}
                  className="min-h-11 rounded-lg bg-rose-500/15 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30"
                >
                  Quitar
                </button>
              </div>
            )}
          </li>
        ))}
        {load.ideas.length === 0 && (
          <li className="py-3 text-center text-xs text-slate-600">
            Nada este día
            <span className="hidden lg:inline"> · arrastra algo aquí</span>
          </li>
        )}
      </ul>
    </div>
  )
}
