import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import logo from "../../assets/images/Rasta-Lion-Logo.png";
import userIcon from "../../assets/images/user-icon.png"; 
import "./Navbar.css";

function Navbar() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {      
      const response = await axios.post('http://localhost:5000/logout');
      console.log('Logout response:', response.data);    
      navigate('/login');
      console.log('Redirecting to /login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={logo} alt="Logo" />
        <h3>RastaCafe</h3>
      </div>
      <div className="navbar-user" onClick={toggleDropdown}>
        <img src={userIcon} alt="User" className="user-icon" />
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <a href="/profile">Gestione del profilo</a>
            <a href="#!" onClick={handleLogout}>Disconnessione</a>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
