import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getPendingOps, markOpDone, markOpFailed, removeOfflineNLot } from "./db/offlineDB";

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const ops = await getPendingOps();
    setPendingCount(ops.length);
  }, []);

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
          const res = await axios({
            method: op.method,
            url: op.url,
            data: op.data,
            withCredentials: true,
          });

          await markOpDone(op.id);
          successCount++;

          // Se era un NewLot, rimuovi il nLot dalla lista pending
          if (op.url.includes("/api/newlot") && op.method === "POST") {
            const nLot = res.data?.newlot_nLot || op.data?.tempNLot;
            if (nLot) await removeOfflineNLot(nLot);
          }
        } catch (err) {
          await markOpFailed(op.id, err.message);
          failCount++;
          // Se un'operazione fallisce interrompi — le successive potrebbero dipendere da questa
          console.error(`Sync fallita per operazione ${op.id}:`, err.message);
          break;
        }
      }

      await refreshPendingCount();

      if (successCount > 0 || failCount > 0) {
        alert(
          `🔄 Sincronizzazione: ${successCount} operazion${successCount === 1 ? "e inviata" : "i inviate"}` +
          (failCount > 0 ? `, ${failCount} fallita${failCount > 1 ? "e" : ""} — riprova più tardi.` : ".")
        );
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
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