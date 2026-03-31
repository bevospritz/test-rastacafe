import React from "react";
import { useOffline } from "../OfflineContext";

const PendingBanner = ({ blockSubmit = true }) => {
  const { pendingCount, sync, isSyncing, isOnline } = useOffline();

  if (pendingCount === 0) return null;

  return (
    <div style={{
      padding: "10px 14px", marginBottom: "1rem",
      backgroundColor: blockSubmit ? "#ffebee" : "#fff8e1",
      border: `1px solid ${blockSubmit ? "#ef9a9a" : "#ffe082"}`,
      borderRadius: "6px", fontSize: "0.85rem",
      color: blockSubmit ? "#c62828" : "#f57f17",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      flexWrap: "wrap", gap: "8px",
    }}>
      <span>
        {blockSubmit ? "🔴" : "🟡"}{" "}
        Hai <strong>{pendingCount}</strong> operazion{pendingCount === 1 ? "e" : "i"} non sincronizzat{pendingCount === 1 ? "a" : "e"}.
        {" "}
        {blockSubmit
          ? "I lotti creati offline non possono procedere alla fase successiva. Sincronizza prima di continuare."
          : "I lotti creati offline non possono procedere alla fase successiva finché non vengono sincronizzati."
        }
      </span>
      {isOnline && (
        <button
          onClick={sync}
          disabled={isSyncing}
          style={{
            background: blockSubmit ? "#c62828" : "#f57f17",
            color: "#fff", border: "none",
            borderRadius: "6px", padding: "4px 12px",
            cursor: isSyncing ? "not-allowed" : "pointer",
            fontSize: "0.8rem", fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          {isSyncing ? "⏳ Sync..." : "🔄 Sincronizza ora"}
        </button>
      )}
      {!isOnline && (
        <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>
          (Sincronizzazione disponibile quando torni online)
        </span>
      )}
    </div>
  );
};

export default PendingBanner;