import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import "./GestioneStruttura.css";

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
    // Fetch data da fattorie
    axios
      .get("http://localhost:5000/api/farm")
      .then((response) => {
        console.log("Response data:", response.data);
        if (Array.isArray(response.data)) {
          setFarms(response.data);
        } else {
          console.error("Response is not an array:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching fattorie:", error);
      });
    // Fetch data da elementi
    axios
      .get("http://localhost:5000/api/elements")
      .then((response) => {
        console.log("Response data (Elements):", response.data);
        if (Array.isArray(response.data)) {
          setElements(response.data);
        } else {
          console.error("Response is not an array:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching elements:", error);
      });
  }, []);


  const handleAddElement = () => {
    axios
      .post("http://localhost:5000/api/elements", {
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
        alert("Elemento creato");
      })
      .catch((error) => {
        console.error("Error adding new element:", error);
        alert("Errore nella creazione dell'elemento" + error.message);
      });
  };

  const handleDeleteElement = (elementId) => {
    axios
      .delete(`http://localhost:5000/api/elements/${elementId}`)
      .then(() => {
        setElements(elements.filter((elem) => elem.id !== elementId));
      })
      .catch((error) => {
        console.error("Error deleting element:", error);
      });
  };

  const handleCancel = () =>{
    setShowFormElem(false)
  }

  


  return (
    <div className="gestione-struttura">
      {farms.map((farm) => (
        <div key={farm.id} className="fattoria-section">
          <div className="fattoria-header">
            <h1 className="fattoria-title"> {farm.name}</h1>
            <div className="action-buttons">
              <button
                className="modify-button"
                onClick={() => {
                  setShowFormElem(true);
                  setSelectedFarm(farm);
                }}
              >
                Adicionar Item
              </button>
            </div>
          </div>
          <table className="element-table">
            <thead>
              <tr>                
                <th>Element</th>
                <th>Name</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {elements
                .filter((element) => element.farmId === farm.id)
                .map((element) => (
                  <tr key={element.id}>                    
                    <td>{element.element}</td>
                    <td>{element.name}</td>
                    <td>{element.notes}</td>
                    <td><button
                        className="delete-button"
                        onClick={() => handleDeleteElement(element.id)}
                      >
                        X
                      </button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      <Modal
        isOpen={showFormElem}
        onRequestClose={() => setShowFormElem(false)}
        contentLabel="Adicionar Item"
        className="modal-struttura"
        overlayClassName="overlay"
      >
        <h2>Adicionar Item</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddElement();
          }}
          className="form"
        >
          <div className="form-group">
            <label>Item:</label>
            <select
              value={newElement}
              onChange={(e) => setNewElement(e.target.value)}
            >
              <option value="">Seleziona</option>
              <option value="Patio">Terreno</option>
              <option value="Dryer">Seccatore</option>
              <option value="Tulha">Tulha</option>
              <option value="Centrifuga">Centrifuga</option>              
            </select>
          </div>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength="45"
            />
          </div>
          <div className="form-group">
            <label>Specifiche:</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              maxLength="255"
            />
          </div>
          <button type="submit" className="submit-button">
            Inserisci
          </button>
          <button type="cancel" onClick={handleCancel} className="cancel-button">
            Annulla
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ManageStructure;
