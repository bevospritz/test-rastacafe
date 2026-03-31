import { useCallback } from "react";
import axios from "axios";
import { addPendingOp, setCache, getCache } from "../db/offlineDB";
import { useOffline } from "../OfflineContext";
import { getPendingOps } from "../db/offlineDB";

const useOfflineRequest = () => {
  const { isOnline, refreshPendingCount } = useOffline();

  // GET — online fetcha dal server e aggiorna cache, offline legge dalla cache
  const get = useCallback(async (url) => {
    if (isOnline) {
      const res = await axios.get(url, { withCredentials: true });
      await setCache(url, res.data); // aggiorna cache
      return res.data;
    } else {
      const cached = await getCache(url);
      if (cached) return cached;
      throw new Error(`Offline: nessun dato in cache per ${url}`);
    }
  }, [isOnline]);

  // POST/PATCH/DELETE — online esegue subito, offline salva in pending
  const request = useCallback(async (method, url, data = null) => {
    if (isOnline) {
      const res = await axios({ method, url, data, withCredentials: true });
      return res.data;
    } else {
      await addPendingOp({ method, url, data });
      await refreshPendingCount();
      // Ritorna un oggetto fake per non rompere il flusso
      return { offline: true, queued: true };
    }
  }, [isOnline, refreshPendingCount]);

  const hasPending = useCallback(async () => {
  const ops = await getPendingOps();
  return ops.length > 0;
}, []);

  const post = useCallback((url, data) => request("POST", url, data), [request]);
  const patch = useCallback((url, data) => request("PATCH", url, data), [request]);
  const del = useCallback((url) => request("DELETE", url), [request]);

  return { get, post, patch, del, hasPending };
};

export default useOfflineRequest;