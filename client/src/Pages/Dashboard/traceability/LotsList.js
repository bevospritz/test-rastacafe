import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useLang } from "../../../LanguageContext";
import { useAuth } from "../../../AuthContext";
import BackButton from "../../../components/BackButton";
import "../Traceability.css";

Modal.setAppElement("#root");

const BASE_URL = "http://localhost:5000";

const CONFIG = {
  newlot: {
    title: "Nuovi Lotti",
    nLotField: "newlot_nLot",
    statusField: "worked",
    activeStatuses: [0],
    columns: ["newlot_nLot", "date", "plot", "volume", "method", "type"],
    editableFields: ["plot", "method", "type"],
    labels: {
      newlot_nLot: "Lotto",
      date: "Data",
      plot: "Talhão",
      volume: "Volume (L)",
      method: "Metodo",
      type: "Tipo",
    },
  },
  patio: {
    title: "Patios",
    nLotField: "patio_nLot",
    statusField: "status",
    activeStatuses: ["active", "split", "fermented"],
    columns: ["patio_nLot", "date", "name", "volume", "type", "status"],
    editableFields: ["name"],
    labels: {
      patio_nLot: "Lotto",
      date: "Data",
      name: "Patio",
      volume: "Volume (L)",
      type: "Tipo",
      status: "Status",
    },
  },
  dryer: {
    title: "Dryer",
    nLotField: "dryer_nLot",
    statusField: "status",
    activeStatuses: ["active", "split"],
    columns: ["dryer_nLot", "date", "dryer", "volume", "type", "status"],
    editableFields: ["dryer", "timeIn"],
    labels: {
      dryer_nLot: "Lotto",
      date: "Data",
      dryer: "Dryer",
      volume: "Volume (L)",
      type: "Tipo",
      status: "Status",
    },
  },
  fermentation: {
    title: "Fermentazioni",
    nLotField: "fermentation_nLot",
    statusField: "worked",
    activeStatuses: [0],
    columns: [
      "fermentation_nLot",
      "date",
      "volume",
      "method",
      "type",
      "worked",
    ],
    editableFields: ["method", "timeIn", "timeOut"],
    labels: {
      fermentation_nLot: "Lotto",
      date: "Data",
      volume: "Volume (L)",
      method: "Metodo",
      type: "Tipo",
      worked: "Status",
    },
  },
  rest: {
    title: "Tulha / Rest",
    nLotField: "rest_nLot",
    statusField: "status",
    activeStatuses: ["active", "split"],
    columns: ["rest_nLot", "date", "tulha", "volume", "type", "status"],
    editableFields: ["tulha", "timeIn"],
    labels: {
      rest_nLot: "Lotto",
      date: "Data",
      tulha: "Tulha",
      volume: "Volume (L)",
      type: "Tipo",
      status: "Status",
    },
  },
  cleaning: {
  title: "Cleaning",
  nLotField: "cleaning_nLot",
  statusField: "status",
  activeStatuses: ["available", "partial"],
  columns: ["cleaning_nLot", "date", "type", "volume", "weight", "bags", "deposit", "status"],
  editableFields: ["umidity", "cata", "bebida"],
  labels: {
    cleaning_nLot: "Lotto",
    date: "Data",
    type: "Tipo",
    volume: "Volume (L)",
    weight: "Peso (kg)",
    bags: "Sacchi",
    deposit: "Deposit",      
    status: "Status",
  },
},
  selling: {
    title: "Vendite",
    nLotField: "selling_nLot",
    statusField: null,
    activeStatuses: null,
    columns: [
      "selling_nLot",
      "date",
      "buyer_name",
      "bags_sold",
      "price_per_bag",
      "currency",
    ],
    editableFields: ["notes", "price_per_bag"],
    labels: {
      selling_nLot: "Lotto",
      date: "Data",
      buyer_name: "Acquirente",
      bags_sold: "Sacchi",
      price_per_bag: "Prezzo/Sacco",
      currency: "Valuta",
    },
  },
};

const formatValue = (key, value) => {
  if (!value && value !== 0) return "—";
  if (key === "date") return new Date(value).toLocaleDateString("it-IT");
  if (key === "volume" || key === "weight")
    return Number(value).toLocaleString("it-IT");
  if (key === "type") {
  const typeMap = {
    "CD":            "type-cd",
    "Natural":       "type-natural",
    "Green":         "type-green",
    "Dry":           "type-dry",
    "BigDry":        "type-bigdry",
    "CDGreen":       "type-cdgreen",
    "WashedNatural": "type-washednnatural",
  };
  // gestisce anche valori multipli es. "CD, Green"
  const types = String(value).split(", ");
  return (
    <span style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {types.map((tp, i) => (
        <span key={i} className={`type-badge ${typeMap[tp.trim()] || ""}`}>{tp.trim()}</span>
      ))}
    </span>
  );
}
  if (key === "worked") return value === 0 ? "Attiva" : "Completata";
  if (key === "status") {
    const map = {
      active: { label: "Attivo", cls: "lots-status-active" },
      split: { label: "Split", cls: "lots-status-partial" },
      partial: { label: "Parziale", cls: "lots-status-partial" },
      fermented: { label: "Fermentato", cls: "lots-status-active" },
      available: { label: "Disponibile", cls: "lots-status-active" },
      finished: { label: "Archiviato", cls: "lots-status-finished" },
      sold: { label: "Venduto", cls: "lots-status-finished" },
    };
    const s = map[value];
    if (s)
      return <span className={`lots-status-badge ${s.cls}`}>{s.label}</span>;
  }
  return value;
};

const getRawValue = (key, value) => {
  if (!value && value !== 0) return "";
  if (key === "date") return new Date(value).getTime();
  if (
    key === "volume" ||
    key === "weight" ||
    key === "bags_sold" ||
    key === "price_per_bag"
  )
    return Number(value);
  return String(value).toLowerCase();
};

const isActive = (lot, config) => {
  if (!config.statusField) return true;
  console.log("statusField:", config.statusField, "value:", lot[config.statusField], "activeStatuses:", config.activeStatuses, "result:", config.activeStatuses?.includes(lot[config.statusField]));
  return config.activeStatuses?.includes(lot[config.statusField]);
};

const TableHeader = ({
  columns,
  labels,
  handleSort,
  sortArrow,
  showActions,
}) => (
  <thead>
    <tr>
      {columns.map((col) => (
        <th
          key={col}
          onClick={() => handleSort(col)}
          className="plots-th-sortable"
        >
          {labels[col] || col}
          {sortArrow(col)}
        </th>
      ))}
      {showActions && <th>Azioni</th>}
    </tr>
  </thead>
);

const ActionButtons = ({ lot, isAdmin, t, handleOpenEdit, handleDelete }) => (
  <td onClick={(e) => e.stopPropagation()} className="plots-actions-cell">
    {isAdmin && (
      <>
        <button
          className="action-button plots-edit-btn"
          style={{ marginTop: 0, padding: "3px 10px", fontSize: "0.78rem" }}
          onClick={() => handleOpenEdit(lot)}
        >
          {t("edit")}
        </button>
        <button
          className="action-button"
          style={{
            backgroundColor: "var(--color-danger)",
            marginTop: 0,
            padding: "3px 10px",
            fontSize: "0.78rem",
            width: "auto",
          }}
          onClick={() => handleDelete(lot)}
        >
          {t("delete")}
        </button>
      </>
    )}
  </td>
);

const LotsList = () => {
  const { type } = useParams();
  const { t } = useLang();
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("users");
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Nuovi stati
  const [showArchived, setShowArchived] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });

  const config = CONFIG[type];

  const fetchLots = useCallback(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/api/lots/${type}`)
      .then((res) => {
        setLots(res.data || []);
      })
      .catch((err) => console.error("Errore caricamento lotti:", err))
      .finally(() => setLoading(false));
  }, [type]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // Sort
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const sortArrow = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.dir === "asc" ? " ↑" : " ↓";
  };

  // Filtra e ordina
  const processLots = (lotList) => {
    let filtered = lotList;

    // Ricerca full-text su tutte le colonne
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = lotList.filter((lot) =>
        config.columns.some((col) => {
          const val = formatValue(col, lot[col]);
          return String(val).toLowerCase().includes(q);
        }),
      );
    }

    // Sort
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const va = getRawValue(sortConfig.key, a[sortConfig.key]);
        const vb = getRawValue(sortConfig.key, b[sortConfig.key]);
        if (va < vb) return sortConfig.dir === "asc" ? -1 : 1;
        if (va > vb) return sortConfig.dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const activeLots = useMemo(
    () => processLots(lots.filter((l) => isActive(l, config))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lots, searchText, sortConfig],
  );

  const archivedLots = useMemo(
    () => processLots(lots.filter((l) => !isActive(l, config))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lots, searchText, sortConfig],
  );

  if (!config)
    return (
      <div className="form-container">
        <p>Tipo non valido.</p>
      </div>
    );

  const allArchived = lots.filter((l) => !isActive(l, config));

  const handleOpenDetail = (lot) => {
    setSelectedLot(lot);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (lot) => {
    setSelectedLot(lot);
    const initial = {};
    config.editableFields.forEach((f) => {
      initial[f] = lot[f] ?? "";
    });
    setEditForm(initial);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLot || isSaving) return;
    setIsSaving(true);
    try {
      await axios.patch(
        `${BASE_URL}/api/lots/${type}/${selectedLot.id}`,
        editForm,
      );
      setIsEditOpen(false);
      fetchLots();
    } catch (err) {
      alert(err.response?.data?.error || t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lot) => {
    if (isDeleting) return;
    const nLot = lot[config.nLotField];
    const check = await axios.get(`${BASE_URL}/api/can-delete/${type}/${nLot}`);
    if (!check.data.canDelete) {
      alert(
        `Non puoi eliminare questo lotto perché esistono lotti collegati di tipo: ${check.data.childType}.\n\nElimina prima i lotti successivi.`,
      );
      return;
    }
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare il lotto ${nLot}? Questa azione è irreversibile.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/api/lots/${type}/${lot.id}`);
      setIsDetailOpen(false);
      fetchLots();
    } catch (err) {
      alert(err.response?.data?.error || t("error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <BackButton to="/dashboard/traceability" />
        <h2 style={{ margin: 0 }}>{config.title}</h2>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.82rem",
            color: "var(--color-text-muted)",
          }}
        >
          {activeLots.length} attivi · {allArchived.length} archiviati
        </span>
      </div>

      {/* Barra ricerca */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="🔍 Cerca per lotto, data, tipo, talhão..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            fontSize: "0.9rem",
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
        />
      </div>

      {loading ? (
        <p className="empty-state">{t("loading")}</p>
      ) : (
        <>
          {/* Lotti attivi */}
          {lots.length > 0 && (
            <table>
              <TableHeader
                columns={config.columns}
                labels={config.labels}
                handleSort={handleSort}
                sortArrow={sortArrow}
                showActions={true}
              />
              <tbody>
                {/* Lotti attivi */}
                {activeLots.map((lot) => (
                  <tr
                    key={lot.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleOpenDetail(lot)}
                  >
                    {config.columns.map((col) => (
                      <td key={col}>{formatValue(col, lot[col])}</td>
                    ))}
                    <ActionButtons
                      lot={lot}
                      isAdmin={isAdmin}
                      t={t}
                      handleOpenEdit={handleOpenEdit}
                      handleDelete={handleDelete}
                    />
                  </tr>
                ))}

                {/* Riga separatrice archiviati */}
                {allArchived.length > 0 && (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      style={{ padding: 0 }}
                    >
                      <div
                        className="lots-archived-header"
                        onClick={() => setShowArchived(!showArchived)}
                      >
                        <span
                          className="lots-archived-arrow"
                          style={{
                            transform: showArchived
                              ? "rotate(90deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▶
                        </span>
                        ARCHIVIATI ({allArchived.length})
                      </div>
                    </td>
                  </tr>
                )}

                {/* Lotti archiviati */}
                {showArchived &&
                  archivedLots.map((lot) => (
                    <tr
                      key={lot.id}
                      style={{ cursor: "pointer", opacity: 0.55 }}
                      onClick={() => handleOpenDetail(lot)}
                    >
                      {config.columns.map((col) => (
                        <td key={col}>{formatValue(col, lot[col])}</td>
                      ))}
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="plots-actions-cell"
                      >
                        {isAdmin && (
                          <button
                            className="action-button"
                            style={{
                              backgroundColor: "var(--color-danger)",
                              marginTop: 0,
                              padding: "3px 10px",
                              fontSize: "0.78rem",
                              width: "auto",
                            }}
                            onClick={() => handleDelete(lot)}
                          >
                            {t("delete")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {lots.length === 0 && <p className="empty-state">{t("noData")}</p>}
        </>
      )}

      {/* Modal dettagli */}
      <Modal
        isOpen={isDetailOpen}
        onRequestClose={() => setIsDetailOpen(false)}
        contentLabel="Dettagli Lotto"
        className="modal-content"
        overlayClassName="modal"
      >
        {selectedLot && (
          <>
            <div className="modal-header">
              <h2>{selectedLot[config.nLotField]} — Dettagli</h2>
            </div>
            <div className="modal-body">
              {Object.entries(config.labels).map(([key, label]) => (
                <div key={key} className="info-row">
                  <span className="info-label">{label}</span>
                  <span className="info-value">
                    {formatValue(key, selectedLot[key])}
                  </span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="action-button cancel"
                style={{ width: "auto" }}
                onClick={() => setIsDetailOpen(false)}
              >
                {t("cancel")}
              </button>
              {isAdmin && (
                <>
                  <button
  className="action-button plots-edit-btn"
  style={{ width: "auto", padding: "8px 16px", fontSize: "0.9rem" }}  // ← aggiungi
  onClick={() => {
    setIsDetailOpen(false);
    handleOpenEdit(selectedLot);
  }}
>
  {t("edit")}
</button>
                  <button
                    className="action-button"
                    style={{
                      width: "auto",
                      backgroundColor: "var(--color-danger)",
                    }}
                    onClick={() => handleDelete(selectedLot)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "..." : t("delete")}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Modal modifica */}
      <Modal
        isOpen={isEditOpen}
        onRequestClose={() => setIsEditOpen(false)}
        contentLabel="Modifica Lotto"
        className="modal-content"
        overlayClassName="modal"
      >
        {selectedLot && (
          <>
            <div className="modal-header">
              <h2>
                {t("edit")} — {selectedLot[config.nLotField]}
              </h2>
            </div>
            <div className="modal-body">
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-text-muted)",
                  marginBottom: "1rem",
                }}
              >
                Solo i campi modificabili sono mostrati.
              </p>
              {config.editableFields.map((field) => (
                <label key={field}>
                  {config.labels[field] || field}:
                  <input
                    type="text"
                    value={editForm[field] ?? ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="action-button cancel"
                style={{ width: "auto" }}
                onClick={() => setIsEditOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="action-button save"
                style={{ width: "auto" }}
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? t("saving") : t("save")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default LotsList;
