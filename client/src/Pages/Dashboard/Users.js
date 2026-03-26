import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLang } from "../../LanguageContext";
import "./Traceability.css";

const ROLES = ["admin", "worker", "viewer"];

const GestioneUsers = () => {
  const { t } = useLang();
  const [utenti, setUtenti] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "worker" });

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/api/users")
      .then((response) => {
        if (Array.isArray(response.data)) setUtenti(response.data);
      })
      .catch((error) => console.error("Errore caricamento utenti:", error));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = (userId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo utente?")) return;
    axios
      .delete(`http://localhost:5000/api/users/${userId}`)
      .then(() => setUtenti((prev) => prev.filter((u) => u.id !== userId)))
      .catch((error) => {
        console.error("Errore eliminazione utente:", error);
        alert("Errore durante l'eliminazione.");
      });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/register", {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      alert(`Utente ${newUser.email} creato con successo!`);
      setNewUser({ email: "", password: "", role: "worker" });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 400) {
        alert("Utente già esistente o dati non validi.");
      } else {
        alert("Errore durante la creazione dell'utente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>{t("usersTitle")}</h2>

      {/* Bottone aggiungi */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button
          className="action-button"
          style={{ width: "auto", marginTop: 0, padding: "8px 20px" }}
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? t("cancel") : "+ " + t("newUser")}
        </button>
      </div>

      {/* Form aggiunta utente */}
      {showForm && (
        <form onSubmit={handleAddUser} style={{
          padding: "1rem", marginBottom: "1.5rem",
          backgroundColor: "var(--color-edit-light)",
          border: "1px solid var(--color-edit-border)",
          borderRadius: "var(--radius-md)"
        }}>
          <div className="info-section-title" style={{ marginBottom: "0.75rem" }}>{t("newUser")}</div>
          <label>{t("email")}
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="es. worker@fattoria.com"
              required
            />
          </label>
          <label>{t("password")}
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Min. 6 caratteri"
              minLength={6}
              required
            />
          </label>
          <label>{t("role")}:
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="button-container" style={{ marginTop: "0.5rem" }}>
            <button type="submit" className="action-button save" disabled={isSubmitting}>
              {isSubmitting ? "Creazione..." : t("createUser")}
            </button>
            <button type="button" className="action-button cancel" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Tabella utenti */}
      {utenti.length === 0 ? (
        <p className="empty-state">{t("noUsers")}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t("id")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {utenti.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === "admin" ? "badge-deposit" : "badge-direct"}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <button
                    className="action-button"
                    style={{ backgroundColor: "var(--color-danger)", marginTop: 0, padding: "4px 12px", width: "auto" }}
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    {t("delete")}
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