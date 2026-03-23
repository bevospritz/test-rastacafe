import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import "./Traceability.css";

Modal.setAppElement("#root");

const ManageFarm = () => {
  const [farms, setFarms] = useState([]);
  const [newFarm, setNewFarm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/farm")
      .then((response) => {
        if (Array.isArray(response.data)) {
          setFarms(response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching farms:", error);
      });
  }, []);

  const handleAddFarm = () => {
    if (!newFarm.trim()) {
      alert("Inserisci un nome per la farm.");
      return;
    }
    axios
      .post("http://localhost:5000/api/farm", { name: newFarm })
      .then((response) => {
        setFarms([...farms, response.data]);
        setNewFarm("");
        setShowForm(false);
        alert("Farm creata con successo!");
      })
      .catch((error) => {
        console.error("Error adding new farm:", error);
        alert("Errore nella creazione della farm: " + error.message);
      });
  };

  const handleDeleteFarm = (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa farm e tutti i suoi dati?")) return;
    axios
      .delete(`http://localhost:5000/api/farm/${id}`)
      .then(() => {
        setFarms(farms.filter((farm) => farm.id !== id));
      })
      .catch((error) => {
        console.error("Error deleting farm:", error);
        alert("Errore durante l'eliminazione.");
      });
  };

  return (
    <div className="form-container">
      <h2>Gestione Fattoria</h2>

      {farms.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 0" }}>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>
            Nessuna farm configurata.
          </p>
          <button className="action-button" style={{ width: "auto", padding: "10px 28px" }} onClick={() => setShowForm(true)}>
            + Aggiungi Farm
          </button>
        </div>
      ) : (
        <div className="tulha-card" style={{ maxWidth: "480px", margin: "0 auto" }}>

          {/* Header farm */}
          <div className="stocking-card-top" style={{ marginBottom: "0.75rem" }}>
            <span className="tulha-card-title" style={{ fontSize: "1.3rem" }}>
              🌿 {farms[0].name}
            </span>
            <button
              className="action-button"
              style={{ backgroundColor: "#dc3545", width: "auto", marginTop: 0, padding: "4px 12px", fontSize: "0.82rem" }}
              onClick={() => handleDeleteFarm(farms[0].id)}
            >
              Elimina
            </button>
          </div>

          <hr className="card-divider" />

          {/* Info farm */}
          <div className="info-section-title">Informazioni</div>
          <div className="info-row">
            <span className="info-label">N° appezzamenti</span>
            <span className="info-value">10</span>
          </div>
          <div className="info-row">
            <span className="info-label">Superficie (ha)</span>
            <span className="info-value">50</span>
          </div>

          <hr className="card-divider" />

          {/* Navigazione */}
          <div className="info-section-title">Gestione</div>
          <div className="button-container" style={{ marginTop: "0.75rem" }}>
            <button
              className="action-button"
              onClick={() => navigate("/dashboard/gestione-struttura")}
            >
              Struttura
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/dashboard/gestione-appezzamenti")}
            >
              Appezzamenti
            </button>
          </div>
        </div>
      )}

      {/* Modal nuova farm */}
      <Modal
        isOpen={showForm}
        onRequestClose={() => setShowForm(false)}
        contentLabel="Nuova Farm"
        className="modal-content"
        overlayClassName="modal"
      >
        <div className="modal-header">
          <h2>Nuova Farm</h2>
        </div>
        <div className="modal-body">
          <label>
            Nome farm:
            <input
              type="text"
              value={newFarm}
              onChange={(e) => setNewFarm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddFarm()}
              placeholder="es. Fazenda Boa Vista"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button className="action-button cancel" style={{ width: "auto", marginRight: "8px" }} onClick={() => setShowForm(false)}>
            Annulla
          </button>
          <button className="action-button save" style={{ width: "auto" }} onClick={handleAddFarm}>
            Aggiungi
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageFarm;