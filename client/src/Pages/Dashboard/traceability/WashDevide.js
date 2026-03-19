import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import "../Traceability.css";

Modal.setAppElement("#root"); // Per evitare un errore di accessibilità

const WashDevide = () => {
  const [newLots, setNewLots] = useState([]); // Array per tenere traccia dei nuovi lotti
  const [selectedLots, setSelectedLots] = useState([]); // Mappa per tenere traccia dei lotti selezionati

  const [isWashed, setIsWashed] = useState(false); // Stato per controllare se il lavaggio è attivo
  const [isFiltered, setIsFiltered] = useState(false); // Stato per controllare se il peneirão è attivo
  const [isDepulped, setIsDepulped] = useState(false); // Stato per controllare se il despolpador è attivo

  const [dryFiltered, setDryFiltered] = useState(50); // Stato per tenere traccia del volume del big dry
  const [matureGreen, setMatureGreen] = useState(50); // Stato per tenere traccia del volume del mature+green
  const [cdDepulped, setcdDepulped] = useState(50); // Stato per tenere traccia del volume del CD

  const [isDepulpedGreen, setIsDepulpedGreen] = useState(false);
  // const [isDemucilagedGreen, setIsDemucilagedGreen] = useState(false);
  // const [isCentrifugedGreen, setIsCentrifugedGreen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patioOptions, setPatioOptions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/newlot")
      .then((response) => {
        console.log("Dati ricevuti da /api/newlot:", response.data);
        // Se la risposta è un oggetto e l'array si trova in response.data.data:
        const lots = Array.isArray(response.data)
          ? response.data
          : response.data.data; // oppure response.data.lots, a seconda del formato
        setNewLots(Array.isArray(lots) ? lots : []);
      })
      .catch((error) => {
        console.error("Errore nel caricamento dei nuovi lotti:", error);
        setNewLots([]); // Imposta l'array vuoto in caso di errore
      });
    axios
      .get("http://localhost:5000/api/elements")
      .then((response) => {
        // Filtra gli elementi che hanno "element" uguale a "patio"
        const onlyPatio = response.data.filter(
          (option) => option.element === "Patio"
        );
        setPatioOptions(onlyPatio);
      })
      .catch((error) => {
        console.error("Errore nel caricamento delle opzioni del patio:", error);
      });
  }, []);

  const handleLotChange = (lot) => {
    console.log(`handleLotChange chiamato con lot:`, lot);
    setSelectedLots((prev) => {
      const exists = prev.find((item) => item.id === lot.id);
      return exists
        ? prev.filter((item) => item.id !== lot.id) // Rimuovi se già selezionato
        : [...prev, lot]; // Aggiungi l'intero oggetto lot se non presente
    });
  };

  const calculateTotalVolume = () => {
    return Math.round(selectedLots.reduce((acc, lot) => acc + lot.volume, 0));
  };

  const totalVolume = calculateTotalVolume();
  const matureGreenVolume = Math.round((totalVolume * matureGreen) / 100);
  const dryVolume = Math.round(totalVolume - matureGreenVolume);
  const greenVolume = Math.round(
    matureGreenVolume - (matureGreenVolume * cdDepulped) / 100
  );
  const cdVolume = Math.round((matureGreenVolume * cdDepulped) / 100);
  const greenVolumeAfterDepulp = Math.round(matureGreenVolume - cdVolume);

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalVolume = calculateTotalVolume();

    if (totalVolume === 0) {
      alert("Nessun lotto è stato selezionato.");
      return;
    }

    setIsModalOpen(true); // Apri il modal
  };

  const handleCancel = () => {
    navigate("/dashboard/traceability/manage-lot"); // Reindirizza alla pagina principale
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmModal = async () => {
    try {
      if (selectedLots.length === 0) {
        alert(
          "Nessun lotto selezionato. Per favore seleziona almeno un lotto."
        );
        return;
      }

      let dataToSend = [];
      const patio_nLot = selectedLots[0].patio_nLot || null;

      // Raccolta dati in base alle condizioni (rimane invariato)
      if (isWashed) {
        if (isFiltered) {
          const bigDryVolume = Math.round((dryVolume * dryFiltered) / 100);
          const dryVolumeAfterFilter = dryVolume - bigDryVolume;
          dataToSend.push(
            {
              name: document.querySelector("#bigDryPatio").value,
              volume: bigDryVolume,
              type: "BigDry",
              date: selectedDate,
              patio_nLot,
              status: "active",
            },
            {
              name: document.querySelector("#dryPatio").value,
              volume: dryVolumeAfterFilter,
              type: "Dry",
              date: selectedDate,
              patio_nLot,
              status: "active",
            }
          );
        } else {
          dataToSend.push({
            name: document.querySelector("#dryPatio").value,
            volume: dryVolume,
            type: "Dry",
            date: selectedDate,
            patio_nLot,
            status: "active",
          });
        }
        if (isDepulped) {
          dataToSend.push(
            {
              name: document.querySelector("#cdPatio").value,
              volume: cdVolume,
              type: "CD",
              date: selectedDate,
              patio_nLot,
              status: "active",
            },
            {
              name: document.querySelector("#greenPatio").value,
              volume: greenVolumeAfterDepulp,
              type: isDepulpedGreen ? "CDGreen" : "Green",
              date: selectedDate,
              patio_nLot,
              status: "active",
            }
          );
        }
        if (!isFiltered && !isDepulped) {
          dataToSend.push({
            name: document.querySelector("#dryPatio").value,
            volume: dryVolume,
            type: isWashed ? "WashedNatural" : "Natural",
            date: selectedDate,
            patio_nLot,
            status: "active",
          });
        }
      } else {
        dataToSend.push({
          name: document.querySelector("#naturalPatio").value,
          volume: totalVolume,
          type: "Natural",
          date: selectedDate,
          patio_nLot,
          status: "active",
        });
      }
      console.log("selectedLots:", selectedLots);

      // Primo endpoint: invio dati principali
      const response = await axios.post(
        "http://localhost:5000/api/patio",
        dataToSend
      );

      console.log("Risposta dal server /api/patio:", response.data);
      const patioIds = response.data.patioIds;
      const patioList = patioIds.map((id) => ({ id }));

      if (!response.data.patioIds) {
        throw new Error(
          "Errore: patioIds non trovato nella risposta del server"
        );
      }
      alert("Dati inviati con successo!");

      if (response.data.patioIds.length === 0 || selectedLots.length === 0) {
        console.error(
          "Errore: Nessun patio creato o nessun lotto selezionato."
        );
        alert("Errore nella corrispondenza tra patio e lotti aggiornati.");
        return;
      }

      const patioPrevNlotData = patioList.flatMap((patio) =>
        selectedLots.map((lot) => ({
          patio_id: patio.id,
          prev_nLot_newlot: lot.newlot_nLot,
        }))
      );

      console.log("Dati inviati a /api/patio_prevnlot:", patioPrevNlotData);

      if (patioPrevNlotData.some((data) => data.patio_id === null)) {
        console.error("Errore: alcuni patio_id sono null!");
        alert("Errore nell'invio dei dati. Alcuni ID patio sono null.");
        return;
      }
      // Secondo endpoint: invio dati a /api/patio_prevnlot
      await axios
        .post("http://localhost:5000/api/patio_prevnlot", patioPrevNlotData)
        .then((response) => {
          console.log("Risposta dal server:", response.data);
        })
        .catch((error) => {
          console.error(
            "Errore durante l'invio:",
            error.response ? error.response.data : error.message
          );
        });

      // Aggiorna il valore "worked" dei lotti selezionati nel caso di successo
      await Promise.all(
        selectedLots.map((lot) =>
          axios.patch(`http://localhost:5000/api/newlot/${lot.id}`, {
            worked: 1,
          })
        )
      );

      setNewLots((prevLots) =>
        prevLots.map((lot) =>
          selectedLots.some((selLot) => selLot.id === lot.id)
            ? { ...lot, worked: 1 }
            : lot
        )
      );

      // Chiudi il modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore nell'invio dei dati. Per favore, riprova.");
    }

    navigate("/dashboard/traceability/manage-lot");
  };

  const handleCancelModal = () => {
    setIsModalOpen(false); // Chiudi il modal
    navigate("/dashboard/traceability/manage-lot");
  };

  return (
    <div className="form-container">
      <h1>Wash & Devide</h1>
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Seleziona</th>
              <th>Data</th>
              <th>Talhão</th>
              <th>Volume</th>
              <th>Metodo</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(newLots) && newLots.length > 0 ? (
              newLots.map((lot) => {
                const lotId = lot.id; // Assicurati di usare solo l'ID univoco del lotto
                return (
                  <tr key={lotId}>
                    <td>
                      <input
                        type="checkbox"
                        name={`selectedLot-${lotId}`}
                        checked={
                          !!selectedLots.find(
                            (selectedLot) => selectedLot.id === lotId
                          )
                        }
                        onChange={() => handleLotChange(lot)}
                      />
                    </td>
                    <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                    <td>{lot.plot}</td>
                    <td>{lot.volume}</td>
                    <td>{lot.method}</td>
                    <td>{lot.type}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td style={{ textAlign: "center", color: "red" }}>Nessun lotto disponibile</td>
              </tr>
            )}
          </tbody>
        </table>
        <label>
          Data:
          <input
            type="date"
            name="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
        </label>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isWashed}
              onChange={() => setIsWashed(!isWashed)}
              
            />
            Washing
          </label>
        </div>
        <div className={`mixer-container ${isWashed ? "" : "disabled"}`}>
          <label>
            Mature+Green: {matureGreen}% ({matureGreenVolume} litri)
            <input
              type="range"
              min="0"
              max="100"
              value={matureGreen}
              onChange={(e) => setMatureGreen(parseInt(e.target.value))}
              disabled={!isWashed}
              
            />
            Dry: {100 - matureGreen}% ({dryVolume} litri)
          </label>
        </div>
        <div className="button-container">
          <button
            type="submit"
            className="action-button"
            disabled={!selectedDate}
            style={{
              opacity: !selectedDate ? 0.5 : 1,
              cursor: !selectedDate ? "not-allowed" : "pointer",
            }}
          >
            Conferma
          </button>
          <button
            type="button"
            className="action-button"
            onClick={handleCancel}
          >
            Annulla
          </button>
        </div>
      </form>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCancelModal}
        contentLabel="Divisione Lotti"
        className="modal-content"
        overlayClassName="modal"
      >
        {isWashed ? (
          <>
            <div className="modal-header">
              {currentStep === 0 && (
                <h2>Gestione Boia - Passo {currentStep + 1}</h2>
              )}
              {currentStep === 1 && (
                <h2>Gestione CD - Passo {currentStep + 1}</h2>
              )}
              {currentStep === 2 && (
                <h2>Gestione verde - Passo {currentStep + 1}</h2>
              )}
              {currentStep === 3 && (
                <h2>Distribuzione nuovi lotti - Passo {currentStep + 1}</h2>
              )}
            </div>
            <div className="modal-body">
              {currentStep === 0 && (
                <div>
                  <p>Volume: {dryVolume} litri</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isFiltered}
                      onChange={() => setIsFiltered(!isFiltered)}
                    />
                    Peneirão
                  </label>
                  <div
                    className={`mixer-container ${
                      isFiltered ? "" : "disabled"
                    }`}
                  >
                    <label>
                      Big Dry: {dryFiltered}% (
                      {Math.round((dryVolume * dryFiltered) / 100)} litri)
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={dryFiltered}
                        onChange={(e) =>
                          setDryFiltered(parseInt(e.target.value))
                        }
                        disabled={!isFiltered}
                      />
                      Dry: {100 - dryFiltered}% (
                      {Math.round(dryVolume - (dryVolume * dryFiltered) / 100)}{" "}
                      litri)
                    </label>
                  </div>
                </div>
              )}
              {currentStep === 1 && (
                <div>
                  <p>Volume: {matureGreenVolume} litri</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isDepulped}
                      onChange={() => setIsDepulped(!isDepulped)}
                    />
                    Despolpador
                  </label>
                  <div
                    className={`mixer-container ${
                      isDepulped ? "" : "disabled"
                    }`}
                  >
                    <label>
                      <input type="checkbox" />
                      Desmucilador
                    </label>
                    <label>
                      <input type="checkbox" />
                      Centrifuga
                    </label>

                    <label>
                      CD: {cdDepulped}% (
                      {Math.round((matureGreenVolume * cdDepulped) / 100)}{" "}
                      litri)
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={cdDepulped}
                        onChange={(e) =>
                          setcdDepulped(parseInt(e.target.value))
                        }
                        disabled={!isDepulped}
                      />
                      Green: {100 - cdDepulped}% (
                      {Math.round(
                        matureGreenVolume -
                          (matureGreenVolume * cdDepulped) / 100
                      )}{" "}
                      litri)
                    </label>
                  </div>
                </div>
              )}
              {currentStep === 2 && (
                <div>
                  <p>Volume verde: {greenVolume} litri</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={isDepulpedGreen}
                      onChange={() => setIsDepulpedGreen(!isDepulpedGreen)}
                    />
                    Despolpador
                  </label>
                  <div
                    className={`mixer-container ${
                      isDepulpedGreen ? "" : "disabled"
                    }`}
                  >
                    <label>
                      <input type="checkbox" />
                      Desmucilador
                    </label>
                    <label>
                      <input type="checkbox" />
                      Centrifuga
                    </label>
                  </div>
                </div>
              )}
              {currentStep === 3 && (
                <div>
                  <p>
                    <strong>Volume Totale: {totalVolume} litri</strong>
                  </p>
                  {isFiltered ? (
                    <div>
                      <p>
                        Big Dry: {Math.round((dryVolume * dryFiltered) / 100)}{" "}
                        litri (
                        {Math.round(
                          ((dryVolume * dryFiltered) / 100 / totalVolume) * 100
                        )}
                        %)
                        <label>
                          Patio:
                          <select id="bigDryPatio">
                            {patioOptions.map((patio) => (
                              <option
                              key={patio.id}
                              value={patio.name}>
                                {patio.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </p>
                      <p>
                        Dry:{" "}
                        {Math.round(
                          dryVolume - (dryVolume * dryFiltered) / 100
                        )}{" "}
                        litri (
                        {Math.round(
                          ((dryVolume - (dryVolume * dryFiltered) / 100) /
                            totalVolume) *
                            100
                        )}
                        %)
                        <label>
                          Patio:
                          <select id="dryPatio">
                            {patioOptions.map((patio) => (
                              <option key={patio.id} value={patio.name}>
                                {patio.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </p>
                    </div>
                  ) : (
                    <p>
                      Dry: {dryVolume} litri (
                      {Math.round((dryVolume / totalVolume) * 100)}%)
                      <label>
                        Patio:
                        <select id="dryPatio">
                          {patioOptions.map((patio) => (
                            <option key={patio.id} value={patio.name}>
                              {patio.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </p>
                  )}
                  {isDepulped && (
                    <div>
                      <p>
                        CD: {Math.round((matureGreenVolume * cdDepulped) / 100)}{" "}
                        litri (
                        {Math.round(
                          ((matureGreenVolume * cdDepulped) /
                            100 /
                            totalVolume) *
                            100
                        )}
                        %)
                        <label>
                          Patio:
                          <select id="cdPatio">
                            {patioOptions.map((patio) => (
                              <option key={patio.id} value={patio.name}>
                                {patio.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </p>
                      <p>
                        Green:{" "}
                        {Math.round(
                          matureGreenVolume -
                            (matureGreenVolume * cdDepulped) / 100
                        )}{" "}
                        litri (
                        {Math.round(
                          ((matureGreenVolume -
                            (matureGreenVolume * cdDepulped) / 100) /
                            totalVolume) *
                            100
                        )}
                        %)
                        <label>
                          Patio:
                          <select id="greenPatio">
                            {patioOptions.map((patio) => (
                              <option key={patio.id} value={patio.name}>
                                {patio.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {currentStep === 0 && (
                <button onClick={handleCancelModal} className="action-button">
                  Annulla
                </button>
              )}
              {currentStep > 0 && (
                <button onClick={handlePrevStep} className="action-button">
                  Indietro
                </button>
              )}
              {currentStep < 3 ? (
                <button onClick={handleNextStep} className="action-button">
                  Avanti
                </button>
              ) : (
                <button onClick={handleConfirmModal} className="action-button">
                  Conferma
                </button>
              )}
            </div>
          </>
        ) : (
          <div>
            <div className="modal-header">
              <h2>Lotto unico naturale</h2>
            </div>
            <div className="modal-body">
              <p>Volume: {totalVolume} litri</p>
              <label>
                Patio:
                <select id="naturalPatio">
                  {patioOptions.map((patio) => (
                    <option key={patio.id} value={patio.name}>
                      {patio.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelModal} className="action-button">
                Annulla
              </button>
              <button onClick={handleConfirmModal} className="action-button">
                Conferma
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WashDevide;
