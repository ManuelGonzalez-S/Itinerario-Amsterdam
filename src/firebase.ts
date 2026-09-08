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

/**
 * Identificador del viaje. En desarrollo apunta a un viaje aparte para que
 * probar la app nunca escriba en la votacion de verdad: en una prueba se colo
 * un votante falso en la coleccion real y hubo que borrarlo a mano, porque las
 * reglas (con razon) no permiten borrar votos.
 */
export const TRIP_ID = import.meta.env.DEV ? 'amsterdam-2026-09-dev' : 'amsterdam-2026-09'
