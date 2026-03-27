import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import { AuthProvider } from "./AuthContext";
import axios from "axios";
import { LanguageProvider } from "./LanguageContext";
import { OfflineProvider } from "./OfflineContext";
axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:5000";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <OfflineProvider>
          <App />
        </OfflineProvider>
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>,
);
