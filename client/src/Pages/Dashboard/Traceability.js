import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import "./Traceability.css";

const CARDS = [
  {
    key: "newLots",
    title: "Nuovi Lotti",
    endpoint: "/api/newlot",
    empty: "Nessun nuovo lotto",
    columns: ["Data", "Talhão", "Volume", "Metodo", "Tipo"],
    renderRow: (lot) => (
      <tr key={lot.id}>
        <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
        <td>{lot.plot}</td>
        <td>{lot.volume?.toLocaleString("it-IT")}</td>
        <td>{lot.method}</td>
        <td>{lot.type}</td>
      </tr>
    ),
  },
  {
    key: "patios",
    title: "Patios",
    endpoint: "/api/patiocard",
    empty: "Nessun patio attivo",
    columns: ["Data", "Talhão", "Patio", "Volume", "Tipo"],
    renderRow: (patio) => (
      <tr key={patio.id}>
        <td>{new Date(patio.date).toLocaleDateString("it-IT")}</td>
        <td>{patio.plots}</td>
        <td>{patio.name}</td>
        <td>{patio.volume?.toLocaleString("it-IT")}</td>
        <td className={patio.type === "fermented" ? "highlight-fermented" : ""}>
          {patio.type}
        </td>
      </tr>
    ),
  },
  {
    key: "dryers",
    title: "Dryer",
    endpoint: "/api/dryercard",
    empty: "Nessun dryer attivo",
    columns: ["Data", "Talhão", "Dryer", "Volume", "Tipo"],
    renderRow: (dryer) => (
      <tr key={dryer.id}>
        <td>{new Date(dryer.date).toLocaleDateString("it-IT")}</td>
        <td>{dryer.plots}</td>
        <td>{dryer.name}</td>
        <td>{dryer.volume?.toLocaleString("it-IT")}</td>
        <td>{dryer.type}</td>
      </tr>
    ),
  },
  {
    key: "fermentations",
    title: "Fermentazioni",
    endpoint: "/api/fermentationcard",
    empty: "Nessuna fermentazione attiva",
    columns: ["Data", "Talhão", "Lotto", "Volume", "Metodo"],
    renderRow: (f) => (
      <tr key={f.id}>
        <td>{new Date(f.date).toLocaleDateString("it-IT")}</td>
        <td>{f.plots}</td>
        <td>{f.name}</td>
        <td>{f.volume?.toLocaleString("it-IT")}</td>
        <td>{f.type}</td>
      </tr>
    ),
  },
  {
    key: "rests",
    title: "Tulha / Rest",
    endpoint: "/api/restcard",
    empty: "Nessun lotto in riposo",
    columns: ["Data", "Talhão", "Tulha", "Volume", "Tipo"],
    renderRow: (r) => (
      <tr key={r.id}>
        <td>{new Date(r.date).toLocaleDateString("it-IT")}</td>
        <td>{r.plots}</td>
        <td>{r.name}</td>
        <td>{r.volume?.toLocaleString("it-IT")}</td>
        <td>{r.type}</td>
      </tr>
    ),
  },
  {
    key: "stocking",
    title: "Stocking",
    endpoint: "/api/stockingcard",
    empty: "Nessun lotto stoccato",
    columns: ["Data", "Lotto", "Talhão", "Bags", "Tipo", "Deposito"],
    renderRow: (s) => (
      <tr key={s.id}>
        <td>{new Date(s.date).toLocaleDateString("it-IT")}</td>
        <td>{s.name}</td>
        <td>{s.plots || "—"}</td>
        <td>{s.bags ?? "—"}</td>
        <td>{s.type || "—"}</td>
        <td>
          {s.deposit || (
            <span style={{ color: "#aaa", fontStyle: "italic" }}>
              Vendita diretta
            </span>
          )}
        </td>
      </tr>
    ),
  },
];

const Traceability = () => {
  const [showTraceability, setShowTraceability] = useState(true);
  const [cardData, setCardData] = useState({
    newLots: [],
    patios: [],
    dryers: [],
    fermentations: [],
    rests: [],
    stocking: [],
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setShowTraceability(
      !location.pathname.includes("manage-lot") &&
        !location.pathname.includes("lot-history"),
    );
  }, [location]);

  useEffect(() => {
    const fetchData = () => {
      CARDS.forEach((card) => {
        axios
          .get(`http://localhost:5000${card.endpoint}`)
          .then((res) => {
            setCardData((prev) => ({
              ...prev,
              [card.key]: Array.isArray(res.data) ? res.data : [],
            }));
          })
          .catch((err) =>
            console.error(`Errore caricamento ${card.title}:`, err),
          );
      });
    };

    fetchData();
    window.addEventListener("focus", fetchData);
    return () => window.removeEventListener("focus", fetchData);
  }, []);

  return (
    <div>
      {showTraceability && (
        <div className="traceability-wrapper">
          <h2>Tracciabilità</h2>
          <p className="page-subtitle">Panoramica dei lotti in lavorazione</p>

          <div className="traceability-actions">
            <button
              className="action-button"
              onClick={() => navigate("/dashboard/traceability/manage-lot")}
            >
              Gestione Lotto
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/dashboard/traceability/lot-history")}
            >
              Storia Lotto
            </button>
          </div>

          <div className="card-container">
            {CARDS.map((card) => {
              const data = cardData[card.key];
              return (
                <div key={card.key} className="card">
                  <h2>{card.title}</h2>
                  {data.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          {card.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{data.map(card.renderRow)}</tbody>
                    </table>
                  ) : (
                    <p className="text-muted">{card.empty}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default Traceability;
