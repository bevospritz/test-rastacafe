import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Traceability.css";

const GestioneUsers = () => {
  const [utenti, setUtenti] = useState([]);

  // ← [] come secondo argomento: esegue solo al mount, non ad ogni render
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {
        if (Array.isArray(response.data)) {
          setUtenti(response.data);
        } else {
          console.error("Response is not an array:", response.data);
        }
      })
      .catch((error) => {
        console.error("Errore caricamento utenti:", error);
      });
  }, []); // ← questo era il bug — mancava []

  const handleDeleteUser = (userId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo utente?")) return;

    axios
      .delete(`http://localhost:5000/api/users/${userId}`)
      .then(() => {
        setUtenti((prev) => prev.filter((u) => u.id !== userId));
      })
      .catch((error) => {
        console.error("Errore eliminazione utente:", error);
        alert("Errore durante l'eliminazione.");
      });
  };

  return (
    <div className="form-container">
      <h2>Gestione Utenti</h2>

      {utenti.length === 0 ? (
        <p className="empty-state">Nessun utente trovato.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {utenti.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button
                    className="action-button"
                    style={{ backgroundColor: "#dc3545", marginTop: 0, padding: "4px 12px", width: "auto" }}
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GestioneUsers;