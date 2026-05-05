import logo from "../../assets/images/Rasta-Lion-Logo.png";
import React from "react";
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="Home">
      <div className="home-header">
        <img src={logo} className="App-logo" alt="RastaCafe logo" />
        <h1 className="home-title">RastaCafe</h1>
        <p className="home-subtitle">Gestione Produzione</p>
      </div>
      <div className="home-body">
        <div className="button-container">
          <Link to="/login" className="button">Login</Link>
          <Link to="/register" className="button">New User</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;