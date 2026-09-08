# 🚲 Ámsterdam · 24–27 de septiembre de 2026

Página del viaje para cuatro personas. Muestra **tres itinerarios completos** y hace una sola
pregunta: ¿A, B o C? La decisión se toma en el grupo de WhatsApp, así que la página no tiene nada
que votar ni que guardar.

**En producción:** https://itinerario-amsterdam.vercel.app

## Los tres planes

| | | Por persona |
| --- | --- | --- |
| **A · El consenso** | Solo lo que dijeron sí los cuatro | 302 € |
| **B · Con museos** | + Van Gogh, Moco y NEMO | 315 € |
| **C · Con escapada** | + medio día en Haarlem | 267 € |

Los precios son por persona sin vuelos ni hotel, e incluyen entradas, comidas y transporte.

Salen de una votación previa en la que los cuatro pasaron por 64 ideas marcando sí, quizás o no.
De ahí vienen las dos reglas que cumplen los tres planes:

- **Ningún plan incluye nada con un solo «no».** Un veto es un veto. Eso deja fuera Utrecht y
  World Press Photo, además de las 23 ideas que salieron descartadas (entre ellas el Rijksmuseum
  y el Museumkaart).
- **Respetan los horarios reales.** El mercado Albert Cuyp cierra los domingos. El festival Craft
  in Focus del NDSM es solo el 26 y el 27. El Van Gogh abre hasta las 21:00 únicamente los
  viernes, que es su mejor momento. NEMO cierra a las 17:30.

La página también genera el mensaje de WhatsApp con esos mismos datos, con un botón de copiar,
para que el texto del grupo y la web no puedan desviarse el uno del otro.

## Puesta en marcha

```bash
npm install
npm run dev
```

Se despliega en **Vercel** con cada push a `main`. Vercel detecta Vite solo: build
`npm run build`, salida `dist`. No hay backend, ni base de datos, ni variables de entorno.

## Estructura

```
src/
├── data/ideas.ts   # el catálogo: precios, horarios, avisos y enlaces oficiales
├── data/plans.ts   # los 3 itinerarios hora a hora y las horas reales de cada día
├── lib/plan.ts     # costes, horas y el texto de WhatsApp
└── App.tsx         # la página entera
```

Para cambiar un plan se edita `src/data/plans.ts`: los precios, las horas y el mensaje de
WhatsApp se recalculan solos desde el catálogo.

### Dos detalles del modelo que no son obvios

- **`scheduleHours`** en una idea son las horas que bloquea de verdad en la agenda, cuando no
  coinciden con su duración. El alquiler de bicis son 4 h, pero esas horas las ocupan el
  Vondelpark y el Jordaan, que se recorren justamente en bici: en la agenda solo cuenta ir a
  recogerlas.
- **`DAY_HOURS`** en `plans.ts` son las horas disponibles de cada día, y no son cuatro días
  iguales: el jueves se llega a las 11:00 y el domingo hay vuelo por la tarde.

## Datos comprobados

Precios y horarios contrastados con las webs oficiales en septiembre de 2026. Los que más pesan:

| Dato | Detalle |
| --- | --- |
| Casa de Ana Frank | 16,50 € · abre 09:00–22:00 · **solo online**, sin taquilla ni lista de espera; las entradas salen cada martes a las 10:00 CEST para seis semanas después |
| Museo Van Gogh | 25 € · 09:00–18:00, viernes hasta las 21:00 · entrada con hora obligatoria |
| Moco Museum | 17,95–21,95 € · 09:00–20:00 |
| NEMO | 17,50 € · martes a domingo 10:00–17:30 · azotea gratis |
| A'DAM Lookout | 16,50 € · 10:00–22:00, última entrada 21:00 · ferry gratis desde Centraal |
| Abono GVB 72 h | 21,50 € |
| I amsterdam City Card | desde 67 €/24 h · **no** incluye Van Gogh ni Ana Frank |
| Tren Schiphol – Centraal | unos 6 € · 17 min · no entra en el abono GVB ni en la City Card |

## Historia

El proyecto empezó como una app de votación con Firebase: los cuatro votaban las 64 ideas,
repartían 100 puntos y armaban su ruta ideal, todo sincronizado en tiempo real. Los cuatro
completaron el triaje, pero solo uno llegó a repartir puntos.

Con el viaje a poco más de dos semanas, la conclusión fue que los datos que hacían falta ya
estaban y lo que faltaba era decidir, y para eso el grupo de WhatsApp gana a cualquier app. Así
que la web se simplificó hasta ser el propio mensaje. Al no necesitar guardar nada se pudo quitar
Firebase entero: el bundle bajó de 737 KB a 229 KB.

La votación y sus datos siguen en el historial de git y en Firestore, por si alguna vez hacen
falta.
