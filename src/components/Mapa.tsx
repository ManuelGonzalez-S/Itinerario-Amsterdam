import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DAY_COLOR, type Parada } from '../lib/plan'
import type { Ubicacion } from '../hooks/useUbicacion'

interface Props {
  paradas: Parada[]
  /** La parada resaltada, para volar hasta ella al tocarla en la lista. */
  activa: string | null
  onSelect: (key: string | null) => void
  /** Dónde está el usuario, si ha dado permiso. */
  ubicacion: Ubicacion | null
  /** Sube de valor cada vez que se pulsa "centrar en mí". */
  centrarEnMi: number
}

/**
 * Mapa con un marcador por parada, numerado y del color de su día.
 *
 * Se usa Leaflet a pelo en vez de react-leaflet: solo hacen falta marcadores y
 * un par de vuelos, y así no entra otra dependencia. Los iconos son divIcon con
 * HTML propio, lo que además evita el clásico problema de las imágenes de
 * marcador de Leaflet con los bundlers y permite darles color.
 */
export function Mapa({ paradas, activa, onSelect, ubicacion, centrarEnMi }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const marcadores = useRef<Map<string, L.Marker>>(new Map())
  const yo = useRef<{ punto: L.Marker; halo: L.Circle } | null>(null)
  const [pista, setPista] = useState(false)
  const [grande, setGrande] = useState(false)

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!contenedor.current || mapa.current) return

    const m = L.map(contenedor.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false, // que la rueda haga scroll de la página, no zoom
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(m)

    m.setView([52.3702, 4.8952], 13)
    capa.current = L.layerGroup().addTo(m)
    mapa.current = m

    // La rueda hace zoom solo con Ctrl (o Cmd), como en los mapas incrustados
    // de Google. Sin esto, bajar por la página sobre el mapa lo desbarataba.
    // En móvil no aplica: ahí el pellizco funciona siempre.
    let ocultar: number | undefined
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // Con la API pública, no con los internos de Leaflet: setZoomAround
        // amplía hacia donde apunta el cursor, que es lo que se espera.
        const punto = m.mouseEventToLatLng(e)
        m.setZoomAround(punto, m.getZoom() + (e.deltaY < 0 ? 1 : -1))
      } else {
        setPista(true)
        window.clearTimeout(ocultar)
        ocultar = window.setTimeout(() => setPista(false), 1600)
      }
    }
    const el = m.getContainer()
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('wheel', onWheel)
      window.clearTimeout(ocultar)
      m.remove()
      mapa.current = null
      capa.current = null
      marcadores.current.clear()
      yo.current = null
    }
  }, [])

  // Repintar los marcadores cada vez que cambian las paradas
  useEffect(() => {
    const m = mapa.current
    const g = capa.current
    if (!m || !g) return

    g.clearLayers()
    marcadores.current.clear()

    const conCoords = paradas.filter((p) => p.coords)
    if (conCoords.length === 0) return

    for (const p of conCoords) {
      const color = DAY_COLOR[p.day].hex
      const icono = L.divIcon({
        className: '',
        html: `<div style="
            width:30px;height:30px;border-radius:9999px;
            background:${color};
            border:${p.approx ? `2px dashed ${color}; background:transparent;` : '2px solid rgba(2,6,23,.85);'}
            color:${p.approx ? color : '#020617'};
            display:grid;place-items:center;
            font:700 13px/1 system-ui,sans-serif;
            box-shadow:0 2px 8px rgba(0,0,0,.45);
          ">${p.n}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const marcador = L.marker(p.coords!, { icon: icono, title: p.title })
        .addTo(g)
        .bindPopup(
          `<strong>${p.time} · ${p.title}</strong>` +
            (p.idea?.address ? `<br>${p.idea.address}` : '') +
            (p.approx ? '<br><em>Posición aproximada</em>' : '') +
            (p.andando
              ? `<br><a href="${p.andando}" target="_blank" rel="noreferrer">🚶 Andando</a>`
              : '') +
            (p.transporte
              ? ` · <a href="${p.transporte}" target="_blank" rel="noreferrer">🚇 Transporte</a>`
              : ''),
        )
        .on('click', () => onSelect(p.key))

      marcadores.current.set(p.key, marcador)
    }

    // Leaflet mide el contenedor al crearlo, y en ese momento aún no tiene su
    // tamaño final: sin esto el encuadre sale disparado de zoom.
    m.invalidateSize()
    const bounds = L.latLngBounds(conCoords.map((p) => p.coords!))
    m.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 })
  }, [paradas, onSelect])

  // Dónde estoy: punto azul con su halo de precisión, como en cualquier mapa
  useEffect(() => {
    const m = mapa.current
    if (!m) return

    if (!ubicacion) {
      if (yo.current) {
        yo.current.punto.remove()
        yo.current.halo.remove()
        yo.current = null
      }
      return
    }

    const { coords, precision } = ubicacion

    if (!yo.current) {
      const icono = L.divIcon({
        className: '',
        html: `<div style="
            width:18px;height:18px;border-radius:9999px;
            background:#2563eb;border:3px solid #fff;
            box-shadow:0 0 0 2px rgba(37,99,235,.35), 0 2px 8px rgba(0,0,0,.5);
          "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      yo.current = {
        // zIndexOffset alto: el punto propio siempre por encima de las paradas.
        punto: L.marker(coords, { icon: icono, zIndexOffset: 1000 })
          .addTo(m)
          .bindPopup('Estás aquí'),
        halo: L.circle(coords, {
          radius: precision,
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(m),
      }
    } else {
      yo.current.punto.setLatLng(coords)
      yo.current.halo.setLatLng(coords).setRadius(precision)
    }
  }, [ubicacion])

  // Centrar en mí cuando se pulsa el botón
  useEffect(() => {
    if (centrarEnMi === 0 || !mapa.current || !ubicacion) return
    mapa.current.flyTo(ubicacion.coords, 16, { duration: 0.6 })
  }, [centrarEnMi, ubicacion])

  // Leaflet no se entera solo de que el contenedor ha cambiado de alto
  useEffect(() => {
    const m = mapa.current
    if (!m) return
    const t = window.setTimeout(() => m.invalidateSize(), 220)
    return () => window.clearTimeout(t)
  }, [grande])

  // Volar a la parada seleccionada desde la lista
  useEffect(() => {
    if (!activa || !mapa.current) return
    const marcador = marcadores.current.get(activa)
    if (!marcador) return
    mapa.current.flyTo(marcador.getLatLng(), 16, { duration: 0.6 })
    marcador.openPopup()
  }, [activa])

  return (
    <div className="relative">
      <div
        ref={contenedor}
        className={`w-full rounded-2xl border border-white/10 transition-[height] ${
          grande ? 'h-[70vh]' : 'h-72 sm:h-96'
        }`}
        // Leaflet pinta sus controles con z-index altos; lo acotamos para que
        // no se cuele por encima de nada del resto de la página.
        style={{ zIndex: 0, background: '#0f172a' }}
        aria-label="Mapa del itinerario"
      />

      <button
        onClick={() => setGrande((g) => !g)}
        className="absolute top-3 right-3 z-[400] min-h-9 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur transition hover:bg-slate-950"
      >
        {grande ? '↙ Reducir' : '↗ Agrandar'}
      </button>

      {pista && (
        <div className="pointer-events-none absolute inset-0 z-[400] grid place-items-center rounded-2xl bg-slate-950/60">
          <p className="rounded-xl bg-slate-950/90 px-4 py-2.5 text-sm font-medium text-slate-200">
            Usa <kbd className="rounded bg-white/10 px-1.5 py-0.5">Ctrl</kbd> + rueda para hacer
            zoom
          </p>
        </div>
      )}
    </div>
  )
}
