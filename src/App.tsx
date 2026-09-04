import { useMemo, useState } from 'react'
import { useIdentity } from './hooks/useIdentity'
import { useVotes } from './hooks/useVotes'
import { tallyAll } from './lib/scoring'
import { WhoAreYou } from './components/WhoAreYou'
import { PhaseTriage } from './components/PhaseTriage'
import { PhasePoints } from './components/PhasePoints'
import { Results } from './components/Results'
import { Briefing } from './components/Briefing'

type Tab = 'votar' | 'puntos' | 'resultados' | 'info'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'votar', label: 'Votar', emoji: '🗳️' },
  { id: 'puntos', label: 'Puntos', emoji: '💯' },
  { id: 'resultados', label: 'Resultados', emoji: '🏆' },
  { id: 'info', label: 'Info', emoji: '📍' },
]

/** Salida del viaje: jueves 24 de septiembre de 2026. */
const TRIP_START = new Date('2026-09-24T00:00:00+02:00')

function daysUntilTrip(): number {
  const ms = TRIP_START.getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

export default function App() {
  const { voter, identify, forget } = useIdentity()
  const votes = useVotes(voter)
  const [tab, setTab] = useState<Tab>('votar')

  const tallies = useMemo(() => tallyAll(votes.allDocs), [votes.allDocs])
  const days = daysUntilTrip()

  if (!voter) {
    return <WhoAreYou onIdentify={identify} alreadyVoting={votes.voters} />
  }

  return (
    <div className="mx-auto max-w-lg px-5 pb-28">
      <header className="sticky top-0 z-20 -mx-5 mb-4 border-b border-white/5 bg-slate-950/80 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-white">
              🚲 Ámsterdam <span className="font-normal text-slate-500">24–27 sept</span>
            </h1>
            <p className="text-xs text-orange-300/90">
              {days > 1 ? `Quedan ${days} días` : days === 1 ? 'Es mañana' : '¡Ya estamos!'}
            </p>
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

      {votes.error && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
          ⚠️ {votes.error}
        </div>
      )}

      <main>
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
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
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
