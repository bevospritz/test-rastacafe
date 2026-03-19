import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import "../Dashboard/Dashboard.css";

function Sidebar() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [farms, setFarms] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    document.querySelector('.dashboard-content').className = isSidebarOpen 
      ? 'dashboard-content dashboard-expanded' 
      : 'dashboard-content dashboard-collapsed';
    console.log(isSidebarOpen);
  };

  useEffect(() => {
    console.log("Sidebar component mounted");
    // Fetch data da farms
    axios
      .get("http://localhost:5000/api/farm")
      .then((response) => {
        console.log("Response data:", response.data);
        if (Array.isArray(response.data)) {
          setFarms(response.data);
        } else {
          console.error("Response is not an array:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching farms:", error);
      });
  }, []);

  return (
    <div>
      <div
        className="burger-menu"
        onClick={() => {
          console.log("Burger menu clicked");
          toggleSidebar();
        }}
      >
        ☰
      </div>
      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <nav>
          <ul>
            <li>
              {farms.map((farm) => (
                <div key={farm.id}>
                  <h3>{farm.name}</h3>
                </div>
              ))}
            </li>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/dashboard/users">Utenti</Link>
            </li>
            <li>
              <Link to="/dashboard/structure">Manage Farm</Link>
            </li>
            {/* <li>
              <Link to="/dashboard/plots">Appezzamenti</Link>
            </li> */}
            <li>
              <Link to="/dashboard/products">Prodotti</Link>
            </li>
            <li>
              <Link to="/dashboard/documents">Documenti</Link>
            </li>
            <li>
              <Link to="/dashboard/traceability">Tracciabilità</Link>
            </li>
            <li>
              <Link to="/dashboard/sharing">Condivisione</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
