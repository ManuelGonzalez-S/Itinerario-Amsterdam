# 🚲 Ámsterdam · 24–27 de septiembre de 2026

Web del viaje para cuatro personas. Ahora mismo está en **modo votación**: entre todos
decidimos qué queremos hacer y, cuando esté cerrado, esta misma web se convierte en el
itinerario día a día.

## Cómo se decide

Cuatro pasos, pensados para hacerse en el móvil:

1. **Votar** — pasas por las 64 ideas y marcas **Sí / Quizás / No**. Un *No* es un veto de
   verdad: lo que alguien no quiere, no se hace.
2. **Puntos** — reparto de **100 puntos** entre lo que has marcado Sí o Quizás. Esto es lo que
   ordena la lista, porque en el triaje casi todo acaba en «sí, vale».
3. **Resultados** — lo que tiene cuatro síes queda **Fijo**. El resto se ordena por puntos, y se
   ve en directo cuánto costaría por persona y si cabe en cuatro días.
4. **Planes** — cuatro itinerarios completos hora a hora, generados a partir de los votos
   reales. Se marcan igual (Me vale / Con cambios / No) y sirven para debatir sobre algo
   concreto en vez de sobre una lista de 64 cosas.

No hay registro ni contraseñas: se entra con el nombre, que sirve para saber de quién es cada
voto. Todo se sincroniza en tiempo real entre los cuatro.

### Los planes

Están en [src/data/plans.ts](src/data/plans.ts) y todos cumplen tres reglas:

- **Ni una sola idea con un «no» de alguien.** Un veto es un veto, así que ningún plan puede
  incluir algo que alguien haya rechazado.
- **Respetan los horarios reales**: Albert Cuyp cierra los domingos, el festival del NDSM solo
  es sábado y domingo, el Van Gogh abre hasta las 21:00 solo los viernes, NEMO cierra a las
  17:30.
- **Se comparan con las horas que hay de verdad**, no con un número redondo: el jueves se llega
  a las 11:00 y el domingo hay vuelo, así que cada día tiene su propia ventana
  (`DAY_HOURS` en `plans.ts`). El aviso de «no cabe» salta por día concreto.

El coste que muestra cada plan va desglosado entre lo que se votó (entradas, mercados, bares) y
lo que no se votó pero hay que pagar igual (comidas libres y traslados).

**Nota de implementación:** los votos de planes se guardan en el mismo mapa `triage` que las
ideas, con claves `plan-*`. Es a propósito: así no hace falta cambiar ni republicar las reglas
de Firestore. `countIdeaVotes()` los filtra para que el progreso siga siendo sobre 64 ideas.

## Puesta en marcha

```bash
npm install
npm run dev
```

El sitio se despliega en **Vercel** con cada push a `main`. Vercel detecta Vite solo: build
`npm run build`, carpeta de salida `dist`. No hace falta configurar nada más.

## Firebase

Los votos viven en Firestore, en `trips/amsterdam-2026-09/votes/{persona}`: un documento por
persona con su triaje y sus puntos.

La configuración de Firebase está en [src/firebase.ts](src/firebase.ts) **a propósito**. La
`apiKey` web de Firebase no es un secreto: viaja en el bundle del navegador y no se puede
esconder. Lo que protege los datos son las reglas de Firestore.

**Hay que publicar [firestore.rules](firestore.rules) una vez**, o la app no podrá guardar nada
(saldrá un aviso de `permission-denied` y los votos se quedarán solo en cada navegador):

```bash
npx firebase-tools deploy --only firestore:rules --project itinerario-amsterdam
```

O pegando el contenido del archivo en **Firebase Console → Firestore → Reglas → Publicar**.

Las reglas dejan leer y escribir a cualquiera con el enlace (somos cuatro amigos, no hay login),
pero acotan mucho *qué* se puede escribir: solo los cinco campos esperados, solo en la colección
de votos, los valores de voto solo pueden ser `yes`/`maybe`/`no`, y nadie puede borrar nada.

## De dónde salen los datos

Los precios, horarios y avisos de cada idea se comprobaron en septiembre de 2026 contra las webs
oficiales. Los que más importan:

| Dato | Detalle |
| --- | --- |
| Casa de Ana Frank | 16,50 € · abre 09:00–22:00 · entradas **solo online**, liberadas cada martes a las 10:00 CEST para seis semanas después |
| Museo Van Gogh | 25 € · 09:00–18:00, viernes hasta las 21:00 · entrada con hora obligatoria |
| Rijksmuseum | 25 € · 09:00–17:00 todos los días |
| Moco Museum | 17,95–21,95 € · 09:00–20:00 |
| NEMO | 17,50 € · martes a domingo 10:00–17:30 · azotea gratis |
| Heineken Experience | desde 24,95 € · 10:30–21:00, **última entrada 18:45** |
| A'DAM Lookout | 16,50 € · 10:00–22:00, última entrada 21:00 · ferry gratis desde Centraal |
| Abono GVB 72 h | 21,50 € |
| I amsterdam City Card | desde 67 €/24 h · **no** incluye Van Gogh ni Ana Frank |
| Museumkaart | 75 € · **sí** incluye Van Gogh, Rijksmuseum y Ana Frank |

Y lo que cae justo esos días: *World Press Photo* en De Nieuwe Kerk y *Jesse Darling* en la Oude
Kerk terminan el **domingo 27**; el festival *Craft in Focus* es el **26 y 27** en el NDSM; y el
mercado Albert Cuyp **cierra los domingos**.

## Estructura

```
src/
├── data/ideas.ts       # el catálogo de 64 ideas: precios, horarios, avisos
├── data/plans.ts       # los 4 itinerarios completos y las horas reales de cada día
├── lib/scoring.ts      # recuento, estados (fijo/probable/...), presupuesto
├── hooks/useVotes.ts   # sincronización en tiempo real con Firestore
├── hooks/useIdentity.ts# quién soy, guardado en el navegador
└── components/         # las cinco pestañas de la app
```

Para añadir o quitar ideas basta con editar `src/data/ideas.ts`: todo lo demás se recalcula solo.
