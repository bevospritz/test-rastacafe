import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import "../Traceability.css";

Modal.setAppElement("#root");

const ManageStructure = () => {
  const [farms, setFarms] = useState([]);
  const [elements, setElements] = useState([]);
  const [showFormElem, setShowFormElem] = useState(false);
  const [newElement, setNewElement] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/farm")
      .then((res) => {
        if (Array.isArray(res.data)) setFarms(res.data);
      })
      .catch((err) => console.error("Error fetching farms:", err));

    axios.get("http://localhost:5000/api/elements")
      .then((res) => {
        if (Array.isArray(res.data)) setElements(res.data);
      })
      .catch((err) => console.error("Error fetching elements:", err));
  }, []);

  const handleAddElement = () => {
    if (!selectedFarm) {
      alert("Nessuna farm selezionata.");
      return;
    }
    if (!newElement || !newName.trim()) {
      alert("Seleziona un tipo e inserisci un nome.");
      return;
    }

    axios.post("http://localhost:5000/api/elements", {
      element: newElement,
      name: newName,
      notes: newNotes,
      farmId: selectedFarm.id,
    })
      .then((response) => {
        setElements([...elements, response.data]);
        setNewElement("");
        setNewName("");
        setNewNotes("");
        setShowFormElem(false);
        alert("Elemento creato con successo!");
      })
      .catch((error) => {
        console.error("Error adding element:", error);
        alert("Errore nella creazione dell'elemento: " + error.message);
      });
  };

  const handleDeleteElement = (elementId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo elemento?")) return;
    axios.delete(`http://localhost:5000/api/elements/${elementId}`)
      .then(() => setElements(elements.filter((e) => e.id !== elementId)))
      .catch((err) => console.error("Error deleting element:", err));
  };

  return (
    <div className="form-container" style={{ maxWidth: "900px" }}>
      <h2>Gestione Struttura</h2>

      {farms.map((farm) => (
        <div key={farm.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px" }}>
            <h3 style={{ margin: 0 }}>{farm.name}</h3>
            <button
              className="action-button"
              style={{ width: "auto", marginTop: 0, padding: "6px 16px" }}
              onClick={() => { setShowFormElem(true); setSelectedFarm(farm); }}
            >
              + Aggiungi Elemento
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome</th>
                <th>Note</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {elements
                .filter((el) => el.farmId === farm.id)
                .map((el) => (
                  <tr key={el.id}>
                    <td>{el.element}</td>
                    <td>{el.name}</td>
                    <td>{el.notes || <span className="text-faint">—</span>}</td>
                    <td>
                      <button
                        className="action-button"
                        style={{ backgroundColor: "var(--color-danger)", width: "auto", marginTop: 0, padding: "3px 10px", fontSize: "0.78rem" }}
                        onClick={() => handleDeleteElement(el.id)}
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              {elements.filter((el) => el.farmId === farm.id).length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">Nessun elemento configurato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {farms.length === 0 && (
        <p className="empty-state">Nessuna farm trovata. Configura prima una farm.</p>
      )}

      {/* Modal nuovo elemento */}
      <Modal
        isOpen={showFormElem}
        onRequestClose={() => setShowFormElem(false)}
        contentLabel="Aggiungi Elemento"
        className="modal-content"
        overlayClassName="modal"
      >
        <div className="modal-header">
          <h2>Aggiungi Elemento</h2>
        </div>
        <div className="modal-body">
          <label>Tipo:
            <select value={newElement} onChange={(e) => setNewElement(e.target.value)} required>
              <option value="">Seleziona</option>
              <option value="Patio">Terreno (Patio)</option>
              <option value="Dryer">Seccatore (Dryer)</option>
              <option value="Tulha">Tulha</option>
              <option value="Centrifuga">Centrifuga</option>
            </select>
          </label>
          <label>Nome:
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Es. Terreno01"
              maxLength="45"
              required
            />
          </label>
          <label>Note:
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Specifiche o note opzionali..."
              maxLength="255"
              rows={3}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--color-border)", resize: "vertical" }}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="action-button cancel" onClick={() => setShowFormElem(false)}>
            Annulla
          </button>
          <button type="button" className="action-button save" onClick={handleAddElement}>
            Inserisci
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageStructure;