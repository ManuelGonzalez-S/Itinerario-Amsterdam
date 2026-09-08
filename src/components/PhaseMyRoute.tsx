import { useMemo, useState } from 'react'
import type { Tally, TripDay, VoteDoc } from '../types'
import { CATEGORIES } from '../data/ideas'
import { DAY_NAMES, PLANS } from '../data/plans'
import { formatEuro } from '../lib/scoring'
import {
  PACE_META,
  SLACK_HOURS,
  TRIP_DAYS,
  availableIdeas,
  compareRoutes,
  itineraryFromPlan,
  missingFromRoute,
  summarizeRoute,
  vetoedIdeas,
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

export function PhaseMyRoute({ mine, docs, tallies, onSetDay, onReplace }: Props) {
  const [showVetoed, setShowVetoed] = useState(false)
  const itinerary = mine.itinerary ?? {}
  const empty = Object.keys(itinerary).length === 0

  const route = useMemo(() => summarizeRoute(itinerary), [itinerary])
  const missing = useMemo(() => missingFromRoute(itinerary, tallies), [itinerary, tallies])
  const pool = useMemo(() => availableIdeas(tallies), [tallies])
  const vetoed = useMemo(() => vetoedIdeas(tallies), [tallies])
  const { withRoute, agreement } = useMemo(() => compareRoutes(docs), [docs])

  const byCategory = useMemo(() => {
    const groups = new Map<string, typeof pool>()
    for (const idea of pool) {
      const list = groups.get(idea.category) ?? []
      list.push(idea)
      groups.set(idea.category, list)
    }
    return [...groups.entries()]
  }, [pool])

  return (
    <div className="space-y-4">
      {/* Explicación y arranque */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">Tu ruta ideal</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400 lg:text-sm">
          Coloca cada cosa en el día que tú harías y manda tu versión. Se guarda sola y los otros
          tres la ven al momento.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 lg:text-sm">
          Va midiendo las dos cosas que pedisteis a la vez: que{' '}
          <strong className="text-emerald-300">no vayáis apretados</strong> —cada día tiene un tope
          cómodo que deja {SLACK_HOURS} h libres para perderse o alargar una terraza— y que{' '}
          <strong className="text-sky-300">no os dejéis cosas</strong>, con la lista de lo que se
          queda fuera abajo. Las dos tiran en direcciones opuestas: la gracia es ver dónde lo dejas.
        </p>

        <p className="mt-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {empty ? 'Empezar desde un plan' : 'Reemplazar por un plan'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => onReplace(itineraryFromPlan(p.id))}
              className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            >
              {p.name}
            </button>
          ))}
          {!empty && (
            <button
              onClick={() => onReplace({})}
              className="rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
            >
              Vaciar
            </button>
          )}
        </div>
      </section>

      {/* Resumen de la ruta */}
      {!empty && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="por persona" value={formatEuro(route.totalCost)} />
          <Stat label="horas en total" value={`${route.totalHours} h`} />
          <Stat label="cosas colocadas" value={String(route.placed)} />
        </div>
      )}

      {route.impossibleDays.length > 0 && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs leading-relaxed text-rose-200">
          🚫 No cabe el{' '}
          {route.impossibleDays
            .map((d) => `${DAY_NAMES[d.day].toLowerCase()} (${d.hours} h de ${d.hard} posibles)`)
            .join(' ni el ')}
          . Hay que mover algo a otro día o quitarlo.
        </p>
      )}

      {route.impossibleDays.length === 0 && route.tightDays.length > 0 && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          ⚠️ Cabe, pero vais con prisa el{' '}
          {route.tightDays
            .map((d) => `${DAY_NAMES[d.day].toLowerCase()} (${d.hours} h, cómodo hasta ${d.comfort})`)
            .join(' y el ')}
          . Sin margen para que nada se alargue.
        </p>
      )}

      {/* Los cuatro días */}
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {route.days.map((d) => {
          const meta = PACE_META[d.pace]
          const pct = Math.min(100, (d.hours / d.hard) * 100)
          const comfortPct = (d.comfort / d.hard) * 100
          return (
            <div key={d.day} className="rounded-2xl border border-white/10 bg-slate-900/50 p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-white">{DAY_NAMES[d.day]}</p>
                <p className={`text-xs font-medium ${meta.text}`}>{meta.label}</p>
              </div>

              {/* La marca gris es el tope cómodo, el final de la barra el tope real */}
              <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${meta.bar}`}
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-0 h-full w-px bg-white/50"
                  style={{ left: `${comfortPct}%` }}
                  title={`Tope cómodo: ${d.comfort} h`}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {d.hours} h · cómodo hasta {d.comfort} h · máximo {d.hard} h
                {d.cost > 0 && ` · ${formatEuro(d.cost)}`}
              </p>

              <ul className="mt-2.5 space-y-1.5">
                {d.ideas.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-2 text-xs">
                    <span className="min-w-0 text-slate-200">
                      {i.title}
                      <span className="ml-1 text-slate-500">{i.hours ?? 0} h</span>
                    </span>
                    <button
                      onClick={() => onSetDay(i.id, null)}
                      aria-label={`Quitar ${i.title}`}
                      className="shrink-0 text-slate-600 transition hover:text-rose-300"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {d.ideas.length === 0 && (
                  <li className="py-2 text-xs text-slate-600">Nada todavía</li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Lo que te dejas fuera */}
      {missing.length > 0 && (
        <section className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
          <h2 className="text-sm font-bold text-white lg:text-base">
            Te dejas fuera {missing.length} cosas
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Ordenadas por cuánto las quiere el grupo. Las de arriba son las que más va a doler
            perderse.
          </p>
          <ul className="mt-3 space-y-1.5">
            {missing.slice(0, 12).map((t) => (
              <li key={t.idea.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-slate-300">
                  {t.idea.title}
                  <span className="ml-1.5 text-slate-500">
                    {t.yes} sí · {t.maybe} qz{t.points > 0 && ` · ${t.points} pts`}
                  </span>
                </span>
                <DayPicker current={undefined} onPick={(day) => onSetDay(t.idea.id, day)} />
              </li>
            ))}
          </ul>
          {missing.length > 12 && (
            <p className="mt-2 text-xs text-slate-500">
              Y {missing.length - 12} más en la lista completa de abajo.
            </p>
          )}
        </section>
      )}

      {/* Repertorio completo */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">Todo lo que puedes colocar</h2>
        <p className="mt-1 text-xs text-slate-400">
          Las {pool.length} ideas que nadie ha vetado. Toca un día para ponerla ahí; tócalo otra vez
          para quitarla.
        </p>

        <div className="mt-3.5 space-y-4">
          {byCategory.map(([cat, ideas]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-slate-400">
                {CATEGORIES[cat as keyof typeof CATEGORIES].emoji}{' '}
                {CATEGORIES[cat as keyof typeof CATEGORIES].label}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {ideas.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-2.5 py-1.5"
                  >
                    <span className="min-w-0 text-xs">
                      <span className="text-slate-200">{i.title}</span>
                      <span className="ml-1.5 text-slate-500">
                        {i.hours ?? 0} h{i.price ? ` · ${formatEuro(i.price)}` : ' · gratis'}
                      </span>
                    </span>
                    <DayPicker
                      current={itinerary[i.id]}
                      onPick={(day) => onSetDay(i.id, itinerary[i.id] === day ? null : day)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Las vetadas, por si alguien quiere reabrir el debate a sabiendas */}
        {vetoed.length > 0 && (
          <>
            <button
              onClick={() => setShowVetoed(!showVetoed)}
              className="mt-4 text-xs font-medium text-slate-500 underline decoration-dotted hover:text-slate-300"
            >
              {showVetoed ? 'Ocultar' : `Ver las ${vetoed.length} vetadas`}
            </button>
            {showVetoed && (
              <div className="mt-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                <p className="text-xs leading-relaxed text-rose-200/80">
                  Estas tienen un «no» de alguien. Puedes meterlas igual si crees que merece
                  discutirse, pero quedará marcado quién las rechazó.
                </p>
                <ul className="mt-2.5 space-y-1.5">
                  {vetoed.map((t) => (
                    <li key={t.idea.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate">
                        <span className="text-slate-300">{t.idea.title}</span>
                        <span className="ml-1.5 text-rose-400">no: {t.vetoedBy.join(', ')}</span>
                      </span>
                      <DayPicker
                        current={itinerary[t.idea.id]}
                        onPick={(day) =>
                          onSetDay(t.idea.id, itinerary[t.idea.id] === day ? null : day)
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* Comparación entre rutas */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">Las rutas de los demás</h2>
        {withRoute.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            Todavía nadie ha mandado su ruta. Sé el primero y los demás verán por dónde vas.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-slate-400">
              Han mandado su ruta {withRoute.length} de 4:{' '}
              {withRoute.map((d) => `${d.emoji} ${d.name}`).join(', ')}.
            </p>

            {withRoute.length >= 2 && (
              <>
                <p className="mt-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Coincidencias
                </p>
                <ul className="mt-2 space-y-1.5">
                  {agreement
                    .filter((a) => a.people.length >= 2)
                    .slice(0, 20)
                    .map((a) => (
                      <li key={a.idea.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate text-slate-200">{a.idea.title}</span>
                        <span className="shrink-0 text-slate-500">
                          {a.people.length === withRoute.length ? (
                            <span className="font-medium text-emerald-300">
                              en las {withRoute.length}
                            </span>
                          ) : (
                            `${a.people.length} de ${withRoute.length}`
                          )}
                          {a.sameDay && (
                            <span className="ml-1.5 text-sky-300">· {DAY_SHORT[a.sameDay]}</span>
                          )}
                        </span>
                      </li>
                    ))}
                </ul>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                  Lo que sale «en las {withRoute.length}» ya no hay que discutirlo: eso es el
                  itinerario. El resto es la conversación que queda.
                </p>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function DayPicker({
  current,
  onPick,
}: {
  current: TripDay | undefined
  onPick: (day: TripDay) => void
}) {
  return (
    <div className="flex shrink-0 gap-1">
      {TRIP_DAYS.map((d) => (
        <button
          key={d}
          onClick={() => onPick(d)}
          aria-pressed={current === d}
          title={DAY_NAMES[d]}
          className={`rounded px-1.5 py-1 text-[10px] font-semibold transition ${
            current === d
              ? 'bg-orange-500 text-slate-950'
              : 'bg-white/5 text-slate-500 hover:bg-white/15 hover:text-slate-200'
          }`}
        >
          {DAY_SHORT[d]}
        </button>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
