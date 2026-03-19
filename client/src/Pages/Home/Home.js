import logo from "../../assets/images/Rasta-Lion-Logo.png";
import React from "react";
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="Home">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Welcome to RastaCafe</h1>
        <div className="button-container">
          <Link to="/login" className="button">
            Login
          </Link>
          <Link to="/register" className="button">
            New User
          </Link>
        </div>
      </header>
    </div>
  );
}

export default Home;