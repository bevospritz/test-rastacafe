import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getPendingOps, markOpDone, markOpFailed } from "./db/offlineDB";

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Aggiorna contatore pending
  const refreshPendingCount = useCallback(async () => {
    const ops = await getPendingOps();
    setPendingCount(ops.length);
  }, []);

  // Sincronizza tutte le operazioni pending
  const sync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);

    try {
      const ops = await getPendingOps();
      if (ops.length === 0) { setIsSyncing(false); return; }

      let successCount = 0;
      let failCount = 0;

      for (const op of ops) {
        try {
          await axios({
            method: op.method,
            url: op.url,
            data: op.data,
            withCredentials: true,
          });
          await markOpDone(op.id);
          successCount++;
        } catch (err) {
          await markOpFailed(op.id, err.message);
          failCount++;
        }
      }

      await refreshPendingCount();

      if (successCount > 0) {
        alert(`✅ Sincronizzazione completata: ${successCount} operazioni inviate${failCount > 0 ? `, ${failCount} fallite` : ""}.`);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  // Listener connessione
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync(); // sync automatica
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sync]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  return (
    <OfflineContext.Provider value={{ isOnline, isSyncing, pendingCount, sync, refreshPendingCount }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);