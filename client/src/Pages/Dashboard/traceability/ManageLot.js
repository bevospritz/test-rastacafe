import React from "react";
import { useNavigate } from "react-router-dom";
import "../Traceability.css";

const STEPS = [
  { label: "New Lot",      path: "new-lot" },
  { label: "Wash & Divide", path: "wash-devide" },
  { label: "Drying",       path: "drying" },
  { label: "Fermentation", path: "fermentation" },
  { label: "Resting",      path: "resting" },
  { label: "Cleaning",     path: "cleaning" },
  { label: "Stocking",     path: "stocking" },
  { label: "Selling",      path: "selling" },
];

const ManageLot = () => {
  const navigate = useNavigate();

  return (
    <div className="form-container">
      <h2>Gestione Lotto</h2>
      <p className="page-subtitle">Seleziona la fase di lavorazione</p>
      <div className="button-container-nav">
        {STEPS.map((step) => (
          <button
            key={step.path}
            className="action-button"
            onClick={() => navigate(`/dashboard/traceability/manage-lot/${step.path}`)}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ManageLot;