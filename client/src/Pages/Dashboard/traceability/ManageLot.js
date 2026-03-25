import React from "react";
import { useNavigate } from "react-router-dom";
import "../Traceability.css";
import ProtectedLink from "../../../components/ProtectedLink";

const STEPS = [
  { label: "New Lot",       path: "new-lot",      permission: "traceability" },
  { label: "Wash & Divide", path: "wash-devide",  permission: "traceability" },
  { label: "Drying",        path: "drying",        permission: "traceability" },
  { label: "Fermentation",  path: "fermentation",  permission: "traceability" },
  { label: "Resting",       path: "resting",       permission: "traceability" },
  { label: "Cleaning",      path: "cleaning",      permission: "traceability" },
  { label: "Stocking",      path: "stocking",      permission: "stocking" },
  { label: "Selling",       path: "selling",       permission: "selling" },
];

const ManageLot = () => {
  const navigate = useNavigate();

  return (
    <div className="form-container">
      <h2>Gestione Lotto</h2>
      <p className="page-subtitle">Seleziona la fase di lavorazione</p>
      <div className="button-container-nav">
        {STEPS.map((step) => (
          <ProtectedLink key={step.path} permission={step.permission}>
            <button
              className="action-button"
              onClick={() => navigate(`/dashboard/traceability/manage-lot/${step.path}`)}
            >
              {step.label}
            </button>
          </ProtectedLink>
        ))}
      </div>
    </div>
  );
};

export default ManageLot;