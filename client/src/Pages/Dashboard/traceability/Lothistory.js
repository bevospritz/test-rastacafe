import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Traceability.css";
import "./Lothistory.css";

// Colori e icone per ogni tipo di lotto
const STEP_CONFIG = {
  Raccolta: { color: "#6d4c41", bg: "#efebe9", border: "#a1887f", icon: "🌱" },
  Patio: { color: "#1565c0", bg: "#e3f2fd", border: "#90caf9", icon: "☀️" },
  Dryer: { color: "#e65100", bg: "#fff3e0", border: "#ffcc80", icon: "🔥" },
  Fermentazione: {
    color: "#6a1b9a",
    bg: "#f3e5f5",
    border: "#ce93d8",
    icon: "🧪",
  },
  Resting: { color: "#2e7d32", bg: "#e8f5e9", border: "#a5d6a7", icon: "🏠" },
  Cleaning: { color: "#00695c", bg: "#e0f2f1", border: "#80cbc4", icon: "✨" },
  Vendita: { color: "#1b5e20", bg: "#e8f5e9", border: "#66bb6a", icon: "💰" },
};

const LotNode = ({ node, isRoot }) => {
  const config = STEP_CONFIG[node.type] || {
    color: "#333",
    bg: "#f5f5f5",
    border: "#ccc",
    icon: "📦",
  };
  const d = node.data;

  return (
    <div className="flow-branch">
      <div
        className={`flow-node ${isRoot ? "flow-node-root" : ""} ${node.highlighted ? "flow-node-highlighted" : ""}`}
        style={{ borderColor: config.border, backgroundColor: config.bg }}
      >
        <div
          className="flow-node-header"
          style={{ backgroundColor: config.border }}
        >
          <span className="flow-node-icon">{config.icon}</span>
          <span className="flow-node-type" style={{ color: config.color }}>
            {node.type}
          </span>
          <span className="flow-node-nlot">{node.nLot}</span>
        </div>
        <div className="flow-node-body">
          {d ? (
            <>
              <div className="flow-node-row">
                <span className="flow-node-label">Data</span>
                <span className="flow-node-value">
                  {d.date ? new Date(d.date).toLocaleDateString("it-IT") : "—"}
                </span>
              </div>
              {d.volume != null && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Volume</span>
                  <span className="flow-node-value">
                    {d.volume.toLocaleString("it-IT")} L
                  </span>
                </div>
              )}
              {d.type && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Tipo</span>
                  <span className="flow-node-value">{d.type}</span>
                </div>
              )}
              {d.plot && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Talhão</span>
                  <span className="flow-node-value">{d.plot}</span>
                </div>
              )}
              {d.name && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Nome</span>
                  <span className="flow-node-value">{d.name}</span>
                </div>
              )}
              {d.method && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Metodo</span>
                  <span className="flow-node-value">{d.method}</span>
                </div>
              )}
              {d.deposit && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Deposito</span>
                  <span className="flow-node-value">{d.deposit}</span>
                </div>
              )}
              {d.bags && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Sacchi venduti</span>
                  <span className="flow-node-value">{d.bags}</span>
                </div>
              )}
              {d.buyer_name && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Acquirente</span>
                  <span className="flow-node-value">{d.buyer_name}</span>
                </div>
              )}
              {d.price_per_bag && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Prezzo/sacco</span>
                  <span className="flow-node-value">
                    {d.price_per_bag} {d.currency}
                  </span>
                </div>
              )}
              {d.certification && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Certificazione</span>
                  <span className="flow-node-value">
                    {d.certification} +{d.certification_bonus} {d.currency}
                  </span>
                </div>
              )}
              {d.notes && (
                <div className="flow-node-row">
                  <span className="flow-node-label">Note</span>
                  <span className="flow-node-value">{d.notes}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flow-node-empty">Dati non disponibili</div>
          )}
        </div>
      </div>

      {/* Figli */}
      {node.children && node.children.length > 0 && (
        <div className="flow-children">
          <div className="flow-arrow">↓</div>
          {node.children.length > 1 && (
            <div className="flow-split-label">{node.children.length} rami</div>
          )}
          <div
            className={`flow-children-row ${node.children.length > 1 ? "flow-multi" : ""}`}
          >
            {node.children.map((child, i) => (
              <LotNode key={i} node={child} isRoot={false} />
            ))}
          </div>
        </div>
      )}

      {/* Foglia senza figli */}
      {(!node.children || node.children.length === 0) && (
        <div className="flow-leaf">
          <div className="flow-arrow">↓</div>
          <div className="flow-leaf-badge">Fine percorso</div>
        </div>
      )}
    </div>
  );
};

const LotHistory = () => {
  const [searchValue, setSearchValue] = useState("");
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const nLot = searchValue.trim().toUpperCase();
    if (!nLot) return;

    setLoading(true);
    setError(null);
    setTree(null);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/lot-history/${nLot}`,
      );
      setTree(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Lotto "${nLot}" non trovato.`);
      } else {
        setError("Errore durante il caricamento della storia del lotto.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <div>
          <h2>Storia Lotto</h2>
          <p className="page-subtitle">
            Inserisci il codice di un lotto per visualizzarne il percorso completo.
          </p>
        </div>
      </div>

      {/* Barra di ricerca */}
      <div className="lot-search-bar">
        <input
          type="text"
          className="lot-search-input"
          placeholder="es. H00001, P00003, C00001..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="action-button"
          onClick={handleSearch}
          disabled={loading || !searchValue.trim()}
        >
          {loading ? "Caricamento..." : "Cerca"}
        </button>
        <button
          className="action-button cancel"
          onClick={() => navigate("/dashboard/traceability")}
        >
          Indietro
        </button>
      </div>

      {/* Legenda */}
      <div className="flow-legend">
        {Object.entries(STEP_CONFIG).map(([type, config]) => (
          <div key={type} className="flow-legend-item">
            <span
              className="flow-legend-dot"
              style={{ backgroundColor: config.border }}
            />
            <span>
              {config.icon} {type}
            </span>
          </div>
        ))}
      </div>

      {/* Errore */}
      {error && <p className="empty-state">{error}</p>}

      {/* Albero */}
      {tree && (
        <div className="flow-container">
          <LotNode node={tree} isRoot={true} />
        </div>
      )}
    </div>
  );
};

export default LotHistory;
