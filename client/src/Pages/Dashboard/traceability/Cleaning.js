import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Traceability.css";

const Cleaning = () => {
  const [tulhas, setTulhas] = useState([]);
  const [selectedTulhas, setSelectedTulhas] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/restforcleaning")
      .then((res) => {
        setTulhas(res.data || []);
      })
      .catch((err) => {
        console.error("Errore caricamento restcards:", err);
      });
  }, []);

  const toggleTulha = (id) => {
    setSelectedTulhas((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  return (
    <div className="form-container">
      <h1>Cleaning Selection</h1>

      {tulhas.map((tulha) => (
        <div key={tulha.id} className="rest-card">
          <div className="rest-card-header">
            <input
              type="checkbox"
              checked={selectedTulhas.includes(tulha.id)}
              onChange={() => toggleTulha(tulha.id)}
            />

            <h2>
              Tulha {tulha.tulha} — {tulha.volume} L
            </h2>
          </div>

          <table className="trace-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Volume</th>
                <th>Tipo</th>
                <th>Origine</th>
              </tr>
            </thead>

            <tbody>
              {(tulha.sublots || []).map((s, i) => (
                <tr key={i}>
                  <td>{new Date(s.date).toLocaleDateString("it-IT")}</td>
                  <td>{s.volume}</td>
                  <td>{s.type || "-"}</td>
                  <td>{s.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default Cleaning;
