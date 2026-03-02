// Firebase Configuration - ARK Analisi
// Using copilota-6d94a Firebase project

const firebaseConfig = {
  apiKey: "AIzaSyBxYLAaFJqFxHkZ2CVU3sFwUCEp60gis2U",
  databaseURL: "https://copilota-6d94a-default-rtdb.firebaseio.com",
  projectId: "copilota-6d94a"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, push, update, remove, onValue, off } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Database helpers with ark_analisi prefix
export const DB = {
  ref: (path) => ref(db, `ark_analisi/${path}`),
  
  set: (path, data) => set(ref(db, `ark_analisi/${path}`), data),
  
  get: async (path) => {
    const snap = await get(ref(db, `ark_analisi/${path}`));
    return snap.exists() ? snap.val() : null;
  },
  
  push: async (path, data) => {
    const newRef = push(ref(db, `ark_analisi/${path}`));
    await set(newRef, data);
    return newRef.key;
  },
  
  update: (path, data) => update(ref(db, `ark_analisi/${path}`), data),
  
  remove: (path) => remove(ref(db, `ark_analisi/${path}`)),
  
  listen: (path, callback) => {
    const r = ref(db, `ark_analisi/${path}`);
    onValue(r, snap => callback(snap.exists() ? snap.val() : null));
    return () => off(r);
  }
};

export { db as database };
