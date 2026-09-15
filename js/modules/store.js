/* ===================================================================
   Store — abstração de dados
   Se USE_FIREBASE = true → usa Firestore (CRUD + onSnapshot em tempo real)
   Se false               → usa mock em memória (mesma API, tempo real simulado)
   =================================================================== */

import { USE_FIREBASE, db, col as demoCol, docRef as demoDocRef } from "../firebase-config.js";
import * as mock from "./mock-data.js";

let fs = null;
if (USE_FIREBASE) {
  fs = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
}

/* ---------- Modo MOCK (persistido em localStorage + pub/sub) ---------- */
const LS_KEY = "mc_db_v2";

const seed = {
  clientes:     structuredClone(mock.clientes),
  motoristas:   structuredClone(mock.motoristas),
  fornecedores: structuredClone(mock.fornecedores),
  equipamentos: structuredClone(mock.equipamentos),
  locacoes:     structuredClone(mock.locacoes),
  despesas:     structuredClone(mock.despesas),
  checklists:   []
};

let memory;
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY));
  memory = saved && saved.locacoes ? saved : seed;
} catch { memory = seed; }

const subscribers = {};

function persist(){ try { localStorage.setItem(LS_KEY, JSON.stringify(memory)); } catch {} }
function notify(col){ (subscribers[col]||[]).forEach(cb => cb([...memory[col]])); }
function uid(){ return "id" + Math.random().toString(36).slice(2,9); }

if (!USE_FIREBASE && typeof window !== "undefined"){
  window.addEventListener("storage", e=>{
    if (e.key !== LS_KEY || !e.newValue) return;
    try {
      memory = JSON.parse(e.newValue);
      Object.keys(subscribers).forEach(col => notify(col));
    } catch {}
  });
  persist();
}

/* ---------- API pública ---------- */
export const Store = {

  /** Observa uma coleção em tempo real. Retorna função de unsubscribe. */
  watch(colName, callback){
    if (USE_FIREBASE){
      const ref = demoCol(colName);
      return fs.onSnapshot(ref, snap => {
        callback(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      });
    }
    (subscribers[colName] ||= []).push(callback);
    callback([...memory[colName]]);
    return () => { subscribers[colName] = subscribers[colName].filter(c => c !== callback); };
  },

  /** Leitura única */
  async list(colName){
    if (USE_FIREBASE){
      const snap = await fs.getDocs(demoCol(colName));
      return snap.docs.map(d => ({ id:d.id, ...d.data() }));
    }
    return [...memory[colName]];
  },

  async add(colName, data){
    if (USE_FIREBASE){
      const ref = await fs.addDoc(demoCol(colName), data);
      return ref.id;
    }
    const id = uid();
    memory[colName].push({ id, ...data });
    persist(); notify(colName);
    return id;
  },

  async update(colName, id, data){
    if (USE_FIREBASE){
      await fs.updateDoc(demoDocRef(colName, id), data);
      return;
    }
    const i = memory[colName].findIndex(x => x.id === id);
    if (i >= 0){ memory[colName][i] = { ...memory[colName][i], ...data }; persist(); notify(colName); }
  },

  async remove(colName, id){
    if (USE_FIREBASE){
      await fs.deleteDoc(demoDocRef(colName, id));
      return;
    }
    memory[colName] = memory[colName].filter(x => x.id !== id);
    persist(); notify(colName);
  }
};
