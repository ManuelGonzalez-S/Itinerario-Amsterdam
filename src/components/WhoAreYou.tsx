import { useState } from 'react'
import { AVATARS } from '../hooks/useIdentity'

interface Props {
  onIdentify: (name: string, emoji: string) => void
  alreadyVoting: { name: string; emoji: string }[]
}

/** Pantalla inicial: sin login, solo el nombre para saber de quién es cada voto. */
export function WhoAreYou({ onIdentify, alreadyVoting }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(AVATARS[0])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <p className="text-5xl">🚲</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Ámsterdam</h1>
        <p className="mt-1 text-lg font-medium text-orange-300">24 – 27 de septiembre</p>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Antes de montar el itinerario, decidimos entre los cuatro qué queremos hacer. Di quién
          eres y empezamos.
        </p>
      </div>

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Tu nombre
      </label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onIdentify(name, emoji)
        }}
        placeholder="Manu"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white outline-none placeholder:text-slate-600 focus:border-orange-400/60 focus:bg-white/10"
      />

      <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Tu bicho
      </p>
      <div className="grid grid-cols-8 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            onClick={() => setEmoji(a)}
            aria-label={`Elegir ${a}`}
            aria-pressed={emoji === a}
            className={`aspect-square rounded-lg text-xl transition ${
              emoji === a
                ? 'bg-orange-500/25 ring-2 ring-orange-400'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <button
        onClick={() => onIdentify(name, emoji)}
        disabled={!name.trim()}
        className="mt-8 w-full rounded-xl bg-orange-500 px-4 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
      >
        Empezar a votar
      </button>

      {alreadyVoting.length > 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Ya han votado:{' '}
          {alreadyVoting.map((v) => (
            <span key={v.name} className="mx-0.5 whitespace-nowrap">
              {v.emoji} {v.name}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
