import { useMemo, useState } from 'react'
import { useIdentity } from './hooks/useIdentity'
import { useVotes } from './hooks/useVotes'
import { tallyAll } from './lib/scoring'
import { WhoAreYou } from './components/WhoAreYou'
import { NextStep } from './components/NextStep'
import { PhaseVote } from './components/PhaseVote'
import { Results } from './components/Results'
import { PhasePlans } from './components/PhasePlans'
import { PhaseMyRoute } from './components/PhaseMyRoute'
import { Briefing } from './components/Briefing'

type Tab = 'ruta' | 'planes' | 'votar' | 'resultados' | 'info'

/**
 * Cuatro destinos en la barra, no seis. Votar y Puntos se fusionaron porque
 * son dos pasos de lo mismo, e Info sale del menú principal y se abre desde el
 * icono de la cabecera: es de consulta, no un paso del proceso.
 */
const TABS: { id: Tab; label: string; emoji: string; hint: string }[] = [
  { id: 'ruta', label: 'Mi ruta', emoji: '✏️', hint: 'Arma tu itinerario' },
  { id: 'planes', label: 'Planes', emoji: '🗺️', hint: 'Las 4 propuestas' },
  { id: 'votar', label: 'Votar', emoji: '🗳️', hint: 'Tus votos y puntos' },
  { id: 'resultados', label: 'Resultados', emoji: '🏆', hint: 'Cómo va la cosa' },
]

/** Salida del viaje: jueves 24 de septiembre de 2026. */
const TRIP_START = new Date('2026-09-24T00:00:00+02:00')

function countdownLabel(): string {
  const days = Math.ceil((TRIP_START.getTime() - Date.now()) / 86_400_000)
  if (days > 1) return `Quedan ${days} días`
  if (days === 1) return 'Es mañana'
  if (days === 0) return '¡Es hoy!'
  return '¡Ya estamos!'
}

export default function App() {
  const { voter, identify, forget } = useIdentity()
  const votes = useVotes(voter)
  const [tab, setTab] = useState<Tab>('ruta')

  const tallies = useMemo(() => tallyAll(votes.allDocs), [votes.allDocs])

  if (!voter) {
    return <WhoAreYou onIdentify={identify} alreadyVoting={votes.voters} />
  }

  // Hasta que no sepamos qué hay guardado, no se deja tocar nada: una
  // pulsación con el estado a medio cargar sobrescribiría los votos buenos.
  if (votes.loading) {
    return (
      <div className="grid min-h-dvh place-items-center px-5">
        <div className="text-center">
          <p className="animate-pulse text-4xl">🚲</p>
          <p className="mt-4 text-sm text-slate-400">Cargando vuestros votos…</p>
        </div>
      </div>
    )
  }

  const content = (
    <>
      {votes.error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          ⚠️ {votes.error}
        </div>
      )}

      {tab !== 'info' && (
        <NextStep mine={votes.mine} docs={votes.allDocs} onGo={(t) => setTab(t)} />
      )}

      {tab === 'ruta' && (
        <PhaseMyRoute
          mine={votes.mine}
          docs={votes.allDocs}
          tallies={tallies}
          onSetDay={votes.setItineraryDay}
          onReplace={votes.replaceItinerary}
        />
      )}
      {tab === 'planes' && (
        <PhasePlans mine={votes.mine} docs={votes.allDocs} onVote={votes.setTriage} />
      )}
      {tab === 'votar' && (
        <PhaseVote
          tallies={tallies}
          mine={votes.mine}
          docs={votes.allDocs}
          spent={votes.pointsSpent}
          onVote={votes.setTriage}
          onSetPoints={votes.setPoints}
          onResetPoints={votes.resetPoints}
        />
      )}
      {tab === 'resultados' && <Results tallies={tallies} docs={votes.allDocs} />}
      {tab === 'info' && <Briefing />}
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-7xl lg:gap-10 lg:px-8">
      {/* ── Barra lateral, solo en pantallas grandes ── */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:py-8">
        <div>
          <p className="text-3xl">🚲</p>
          <h1 className="mt-2 text-2xl leading-tight font-bold text-white">Ámsterdam</h1>
          <p className="text-sm font-medium text-slate-400">24 – 27 de septiembre</p>
          <p className="mt-1 text-sm font-semibold text-orange-300">{countdownLabel()}</p>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                tab === t.id
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {t.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block truncate text-xs text-slate-500">{t.hint}</span>
              </span>
            </button>
          ))}
          <button
            onClick={() => setTab('info')}
            aria-current={tab === 'info' ? 'page' : undefined}
            className={`mt-2 flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              tab === 'info'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              📍
            </span>
            <span className="text-sm font-semibold">Info del viaje</span>
          </button>
        </nav>

        {votes.voters.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              En el viaje
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {votes.voters.map((v) => (
                <span
                  key={v.name}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                >
                  {v.emoji} {v.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={forget}
          className="mt-auto min-h-11 self-start rounded-full bg-white/5 px-3.5 py-2 text-xs text-slate-300 transition hover:bg-white/10"
        >
          {voter.emoji} {voter.name} · cambiar
        </button>
      </aside>

      {/* ── Contenido ── */}
      <div className="min-w-0 flex-1 px-5 pb-28 lg:px-0 lg:pt-8 lg:pb-12">
        {/* Cabecera, solo en móvil: en escritorio está en la barra lateral */}
        <header className="sticky top-0 z-20 -mx-5 mb-4 border-b border-white/5 bg-slate-950/80 px-5 py-2.5 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-white">
                🚲 Ámsterdam <span className="font-normal text-slate-500">24–27 sept</span>
              </h1>
              <p className="text-xs text-orange-300/90">{countdownLabel()}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => setTab('info')}
                aria-label="Información del viaje"
                title="Información del viaje"
                className={`grid size-11 shrink-0 place-items-center rounded-full text-base transition ${
                  tab === 'info'
                    ? 'bg-orange-500/20 text-orange-300'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                📍
              </button>
              <button
                onClick={forget}
                title="Cambiar de persona"
                className="min-h-11 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"
              >
                {voter.emoji} {voter.name}
              </button>
            </div>
          </div>
        </header>

        <main>{content}</main>
      </div>

      {/* ── Barra inferior, solo en móvil ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition ${
                tab === t.id ? 'text-orange-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl leading-none" aria-hidden>
                {t.emoji}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
