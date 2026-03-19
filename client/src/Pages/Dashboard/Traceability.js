import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import "./Traceability.css";

Modal.setAppElement("#root");

const Traceability = () => {
  const [showTraceability, setShowTraceability] = useState(true);
  const [newLots, setNewLots] = useState([]);
  const [newPatios, setNewPatios] = useState([]);
  const [newDryers, setNewDryers] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [newFermentations, setNewFermentations] = useState([]);
  const [newRests, setNewRests] = useState([]);

  React.useEffect(() => {
    if (location.pathname.includes("manage-lot")) {
      setShowTraceability(false);
    } else {
      setShowTraceability(true);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = () => {
      axios
        .get("http://localhost:5000/api/newlot")
        .then((res) => setNewLots(res.data))
        .catch((err) =>
          console.error("Errore nel caricamento dei nuovi lotti:", err),
        );

      axios
        .get("http://localhost:5000/api/patiocard")
        .then((res) => {
          setNewPatios(res.data);
          console.log("Nuovi patii:", res.data);
        })
        .catch((err) =>
          console.error("Errore nel caricamento dei patii:", err),
        );

      axios
        .get("http://localhost:5000/api/dryercard")
        .then((res) => setNewDryers(res.data))
        .catch((err) =>
          console.error("Errore nel caricamento dei seccatori:", err),
        );

      axios.get("http://localhost:5000/api/fermentationcard").then((res) => {
        console.log("FERMENTATION CARD DATA:", res.data);
        setNewFermentations(Array.isArray(res.data) ? res.data : []);
      });

      axios
        .get("http://localhost:5000/api/restcard")
        .then((res) => {
          console.log("REST CARD DATA:", res.data);
          setNewRests(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => console.error("Errore rest card:", err));
    };

    fetchData(); // chiamata iniziale

    // Ricarica dati quando la scheda del browser torna visibile
    window.addEventListener("focus", fetchData);

    return () => {
      window.removeEventListener("focus", fetchData);
    };
  }, []);

  return (
    <div>
      {showTraceability && (
        <>
          <h1>Tracciabilità</h1>
          <button
            onClick={() => navigate("/dashboard/traceability/manage-lot")}
            className="action-button"
          >
            Gestione lotto
          </button>
          <div className="card-container">
            <div className="card">
              <h2>Nuovi Lotti</h2>
              {newLots.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Talhão</th>
                      <th>Volume</th>
                      <th>Metodo</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newLots.map((lot) => (
                      <tr key={lot.id}>
                        <td>
                          {new Date(lot.date).toLocaleDateString("it-IT")}
                        </td>
                        <td>{lot.plot}</td>
                        <td>{lot.volume}</td>
                        <td>{lot.method}</td>
                        <td>{lot.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Nenhum novo lote adicionado</p>
              )}
            </div>
            <div className="card">
              <h2>Patios</h2>
              {newPatios.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Talhão</th>
                      <th>Patio</th>
                      <th>Volume</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newPatios.map((patio) => (
                      <tr key={patio.id}>
                        <td>
                          {new Date(patio.date).toLocaleDateString("it-IT")}
                        </td>
                        <td>{patio.plots}</td>
                        <td>{patio.name}</td>
                        <td>{patio.volume}</td>
                        <td
                          className={
                            patio.type === "fermented"
                              ? "highlight-fermented"
                              : ""
                          }
                        >
                          {patio.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Todos os pátios estão vazios</p>
              )}
            </div>
            <div className="card">
              <h2>Dryer</h2>
              {newDryers.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Talhão</th>
                      <th>Dryer</th>
                      <th>Volume</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newDryers.map((dryer) => (
                      <tr key={dryer.id}>
                        <td>
                          {new Date(dryer.date).toLocaleDateString("it-IT")}
                        </td>
                        <td>{dryer.plots}</td>
                        <td>{dryer.name}</td>
                        <td>{dryer.volume}</td>
                        <td>{dryer.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Todos os pátios estão vazios</p>
              )}
            </div>

            <div className="card">
              <h2>Fermentazioni</h2>
              {newFermentations.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Talhão</th>
                      <th>Lotto</th>
                      <th>Volume</th>
                      <th>Metodo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newFermentations.map((f) => (
                      <tr key={f.id}>
                        <td>{new Date(f.date).toLocaleDateString("it-IT")}</td>
                        <td>{f.plots}</td>
                        <td>{f.name}</td>
                        <td>{f.volume}</td>
                        <td>{f.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Nessuna fermentazione attiva</p>
              )}
            </div>
            <div className="card">
              <h2>Tulha / Rest</h2>
              {newRests.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Talhão</th>
                      <th>Tulha</th>
                      <th>Volume</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newRests.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.date).toLocaleDateString("it-IT")}</td>
                        <td>{r.plots}</td>
                        <td>{r.name}</td>
                        <td>{r.volume}</td>
                        <td>{r.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Nessun lotto in riposo</p>
              )}
            </div>
          </div>
        </>
      )}
      <Outlet />
    </div>
  );
};

export default Traceability;
