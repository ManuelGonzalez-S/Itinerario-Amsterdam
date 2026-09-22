# 🚲 Ámsterdam · 24–27 de septiembre de 2026

Itinerario del viaje para cuatro personas: un plan cerrado, un **mapa con los sitios de cada día**
y la lista hora a hora con direcciones. Nada que votar ni elegir, solo seguirlo.

**En producción:** https://itinerario-amsterdam.vercel.app

## El plan

**El consenso** — calle, bici y canales. Unos **313 € por persona** sin vuelos ni hotel, con
entradas, comidas y transporte.

Se eligió por los votos del grupo, no por gusto: es el único de los tres que conserva **todo lo
que tenía síes reales** (el crucero y las bicis, con dos síes cada uno) y no añade nada que nadie
hubiera pedido. Moco, NEMO y Haarlem se quedaron los tres en cero síes y cuatro quizás.

### Puntos fijos

- ✅ **Museo Van Gogh reservado: viernes 25 a las 11:15.** Es el único punto inamovible y el
  itinerario del viernes se construye alrededor de él.
- ❌ **Casa de Ana Frank:** sin entradas para estas fechas.

## Cómo funciona la página

- **Un color por día** (jueves ámbar, viernes azul, sábado violeta, domingo verde). El color ata
  cada marcador del mapa con su hora en la lista.
- **Marcadores numerados**: el número del mapa y el de la lista son el mismo. Se puede tocar en
  cualquiera de los dos y el mapa vuela hasta el sitio.
- **Marcadores de borde discontinuo** = posición aproximada, cuando solo se conoce el barrio. Es
  deliberado: en un mapa que la gente sigue por la calle, es mejor decir «por aquí» que fingir
  precisión.
- Cada parada lleva su **dirección** y un enlace **«Cómo llegar»** a Google Maps. El marcador
  orienta; el enlace es el que lleva.
- El botón de abajo copia el itinerario entero en formato WhatsApp, generado de los mismos datos
  para que no puedan desviarse.
- **Dónde estás**: el botón de ubicación pinta tu punto en el mapa con su halo de precisión y
  añade a cada parada la distancia y los minutos andando. No se pide el permiso al cargar, solo
  cuando se pulsa: soltar el aviso de permisos nada más entrar es de mala educación y el navegador
  recuerda un «no» dado a la ligera.
- **Cómo llegar**: cada parada abre la ruta en Google Maps desde donde estés, andando o en
  transporte público, que en Ámsterdam significa tranvías y ferris.

Si el viaje ya ha empezado, la página abre directamente por el día que toca.

## Puesta en marcha

```bash
npm install
npm run dev
```

Se despliega en **Vercel** con cada push a `main`. No hay backend ni base de datos. El mapa es
**Leaflet** con teselas de OpenStreetMap: sin claves de API y sin servicios de pago.

## Estructura

```
src/
├── data/ideas.ts        # catálogo: precios, horarios, direcciones y coordenadas
├── data/plans.ts        # los itinerarios hora a hora y las horas reales de cada día
├── lib/plan.ts          # el plan elegido, el itinerario, los colores y el texto de WhatsApp
├── components/Mapa.tsx  # el mapa, con Leaflet a pelo
└── App.tsx              # la página
```

### Cambiar de plan

En `src/lib/plan.ts`, la constante `PLAN_ELEGIDO`. Los tres planes siguen en `plans.ts`, así que
pasar a `'plan-museos'` (añade Moco y NEMO) o `'plan-escapada'` (medio día en Haarlem) es **una
línea**: el itinerario, el mapa y el mensaje de WhatsApp se regeneran solos.

### Dos detalles del modelo que no son obvios

- **`scheduleHours`** son las horas que una idea bloquea de verdad en la agenda, cuando no
  coinciden con su duración. El alquiler de bicis son 4 h, pero esas horas las ocupan el
  Vondelpark y el Jordaan, que se recorren justamente en bici.
- **`DAY_HOURS`** son las horas disponibles de cada día, y no son cuatro días iguales: el jueves
  se llega a las 11:00 y el domingo hay vuelo por la tarde.

## Datos comprobados

Precios, horarios y direcciones contrastados con las webs oficiales en septiembre de 2026.

| Sitio | Dato |
| --- | --- |
| Museo Van Gogh | Museumplein 6 · 25 € · **reservado viernes 11:15** |
| Vleminckx | Voetboogstraat 33 |
| Booth Club | Raamsteeg 2 · 6 € la tira de cuatro fotos |
| Van Stapele | Heisteeg 4 |
| Van Dobben | Korte Reguliersdwarsstraat 5-9 · sin reservas, solo mostrador |
| Foodhallen | Bellamyplein 51, Oud-West |
| Pantopia | Kerkstraat 163 · a unos 12 min andando del Van Gogh |
| Albert Cuyp | cierra a las 17:00 y **no abre los domingos** |
| Brouwerij 't IJ | Funenkade 7, junto al molino De Gooyer |
| De Tros | Linnaeusstraat 63H, Amsterdam-Oost |
| A'DAM Lookout | Overhoeksplein 5 · última entrada 21:00 · ferry gratis |
| NDSM | festival Craft in Focus solo el 26 y el 27 |
| Abono GVB 72 h | 21,50 € · los trenes NS van aparte |

**Sin confirmar:** de *Brittons* y de las tiendas *Secondlife, Just Waldo* y *Love Storie Archive*
no se encontró dirección ni horarios, así que no están en el itinerario. La tienda vintage que sí
está localizada es *Millesime*, en Leidsestraat 64-66.

## Historia

Empezó como una app de votación con Firebase: los cuatro votaron 64 ideas, repartían 100 puntos y
armaban su ruta. Los cuatro completaron el triaje, pero solo uno repartió puntos.

Con el viaje a dos semanas quedó claro que los datos ya estaban y lo que faltaba era decidir, así
que la web se simplificó hasta ser el mensaje: tres planes y una pregunta. Al no necesitar guardar
nada se pudo quitar Firebase entero.

A dos días de salir, con el Van Gogh reservado y Ana Frank descartado, tres opciones ya solo
servían para no decidir: se cerró un plan y la página pasó a ser el itinerario con mapa. La
votación y sus datos siguen en el historial de git y en Firestore.
