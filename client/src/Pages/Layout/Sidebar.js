import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Sidebar.css";
import "../Dashboard/Dashboard.css";
import ProtectedLink from "../../components/ProtectedLink";
import { useLang } from "../../LanguageContext";

function Sidebar({ isOpen }) {
  const { t } = useLang();
  const [farms, setFarms] = useState([]);

  useEffect(() => {
    axios
      .get("/api/farm")
      .then((response) => {
        if (Array.isArray(response.data)) setFarms(response.data);
      })
      .catch((error) => {
        console.error("Error fetching farms:", error);
      });
  }, []);

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
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
  );
}

export default Sidebar;
