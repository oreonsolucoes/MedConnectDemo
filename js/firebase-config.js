import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const USE_FIREBASE = true;

/* =====================================================================
   MODO DEMO
   - DEMO_MODE = true  → dados gravados em demo/dados/<colecao>
   - DEMO_MODE = false → dados gravados em /<colecao>  (produção)
   ===================================================================== */
export const DEMO_MODE = true; // ← altere para true no MedConnectDemo

const DEMO_ROOT_COL = "demo";   // coleção raiz
const DEMO_ROOT_DOC = "dados";  // documento raiz dentro de "demo"

const firebaseConfig = {
  apiKey: "AIzaSyBAt7gHv0EBES4ZHbfZN0fhnQGBTjqMXog",
  authDomain: "medconnect-36c91.firebaseapp.com",
  projectId: "medconnect-36c91",
  storageBucket: "medconnect-36c91.firebasestorage.app",
  messagingSenderId: "587460819432",
  appId: "1:587460819432:web:d4494a581de6316ce94c5d"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

/* =====================================================================
   col(nome) — helper universal para obter referência de coleção
   Uso em todos os módulos:
     import { col } from './firebase-config.js';
     getDocs(col('clientes'))
   ===================================================================== */
export function col(nome) {
  if (DEMO_MODE) {
    // Estrutura: demo/dados/<nome>
    return collection(db, DEMO_ROOT_COL, DEMO_ROOT_DOC, nome);
  }
  return collection(db, nome);
}

/* =====================================================================
   docRef(colecao, id) — referência a documento específico
   Substitui: doc(db, 'clientes', id)
   ===================================================================== */
export function docRef(colecao, id) {
  if (DEMO_MODE) {
    return doc(db, DEMO_ROOT_COL, DEMO_ROOT_DOC, colecao, id);
  }
  return doc(db, colecao, id);
}

/* =====================================================================
   PERSISTÊNCIA OFFLINE — Firestore IndexedDB
   ===================================================================== */
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === "failed-precondition") {
    console.warn("[Offline] Persistência não ativada: múltiplas abas abertas.");
  } else if (err.code === "unimplemented") {
    console.warn("[Offline] Navegador não suporta persistência offline.");
  }
});
