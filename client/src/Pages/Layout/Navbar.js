import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import logo from "../../assets/images/Rasta-Lion-Logo.png";
import userIcon from "../../assets/images/user-icon.png"; 
import "./Navbar.css";
import { useAuth } from "../../AuthContext";
import { useLang } from "../../LanguageContext";


function Navbar() {  
  const { t, lang, toggleLang } = useLang();
  const { setUser } = useAuth();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

 const handleLogout = async () => {
  try {
    await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
  } catch (error) {
    console.error('Logout error:', error);
    // sessione già scaduta — va bene lo stesso
  } finally {
    // ← esegue sempre, errore o no
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
      <button
        onClick={toggleLang}
        style={{
          background: "none", border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff", borderRadius: "6px", padding: "4px 10px",
          cursor: "pointer", fontSize: "0.8rem", fontWeight: "600",
          marginLeft: "auto", marginRight: "12px"
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
