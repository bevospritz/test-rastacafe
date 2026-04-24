import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../Login/Auth.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("worker");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { alert("Le password non coincidono"); return; }

    try {
      const response = await axios.post("http://localhost:5000/register", {
        username, email, password, role,
      }, { headers: { "Content-Type": "application/json" } });

      if (response.status === 201) {
        alert("Registrazione avvenuta con successo!");
        navigate("/login");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Errore durante la registrazione");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Registrazione</h1>
        <p className="auth-subtitle">Crea un nuovo account</p>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">Username</label>
          <input className="auth-input" type="text" value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="es. mario_rossi" required />

          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="es. mario@fattoria.com" required />

          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input className="auth-input" type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caratteri" required />
            <span className="auth-eye" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <label className="auth-label">Conferma Password</label>
          <div className="auth-input-wrap">
            <input className="auth-input" type={showConfirm ? "text" : "password"}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ripeti la password" required />
            <span className="auth-eye" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? "🙈" : "👁️"}
            </span>
          </div>

          <label className="auth-label">Ruolo</label>
          <select className="auth-select" value={role}
            onChange={(e) => setRole(e.target.value)} required>
            <option value="admin">Admin</option>
            <option value="worker">Worker</option>
            <option value="viewer">Viewer</option>
          </select>

          <button type="submit" className="auth-btn">Registra</button>
        </form>
      </div>
    </div>
  );
};

export default Register;