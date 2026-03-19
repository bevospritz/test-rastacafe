import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import "./GestioneFattoria.css";

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
    axios
      .post("http://localhost:5000/api/farm", { name: newFarm })
      .then((response) => {
        setFarms([...farms, response.data]);
        setNewFarm("");
        setShowForm(false);
        alert("Farm creata");
      })
      .catch((error) => {
        console.error("Error adding new farm:", error);
        alert("Errore nella creazione della farm" +  error.message);
      });
  };

  const handleDeleteFarm = (id) => {
    axios
      .delete(`http://localhost:5000/api/farm/${id}`)
      .then(() => {
        setFarms(farms.filter((farm) => farm.id !== id));
      })
      .catch((error) => {
        console.error("Error deleting farm:", error);
      });
  };

  return (
    <div className="gestione-fattoria-container">
      {farms.length === 0 ? (
        <button
          className="new-farm-button"
          onClick={() => setShowForm(true)}
        >
          Add farm
        </button>
      ) : (
        <div className="gestione-fattoria-card">
          <h1>{farms[0].name}</h1>
          <button
                className="delete-button"
                onClick={() => handleDeleteFarm(farms[0].id)}
              >
                X
              </button>
          <p>N° appezzamenti: 10</p>
          <p>Superficie a caffè (ettari): 50</p>
          <div className="button-container">
            <button onClick={() => navigate('/dashboard/gestione-struttura')} className="action-button">
            Gerenciar Estrutura
            </button>
            <button onClick={() => navigate('/dashboard/gestione-appezzamenti')} className="action-button">
            Gerenciar Talhão
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onRequestClose={() => setShowForm(false)}
        contentLabel="New Farm"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>New Farm</h2>
        <input
          type="text"
          value={newFarm}
          onChange={(e) => setNewFarm(e.target.value)}
          placeholder="Farm Name"
          className="input-field"
        />
        <button className="submit-button" onClick={handleAddFarm}>
          Aggiungi
        </button>
      </Modal>
    </div>
  );
};

export default ManageFarm;
