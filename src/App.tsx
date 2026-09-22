import { useMemo, useState } from 'react'
import type { TripDay } from './types'
import { Mapa } from './components/Mapa'
import {
  COSTE_TOTAL,
  DAY_COLOR,
  DAY_NAMES,
  DAY_SHORT,
  ITINERARIO,
  PLAN,
  daysUntilTrip,
  diaDeHoy,
  formatEuro,
  whatsappText,
  type Parada,
} from './lib/plan'

/**
 * La página es el itinerario: un plan cerrado, un mapa con los sitios de cada
 * día y la lista hora a hora. Nada que votar ni elegir; solo seguirlo.
 */
export default function App() {
  const hoy = diaDeHoy()
  const [dia, setDia] = useState<TripDay | 'todo'>(hoy ?? 'jue24')
  const [activa, setActiva] = useState<string | null>(null)
  const [copia, setCopia] = useState<'no' | 'si' | 'fallo'>('no')
  const dias = daysUntilTrip()

  const visibles = useMemo(
    () => (dia === 'todo' ? ITINERARIO : ITINERARIO.filter((d) => d.day === dia)),
    [dia],
  )
  const paradas = useMemo(() => visibles.flatMap((d) => d.paradas), [visibles])
  const aproximadas = paradas.filter((p) => p.coords && p.approx).length

  async function copiar() {
    try {
      await navigator.clipboard.writeText(whatsappText())
      setCopia('si')
      window.setTimeout(() => setCopia('no'), 2500)
    } catch {
      setCopia('fallo')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-5">
      <header className="pt-8 pb-5 text-center">
        <p className="text-4xl">🚲</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Ámsterdam</h1>
        <p className="mt-1 text-base font-medium text-slate-300">24 – 27 de septiembre</p>
        <p className="mt-1 text-sm font-semibold text-orange-300">
          {hoy
            ? `Hoy es ${DAY_NAMES[hoy].toLowerCase()}`
            : dias > 1
              ? `Quedan ${dias} días`
              : dias === 1
                ? 'Salimos mañana'
                : '¡Ya estamos!'}
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Plan <strong className="text-slate-200">{PLAN.name}</strong> ·{' '}
          {formatEuro(COSTE_TOTAL)} por persona
        </p>
      </header>

      {/* El único punto fijo */}
      <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-100">
        ✅ <strong>Van Gogh reservado:</strong> viernes 25 a las <strong>11:15</strong>. Todo lo
        demás se puede mover.
      </p>

      {/* Selector de día */}
      <nav className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Días del viaje">
        {ITINERARIO.map((d) => {
          const activo = dia === d.day
          return (
            <button
              key={d.day}
              onClick={() => {
                setDia(d.day)
                setActiva(null)
              }}
              aria-pressed={activo}
              className={`min-h-16 rounded-xl border px-1 py-2 transition ${
                activo ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/5'
              }`}
            >
              <span
                className={`mx-auto block size-2.5 rounded-full ${DAY_COLOR[d.day].bg}`}
                aria-hidden
              />
              <span className="mt-1 block text-xs font-bold text-white">
                {DAY_SHORT[d.day].split(' ')[0]}
              </span>
              <span className="block text-[11px] text-slate-500">
                {DAY_SHORT[d.day].split(' ')[1]}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => {
            setDia('todo')
            setActiva(null)
          }}
          aria-pressed={dia === 'todo'}
          className={`min-h-16 rounded-xl border px-1 py-2 transition ${
            dia === 'todo' ? 'border-white/30 bg-white/10' : 'border-white/10 hover:bg-white/5'
          }`}
        >
          <span className="mx-auto block size-2.5 rounded-full bg-slate-400" aria-hidden />
          <span className="mt-1 block text-xs font-bold text-white">Todo</span>
          <span className="block text-[11px] text-slate-500">4 días</span>
        </button>
      </nav>

      {/* Mapa */}
      <div className="mt-4">
        <Mapa paradas={paradas} activa={activa} onSelect={setActiva} />
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Toca un número, en el mapa o en la lista, para localizarlo. Los marcadores orientan; el
          enlace «Cómo llegar» de cada parada abre Google Maps, que es lo que te lleva de verdad.
          {aproximadas > 0 && (
            <> Los marcadores de borde discontinuo son aproximados: de esos solo conozco el barrio.</>
          )}
        </p>
      </div>

      {/* Itinerario */}
      <div className="mt-6 space-y-6">
        {visibles.map((d) => (
          <section key={d.day}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <span className={`size-3 rounded-full ${DAY_COLOR[d.day].bg}`} aria-hidden />
                {DAY_NAMES[d.day]}
                <span className="text-sm font-normal text-slate-500">{d.title}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {d.hours} h · {formatEuro(d.cost)}
              </p>
            </div>

            <ol className="mt-3 space-y-1.5">
              {d.paradas.map((p) => (
                <ParadaFila
                  key={p.key}
                  parada={p}
                  activa={activa === p.key}
                  onSelect={() => setActiva(activa === p.key ? null : p.key)}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>

      {/* Compartir */}
      <button
        onClick={copiar}
        className="mt-8 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
      >
        {copia === 'si' ? '✅ Copiado, pégalo en el grupo' : '📋 Copiar el itinerario para WhatsApp'}
      </button>

      {copia === 'fallo' && (
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs leading-relaxed text-amber-200">
            Tu navegador no ha dejado copiar automáticamente. Selecciona el texto y cópialo a mano.
          </p>
          <textarea
            readOnly
            rows={10}
            value={whatsappText()}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-2.5 w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-slate-300"
          />
        </div>
      )}

      {/* La buena letra */}
      <details className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-300">
          La buena letra: transporte, tiempo y lo que se quedó fuera
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            <strong className="text-slate-200">Transporte.</strong> El abono GVB de 72 h cuesta
            21,50 € y es solo transporte. La City Card no compensa: deja fuera el Van Gogh, que ya
            está pagado, y el Rijksmuseum y el Museumkaart salieron descartados en la votación. Lo
            que sale a cuenta es <strong className="text-slate-200">GVB + entradas sueltas</strong>.
            Del aeropuerto al centro, tren directo en 17 minutos por unos 6 €; los trenes NS no
            entran en el abono.
          </p>
          <p>
            <strong className="text-slate-200">El tiempo.</strong> Finales de septiembre: unos 17-18
            °C de día, 11 °C de noche y lluvia intermitente casi garantizada algún rato. Chubasquero
            mejor que paraguas, porque hace viento.
          </p>
          <p>
            <strong className="text-slate-200">Horarios que aprietan.</strong> El mercado Albert
            Cuyp cierra a las 17:00 y no abre los domingos, por eso va el viernes. El festival Craft
            in Focus del NDSM solo es sábado y domingo. El A'DAM Lookout admite entrada hasta las
            21:00.
          </p>
          <p>
            <strong className="text-slate-200">Se quedó fuera.</strong> La Casa de Ana Frank, porque
            no quedan entradas para nuestras fechas. Si alguien quiere intentarlo, hay webs que
            dicen que liberan un 20 % del aforo a las 09:00 del mismo día, pero{' '}
            <strong className="text-slate-200">su web oficial no lo menciona</strong>: no contéis
            con ello.
          </p>
          <p>
            <strong className="text-slate-200">Sin confirmar.</strong> De{' '}
            <strong className="text-slate-200">Brittons</strong> y de las tiendas{' '}
            <strong className="text-slate-200">Secondlife, Just Waldo y Love Storie Archive</strong>{' '}
            no encontré dirección ni horarios, así que no están en el itinerario. Muchas tiendas
            vintage abren sobre las 12:00 y cierran los lunes. La vintage que sí está localizada es
            Millesime, en Leidsestraat 64-66.
          </p>
        </div>
      </details>

      <p className="mt-8 text-center text-xs text-slate-600">
        Precios y horarios comprobados en las webs oficiales en septiembre de 2026.
      </p>
    </div>
  )
}

function ParadaFila({
  parada,
  activa,
  onSelect,
}: {
  parada: Parada
  activa: boolean
  onSelect: () => void
}) {
  const c = DAY_COLOR[parada.day]
  const tieneDetalle = !!(parada.note || parada.idea?.address || parada.maps)

  return (
    <li
      className={`rounded-xl border transition ${
        activa ? 'border-white/25 bg-white/10' : 'border-transparent bg-slate-900/40'
      }`}
    >
      <button
        onClick={onSelect}
        aria-expanded={activa}
        className="flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="w-11 shrink-0 text-sm font-medium tabular-nums text-slate-400">
          {parada.time}
        </span>

        {parada.n > 0 ? (
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-slate-950"
            style={
              parada.approx ? { border: `2px dashed ${c.hex}`, color: c.hex } : { background: c.hex }
            }
            aria-hidden
          >
            {parada.n}
          </span>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-white">{parada.title}</span>
          {(parada.price > 0 || parada.ticket) && (
            <span className="mt-0.5 block text-xs text-slate-500">
              {parada.price > 0 && formatEuro(parada.price)}
              {parada.ticket && (
                <span className="ml-1.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                  entrada
                </span>
              )}
            </span>
          )}
        </span>

        {tieneDetalle && (
          <span className="shrink-0 text-xs text-slate-600" aria-hidden>
            {activa ? '−' : '+'}
          </span>
        )}
      </button>

      {activa && tieneDetalle && (
        <div className="space-y-1.5 border-t border-white/10 px-3 py-2.5 sm:pl-[4.75rem]">
          {parada.idea?.address && (
            <p className="text-xs text-slate-400">
              📍 {parada.idea.address}
              {parada.approx && <span className="text-slate-600"> (aproximado)</span>}
            </p>
          )}
          {parada.note && <p className="text-xs leading-relaxed text-slate-500">{parada.note}</p>}
          <div className="flex flex-wrap gap-3 pt-0.5">
            {parada.maps && (
              <a
                href={parada.maps}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-sky-300 hover:text-sky-200"
              >
                Cómo llegar ↗
              </a>
            )}
            {parada.idea?.url && (
              <a
                href={parada.idea.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-sky-300 hover:text-sky-200"
              >
                Web oficial ↗
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
