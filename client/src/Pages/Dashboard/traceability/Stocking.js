import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLang } from "../../../LanguageContext";
import BackButton from "../../../components/BackButton";
import "../Traceability.css";

const BEBIDA_OPTIONS = ["Strictly Soft", "Soft", "Softish", "Hard", "Riada", "Rioy", "Rio"];

const InfoRow = ({ label, value, editing, children }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    {editing ? children : (
      <span className={`info-value ${!value ? "empty" : ""}`}>{value ?? "—"}</span>
    )}
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="info-section-title">{children}</div>
);

const Stocking = () => {
  const { t } = useLang();
  const [lots, setLots] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deposits, setDeposits] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState("table"); // "table" | "cards"

  useEffect(() => { fetchLots(); fetchDeposits(); }, []);

  const fetchLots = () => {
    axios.get("http://localhost:5000/api/cleaning")
      .then((res) => setLots(res.data || []))
      .catch((err) => console.error("Errore caricamento cleaning:", err));
  };

  const fetchDeposits = () => {
    axios.get("http://localhost:5000/api/deposits")
      .then((res) => setDeposits(res.data || []))
      .catch((err) => console.error("Errore caricamento deposits:", err));
  };

  const handleEdit = (lot) => {
    setEditingId(lot.id);
    setEditForm({
      weight: lot.weight ?? "", bags: lot.bags ?? "",
      umidity: lot.umidity ?? "", cata: lot.cata ?? "",
      peneira: lot.peneira ?? "", weight_deposit: lot.weight_deposit ?? "",
      umidity_deposit: lot.umidity_deposit ?? "", cata_deposit: lot.cata_deposit ?? "",
      peneira_deposit: lot.peneira_deposit ?? "", bebida: lot.bebida ?? "",
      deposit: lot.deposit ?? "",
    });
  };

  const handleCancel = () => { setEditingId(null); setEditForm({}); };

  const handleSave = async (id) => {
    setIsSaving(true);
    try {
      await axios.patch(`http://localhost:5000/api/cleaning/${id}`, {
        weight: editForm.weight !== "" ? parseInt(editForm.weight) : null,
        bags: editForm.bags !== "" ? parseInt(editForm.bags) : null,
        umidity: editForm.umidity !== "" ? parseFloat(editForm.umidity) : null,
        cata: editForm.cata !== "" ? parseInt(editForm.cata) : null,
        peneira: editForm.peneira !== "" ? parseFloat(editForm.peneira) : null,
        weight_deposit: editForm.weight_deposit !== "" ? parseInt(editForm.weight_deposit) : null,
        umidity_deposit: editForm.umidity_deposit !== "" ? parseFloat(editForm.umidity_deposit) : null,
        cata_deposit: editForm.cata_deposit !== "" ? parseInt(editForm.cata_deposit) : null,
        peneira_deposit: editForm.peneira_deposit !== "" ? parseFloat(editForm.peneira_deposit) : null,
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
  const handleChange = (field) => (e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Vista Tabella ──
  const TableView = () => (
    <table>
      <thead>
        <tr>
          <th>{t("lot")}</th>
          <th>{t("date")}</th>
          <th>{t("bags")}</th>
          <th>{t("weight")}</th>
          <th>{t("humidity")}</th>
          <th>{t("peneira")}</th>
          <th>{t("bebida")}</th>
          <th>{t("deposit")}</th>
          <th>{t("actions")}</th>
        </tr>
      </thead>
      <tbody>
        {lots.map((lot) => {
          const editing = isEditing(lot.id);
          return (
            <tr key={lot.id}>
              <td><strong>{lot.cleaning_nLot}</strong></td>
              <td>{formatDate(lot.date)}</td>
              <td>
                {editing
                  ? <input className="info-input" type="number" min="0" value={editForm.bags} onChange={handleChange("bags")} placeholder="n°" />
                  : lot.bags ?? "—"}
              </td>
              <td>
                {editing
                  ? <input className="info-input" type="number" min="0" value={editForm.weight_deposit} onChange={handleChange("weight_deposit")} placeholder="kg" />
                  : lot.weight_deposit ? `${lot.weight_deposit.toLocaleString("it-IT")} kg` : "—"}
              </td>
              <td>
                {editing
                  ? <input className="info-input" type="number" min="0" max="100" step="0.1" value={editForm.umidity_deposit} onChange={handleChange("umidity_deposit")} placeholder="%" />
                  : lot.umidity_deposit != null ? `${lot.umidity_deposit}%` : "—"}
              </td>
              <td>
                {editing
                  ? <input className="info-input" type="number" min="0" max="100" step="0.1" value={editForm.peneira_deposit} onChange={handleChange("peneira_deposit")} placeholder="%" />
                  : lot.peneira_deposit != null ? `${lot.peneira_deposit}%` : "—"}
              </td>
              <td>
                {editing
                  ? <select className="info-select" value={editForm.bebida} onChange={handleChange("bebida")}>
                      <option value="">—</option>
                      {BEBIDA_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  : lot.bebida || "—"}
              </td>
              <td>
                {editing
                  ? <select className="info-select" value={editForm.deposit} onChange={handleChange("deposit")}>
                      <option value="">— {t("directSale")} —</option>
                      {deposits.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  : lot.deposit || <span style={{ color: "#aaa", fontStyle: "italic" }}>{t("directSale")}</span>}
              </td>
              <td className="plots-actions-cell">
                {editing ? (
                  <>
                    <button className="action-button save" style={{ width: "auto", marginTop: 0, padding: "3px 10px", fontSize: "0.78rem" }}
                      onClick={() => handleSave(lot.id)} disabled={isSaving}>
                      {isSaving ? t("saving") : t("save")}
                    </button>
                    <button className="action-button cancel" style={{ width: "auto", marginTop: 0, padding: "3px 10px", fontSize: "0.78rem" }}
                      onClick={handleCancel} disabled={isSaving}>
                      {t("cancel")}
                    </button>
                  </>
                ) : (
                  <button className="action-button plots-edit-btn" style={{ width: "auto", marginTop: 0, padding: "3px 10px", fontSize: "0.78rem" }}
                    onClick={() => handleEdit(lot)}>
                    {t("edit")}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // ── Vista Cards ──
  const CardsView = () => (
    <div className="tulha-grid">
      {lots.map((lot) => {
        const editing = isEditing(lot.id);
        return (
          <div key={lot.id} className={`tulha-card ${editing ? "editing" : ""}`}>
            <div className="stocking-card-header">
              <div className="stocking-card-top">
                <span className="tulha-card-title">{lot.cleaning_nLot}</span>
                <span className={`badge ${lot.deposit ? "badge-deposit" : "badge-direct"}`}>
                  {lot.deposit || t("directSale")}
                </span>
              </div>
              <div className="tulha-card-meta">{formatDate(lot.date)}</div>
            </div>
            <hr className="card-divider" />
            <InfoRow label="Volume" value={lot.volume ? `${lot.volume.toLocaleString("it-IT")} L` : null} />
            <hr className="card-divider" />
            <SectionTitle>{t("farmData")}</SectionTitle>
            <InfoRow label={t("weight")} value={lot.weight ? `${lot.weight.toLocaleString("it-IT")} kg` : null} editing={editing}>
              <input className="info-input" type="number" min="0" value={editForm.weight} onChange={handleChange("weight")} placeholder="kg" />
            </InfoRow>
            <InfoRow label={t("bags")} value={lot.bags ?? null} editing={editing}>
              <input className="info-input" type="number" min="0" value={editForm.bags} onChange={handleChange("bags")} placeholder="n°" />
            </InfoRow>
            <InfoRow label={t("humidity")} value={lot.umidity != null ? `${lot.umidity}%` : null} editing={editing}>
              <input className="info-input" type="number" min="0" max="100" step="0.1" value={editForm.umidity} onChange={handleChange("umidity")} placeholder="%" />
            </InfoRow>
            <InfoRow label={t("defects")} value={lot.cata != null ? `${lot.cata}%` : null} editing={editing}>
              <input className="info-input" type="number" min="0" max="100" value={editForm.cata} onChange={handleChange("cata")} placeholder="%" />
            </InfoRow>
            <InfoRow label={t("peneira")} value={lot.peneira != null ? `${lot.peneira}%` : null} editing={editing}>
              <input className="info-input" type="number" min="0" max="100" step="0.1" value={editForm.peneira} onChange={handleChange("peneira")} placeholder="%" />
            </InfoRow>
            <hr className="card-divider" />
            <SectionTitle>{t("depositData")}</SectionTitle>
            <InfoRow label={t("weight")} value={lot.weight_deposit ? `${lot.weight_deposit.toLocaleString("it-IT")} kg` : null} editing={editing}>
              <input className="info-input" type="number" min="0" value={editForm.weight_deposit} onChange={handleChange("weight_deposit")} placeholder="kg" />
            </InfoRow>
            <InfoRow label={t("humidity")} value={lot.umidity_deposit != null ? `${lot.umidity_deposit}%` : null} editing={editing}>
              <input className="info-input" type="number" min="0" max="100" step="0.1" value={editForm.umidity_deposit} onChange={handleChange("umidity_deposit")} placeholder="%" />
            </InfoRow>
            <InfoRow label={t("defects")} value={lot.cata_deposit != null ? `${lot.cata_deposit}%` : null} editing={editing}>
              <input className="info-input" type="number" min="0" max="100" value={editForm.cata_deposit} onChange={handleChange("cata_deposit")} placeholder="%" />
            </InfoRow>
            <InfoRow label={t("peneira")} value={lot.peneira_deposit != null ? `${lot.peneira_deposit}%` : null} editing={editing}>
              <input className="info-input" type="number" min="0" max="100" step="0.1" value={editForm.peneira_deposit} onChange={handleChange("peneira_deposit")} placeholder="%" />
            </InfoRow>
            <InfoRow label={t("bebida")} value={lot.bebida || null} editing={editing}>
              <select className="info-select" value={editForm.bebida} onChange={handleChange("bebida")}>
                <option value="">—</option>
                {BEBIDA_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </InfoRow>
            <InfoRow label={t("deposit")} value={lot.deposit || null} editing={editing}>
              <select className="info-select" value={editForm.deposit} onChange={handleChange("deposit")}>
                <option value="">— {t("directSale")} —</option>
                {deposits.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </InfoRow>
            <div className="card-actions">
              {editing ? (
                <>
                  <button className="action-button save" onClick={() => handleSave(lot.id)} disabled={isSaving}>
                    {isSaving ? t("saving") : t("save")}
                  </button>
                  <button className="action-button cancel" onClick={handleCancel} disabled={isSaving}>{t("cancel")}</button>
                </>
              ) : (
                <button className="action-button" onClick={() => handleEdit(lot)}>{t("edit")}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="form-container">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <BackButton to="/dashboard/traceability/manage-lot" />
        <h2 style={{ margin: 0 }}>{t("stockingTitle")}</h2>
        {/* Toggle vista */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          <button
            onClick={() => setView("table")}
            style={{
              padding: "6px 14px", fontSize: "0.82rem", cursor: "pointer",
              border: "1px solid var(--color-border)", borderRadius: "6px 0 0 6px",
              backgroundColor: view === "table" ? "var(--color-primary)" : "#fff",
              color: view === "table" ? "#fff" : "var(--color-text-muted)",
              fontWeight: view === "table" ? "600" : "400",
            }}
          >
            ☰ {t("table") || "Tabella"}
          </button>
          <button
            onClick={() => setView("cards")}
            style={{
              padding: "6px 14px", fontSize: "0.82rem", cursor: "pointer",
              border: "1px solid var(--color-border)", borderRadius: "0 6px 6px 0",
              borderLeft: "none",
              backgroundColor: view === "cards" ? "var(--color-primary)" : "#fff",
              color: view === "cards" ? "#fff" : "var(--color-text-muted)",
              fontWeight: view === "cards" ? "600" : "400",
            }}
          >
            ⊞ {t("cards") || "Cards"}
          </button>
        </div>
      </div>

      <p className="page-subtitle">{t("stockingSubtitle")}</p>

      {lots.length === 0 ? (
        <p className="empty-state">{t("noData")}</p>
      ) : (
        view === "table" ? <TableView /> : <CardsView />
      )}
    </div>
  );
};

export default Stocking;