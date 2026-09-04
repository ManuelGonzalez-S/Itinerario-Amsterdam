import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// La configuración web de Firebase es pública por diseño: viaja en el bundle
// del navegador. Lo que protege los datos son las reglas de Firestore
// (ver firestore.rules en la raíz del repo), no ocultar estas claves.
const firebaseConfig = {
  apiKey: 'AIzaSyDWq7bDuhgo_WS0s-byV08ydp9BSWh7ZdU',
  authDomain: 'itinerario-amsterdam.firebaseapp.com',
  projectId: 'itinerario-amsterdam',
  storageBucket: 'itinerario-amsterdam.firebasestorage.app',
  messagingSenderId: '666892926606',
  appId: '1:666892926606:web:777dbc37a66fb9ed7553df',
  measurementId: 'G-DQV40F6WPV',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

/** Identificador del viaje: permite reutilizar la app para otro destino. */
export const TRIP_ID = 'amsterdam-2026-09'
