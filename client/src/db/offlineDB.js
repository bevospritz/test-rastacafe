import { openDB } from "idb";

const DB_NAME = "rastacafe-offline";
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pendingOps")) {
        const store = db.createObjectStore("pendingOps", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status");
      }
      if (!db.objectStoreNames.contains("cache")) {
        const cache = db.createObjectStore("cache", { keyPath: "key" });
        cache.createIndex("timestamp", "timestamp");
      }
    },
  });
};

// ── Pending Operations ──

export const addPendingOp = async (op) => {
  const db = await initDB();
  await db.add("pendingOps", {
    ...op,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
};

export const getPendingOps = async () => {
  const db = await initDB();
  const all = await db.getAllFromIndex("pendingOps", "status", "pending");
  // Ordine cronologico — fondamentale per rispettare la filiera
  return all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const markOpDone = async (id) => {
  const db = await initDB();
  const op = await db.get("pendingOps", id);
  if (op) await db.put("pendingOps", { ...op, status: "done" });
};

export const markOpFailed = async (id, error) => {
  const db = await initDB();
  const op = await db.get("pendingOps", id);
  if (op) await db.put("pendingOps", { ...op, status: "failed", error });
};

// ── Cache dati per lettura offline ──

export const setCache = async (key, data) => {
  const db = await initDB();
  await db.put("cache", {
    key,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const getCache = async (key) => {
  const db = await initDB();
  const entry = await db.get("cache", key);
  return entry?.data || null;
};

// ── Lotti creati offline (pending nLot) ──

// Salva nLot creato offline
export const addOfflineNLot = async (nLot) => {
  const db = await initDB();
  await db.put("cache", {
    key: `offline-nlot-${nLot}`,
    data: { nLot, pending: true },
    timestamp: new Date().toISOString(),
  });
};

// Controlla se un nLot è ancora pending
export const isNLotPending = async (nLot) => {
  const db = await initDB();
  const entry = await db.get("cache", `offline-nlot-${nLot}`);
  return !!entry;
};

// Rimuovi nLot dalla lista pending dopo sync riuscita
export const removeOfflineNLot = async (nLot) => {
  const db = await initDB();
  await db.delete("cache", `offline-nlot-${nLot}`);
};