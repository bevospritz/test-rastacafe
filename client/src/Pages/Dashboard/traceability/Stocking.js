import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Traceability.css";

const Stocking = () => {
  const [lots, setLots] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deposits, setDeposits] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLots();
    fetchDeposits();
  }, []);

  const fetchLots = () => {
    axios
      .get("http://localhost:5000/api/cleaning")
      .then((res) => setLots(res.data || []))
      .catch((err) => console.error("Errore caricamento cleaning:", err));
  };

  const fetchDeposits = () => {
    axios
      .get("http://localhost:5000/api/deposits")
      .then((res) => setDeposits(res.data || []))
      .catch((err) => console.error("Errore caricamento deposits:", err));
  };

  const handleEdit = (lot) => {
    setEditingId(lot.id);
    setEditForm({
      umidity: lot.umidity ?? "",
      cata: lot.cata ?? "",
      weight_deposit: lot.weight_deposit ?? "",
      deposit: lot.deposit ?? "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id) => {
    setIsSaving(true);
    try {
      await axios.patch(`http://localhost:5000/api/cleaning/${id}`, {
        umidity: editForm.umidity !== "" ? parseFloat(editForm.umidity) : null,
        cata: editForm.cata !== "" ? parseInt(editForm.cata) : null,
        weight_deposit: editForm.weight_deposit !== "" ? parseInt(editForm.weight_deposit) : null,
        deposit: editForm.deposit || null,
      });
      setEditingId(null);
      fetchLots();
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("it-IT") : "-";

  const isEditing = (id) => editingId === id;

  // Componente riga info riutilizzabile
  const InfoRow = ({ label, value, editing, children }) => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      {editing ? children : (
        <span className={`info-value ${!value ? "empty" : ""}`}>
          {value ?? "—"}
        </span>
      )}
    </div>
  );

  return (
    <div className="form-container">
      <h2>Stocking</h2>
      <p className="page-subtitle">
        Visualizza e aggiorna i dettagli dei lotti puliti prima della vendita.
      </p>

      {lots.length === 0 ? (
        <p className="empty-state">Nessun lotto disponibile.</p>
      ) : (
        <div className="tulha-grid">
          {lots.map((lot) => {
            const editing = isEditing(lot.id);

            return (
              <div
                key={lot.id}
                className={`tulha-card ${editing ? "editing" : ""}`}
              >
                {/* Header */}
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="tulha-card-title">{lot.cleaning_nLot}</span>
                    <span className={`badge ${lot.deposit ? "badge-deposit" : "badge-direct"}`}>
                      {lot.deposit || "Vendita diretta"}
                    </span>
                  </div>
                  <div className="tulha-card-meta">{formatDate(lot.date)}</div>
                </div>

                <hr className="card-divider" />

                {/* Campi non modificabili */}
                <InfoRow
                  label="Volume"
                  value={lot.volume ? `${lot.volume.toLocaleString("it-IT")} L` : null}
                />
                <InfoRow
                  label="Peso fattoria"
                  value={lot.weight ? `${lot.weight.toLocaleString("it-IT")} kg` : null}
                />
                <InfoRow label="Big Bags" value={lot.bigBag} />

                <hr className="card-divider" />

                {/* Campi modificabili */}
                <InfoRow
                  label="Peso deposito"
                  value={lot.weight_deposit ? `${lot.weight_deposit.toLocaleString("it-IT")} kg` : null}
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    value={editForm.weight_deposit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, weight_deposit: e.target.value }))}
                    placeholder="kg"
                  />
                </InfoRow>

                <InfoRow
                  label="Umidità"
                  value={lot.umidity != null ? `${lot.umidity}%` : null}
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editForm.umidity}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, umidity: e.target.value }))}
                    placeholder="%"
                  />
                </InfoRow>

                <InfoRow
                  label="Cata"
                  value={lot.cata != null ? `${lot.cata}%` : null}
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.cata}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, cata: e.target.value }))}
                    placeholder="%"
                  />
                </InfoRow>

                <InfoRow
                  label="Deposito"
                  value={lot.deposit || null}
                  editing={editing}
                >
                  <select
                    className="info-select"
                    value={editForm.deposit}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, deposit: e.target.value }))}
                  >
                    <option value="">— Vendita diretta —</option>
                    {deposits.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </InfoRow>

                {/* Bottoni */}
                <div className="card-actions">
                  {editing ? (
                    <>
                      <button
                        className="action-button save"
                        onClick={() => handleSave(lot.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Salvataggio..." : "Salva"}
                      </button>
                      <button
                        className="action-button cancel"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-button"
                      onClick={() => handleEdit(lot)}
                    >
                      Modifica
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Stocking;