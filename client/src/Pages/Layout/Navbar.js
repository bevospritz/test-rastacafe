import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from "../../assets/images/Rasta-Lion-Logo.png";
import userIcon from "../../assets/images/user-icon.png";
import "./Navbar.css";
import { useAuth } from "../../AuthContext";
import { useLang } from "../../LanguageContext";
import { useOffline } from "../../OfflineContext";

function Navbar() {
  const { t, lang, toggleLang } = useLang();
  const { setUser } = useAuth();
  const { isOnline, isSyncing, pendingCount, sync } = useOffline();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={logo} alt="Logo" />
        <h3>RastaCafe</h3>
      </div>

      {/* Indicatore connessione */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", marginRight: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: isOnline ? "#4caf50" : "#f44336",
            boxShadow: isOnline ? "0 0 6px #4caf50" : "0 0 6px #f44336",
          }} />
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Bottone sync — visibile solo se ci sono operazioni pending */}
        {pendingCount > 0 && (
          <button
            onClick={sync}
            disabled={isSyncing || !isOnline}
            style={{
              background: isSyncing ? "rgba(255,255,255,0.1)" : "rgba(76,175,80,0.2)",
              border: "1px solid rgba(76,175,80,0.5)",
              color: "#fff", borderRadius: "6px", padding: "3px 10px",
              cursor: isOnline ? "pointer" : "not-allowed",
              fontSize: "0.75rem", fontWeight: "600",
              display: "flex", alignItems: "center", gap: "5px",
            }}
          >
            {isSyncing ? "⏳" : "🔄"} {isSyncing ? "Sync..." : `Sync (${pendingCount})`}
          </button>
        )}
      </div>

      {/* Toggle lingua */}
      <button
        onClick={toggleLang}
        style={{
          background: "none", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", borderRadius: "6px", padding: "4px 10px",
          cursor: "pointer", fontSize: "0.8rem", fontWeight: "600",
          marginRight: "12px",
        }}
      >
        {lang === "IT" ? "🇧🇷 PT" : "🇮🇹 IT"}
      </button>

      <div className="navbar-user" onClick={toggleDropdown}>
        <img src={userIcon} alt="User" className="user-icon" />
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <a href="/profile">{t("profile")}</a>
            <a href="#!" onClick={handleLogout}>{t("logout")}</a>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;