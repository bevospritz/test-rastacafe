import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { useLang } from "../../../LanguageContext";
import "../Traceability.css";

Modal.setAppElement("#root");

const ManageStructure = () => {
  const { t } = useLang();
  const [farms, setFarms] = useState([]);
  const [elements, setElements] = useState([]);
  const [showFormElem, setShowFormElem] = useState(false);
  const [showEditElem, setShowEditElem] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", notes: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [newElement, setNewElement] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/farm")
      .then((res) => { if (Array.isArray(res.data)) setFarms(res.data); })
      .catch((err) => console.error("Error fetching farms:", err));

    axios.get("http://localhost:5000/api/elements")
      .then((res) => { if (Array.isArray(res.data)) setElements(res.data); })
      .catch((err) => console.error("Error fetching elements:", err));
  }, []);

  const handleAddElement = () => {
    if (!selectedFarm) { alert("Nessuna farm selezionata."); return; }
    if (!newElement || !newName.trim()) { alert("Seleziona un tipo e inserisci un nome."); return; }

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

  const handleOpenEdit = (el) => {
    setEditingElement(el);
    setEditForm({ name: el.name || "", notes: el.notes || "" });
    setShowEditElem(true);
  };

  const handleSaveEdit = async () => {
    if (!editingElement) return;
    if (!editForm.name.trim()) { alert("Il nome non può essere vuoto."); return; }
    setIsSaving(true);
    try {
      await axios.patch(`http://localhost:5000/api/elements/${editingElement.id}`, {
        name: editForm.name,
        notes: editForm.notes,
      });
      setElements((prev) =>
        prev.map((e) =>
          e.id === editingElement.id
            ? { ...e, name: editForm.name, notes: editForm.notes }
            : e
        )
      );
      setShowEditElem(false);
      setEditingElement(null);
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: "900px" }}>
      <h2>{t("manageStructureTitle")}</h2>

      {farms.map((farm) => (
        <div key={farm.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px" }}>
            <h3 style={{ margin: 0 }}>{farm.name}</h3>
            <button
              className="action-button"
              style={{ width: "auto", marginTop: 0, padding: "6px 16px" }}
              onClick={() => { setShowFormElem(true); setSelectedFarm(farm); }}
            >
              {t("addElement")}
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>{t("element")}</th>
                <th>{t("name")}</th>
                <th>{t("notes")}</th>
                <th>{t("actions")}</th>
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
                    <td className="plots-actions-cell">
                      <button
                        className="action-button plots-edit-btn"
                        onClick={() => handleOpenEdit(el)}
                      >
                        {t("edit")}
                      </button>
                      <button
                        className="action-button"
                        style={{ backgroundColor: "var(--color-danger)", width: "auto", marginTop: 0, padding: "3px 10px", fontSize: "0.78rem" }}
                        onClick={() => handleDeleteElement(el.id)}
                      >
                        {t("delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              {elements.filter((el) => el.farmId === farm.id).length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">{t("noElement")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {farms.length === 0 && (
        <p className="empty-state">{t("noFarms")}</p>
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
          <h2>{t("addElement")}</h2>
        </div>
        <div className="modal-body">
          <label>{t("element")}:
            <select value={newElement} onChange={(e) => setNewElement(e.target.value)} required>
              <option value="">{t("select")}</option>
              <option value="Patio">{t("patio")}</option>
              <option value="Dryer">{t("dryer")}</option>
              <option value="Tulha">{t("tulha")}</option>
              <option value="Centrifuga">{t("centrifuga")}</option>
            </select>
          </label>
          <label>{t("name")}:
            <input type="text" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Es. Patio01" maxLength="45" required />
          </label>
          <label>{t("notes")}:
            <textarea value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Specifiche o note opzionali..."
              maxLength="255" rows={3}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--color-border)", resize: "vertical" }}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="action-button cancel" onClick={() => setShowFormElem(false)}>
            {t("cancel")}
          </button>
          <button type="button" className="action-button save" onClick={handleAddElement}>
            {t("save")}
          </button>
        </div>
      </Modal>

      {/* Modal modifica elemento */}
      <Modal
        isOpen={showEditElem}
        onRequestClose={() => setShowEditElem(false)}
        contentLabel="Modifica Elemento"
        className="modal-content"
        overlayClassName="modal"
      >
        <div className="modal-header">
          <h2>{t("editElement")} — {editingElement?.element} {editingElement?.name}</h2>
        </div>
        <div className="modal-body">
          <label>{t("name")}:
            <input type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              maxLength="45" required />
          </label>
          <label>{t("notes")}:
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              maxLength="255" rows={3}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--color-border)", resize: "vertical" }}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="action-button cancel" onClick={() => setShowEditElem(false)}>
            {t("cancel")}
          </button>
          <button type="button" className="action-button save" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageStructure;