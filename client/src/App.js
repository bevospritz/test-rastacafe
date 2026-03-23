import "./App.css";
import React from "react";
import Login from "./Pages/Login/login.js";
import Register from "./Pages/Register/register.js";
import Dashboard from "./Pages/Dashboard/dashboard";
import Home from "./Pages/Home/Home.js";
import ManageFarm from "./Pages/Dashboard/GestioneFattoria.js";
import GestioneStruttura from "./Pages/Dashboard/components/GestioneStruttura.js";
import PlotsManagement from "./Pages/Dashboard/components/GestioneAppezzamenti.js";
import Users from "./Pages/Dashboard/Users.js";
import Traceability from "./Pages/Dashboard/Traceability.js";
import ManageLot from "./Pages/Dashboard/traceability/ManageLot.js";
import NewLot from "./Pages/Dashboard/traceability/NewLot";
import WashDevide from "./Pages/Dashboard/traceability/WashDevide";
import Selling from "./Pages/Dashboard/traceability/Selling";
import Fermentation from "./Pages/Dashboard/traceability/Fermentation";
import Drying from "./Pages/Dashboard/traceability/Drying";
import Resting from "./Pages/Dashboard/traceability/Resting";
import Cleaning from "./Pages/Dashboard/traceability/Cleaning";
import Stocking from "./Pages/Dashboard/traceability/Stocking";
import LotHistory from "./Pages/Dashboard/traceability/Lothistory.js";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App = () => {
  return (
    <Router>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/*" element={<Dashboard />}>
            <Route path="structure" element={<ManageFarm />} />
            <Route path="gestione-struttura" element={<GestioneStruttura />} />
            <Route path="gestione-appezzamenti" element={<PlotsManagement />} />
            <Route path="users" element={<Users />} />
            <Route path="traceability/*" element={<Traceability />}>              
              <Route path="manage-lot" element={<ManageLot />} />
              <Route path="manage-lot/new-lot" element={<NewLot />} />
              <Route path="manage-lot/wash-devide" element={<WashDevide />} />
              <Route path="manage-lot/selling" element={<Selling />} />
              <Route
                path="manage-lot/fermentation"
                element={<Fermentation />}
              />
              <Route path="manage-lot/drying" element={<Drying />} />
              <Route path="manage-lot/resting" element={<Resting />} />
              <Route path="manage-lot/cleaning" element={<Cleaning />} />
              <Route path="manage-lot/stocking" element={<Stocking />} />
              <Route path="lot-history" element={<LotHistory />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default App;
