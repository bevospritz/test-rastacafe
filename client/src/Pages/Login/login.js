import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Auth.css";
import logo from "../../assets/images/Rasta-Lion-Logo.png";

const Login = () => {
  const { fetchUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login",
        { email, password },
        { withCredentials: true }
      );
      if (response.status === 200) {
        await fetchUser();
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        alert("Credenziali non valide.");
      } else {
        alert("Errore del server.");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={logo} alt="RastaCafe" className="auth-logo" />
        <h1>RastaCafe</h1>
        <p className="auth-subtitle">Accedi al tuo account</p>
        <form onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="es. mario@fattoria.com" required />

          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input className="auth-input"
              type={showPassword ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password" required />
            <span className="auth-eye" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button type="submit" className="auth-btn">Accedi</button>
        </form>
      </div>
    </div>
  );
};

export default Login;