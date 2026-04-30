import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Layout/Navbar";
import Sidebar from "../Layout/Sidebar";
import "./Dashboard.css";

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(open => !open);

  return (
    <div>
      <Navbar onBurgerClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "dashboard-collapsed" : "dashboard-expanded"}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
