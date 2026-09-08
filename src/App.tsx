import { useState } from 'react'
import type { Idea } from './types'
import { IDEAS_BY_ID } from './data/ideas'
import {
  DAY_NAMES,
  PLAN_SUMMARIES,
  daysUntilTrip,
  formatEuro,
  slotIdea,
  slotPrice,
  whatsappText,
  type PlanSummary,
} from './lib/plan'

/**
 * La página es el mensaje: tres itinerarios completos y una sola pregunta,
 * ¿A, B o C? La decisión se toma en el grupo de WhatsApp, no aquí, así que no
 * hay nada que votar ni guardar. Eso permitió quitar Firebase entero.
 */
export default function App() {
  const [activo, setActivo] = useState(0)
  // 'fallo' importa: el portapapeles se puede denegar (sin HTTPS, permisos,
  // pestaña sin foco) y un botón de copiar que no avisa cuando no copia es
  // peor que no tenerlo.
  const [copia, setCopia] = useState<'no' | 'si' | 'fallo'>('no')
  const dias = daysUntilTrip()
  const plan = PLAN_SUMMARIES[activo]
  const barato = PLAN_SUMMARIES.reduce((a, b) => (b.cost < a.cost ? b : a))

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
    <div className="mx-auto max-w-3xl px-5 pb-16">
      <header className="pt-10 pb-6 text-center">
        <p className="text-4xl">🚲</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Ámsterdam</h1>
        <p className="mt-1 text-lg font-medium text-slate-300">24 – 27 de septiembre</p>
        <p className="mt-1 text-sm font-semibold text-orange-300">
          {dias > 1 ? `Quedan ${dias} días` : dias === 1 ? 'Es mañana' : '¡Ya estamos!'}
        </p>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400">
          Tres itinerarios completos, sacados de lo que votamos los cuatro. Ninguno mete nada que
          alguien haya rechazado. <strong className="text-slate-200">Elegid uno por el grupo.</strong>
        </p>
      </header>

      {/* Lo urgente, antes que nada */}
      <section className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 sm:p-5">
        <h2 className="text-base font-bold text-rose-200">⚠️ Esto no puede esperar</h2>
        <p className="mt-2 text-sm leading-relaxed text-rose-100/90">
          La <strong>Casa de Ana Frank</strong> está en los tres planes y quedan {dias} días. Solo
          se vende en su web, no hay taquilla ni lista de espera, y las entradas de nuestras fechas
          salieron el <strong>11 de agosto</strong>. Hay que mirar hoy: si queda algo serán horas de
          noche.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://www.annefrank.org/en/museum/tickets/"
            target="_blank"
            rel="noreferrer"
            className="min-h-11 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Comprar Ana Frank ↗
          </a>
          <a
            href="https://www.vangoghmuseum.nl/en/visit/tickets-and-ticket-prices"
            target="_blank"
            rel="noreferrer"
            className="min-h-11 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/20"
          >
            Van Gogh (plan B) ↗
          </a>
        </div>
      </section>

      {/* Comparación de un vistazo */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {PLAN_SUMMARIES.map((s, i) => (
          <button
            key={s.plan.id}
            onClick={() => setActivo(i)}
            aria-pressed={activo === i}
            className={`min-h-20 rounded-2xl border px-2 py-3 text-center transition ${
              activo === i
                ? 'border-orange-400 bg-orange-500/15'
                : 'border-white/10 bg-slate-900/50 hover:bg-slate-900'
            }`}
          >
            <span className="block text-xs font-semibold text-slate-500">PLAN {s.letra}</span>
            <span className="mt-0.5 block text-sm leading-tight font-bold text-white">
              {s.plan.name}
            </span>
            <span
              className={`mt-1 block text-sm font-semibold ${
                s === barato ? 'text-emerald-300' : 'text-slate-400'
              }`}
            >
              {formatEuro(s.cost)}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        Por persona, sin vuelos ni hotel. Incluye entradas, comidas y transporte.
      </p>

      {/* El plan elegido, al detalle */}
      <PlanDetalle key={plan.plan.id} plan={plan} />

      {/* Copiar para el grupo */}
      <button
        onClick={copiar}
        className="mt-8 min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
      >
        {copia === 'si' ? '✅ Copiado, pégalo en el grupo' : '📋 Copiar los tres planes para WhatsApp'}
      </button>

      {/* Si el navegador no deja copiar, al menos que el texto esté a mano */}
      {copia === 'fallo' && (
        <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs leading-relaxed text-amber-200">
            Tu navegador no ha dejado copiar automáticamente. Selecciona el texto de aquí abajo y
            cópialo a mano.
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

      {/* La buena letra, para quien quiera entrar al detalle */}
      <details className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-300">
          La buena letra: abonos, tiempo y aeropuerto
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            <strong className="text-slate-200">Abonos.</strong> El abono GVB de 72 h cuesta 21,50 €
            y es solo transporte. La I amsterdam City Card sale desde 67 € por 24 h e incluye
            transporte, un crucero y más de 70 museos, pero deja fuera justo el Van Gogh y Ana
            Frank. El Museumkaart (75 €) sí los incluye, pero salió descartado por unanimidad en la
            votación. Con el Rijksmuseum también descartado, lo que sale a cuenta es{' '}
            <strong className="text-slate-200">GVB + entradas sueltas</strong>.
          </p>
          <p>
            <strong className="text-slate-200">Del aeropuerto al centro.</strong> Tren directo
            Schiphol – Centraal en 17 minutos por unos 6 € por persona. Un taxi son 45-55 € para
            los cuatro. Los trenes NS no entran ni en el abono GVB ni en la City Card.
          </p>
          <p>
            <strong className="text-slate-200">El tiempo.</strong> Finales de septiembre: unos 17-18
            °C de día, 11 °C de noche y lluvia intermitente casi garantizada algún rato.
            Chubasquero mejor que paraguas, porque hace viento.
          </p>
          <p>
            <strong className="text-slate-200">Fechas que aprietan.</strong> El mercado Albert Cuyp
            cierra los domingos. El festival Craft in Focus del NDSM es solo el 26 y el 27. El Van
            Gogh abre hasta las 21:00 únicamente los viernes, que es su mejor momento y el más
            vacío. NEMO cierra a las 17:30.
          </p>
        </div>
      </details>

      <p className="mt-8 text-center text-xs text-slate-600">
        Precios y horarios comprobados en las webs oficiales en septiembre de 2026.
      </p>
    </div>
  )
}

function PlanDetalle({ plan }: { plan: PlanSummary }) {
  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
        <h2 className="text-xl font-bold text-white">
          Plan {plan.letra} · {plan.plan.name}
        </h2>
        <p className="mt-0.5 text-sm font-medium text-orange-300">{plan.plan.tagline}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{plan.plan.thesis}</p>
        <p className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5 text-sm leading-relaxed text-slate-400">
          <strong className="text-slate-200">Qué deja fuera:</strong> {plan.plan.tradeoff}
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {plan.days.map((d) => (
          <div key={d.day} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-base font-bold text-white">
                {DAY_NAMES[d.day]}
                <span className="ml-2 text-sm font-normal text-slate-500">{d.title}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {d.hours} h de {d.available} · {formatEuro(d.cost)}
              </p>
            </div>

            <ol className="mt-3 space-y-2.5">
              {d.slots.map((s, i) => {
                const idea = slotIdea(s)
                const precio = slotPrice(s)
                return (
                  <li key={`${d.day}-${i}`} className="flex gap-3">
                    <span className="w-12 shrink-0 pt-0.5 text-sm font-medium tabular-nums text-slate-500">
                      {s.time}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-sm text-slate-200">
                        {s.label ?? idea?.title}
                      </span>
                      {precio > 0 && (
                        <span className="ml-2 text-xs text-slate-500">{formatEuro(precio)}</span>
                      )}
                      {s.ticket && (
                        <span className="ml-2 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-medium text-sky-300">
                          entrada
                        </span>
                      )}
                      {s.note && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {s.note}
                        </span>
                      )}
                      {idea?.url && <Enlace idea={idea} />}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

function Enlace({ idea }: { idea: Idea }) {
  // Solo enseñamos el enlace donde de verdad hace falta comprar o mirar hora.
  if (!idea.needsBooking || !IDEAS_BY_ID.has(idea.id)) return null
  return (
    <a
      href={idea.url}
      target="_blank"
      rel="noreferrer"
      className="mt-0.5 block text-xs font-medium text-sky-300 hover:text-sky-200"
    >
      Comprar o ver horarios ↗
    </a>
  )
}
