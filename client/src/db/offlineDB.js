import { openDB } from "idb";

const DB_NAME = "rastacafe-offline";
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Coda operazioni pending da sincronizzare
      if (!db.objectStoreNames.contains("pendingOps")) {
        const store = db.createObjectStore("pendingOps", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status");
      }

      // Cache dati esistenti per lettura offline
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
  return db.getAllFromIndex("pendingOps", "status", "pending");
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

// ── Cache ──

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