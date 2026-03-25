import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import Sidebar from "../Layout/Sidebar";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <div className="dashboard-content dashboard-expanded">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;