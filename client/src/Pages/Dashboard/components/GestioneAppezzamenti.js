import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { useDropzone } from "react-dropzone";
import "../Traceability.css";
import "./GestioneAppezzamenti.css";

Modal.setAppElement("#root");

const PlotsManagement = () => {
  const [farms, setFarms] = useState([]);
  const [plots, setPlots] = useState([]);
  const [showFormPlot, setShowFormPlot] = useState(false);
  const [showEditPlot, setShowEditPlot] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [editForm, setEditForm] = useState({ state: "", irrigation: "", renda_forecast: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filterText, setFilterText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [newPlot, setNewPlot] = useState({
    name: "", codename: "", variety: "", ncovas: "",
    distance: "", surface: "", age: "", state: "",
    irrigation: "", renda: "",
  });

  useEffect(() => {
    axios.get("http://localhost:5000/api/farm").then((response) => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        setFarms(response.data);
        setSelectedFarm(response.data[0]);
      }
    }).catch((err) => console.error("Error fetching farms:", err));

    axios.get("http://localhost:5000/api/plots").then((response) => {
      if (Array.isArray(response.data)) setPlots(response.data);
    }).catch((err) => console.error("Error fetching plots:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPlot((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPlot = (e) => {
    e.preventDefault();
    if (!selectedFarm) {
      alert("Nessuna farm selezionata.");
      return;
    }

    const plotData = {
      name: newPlot.name,
      codename: newPlot.codename,
      variety: newPlot.variety,
      ncovas: newPlot.ncovas,
      distance: newPlot.distance,
      surface: newPlot.surface,
      age: newPlot.age,
      state: newPlot.state,
      irrigation: newPlot.irrigation,
      renda_forecast: newPlot.renda,
      farmId: selectedFarm.id,
    };

    axios.post("http://localhost:5000/api/plots", plotData)
      .then((response) => {
        setPlots([...plots, response.data]);
        setNewPlot({ name: "", codename: "", variety: "", ncovas: "", distance: "", surface: "", age: "", state: "", irrigation: "", renda: "" });
        setShowFormPlot(false);
        alert("Talhão inserito con successo!");
      })
      .catch((error) => {
        console.error("Error adding plot:", error);
        alert("Errore nell'inserimento del talhão: " + error.message);
      });
  };

  const handleDeletePlot = (plotId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo appezzamento?")) return;
    axios.delete(`http://localhost:5000/api/plots/${plotId}`)
      .then(() => setPlots(plots.filter((p) => p.id !== plotId)))
      .catch((err) => console.error("Error deleting plot:", err));
  };

  // Apri modal modifica
  const handleOpenEdit = (plot) => {
    setEditingPlot(plot);
    setEditForm({
      state: plot.state ?? "",
      irrigation: plot.irrigation ?? "",
      renda_forecast: plot.renda_forecast ?? "",
    });
    setShowEditPlot(true);
  };

  // Salva modifiche
  const handleSaveEdit = async () => {
    if (!editingPlot) return;
    setIsSaving(true);
    try {
      await axios.patch(`http://localhost:5000/api/plots/${editingPlot.id}`, {
        state: editForm.state || null,
        irrigation: editForm.irrigation || null,
        renda_forecast: editForm.renda_forecast !== "" ? parseFloat(editForm.renda_forecast) : null,
      });
      // Aggiorna lo stato locale
      setPlots((prev) =>
        prev.map((p) =>
          p.id === editingPlot.id
            ? { ...p, state: editForm.state, irrigation: editForm.irrigation, renda_forecast: editForm.renda_forecast }
            : p
        )
      );
      setShowEditPlot(false);
      setEditingPlot(null);
    } catch (err) {
      console.error("Errore salvataggio plot:", err);
      alert("Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  // Sort e filter
  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const sortArrow = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "ascending" ? " ↑" : " ↓";
  };

  const filteredPlots = [...plots]
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    })
    .filter((plot) => plot.name?.toLowerCase().includes(filterText.toLowerCase()));

  // Dropzone
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || !selectedFarm) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("farmId", selectedFarm.id);

    try {
      setIsUploading(true);
      const res = await axios.post("http://localhost:5000/api/excelplots", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(`✅ ${res.data.message || "File caricato correttamente!"}`);
      const updated = await axios.get("http://localhost:5000/api/plots");
      setPlots(updated.data);
    } catch (err) {
      alert(`❌ Errore: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <div className="form-container plots-container">
      <h2>Gestione Appezzamenti</h2>

      {/* Filtro */}
      <div className="plots-filter-bar">
        <input
          type="text"
          placeholder="Filtra per nome..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="plots-filter-input"
        />
        <button
          className="action-button"
          style={{ width: "auto", marginTop: 0, padding: "8px 20px" }}
          onClick={() => { setShowFormPlot(true); setSelectedFarm(farms[0]); }}
        >
          + Aggiungi Talhão
        </button>
      </div>

      {farms.map((farm) => (
        <div key={farm.id}>
          <h3>{farm.name}</h3>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`plots-dropzone ${isDragActive ? "active" : ""} ${isUploading ? "uploading" : ""} ${!selectedFarm ? "disabled" : ""}`}
          >
            <input {...getInputProps()} disabled={!selectedFarm || isUploading} />
            {!selectedFarm ? (
              <p>⚠️ Seleziona prima una fattoria per importare un file Excel</p>
            ) : isUploading ? (
              <p>⏳ Caricamento in corso...</p>
            ) : isDragActive ? (
              <p>📂 Rilascia qui il file Excel</p>
            ) : (
              <p>📁 Trascina un file Excel o <strong>clicca</strong> per selezionarlo</p>
            )}
          </div>

          {/* Tabella */}
          <div className="plots-table-wrapper">
            <table>
              <thead>
                <tr>
                  {["name","codename","variety","ncovas","distance","surface","age","state","irrigation","renda_forecast","volume_harvested","renda_actual"].map((col) => (
                    <th key={col} onClick={() => requestSort(col)} className="plots-th-sortable">
                      {col.charAt(0).toUpperCase() + col.slice(1).replace("_", " ")}{sortArrow(col)}
                    </th>
                  ))}
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlots
                  .filter((p) => p.farmId === farm.id)
                  .map((plot) => (
                    <tr key={plot.id}>
                      <td>{plot.name}</td>
                      <td>{plot.codename}</td>
                      <td>{plot.variety}</td>
                      <td>{plot.ncovas}</td>
                      <td>{plot.distance}</td>
                      <td>{plot.surface}</td>
                      <td>{plot.age}</td>
                      <td>{plot.state}</td>
                      <td>{plot.irrigation}</td>
                      <td>{plot.renda_forecast}</td>
                      <td>{plot.volume_harvested}</td>
                      <td>{plot.renda_actual}</td>
                      <td className="plots-actions-cell">
                        <button
                          className="action-button plots-edit-btn"
                          onClick={() => handleOpenEdit(plot)}
                        >
                          Modifica
                        </button>
                        <button
                          className="action-button plots-delete-btn"
                          onClick={() => handleDeletePlot(plot.id)}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))}
                {filteredPlots.filter((p) => p.farmId === farm.id).length === 0 && (
                  <tr>
                    <td colSpan={13} className="empty-state">Nessun appezzamento trovato</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal nuovo talhão */}
      <Modal
        isOpen={showFormPlot}
        onRequestClose={() => setShowFormPlot(false)}
        contentLabel="Aggiungi Talhão"
        className="modal-content"
        overlayClassName="modal"
      >
        <div className="modal-header">
          <h2>Aggiungi Talhão</h2>
        </div>
        <div className="modal-body">
          <form onSubmit={handleAddPlot}>
            <label>Nome:
              <input type="text" name="name" value={newPlot.name} onChange={handleChange} placeholder="Nome del talhão" maxLength="50" required />
            </label>
            <label>Codice:
              <input type="text" name="codename" value={newPlot.codename}
                onChange={(e) => setNewPlot((prev) => ({ ...prev, codename: e.target.value.replace(/\s+/g, "").toUpperCase() }))}
                placeholder="Es. P12" maxLength="10" required />
            </label>
            <label>Varietà:
              <input type="text" name="variety" value={newPlot.variety} onChange={handleChange} placeholder="Es. Catuai" maxLength="45" />
            </label>
            <label>N° Covas:
              <input type="number" name="ncovas" value={newPlot.ncovas} onChange={handleChange} placeholder="Es. 12050" />
            </label>
            <label>Distanziamento (cm):
              <input type="number" name="distance" value={newPlot.distance} onChange={handleChange} placeholder="Es. 280" />
            </label>
            <label>Superficie (ha):
              <input type="number" name="surface" value={newPlot.surface} onChange={handleChange} placeholder="Es. 10.25" step="0.01" />
            </label>
            <label>Anno impianto:
              <input type="number" name="age" value={newPlot.age} onChange={handleChange} placeholder="Es. 2016" min="1900" max="2100" />
            </label>
            <label>Stato:
              <select name="state" value={newPlot.state} onChange={handleChange}>
                <option value="">Seleziona</option>
                <option value="raccolta">Raccolta</option>
                <option value="potato">Potato</option>
                <option value="formazione">Formazione</option>
              </select>
            </label>
            <label>Irrigazione:</label>
            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="radio" name="irrigation" value="Yes" checked={newPlot.irrigation === "Yes"} onChange={handleChange} /> Sì
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="radio" name="irrigation" value="No" checked={newPlot.irrigation === "No"} onChange={handleChange} /> No
              </label>
            </div>
            <label>Renda Stimata:
              <input type="number" name="renda" value={newPlot.renda} onChange={handleChange} placeholder="Es. 5.24" step="0.01" />
            </label>
            <div className="modal-footer">
              <button type="button" className="action-button cancel" onClick={() => setShowFormPlot(false)}>Annulla</button>
              <button type="submit" className="action-button save">Inserisci</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal modifica talhão */}
      <Modal
        isOpen={showEditPlot}
        onRequestClose={() => setShowEditPlot(false)}
        contentLabel="Modifica Talhão"
        className="modal-content"
        overlayClassName="modal"
      >
        <div className="modal-header">
          <h2>Modifica — {editingPlot?.codename}</h2>
        </div>
        <div className="modal-body">
          <label>Stato:
            <select
              value={editForm.state}
              onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))}
            >
              <option value="">Seleziona</option>
              <option value="raccolta">Raccolta</option>
              <option value="potato">Potato</option>
              <option value="formazione">Formazione</option>
            </select>
          </label>

          <label>Irrigazione:</label>
          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="radio"
                value="Yes"
                checked={editForm.irrigation === "Yes"}
                onChange={() => setEditForm((prev) => ({ ...prev, irrigation: "Yes" }))}
              /> Sì
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="radio"
                value="No"
                checked={editForm.irrigation === "No"}
                onChange={() => setEditForm((prev) => ({ ...prev, irrigation: "No" }))}
              /> No
            </label>
          </div>

          <label>Renda Stimata:
            <input
              type="number"
              value={editForm.renda_forecast}
              onChange={(e) => setEditForm((prev) => ({ ...prev, renda_forecast: e.target.value }))}
              placeholder="Es. 5.24"
              step="0.01"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="action-button cancel" onClick={() => setShowEditPlot(false)}>
            Annulla
          </button>
          <button type="button" className="action-button save" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default PlotsManagement;