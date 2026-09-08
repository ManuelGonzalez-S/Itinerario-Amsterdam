import { useMemo, useState } from 'react'
import { useIdentity } from './hooks/useIdentity'
import { useVotes } from './hooks/useVotes'
import { tallyAll, POINTS_BUDGET, countIdeaVotes } from './lib/scoring'
import { IDEAS } from './data/ideas'
import { WhoAreYou } from './components/WhoAreYou'
import { PhaseTriage } from './components/PhaseTriage'
import { PhasePoints } from './components/PhasePoints'
import { Results } from './components/Results'
import { PhasePlans } from './components/PhasePlans'
import { Briefing } from './components/Briefing'

type Tab = 'planes' | 'votar' | 'puntos' | 'resultados' | 'info'

const TABS: { id: Tab; label: string; emoji: string; hint: string }[] = [
  { id: 'planes', label: 'Planes', emoji: '🗺️', hint: 'Los 4 planes a debate' },
  { id: 'votar', label: 'Votar', emoji: '🗳️', hint: 'Sí, quizás o no' },
  { id: 'puntos', label: 'Puntos', emoji: '💯', hint: 'Reparte tus 100' },
  { id: 'resultados', label: 'Resultados', emoji: '🏆', hint: 'Cómo va la cosa' },
  { id: 'info', label: 'Info', emoji: '📍', hint: 'Lo que hay que saber' },
]

/** Salida del viaje: jueves 24 de septiembre de 2026. */
const TRIP_START = new Date('2026-09-24T00:00:00+02:00')

function daysUntilTrip(): number {
  return Math.ceil((TRIP_START.getTime() - Date.now()) / 86_400_000)
}

function countdownLabel(days: number): string {
  if (days > 1) return `Quedan ${days} días`
  if (days === 1) return 'Es mañana'
  if (days === 0) return '¡Es hoy!'
  return '¡Ya estamos!'
}

export default function App() {
  const { voter, identify, forget } = useIdentity()
  const votes = useVotes(voter)
  const [tab, setTab] = useState<Tab>('planes')

  const tallies = useMemo(() => tallyAll(votes.allDocs), [votes.allDocs])
  const days = daysUntilTrip()
  const votedCount = countIdeaVotes(votes.mine.triage)
  const votedPct = Math.round((votedCount / IDEAS.length) * 100)

  if (!voter) {
    return <WhoAreYou onIdentify={identify} alreadyVoting={votes.voters} />
  }

  const content = (
    <>
      {votes.error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          ⚠️ {votes.error}
        </div>
      )}

      {tab === 'planes' && (
        <PhasePlans mine={votes.mine} docs={votes.allDocs} onVote={votes.setTriage} />
      )}
      {tab === 'votar' && (
        <PhaseTriage
          tallies={tallies}
          mine={votes.mine}
          docs={votes.allDocs}
          onVote={votes.setTriage}
        />
      )}
      {tab === 'puntos' && (
        <PhasePoints
          mine={votes.mine}
          spent={votes.pointsSpent}
          onSetPoints={votes.setPoints}
          onReset={votes.resetPoints}
          onGoTriage={() => setTab('votar')}
        />
      )}
      {tab === 'resultados' && <Results tallies={tallies} docs={votes.allDocs} />}
      {tab === 'info' && <Briefing />}
    </>
  )

  return (
    <div className="mx-auto flex w-full max-w-7xl lg:gap-10 lg:px-8">
      {/* ── Barra lateral, solo en pantallas grandes ── */}
      <aside className="hidden lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:sticky lg:top-0 lg:py-8">
        <div>
          <p className="text-3xl">🚲</p>
          <h1 className="mt-2 text-2xl leading-tight font-bold text-white">Ámsterdam</h1>
          <p className="text-sm font-medium text-slate-400">24 – 27 de septiembre</p>
          <p className="mt-1 text-sm font-semibold text-orange-300">{countdownLabel(days)}</p>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
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
        </nav>

        {/* Progreso propio, siempre a la vista en escritorio */}
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/50 p-3.5">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tu progreso
            </p>
            <p className="text-sm font-bold text-orange-300">{votedPct}%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all duration-300"
              style={{ width: `${votedPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {votedCount} de {IDEAS.length} ideas · {POINTS_BUDGET - votes.pointsSpent} puntos sin
            repartir
          </p>
        </div>

        {/* Quién está votando */}
        {votes.voters.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              En la votación
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
          className="mt-auto self-start rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
        >
          {voter.emoji} {voter.name} · cambiar
        </button>
      </aside>

      {/* ── Contenido ── */}
      <div className="min-w-0 flex-1 px-5 pb-28 lg:px-0 lg:pb-12 lg:pt-8">
        {/* Cabecera, solo en móvil: en escritorio ya está en la barra lateral */}
        <header className="sticky top-0 z-20 -mx-5 mb-4 border-b border-white/5 bg-slate-950/80 px-5 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-white">
                🚲 Ámsterdam <span className="font-normal text-slate-500">24–27 sept</span>
              </h1>
              <p className="text-xs text-orange-300/90">{countdownLabel(days)}</p>
            </div>
            <button
              onClick={forget}
              title="Cambiar de persona"
              className="shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
            >
              {voter.emoji} {voter.name}
            </button>
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
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                tab === t.id ? 'text-orange-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
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
