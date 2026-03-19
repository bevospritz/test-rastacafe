import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { useDropzone } from "react-dropzone";
import "./GestioneAppezzamenti.css";

Modal.setAppElement("#root");

const PlotsManagement = () => {
  const [farms, setFarms] = useState([]);
  const [plots, setPlots] = useState([]);
  const [showFormPlot, setShowFormPlot] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCodename, setNewCodename] = useState("");
  const [newVariety, setNewVariety] = useState("");
  const [newNcovas, setNewNcovas] = useState("");
  const [newDistance, setNewDistance] = useState("");
  const [newSurface, setNewSurface] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newState, setNewState] = useState("");
  const [newIrrigation, setNewIrrigation] = useState("");
  const [newRenda, setNewRenda] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  }); //sort
  const [filterText, setFilterText] = useState(""); //filter
  const [isUploading, setIsUploading] = useState(false); //drag and drop

  useEffect(() => {
    // Fetch data da farms
    axios.get("http://localhost:5000/api/farm").then((response) => {
      console.log("Response data:", response.data);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setFarms(response.data);

        setSelectedFarm(response.data[0]);
        console.log("Farm selezionata di default:", response.data[0]);
      } else {
        console.error("Response is not an array or empty:", response.data);
      }
    });
    // Fetch data da plots
    axios
      .get("http://localhost:5000/api/plots")
      .then((response) => {
        console.log("Response data (Plots):", response.data);
        if (Array.isArray(response.data)) {
          setPlots(response.data);
        } else {
          console.error("Response is not an array:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching Plots:", error);
      });
  }, []);

  const handleAddPlot = (e) => {
    e.preventDefault();
    if (!selectedFarm) {
      console.error("Nessuna farm selezionata");
      return;
    }

    const plotData = {
      name: newName,
      codename: newCodename,
      variety: newVariety,
      ncovas: newNcovas,
      distance: newDistance,
      surface: newSurface,
      age: newAge,
      state: newState,
      irrigation: newIrrigation,
      renda_forecast: newRenda,
      farmId: selectedFarm.id,
    };

    console.log("Dati inviati al server:", plotData);

    axios
      .post("http://localhost:5000/api/plots", plotData)
      .then((response) => {
        console.log("Risposta dal server:", response.data);
        setPlots([...plots, response.data]);
        setNewName("");
        setNewCodename("");
        setNewVariety("");
        setNewNcovas("");
        setNewDistance("");
        setNewSurface("");
        setNewAge("");
        setNewState("");
        setNewIrrigation("");
        setNewRenda("");
        setShowFormPlot(false);
        alert("Talhão inserito");
      })
      .catch((error) => {
        console.error("Error adding new plot:", error);
        alert("Errore nell'inserimento del talhão" + error.message);
      });
  };

  const handleDeletePlot = (plotId) => {
    axios
      .delete(`http://localhost:5000/api/plots/${plotId}`)
      .then(() => {
        setPlots(plots.filter((elem) => elem.id !== plotId));
      })
      .catch((error) => {
        console.error("Error deleting elemento:", error);
      });
  };

  const handleCancel = () => {
    setShowFormPlot(false);
  };

  //sort and filter results
  const sortedPlots = [...plots].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredPlots = sortedPlots.filter((plot) =>
    plot.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!selectedFarm) {
      alert(
        "⚠️ Nessuna farm disponibile! Impossibile caricare gli appezzamenti."
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("farmId", selectedFarm.id);

    try {
      setIsUploading(true);
      const res = await axios.post(
        "http://localhost:5000/api/excelplots",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(`✅ ${res.data.message || "File caricato correttamente!"}`);

      const updated = await axios.get("http://localhost:5000/api/plots");
      setPlots(updated.data);
    } catch (err) {
      console.error("Errore durante l'upload:", err);
      alert(
        `❌ Errore durante il caricamento: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Configurazione dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <div className="gestione-appezzamenti">
      <input
        type="text"
        placeholder="Filtrar por nome..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
      />
      {farms.map((farm) => (
        <div key={farm.id} className="farm-section-appezzamenti">
          <div className="farm-header-appezzamenti">
            <h1 className="farm-title-appezzamenti">{farm.name}</h1>

            {/*  INIZIO DRAG & DROP */}
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${
                  !selectedFarm ? "#ccc" : isDragActive ? "#00897b" : "#888"
                }`,
                color: !selectedFarm ? "#bbb" : "black",
                borderRadius: "10px",
                padding: "25px",
                textAlign: "center",
                margin: "15px 0 30px",
                background: isDragActive
                  ? "#e0f7fa"
                  : !selectedFarm
                  ? "#f9f9f9"
                  : "#fafafa",
                cursor: !selectedFarm ? "not-allowed" : "pointer",
                opacity: isUploading ? 0.6 : 1,
                pointerEvents: isUploading ? "none" : "auto",
                transition: "all 0.2s ease-in-out",
              }}
            >
              <input
                {...getInputProps()}
                disabled={!selectedFarm || isUploading}
              />

              {!selectedFarm ? (
                <p>
                  ⚠️ Seleziona prima una <strong>fattoria</strong> per importare
                  un file Excel
                </p>
              ) : isUploading ? (
                <p>⏳ Caricamento in corso, attendi qualche secondo...</p>
              ) : isDragActive ? (
                <p>
                  📂 Rilascia qui il file Excel per importare gli appezzamenti
                </p>
              ) : (
                <p>
                  📁 Trascina qui il file Excel o <strong>clicca</strong> per
                  selezionarlo
                </p>
              )}
            </div>

            {/* ⬆️ FINE DRAG & DROP */}

            <div className="action-buttons">
              <button
                className="modify-button"
                onClick={() => {
                  setShowFormPlot(true);
                  setSelectedFarm(farm);
                }}
              >
                +
              </button>
            </div>
          </div>
          <div className="element-table-wrapper">
            <table className="element-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort("name")}>Nome</th>
                  <th onClick={() => requestSort("codename")}>Codice</th>
                  <th onClick={() => requestSort("variety")}>Varietà</th>
                  <th onClick={() => requestSort("ncovas")}>Covas</th>
                  <th onClick={() => requestSort("distance")}>Distanza</th>
                  <th onClick={() => requestSort("surface")}>Superficie</th>
                  <th onClick={() => requestSort("age")}>Età</th>
                  <th onClick={() => requestSort("state")}>Stato</th>
                  <th onClick={() => requestSort("irrigation")}>Irrigazione</th>
                  <th onClick={() => requestSort("renda_forecast")}>
                    Renda Stim.
                  </th>
                  <th onClick={() => requestSort("volume_harvested")}>
                    Volume Rac.
                  </th>
                  <th onClick={() => requestSort("renda_actual")}>
                    Renda Att.
                  </th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlots.map((plot) => (
                  <tr key={plot.id}>
                    <td>{plot.name}</td>
                    <td>{plot.codename}</td>
                    <td>{plot.variety}</td>
                    <td>{plot.ncovas}</td>
                    <td>{plot.distance}</td>
                    <td>{plot.surface}</td>
                    <td>{plot.age}</td>
                    <td>{plot.state}</td>
                    <td>{plot.irrigation}</td>
                    <td>{plot.renda_forecast}</td>
                    <td>{plot.volume_harvested}</td>
                    <td>{plot.renda_actual}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDeletePlot(plot.id)}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <Modal
        isOpen={showFormPlot}
        onRequestClose={() => setShowFormPlot(false)}
        contentLabel="Adicionar Talhão"
        className="modal-appezzamenti"
        overlayClassName="overlay"
      >
        <h2>Adicionar Talhão</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPlot();
          }}
          className="form"
        >
          <div className="form-group">
            <label htmlFor="name">Nome:</label>
            <input
              id="name"
              placeholder="Nome do talhão"
              type="text"
              value={newName}
              onChange={(e) => {
                const clean = e.target.value.replace().toUpperCase();
                setNewCodename(clean);
              }}
              maxLength="50"
              tabIndex={1}
            />
          </div>
          <div className="form-group">
            <label htmlFor="codename">Codice:</label>
            <input
              id="codename"
              placeholder="Codigo do talhao Ex. P12"
              type="text"
              value={newCodename}
              onChange={(e) => {
                const clean = e.target.value.replace(/\s+/g, "").toUpperCase();
                setNewCodename(clean);
              }}
              maxLength="10"
              tabIndex={2}
            />
          </div>
          <div className="form-group">
            <label htmlFor="variety">Varietà:</label>
            <input
              id="variety"
              placeholder="Ex. Catuai"
              type="text"
              value={newVariety}
              onChange={(e) => setNewVariety(e.target.value)}
              maxLength="45"
              tabIndex={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ncovas">N° Covas:</label>
            <input
              id="ncovas"
              placeholder="Ex. 12050"
              type="text"
              value={newNcovas}
              onChange={(e) => setNewNcovas(e.target.value)}
              maxLength="10"
              tabIndex={4}
            />
          </div>
          <div className="form-group">
            <label htmlFor="distance">Distanziamento cm:</label>
            <input
              id="distance"
              placeholder="Ex. 280"
              type="text"
              value={newDistance}
              onChange={(e) => setNewDistance(e.target.value)}
              maxLength="10"
              tabIndex={5}
            />
          </div>
          <div className="form-group">
            <label htmlFor="surface">Superficie ha:</label>
            <input
              id="surface"
              placeholder="Ex. 10.25"
              type="text"
              value={newSurface}
              onChange={(e) => setNewSurface(e.target.value)}
              maxLength="10"
              tabIndex={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="age">Età:</label>
            <input
              id="age"
              placeholder="Ex. 2016"
              type="year"
              value={newAge}
              onChange={(e) => setNewAge(e.target.value)}
              maxLength="4"
              minLength="4"
              tabIndex={7}
            />
          </div>
          <div className="form-group">
            <label htmlFor="state">Stato:</label>
            <select
              id="state"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              tabIndex={8}
            >
              <option value="">Seleziona</option>
              <option value="raccolta">Raccolta</option>
              <option value="potato">Potato</option>
              <option value="formazione">Formazione</option>
            </select>
          </div>
          <div className="form-group">
            <label>Irrigazione:</label>
            <div>
              <div className="custom-radio">
                <input
                  id="irrigation-yes"
                  type="radio"
                  value="Yes"
                  checked={newIrrigation === "Yes"}
                  onChange={(e) => setNewIrrigation(e.target.value)}
                  tabIndex={9}
                />
                <label htmlFor="irrigation-yes">Yes</label>
              </div>
              <div className="custom-radio">
                <input
                  id="irrigation-no"
                  type="radio"
                  value="No"
                  checked={newIrrigation === "No"}
                  onChange={(e) => setNewIrrigation(e.target.value)}
                  tabIndex={10}
                />
                <label htmlFor="irrigation-no">No</label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="renda">Renda Stimata:</label>
            <input
              id="renda"
              placeholder="Ex. 5.24"
              type="text"
              value={newRenda}
              onChange={(e) => setNewRenda(e.target.value)}
              maxLength="10"
              tabIndex={11}
            />
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              onClick={handleAddPlot}
              tabIndex={12}
            >
              Inserisci
            </button>
            <button
              type="cancel"
              onClick={handleCancel}
              className="cancel-button"
              tabIndex={13}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlotsManagement;
