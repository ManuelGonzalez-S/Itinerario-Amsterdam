/**
 * Pestaña de información: lo que hay que saber antes de votar y, sobre todo,
 * lo que caduca. Todos los datos salen de la investigación de fuentes
 * oficiales de septiembre de 2026 (ver README).
 */
export function Briefing() {
  return (
    <div className="space-y-4 xl:grid xl:grid-cols-2 xl:items-start xl:gap-4 xl:space-y-0">
      <section className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4 xl:col-span-2">
        <h2 className="text-sm font-bold text-rose-200 lg:text-base">🚨 Lo que caduca (mirar hoy)</h2>
        <ul className="mt-3 space-y-3 text-xs leading-relaxed text-rose-100/90 lg:text-sm xl:grid xl:grid-cols-3 xl:gap-4 xl:space-y-0">
          <li>
            <strong className="text-white">Casa de Ana Frank.</strong> Las entradas salen cada
            martes a las 10:00 CEST para seis semanas después. Las de nuestras fechas se
            liberaron el <strong>martes 11 de agosto</strong>. Los slots buenos se agotan en
            minutos, así que probablemente solo queden horas de noche (abren hasta las 22:00) o
            nada. No hay taquilla, ni lista de espera, ni reventa oficial.
          </li>
          <li>
            <strong className="text-white">Museo Van Gogh.</strong> En 2026 es todo entrada con
            hora y se agota con más de una semana de antelación. No entra en la I amsterdam City
            Card.
          </li>
          <li>
            <strong className="text-white">World Press Photo.</strong> El domingo 27, nuestro
            último día, es el último día de la exposición en De Nieuwe Kerk. Igual que la de
            Jesse Darling en la Oude Kerk.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">🎟️ Abonos: cuál sale a cuenta</h2>
        <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-300 lg:text-sm">
          <p>
            <strong className="text-white">GVB 72 h — 21,50 €.</strong> Solo transporte. Ámsterdam
            se camina y se pedalea bien, así que muchas veces ni hace falta.
          </p>
          <p>
            <strong className="text-white">I amsterdam City Card — desde 67 € / 24 h.</strong>{' '}
            Transporte ilimitado, un crucero por los canales, 4 h de bici y más de 70 museos
            (Rijksmuseum, Casa de Rembrandt, Marítimo). Deja fuera justo los dos más buscados:
            Van Gogh y Ana Frank. Solo compensa haciendo 2 o más museos incluidos cada día.
          </p>
          <p>
            <strong className="text-white">Museumkaart — 75 €.</strong> Esta sí incluye Van Gogh,
            Rijksmuseum y Ana Frank. La versión temporal para turistas se compra en el propio
            museo y vale 31 días o 5 visitas. Sale a cuenta a partir de cuatro museos grandes.
            Aunque la tarjeta cubra Ana Frank, sigue haciendo falta reservar la hora online.
          </p>
          <p className="rounded-lg bg-black/25 px-3 py-2 text-slate-400">
            Cuentas rápidas por persona: Rijksmuseum 25 € + Van Gogh 25 € + Stedelijk 22 € + Ana
            Frank 16,50 € = <strong className="text-white">88,50 €</strong>. Con Museumkaart,{' '}
            <strong className="text-white">75 €</strong>. Con City Card de 24 h, 67 € pero
            pagando Van Gogh y Ana Frank aparte.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">📅 Qué pasa esos cuatro días</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300 lg:text-sm">
          <li>
            <strong className="text-white">Jueves 24 y viernes 25</strong> son laborables: los
            museos están bastante mejor que el fin de semana. El Van Gogh abre hasta las 21:00 el
            viernes, que es su mejor momento.
          </li>
          <li>
            <strong className="text-white">Sábado 26 y domingo 27</strong> los museos se llenan.
            Mejor dejarlos para barrios, mercados y calle. Además el festival Craft in Focus cae
            justo esos dos días en el NDSM Loods, en Noord, con ferry gratis desde Centraal.
          </li>
          <li>
            <strong className="text-white">El mercado Albert Cuyp cierra los domingos</strong>, así
            que si lo queremos tiene que ser jueves, viernes o sábado.
          </li>
          <li>
            <strong className="text-white">Domingo 27 por la noche</strong>: Mystery Ensemble en la
            Posthoornkerk, 15 canciones conocidas con cuerdas y piano dentro de una iglesia.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">🌧️ El tiempo y la ropa</h2>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-300 lg:text-sm">
          Finales de septiembre en Ámsterdam: unos 17-18 °C de día, 11 °C de noche y lluvia
          intermitente casi garantizada algún rato. Chubasquero mejor que paraguas, porque hace
          viento. Y calzado cómodo: se camina mucho más de lo que parece.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <h2 className="text-sm font-bold text-white lg:text-base">✈️ Del aeropuerto al centro</h2>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-300 lg:text-sm">
          Tren directo Schiphol – Amsterdam Centraal en 17 minutos por unos 6 € por persona. Un
          taxi son 45-55 € para los cuatro, así que solo compensa con maletas grandes o a horas
          raras. Importante: los trenes NS no entran ni en el abono GVB ni en la City Card.
        </p>
      </section>

    </div>
  )
}
