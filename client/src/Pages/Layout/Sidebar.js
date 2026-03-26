import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import "../Dashboard/Dashboard.css";
import ProtectedLink from "../../components/ProtectedLink";
import { useLang } from "../../LanguageContext"; 

function Sidebar() {
  const { t } = useLang();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [farms, setFarms] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    document.querySelector(".dashboard-content").className = isSidebarOpen
      ? "dashboard-content dashboard-expanded"
      : "dashboard-content dashboard-collapsed";
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
                  <h3>{farm.name.toUpperCase()}</h3>
                </div>
              ))}
            </li>
            <li>
              <Link to="/dashboard">{t("dashboard")}</Link>
            </li>
            <ProtectedLink permission="users">
              <li>
                <Link to="/dashboard/users">{t("users")}</Link>
              </li>
            </ProtectedLink>
            <ProtectedLink permission="structure">
              <li>
                <Link to="/dashboard/structure">{t("manageFarm")}</Link>
              </li>
            </ProtectedLink>
            <li>
              <Link to="/dashboard/traceability">{t("traceability")}</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Sidebar;
