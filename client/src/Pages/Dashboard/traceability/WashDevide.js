import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import "../Traceability.css";

Modal.setAppElement("#root");

const WashDevide = () => {
  const [newLots, setNewLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [isWashed, setIsWashed] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isDepulped, setIsDepulped] = useState(false);
  const [dryFiltered, setDryFiltered] = useState(50);
  const [matureGreen, setMatureGreen] = useState(50);
  const [cdDepulped, setcdDepulped] = useState(50);
  const [isDepulpedGreen, setIsDepulpedGreen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patioOptions, setPatioOptions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/newlot")
      .then((response) => {
        const lots = Array.isArray(response.data) ? response.data : response.data.data;
        setNewLots(Array.isArray(lots) ? lots : []);
      })
      .catch((error) => {
        console.error("Errore nel caricamento dei nuovi lotti:", error);
        setNewLots([]);
      });

    axios
      .get("http://localhost:5000/api/elements")
      .then((response) => {
        const onlyPatio = response.data.filter((option) => option.element === "Patio");
        setPatioOptions(onlyPatio);
      })
      .catch((error) => console.error("Errore nel caricamento delle opzioni del patio:", error));
  }, []);

  const handleLotChange = (lot) => {
    setSelectedLots((prev) => {
      const exists = prev.find((item) => item.id === lot.id);
      return exists ? prev.filter((item) => item.id !== lot.id) : [...prev, lot];
    });
  };

  const calculateTotalVolume = () => Math.round(selectedLots.reduce((acc, lot) => acc + lot.volume, 0));

  const totalVolume = calculateTotalVolume();
  const matureGreenVolume = Math.round((totalVolume * matureGreen) / 100);
  const dryVolume = Math.round(totalVolume - matureGreenVolume);
  const cdVolume = Math.round((matureGreenVolume * cdDepulped) / 100);
  const greenVolume = Math.round(matureGreenVolume - (matureGreenVolume * cdDepulped) / 100);
  const greenVolumeAfterDepulp = Math.round(matureGreenVolume - cdVolume);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalVolume === 0) {
      alert("Nessun lotto è stato selezionato.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");
  const handleNextStep = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const handlePrevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const handleConfirmModal = async () => {
    try {
      if (selectedLots.length === 0) {
        alert("Nessun lotto selezionato. Per favore seleziona almeno un lotto.");
        return;
      }

      let dataToSend = [];
      const patio_nLot = selectedLots[0].patio_nLot || null;

      if (isWashed) {
        if (isFiltered) {
          const bigDryVolume = Math.round((dryVolume * dryFiltered) / 100);
          const dryVolumeAfterFilter = dryVolume - bigDryVolume;
          dataToSend.push(
            { name: document.querySelector("#bigDryPatio").value, volume: bigDryVolume, type: "BigDry", date: selectedDate, patio_nLot, status: "active" },
            { name: document.querySelector("#dryPatio").value, volume: dryVolumeAfterFilter, type: "Dry", date: selectedDate, patio_nLot, status: "active" }
          );
        } else {
          dataToSend.push({ name: document.querySelector("#dryPatio").value, volume: dryVolume, type: "Dry", date: selectedDate, patio_nLot, status: "active" });
        }
        if (isDepulped) {
          dataToSend.push(
            { name: document.querySelector("#cdPatio").value, volume: cdVolume, type: "CD", date: selectedDate, patio_nLot, status: "active" },
            { name: document.querySelector("#greenPatio").value, volume: greenVolumeAfterDepulp, type: isDepulpedGreen ? "CDGreen" : "Green", date: selectedDate, patio_nLot, status: "active" }
          );
        }
        if (!isFiltered && !isDepulped) {
          dataToSend.push({ name: document.querySelector("#dryPatio").value, volume: dryVolume, type: "WashedNatural", date: selectedDate, patio_nLot, status: "active" });
        }
      } else {
        dataToSend.push({ name: document.querySelector("#naturalPatio").value, volume: totalVolume, type: "Natural", date: selectedDate, patio_nLot, status: "active" });
      }

      const response = await axios.post("http://localhost:5000/api/patio", dataToSend);
      const patioIds = response.data.patioIds;

      if (!patioIds) throw new Error("Errore: patioIds non trovato nella risposta del server");

      alert("Dati inviati con successo!");

      const patioList = patioIds.map((id) => ({ id }));
      const patioPrevNlotData = patioList.flatMap((patio) =>
        selectedLots.map((lot) => ({
          patio_id: patio.id,
          prev_nLot_newlot: lot.newlot_nLot,
        }))
      );

      await axios.post("http://localhost:5000/api/patio_prevnlot", patioPrevNlotData);

      await Promise.all(
        selectedLots.map((lot) =>
          axios.patch(`http://localhost:5000/api/newlot/${lot.id}`, { worked: 1 })
        )
      );

      setNewLots((prevLots) =>
        prevLots.map((lot) =>
          selectedLots.some((selLot) => selLot.id === lot.id) ? { ...lot, worked: 1 } : lot
        )
      );

      setIsModalOpen(false);
      navigate("/dashboard/traceability/manage-lot");
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore nell'invio dei dati. Per favore, riprova.");
    }
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    navigate("/dashboard/traceability/manage-lot");
  };

  return (
    <div className="form-container">
      <h2>Wash & Divide</h2>
      <form onSubmit={handleSubmit}>

        <h3>Seleziona Lotti</h3>
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
              newLots.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selectedLots.find((s) => s.id === lot.id)}
                      onChange={() => handleLotChange(lot)}
                    />
                  </td>
                  <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                  <td>{lot.plot}</td>
                  <td>{lot.volume.toLocaleString("it-IT")}</td>
                  <td>{lot.method}</td>
                  <td>{lot.type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-state">Nessun lotto disponibile</td>
              </tr>
            )}
          </tbody>
        </table>

        <label>
          Data:
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={isWashed}
            onChange={() => setIsWashed(!isWashed)}
          />
          {" "}Washing
        </label>

        <div className={`mixer-container ${isWashed ? "" : "disabled"}`}>
          <label>
            Mature+Green: {matureGreen}% ({matureGreenVolume.toLocaleString("it-IT")} litri)
            <input
              type="range"
              min="0"
              max="100"
              value={matureGreen}
              onChange={(e) => setMatureGreen(parseInt(e.target.value))}
              disabled={!isWashed}
            />
            Dry: {100 - matureGreen}% ({dryVolume.toLocaleString("it-IT")} litri)
          </label>
        </div>

        <div className="button-container">
          <button
            type="submit"
            className="action-button"
            disabled={!selectedDate || selectedLots.length === 0}
          >
            Conferma
          </button>
          <button type="button" className="action-button cancel" onClick={handleCancel}>
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
              <h2>
                {currentStep === 0 && "Gestione Boia"}
                {currentStep === 1 && "Gestione CD"}
                {currentStep === 2 && "Gestione Verde"}
                {currentStep === 3 && "Distribuzione Nuovi Lotti"}
                {" "}— Passo {currentStep + 1}
              </h2>
            </div>

            <div className="modal-body">
              {currentStep === 0 && (
                <div>
                  <p>Volume: {dryVolume.toLocaleString("it-IT")} litri</p>
                  <label>
                    <input type="checkbox" checked={isFiltered} onChange={() => setIsFiltered(!isFiltered)} />
                    {" "}Peneirão
                  </label>
                  <div className={`mixer-container ${isFiltered ? "" : "disabled"}`}>
                    <label>
                      Big Dry: {dryFiltered}% ({Math.round((dryVolume * dryFiltered) / 100).toLocaleString("it-IT")} litri)
                      <input
                        type="range" min="0" max="100" value={dryFiltered}
                        onChange={(e) => setDryFiltered(parseInt(e.target.value))}
                        disabled={!isFiltered}
                      />
                      Dry: {100 - dryFiltered}% ({Math.round(dryVolume - (dryVolume * dryFiltered) / 100).toLocaleString("it-IT")} litri)
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div>
                  <p>Volume: {matureGreenVolume.toLocaleString("it-IT")} litri</p>
                  <label>
                    <input type="checkbox" checked={isDepulped} onChange={() => setIsDepulped(!isDepulped)} />
                    {" "}Despolpador
                  </label>
                  <div className={`mixer-container ${isDepulped ? "" : "disabled"}`}>
                    <label><input type="checkbox" /> Desmucilador</label>
                    <label><input type="checkbox" /> Centrifuga</label>
                    <label>
                      CD: {cdDepulped}% ({Math.round((matureGreenVolume * cdDepulped) / 100).toLocaleString("it-IT")} litri)
                      <input
                        type="range" min="0" max="100" value={cdDepulped}
                        onChange={(e) => setcdDepulped(parseInt(e.target.value))}
                        disabled={!isDepulped}
                      />
                      Green: {100 - cdDepulped}% ({Math.round(matureGreenVolume - (matureGreenVolume * cdDepulped) / 100).toLocaleString("it-IT")} litri)
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <p>Volume verde: {greenVolume.toLocaleString("it-IT")} litri</p>
                  <label>
                    <input type="checkbox" checked={isDepulpedGreen} onChange={() => setIsDepulpedGreen(!isDepulpedGreen)} />
                    {" "}Despolpador
                  </label>
                  <div className={`mixer-container ${isDepulpedGreen ? "" : "disabled"}`}>
                    <label><input type="checkbox" /> Desmucilador</label>
                    <label><input type="checkbox" /> Centrifuga</label>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <p><strong>Volume Totale: {totalVolume.toLocaleString("it-IT")} litri</strong></p>

                  {isFiltered ? (
                    <>
                      <p>
                        Big Dry: {Math.round((dryVolume * dryFiltered) / 100).toLocaleString("it-IT")} litri
                        <label>Patio:
                          <select id="bigDryPatio">
                            {patioOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </label>
                      </p>
                      <p>
                        Dry: {Math.round(dryVolume - (dryVolume * dryFiltered) / 100).toLocaleString("it-IT")} litri
                        <label>Patio:
                          <select id="dryPatio">
                            {patioOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </label>
                      </p>
                    </>
                  ) : (
                    <p>
                      Dry: {dryVolume.toLocaleString("it-IT")} litri
                      <label>Patio:
                        <select id="dryPatio">
                          {patioOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </label>
                    </p>
                  )}

                  {isDepulped && (
                    <>
                      <p>
                        CD: {Math.round((matureGreenVolume * cdDepulped) / 100).toLocaleString("it-IT")} litri
                        <label>Patio:
                          <select id="cdPatio">
                            {patioOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </label>
                      </p>
                      <p>
                        Green: {Math.round(matureGreenVolume - (matureGreenVolume * cdDepulped) / 100).toLocaleString("it-IT")} litri
                        <label>Patio:
                          <select id="greenPatio">
                            {patioOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </label>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {currentStep === 0 ? (
                <button onClick={handleCancelModal} className="action-button cancel">Annulla</button>
              ) : (
                <button onClick={handlePrevStep} className="action-button">Indietro</button>
              )}
              {currentStep < 3 ? (
                <button onClick={handleNextStep} className="action-button">Avanti</button>
              ) : (
                <button onClick={handleConfirmModal} className="action-button save">Conferma</button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h2>Lotto unico naturale</h2>
            </div>
            <div className="modal-body">
              <p>Volume: {totalVolume.toLocaleString("it-IT")} litri</p>
              <label>
                Patio:
                <select id="naturalPatio">
                  {patioOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelModal} className="action-button cancel">Annulla</button>
              <button onClick={handleConfirmModal} className="action-button save">Conferma</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default WashDevide;