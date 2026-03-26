import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { useLang } from "../../LanguageContext";
import "./Traceability.css";

Modal.setAppElement("#root");

const ManageFarm = () => {
  const { t } = useLang();
  const [farms, setFarms] = useState([]);
  const [stats, setStats] = useState(null);
  const [newFarm, setNewFarm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState("");
  const navigate = useNavigate();

  const fetchFarms = () => {
    axios.get("http://localhost:5000/api/farm")
      .then((res) => { if (Array.isArray(res.data)) setFarms(res.data); })
      .catch((err) => console.error("Error fetching farms:", err));
  };

  useEffect(() => { fetchFarms(); }, []);

  // Carica statistiche quando la farm è disponibile
  useEffect(() => {
    if (farms.length > 0) {
      axios.get(`http://localhost:5000/api/farm/${farms[0].id}/stats`)
        .then((res) => setStats(res.data))
        .catch((err) => console.error("Error fetching stats:", err));
    }
  }, [farms]);

  const handleAddFarm = () => {
    if (!newFarm.trim()) { alert("Inserisci un nome per la farm."); return; }
    axios.post("http://localhost:5000/api/farm", { name: newFarm })
      .then((response) => {
        setFarms([...farms, response.data]);
        setNewFarm("");
        setShowAddForm(false);
        alert("Farm creata con successo!");
      })
      .catch((error) => {
        console.error("Error adding farm:", error);
        alert("Errore nella creazione della farm: " + error.message);
      });
  };

  const handleEditFarm = async () => {
    if (!editName.trim()) { alert("Inserisci un nome valido."); return; }
    try {
      await axios.patch(`http://localhost:5000/api/farm/${farms[0].id}`, { name: editName });
      setShowEditForm(false);
      fetchFarms();
    } catch (err) {
      alert("Errore durante la modifica.");
    }
  };

  const openEdit = () => {
    setEditName(farms[0].name);
    setShowEditForm(true);
  };

  const InfoRow = ({ label, value }) => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="form-container">
      <h2>{t("manageFarmTitle")}</h2>

      {farms.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>{t("noFarms")}</p>
          <button className="action-button" style={{ width: "auto", padding: "10px 28px" }}
            onClick={() => setShowAddForm(true)}>
            {t("addFarm")}
          </button>
        </div>
      ) : (
        <div className="tulha-card" style={{ maxWidth: "480px", margin: "0 auto" }}>

          {/* Header */}
          <div className="stocking-card-top" style={{ marginBottom: "0.75rem" }}>
            <span className="tulha-card-title" style={{ fontSize: "1.3rem" }}>
              🌿 {farms[0].name.toUpperCase()}
            </span>
            <button
              className="action-button"
              style={{ backgroundColor: "var(--color-edit)", width: "auto", marginTop: 0, padding: "4px 12px", fontSize: "0.82rem" }}
              onClick={openEdit}
            >
              {t("edit")}
            </button>
          </div>

          <hr className="card-divider" />

          {/* Info dinamiche */}
          <div className="info-section-title">{t("info")}</div>
          <InfoRow label={t("nFarmlands")} value={stats?.nPlots ?? "..."} />
          <InfoRow
            label={t("totalSurface")}
            value={stats ? `${parseFloat(stats.totalSurface).toFixed(2)} ha` : "..."}
          />
          <InfoRow
            label={t("avgAge")}
            value={stats ? `${stats.avgAge} ${t("years")}` : "..."}
          />

          <hr className="card-divider" />

          {/* Navigazione */}
          <div className="info-section-title">{t("manage")}</div>
          <div className="button-container" style={{ marginTop: "0.75rem" }}>
            <button className="action-button" onClick={() => navigate("/dashboard/gestione-struttura")}>
              {t("structure")}
            </button>
            <button className="action-button" onClick={() => navigate("/dashboard/gestione-appezzamenti")}>
              {t("farmlands")}
            </button>
          </div>
        </div>
      )}

      {/* Modal nuova farm */}
      <Modal isOpen={showAddForm} onRequestClose={() => setShowAddForm(false)}
        contentLabel="Nuova Farm" className="modal-content" overlayClassName="modal">
        <div className="modal-header"><h2>{t("newFarm")}</h2></div>
        <div className="modal-body">
          <label>{t("farmName")}:
            <input type="text" value={newFarm}
              onChange={(e) => setNewFarm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFarm()}
              placeholder="es. Fazenda Boa Vista" />
          </label>
        </div>
        <div className="modal-footer">
          <button className="action-button cancel" style={{ width: "auto", marginRight: "8px" }}
            onClick={() => setShowAddForm(false)}>{t("cancel")}</button>
          <button className="action-button save" style={{ width: "auto" }}
            onClick={handleAddFarm}>{t("add")}</button>
        </div>
      </Modal>

      {/* Modal modifica farm */}
      <Modal isOpen={showEditForm} onRequestClose={() => setShowEditForm(false)}
        contentLabel="Modifica Farm" className="modal-content" overlayClassName="modal">
        <div className="modal-header"><h2>{t("editFarm")}</h2></div>
        <div className="modal-body">
          <label>{t("farmName")}:
            <input type="text" value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditFarm()}
              placeholder="es. Fazenda Boa Vista" />
          </label>
        </div>
        <div className="modal-footer">
          <button className="action-button cancel" style={{ width: "auto", marginRight: "8px" }}
            onClick={() => setShowEditForm(false)}>{t("cancel")}</button>
          <button className="action-button save" style={{ width: "auto" }}
            onClick={handleEditFarm}>{t("save")}</button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageFarm;