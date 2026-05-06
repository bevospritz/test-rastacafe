import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { useLang } from "../../LanguageContext";
import "./Traceability.css";
import "./Users.css";

Modal.setAppElement("#root");

const ROLES = ["admin", "worker", "viewer"];

const passwordStrength = (pwd) => {
  if (pwd.length === 0) return null;
  if (pwd.length < 8) return "weak";
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  return hasUpper && hasNumber ? "strong" : "medium";
};

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "worker",
};

const GestioneUsers = () => {
  const { t } = useLang();
  const [utenti, setUtenti] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_FORM);

  const fetchUsers = () => {
    axios
      .get("/api/users")
      .then((response) => {
        if (Array.isArray(response.data)) setUtenti(response.data);
      })
      .catch((error) => console.error("Errore caricamento utenti:", error));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setNewUser(EMPTY_FORM);
    setFormError("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleChange = (field) => (e) =>
    setNewUser((prev) => ({ ...prev, [field]: e.target.value }));

  const handleDeleteUser = (userId) => {
    if (!window.confirm(t("confirmDelete"))) return;
    axios
      .delete(`/api/users/${userId}`)
      .then(() => setUtenti((prev) => prev.filter((u) => u.id !== userId)))
      .catch(() => alert(t("deleteError")));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError("");

    if (newUser.password.length < 8) {
      setFormError(t("passwordTooShort"));
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setFormError(t("passwordMismatch"));
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await axios.post("/register", {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
      });
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 400) {
        setFormError(t("userAlreadyExists"));
      } else {
        setFormError(t("createUserError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = passwordStrength(newUser.password);

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{t("usersTitle")}</h2>
        <button className="action-button" onClick={() => setShowModal(true)}>
          + {t("newUser")}
        </button>
      </div>

      {utenti.length === 0 ? (
        <p className="empty-state">{t("noUsers")}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t("id")}</th>
              <th>{t("username")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {utenti.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td className="users-table-username">{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    className={`badge ${u.role === "admin" ? "badge-deposit" : "badge-direct"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <button
                    className="action-button"
                    style={{
                      backgroundColor: "var(--color-danger)",
                      marginTop: 0,
                      padding: "4px 12px",
                      width: "auto",
                    }}
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

      <Modal
        isOpen={showModal}
        onRequestClose={handleCloseModal}
        contentLabel={t("newUser")}
        className="modal-content"
        overlayClassName="modal"
      >
        <div className="modal-header">
          <h2>{t("newUser")}</h2>
        </div>
        <div className="modal-body">
          <form onSubmit={handleAddUser} id="new-user-form">
            <label>
              {t("username")}
              <input
                type="text"
                value={newUser.username}
                onChange={handleChange("username")}
                placeholder="es. mario_rossi"
                autoComplete="username"
                required
              />
            </label>
            <label>
              {t("email")}
              <input
                type="email"
                value={newUser.email}
                onChange={handleChange("email")}
                placeholder="es. worker@fattoria.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              {t("password")}
              <div className="users-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={handleChange("password")}
                  placeholder="Min. 8 caratteri"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="users-toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? t("hidePassword") : t("showPassword")}
                </button>
              </div>
              {strength && (
                <div className={`users-pw-strength users-pw-${strength}`}>
                  <div className="users-pw-bar" />
                  <span>{t(`pwStrength_${strength}`)}</span>
                </div>
              )}
            </label>
            <label>
              {t("confirmPassword")}
              <div className="users-password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={newUser.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  placeholder={t("confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="users-toggle-pw"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? t("hidePassword") : t("showPassword")}
                </button>
              </div>
            </label>
            <label>
              {t("role")}
              <select value={newUser.role} onChange={handleChange("role")}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {formError && <p className="users-form-error">{formError}</p>}
          </form>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="action-button cancel"
            onClick={handleCloseModal}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="new-user-form"
            className="action-button save"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("creating") : t("createUser")}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default GestioneUsers;
