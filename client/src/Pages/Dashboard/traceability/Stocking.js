import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Traceability.css";

const BEBIDA_OPTIONS = [
  "Strictly Soft",
  "Soft",
  "Softish",
  "Hard",
  "Riada",
  "Rioy",
  "Rio",
];

// ← FUORI dal componente — non vengono ricreati ad ogni render
const InfoRow = ({ label, value, editing, children }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    {editing ? (
      children
    ) : (
      <span className={`info-value ${!value ? "empty" : ""}`}>
        {value ?? "—"}
      </span>
    )}
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="info-section-title">{children}</div>
);

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
      weight: lot.weight ?? "",
      bags: lot.bags ?? "",
      umidity: lot.umidity ?? "",
      cata: lot.cata ?? "",
      peneira: lot.peneira ?? "",
      weight_deposit: lot.weight_deposit ?? "",
      umidity_deposit: lot.umidity_deposit ?? "",
      cata_deposit: lot.cata_deposit ?? "",
      peneira_deposit: lot.peneira_deposit ?? "",
      bebida: lot.bebida ?? "",
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
        weight: editForm.weight !== "" ? parseInt(editForm.weight) : null,
        bags: editForm.bags !== "" ? parseInt(editForm.bags) : null,
        umidity: editForm.umidity !== "" ? parseFloat(editForm.umidity) : null,
        cata: editForm.cata !== "" ? parseInt(editForm.cata) : null,
        peneira: editForm.peneira !== "" ? parseFloat(editForm.peneira) : null,
        weight_deposit:
          editForm.weight_deposit !== ""
            ? parseInt(editForm.weight_deposit)
            : null,
        umidity_deposit:
          editForm.umidity_deposit !== ""
            ? parseFloat(editForm.umidity_deposit)
            : null,
        cata_deposit:
          editForm.cata_deposit !== "" ? parseInt(editForm.cata_deposit) : null,
        peneira_deposit:
          editForm.peneira_deposit !== ""
            ? parseFloat(editForm.peneira_deposit)
            : null,
        bebida: editForm.bebida || null,
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("it-IT") : "-");
  const isEditing = (id) => editingId === id;

  const handleChange = (field) => (e) =>
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));

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
                <div className="stocking-card-header">
                  <div className="stocking-card-top">
                    <span className="tulha-card-title">
                      {lot.cleaning_nLot}
                    </span>
                    <span
                      className={`badge ${lot.deposit ? "badge-deposit" : "badge-direct"}`}
                    >
                      {lot.deposit || "Vendita diretta"}
                    </span>
                  </div>
                  <div className="tulha-card-meta">{formatDate(lot.date)}</div>
                </div>

                <hr className="card-divider" />

                {/* Volume — non modificabile */}
                <InfoRow
                  label="Volume"
                  value={
                    lot.volume
                      ? `${lot.volume.toLocaleString("it-IT")} L`
                      : null
                  }
                />

                <hr className="card-divider" />

                {/* Dati fattoria */}
                <SectionTitle>Dati fattoria</SectionTitle>

                <InfoRow
                  label="Peso"
                  value={
                    lot.weight
                      ? `${lot.weight.toLocaleString("it-IT")} kg`
                      : null
                  }
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    value={editForm.weight}
                    onChange={handleChange("weight")}
                    placeholder="kg"
                  />
                </InfoRow>

                <InfoRow
                  label="Bags"
                  value={lot.bags ?? null}
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    value={editForm.bags}
                    onChange={handleChange("bags")}
                    placeholder="n°"
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
                    onChange={handleChange("umidity")}
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
                    onChange={handleChange("cata")}
                    placeholder="%"
                  />
                </InfoRow>

                <InfoRow
                  label="Peneira 17 (%)"
                  value={lot.peneira != null ? `${lot.peneira}%` : null}
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editForm.peneira}
                    onChange={handleChange("peneira")}
                    placeholder="%"
                  />
                </InfoRow>

                <hr className="card-divider" />

                {/* Dati deposito */}
                <SectionTitle>Dati deposito</SectionTitle>

                <InfoRow
                  label="Peso"
                  value={
                    lot.weight_deposit
                      ? `${lot.weight_deposit.toLocaleString("it-IT")} kg`
                      : null
                  }
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    value={editForm.weight_deposit}
                    onChange={handleChange("weight_deposit")}
                    placeholder="kg"
                  />
                </InfoRow>

                <InfoRow
                  label="Umidità"
                  value={
                    lot.umidity_deposit != null
                      ? `${lot.umidity_deposit}%`
                      : null
                  }
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editForm.umidity_deposit}
                    onChange={handleChange("umidity_deposit")}
                    placeholder="%"
                  />
                </InfoRow>

                <InfoRow
                  label="Cata"
                  value={
                    lot.cata_deposit != null ? `${lot.cata_deposit}%` : null
                  }
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.cata_deposit}
                    onChange={handleChange("cata_deposit")}
                    placeholder="%"
                  />
                </InfoRow>

                <InfoRow
                  label="Peneira 17 (%)"
                  value={
                    lot.peneira_deposit != null
                      ? `${lot.peneira_deposit}%`
                      : null
                  }
                  editing={editing}
                >
                  <input
                    className="info-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editForm.peneira_deposit}
                    onChange={handleChange("peneira_deposit")}
                    placeholder="%"
                  />
                </InfoRow>

                <InfoRow
                  label="Bebida"
                  value={lot.bebida || null}
                  editing={editing}
                >
                  <select
                    className="info-select"
                    value={editForm.bebida}
                    onChange={handleChange("bebida")}
                  >
                    <option value="">—</option>
                    {BEBIDA_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </InfoRow>

                <InfoRow
                  label="Deposito"
                  value={lot.deposit || null}
                  editing={editing}
                >
                  <select
                    className="info-select"
                    value={editForm.deposit}
                    onChange={handleChange("deposit")}
                  >
                    <option value="">— Vendita diretta —</option>
                    {deposits.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
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
