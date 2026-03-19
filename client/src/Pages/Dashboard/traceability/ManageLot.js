import React from "react";
import { useNavigate } from "react-router-dom";
import "./Traceability.css";

const ManageLot = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Gestione Lotto</h1>
      <div className="button-container">
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/new-lot')}>New Lot</button>
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/wash-devide')}>Wash & Devide</button>
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/drying')}>Drying</button>
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/fermentation')}>Fermentation</button>        
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/resting')}>Resting</button>
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/cleaning')}>Cleaning</button>
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/stocking')}>Stocking</button>
        <button className="action-button" onClick={() => navigate('/dashboard/traceability/manage-lot/selling')}>Selling</button>
      </div>
    </div>
  );
};

export default ManageLot;
