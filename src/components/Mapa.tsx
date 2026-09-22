import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DAY_COLOR, type Parada } from '../lib/plan'

interface Props {
  paradas: Parada[]
  /** La parada resaltada, para volar hasta ella al tocarla en la lista. */
  activa: string | null
  onSelect: (key: string | null) => void
}

/**
 * Mapa con un marcador por parada, numerado y del color de su día.
 *
 * Se usa Leaflet a pelo en vez de react-leaflet: solo hacen falta marcadores y
 * un par de vuelos, y así no entra otra dependencia. Los iconos son divIcon con
 * HTML propio, lo que además evita el clásico problema de las imágenes de
 * marcador de Leaflet con los bundlers y permite darles color.
 */
export function Mapa({ paradas, activa, onSelect }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const capa = useRef<L.LayerGroup | null>(null)
  const marcadores = useRef<Map<string, L.Marker>>(new Map())

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

    return () => {
      m.remove()
      mapa.current = null
      capa.current = null
      marcadores.current.clear()
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
            (p.maps ? `<br><a href="${p.maps}" target="_blank" rel="noreferrer">Abrir en Google Maps ↗</a>` : ''),
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

  // Volar a la parada seleccionada desde la lista
  useEffect(() => {
    if (!activa || !mapa.current) return
    const marcador = marcadores.current.get(activa)
    if (!marcador) return
    mapa.current.flyTo(marcador.getLatLng(), 16, { duration: 0.6 })
    marcador.openPopup()
  }, [activa])

  return (
    <div
      ref={contenedor}
      className="h-72 w-full rounded-2xl border border-white/10 sm:h-96"
      // Leaflet pinta sus controles con z-index altos; lo acotamos para que no
      // se cuele por encima de nada del resto de la página.
      style={{ zIndex: 0, background: '#0f172a' }}
      aria-label="Mapa del itinerario"
    />
  )
}
