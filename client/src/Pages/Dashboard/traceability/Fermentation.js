import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Traceability.css";

function Fermentation() {
  const [step, setStep] = useState(null); // "start" o "end"
  const [patioLots, setPatioLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [fermentationType, setFermentationType] = useState("Barrel");
  const [lotVolumes, setLotVolumes] = useState({});
  const [activeFermentations, setActiveFermentations] = useState([]);
  const [patioOptions, setPatioOptions] = useState([]);
  const [form, setForm] = useState({
    patio: "",
    date: "",
    timeIn: "",
    timeOut: "",
  });

  const fetchActiveFermentations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/fermentation/active"
      );
      console.log("Fermentazioni attive:", response.data);
      setActiveFermentations(response.data);
    } catch (err) {
      console.error("Errore Axios:", err);
    }
  };

  const navigate = useNavigate();

  // Carica lotti disponibili da patio
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/patio")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        const notFinished = data.filter((lot) => lot.status !== "finished");
        setPatioLots(notFinished);
      })
      .catch((err) => {
        console.error("Errore caricamento patio:", err);
        setPatioLots([]);
      });
  }, []);

  // Carica opzioni patio disponibili
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/elements")
      .then((res) => {
        const onlyPatio = res.data.filter((e) => e.element === "Patio");
        setPatioOptions(onlyPatio);
      })
      .catch((err) =>
        console.error("Errore nel caricamento delle opzioni patio:", err)
      );
  }, []);

  // Carica fermentazioni attive
  useEffect(() => {
    fetchActiveFermentations();
  }, []);

  // Carica i valori di newlot_nlot per i lotti selezionati

  const getDisplayVolume = (lot) => {
    return lot.status === "split" && lot.partial_volume != null
      ? lot.partial_volume
      : lot.volume;
  };

  const handleSelectLot = (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id);

    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => l.id !== lot.id));
      setLotVolumes((prev) => {
        const updated = { ...prev };
        delete updated[lot.id];
        return updated;
      });
      return;
    }

    // 🔽 LOGICA DI BLOCCO CD ↔ Green/Dry
    const hasCD = selectedLots.some((l) => l.type === "CD");
    const isCD = lot.type === "CD";
    const hasNonCD = selectedLots.some((l) => l.type !== "CD");

    // Se sto provando a selezionare un CD ma ho già Dry/Green → blocco
    if (isCD && hasNonCD) {
      alert(
        "Non puoi mescolare lotti di tipo CD con altri tipi (Dry/Green/Natural)."
      );
      return;
    }

    // Se sto provando a selezionare un Dry/Green ma ho già CD → blocco
    if (!isCD && hasCD) {
      alert(
        "Non puoi mescolare lotti di tipo CD con altri tipi (Dry/Green/Natural)."
      );
      return;
    }

    // Se tutto ok, seleziono normalmente
    setSelectedLots((prev) => [...prev, lot]);
    setLotVolumes((prev) => ({ ...prev, [lot.id]: 100 }));
  };

  const handleSliderChange = (lot, value) => {
    setLotVolumes((prev) => ({ ...prev, [lot.id]: value }));
  };

  const calculateTotalPartialVolume = () => {
    return selectedLots.reduce((sum, lot) => {
      const perc = lotVolumes[lot.id] || 0;
      const baseVol = getDisplayVolume(lot);
      return sum + Math.round((perc / 100) * baseVol);
    }, 0);
  };

  const handleSubmitStart = async (e) => {
    e.preventDefault();

    if (selectedLots.length === 0) {
      alert("Seleziona almeno un lotto per iniziare la fermentazione.");
      return;
    }

    //PAYLOAD per /api/fermentation
    const fermentationPayload = {
      volume: calculateTotalPartialVolume(),
      date: form.date,
      type: selectedLots[0].type,
      timeIn: form.timeIn,
      method: fermentationType,
      lots: selectedLots.map((lot) => ({
        prev_nLot_patio: lot.patio_nLot,
        volume: Math.round((lotVolumes[lot.id] / 100) * getDisplayVolume(lot)),
      })),
    };

    // Validazione del payload
    if (
      typeof fermentationPayload.volume !== "number" ||
      isNaN(fermentationPayload.volume) ||
      !fermentationPayload.date?.trim() ||
      !fermentationPayload.type?.trim() ||
      !fermentationPayload.timeIn?.trim() ||
      !fermentationPayload.method?.trim() ||
      !Array.isArray(fermentationPayload.lots) ||
      fermentationPayload.lots.length === 0
    ) {
      console.error(
        "Errore: Payload incompleto o malformato",
        fermentationPayload
      );
      alert("Errore: dati incompleti, controlla i campi del form.");
      return;
    }

    try {
      //POST /api/fermentation
      const response = await axios.post(
        "http://localhost:5000/api/fermentation",
        fermentationPayload
      );
      const fermentationData = response.data;
      console.log("Fermentazione creata:", fermentationData);

      //PATCH /api/patio
      try {
        const patchPayload = {
          lots: selectedLots.map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round(
              (lotVolumes[lot.id] / 100) * getDisplayVolume(lot)
            ),
          })),
        };

        const patchRes = await axios.patch(
          "http://localhost:5000/api/patio/update-lots-fermentation",
          patchPayload
        );

        console.log("PATCH ok:", patchRes.data);
      } catch (error) {
        console.error(
          "Errore PATCH:",
          error.response ? error.response.data : error.message
        );
      }

      alert("Fermentazione salvata e lotti aggiornati con successo!");
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error(
        "Errore POST /api/fermentation:",
        err.response ? err.response.data : err.message
      );
      alert("Errore durante il salvataggio.");
    }
  };

  const handleSubmitEnd = async (e) => {
    e.preventDefault();

    if (selectedLots.length === 0) {
      alert("Seleziona almeno un lotto per finire la fermentazione.");
      return;
    }

    // Primo PAYLOAD per /api/patio
    const patioPayload = {
      name: form.patio,
      volume: selectedLots[0].volume,
      type: selectedLots[0].type,
      date: form.date,
      status: "active",
      fermented: 1,
    };

    // Validazione del payload
    if (
      !patioPayload.name?.trim() ||
      typeof patioPayload.volume !== "number" ||
      isNaN(patioPayload.volume) ||
      !patioPayload.date?.trim() ||
      !patioPayload.type?.trim()
    ) {
      console.error("Errore: Payload incompleto o malformato", patioPayload);
      alert("Errore: dati incompleti, controlla i campi del form.");
      return;
    }

    try {
      // Primo POST /api/patio
      const response = await axios.post("http://localhost:5000/api/patio", [
        patioPayload,
      ]);
      const fermentationEndData = response.data;
      console.log("Fermentazione creata:", fermentationEndData);

      // Ottieni i patio_id creati (supporta array o singolo oggetto)
      const patioIds = fermentationEndData.patioRecords
        ? fermentationEndData.patioRecords.map((p) => p.id)
        : [];

      if (patioIds.length === 0) {
        throw new Error("Nessun patioId ottenuto dal server.");
      }
      console.log("Patio IDs:", patioIds);

      // Secondo PAYLOAD per /api/patio_prevnlot
      const patioPrevnlotPayload = [];

      for (const lot of selectedLots) {
        let prev_nLot_newlot = null;

        try {
          const res = await axios.get(
            `http://localhost:5000/api/trace/prev-nlot-newlot/${lot.fermentation_nLot}`
          );
          prev_nLot_newlot = res.data.prev_nLot_newlot;
        } catch (err) {
          console.warn(
            `prev_nLot_newlot non trovato per ${lot.fermentation_nLot}`,
            err
          );
        }

        patioIds.forEach((patioId) => {
          patioPrevnlotPayload.push({
            patio_id: patioId,
            prev_nLot_fermentation: lot.fermentation_nLot,
            prev_nLot_newlot: prev_nLot_newlot || null,
          });
        });
      }

      // Secondo POST /api/patio_prevnlot
      const secondResponse = await axios.post(
        "http://localhost:5000/api/patio_prevnlot_fermentation",
        patioPrevnlotPayload
      );

      console.log("Lotti aggiornati:", secondResponse.data);

      // Terzo PAYLOAD per PATCH /api/fermentation/update-lots
      const patchFermentationPayload = {
        lots: selectedLots.map((lot) => ({
          id: lot.id,
          dateOut: form.date,
          timeOut: form.timeOut,
          worked: 1,
        })),
      };

      // Terzo PATCH /api/fermentation/update-lots
      const patchRes = await axios.patch(
        "http://localhost:5000/api/fermentation/update-lots",
        patchFermentationPayload
      );

      console.log("PATCH ok:", patchRes.data);
      alert("Fermentazione salvata e lotti aggiornati con successo!");
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error(
        "Errore durante il salvataggio di PATCH:",
        err.response ? err.response.data : err.message
      );
      alert("Errore durante il salvataggio.");
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
      <h1>Fermentation</h1>
      <div className="button-container">
        <button
          type="button"
          className="action-button"
          onClick={() => setStep("start")}
        >
          Inizia Fermentazione
        </button>

        <button
          type="button"
          className="action-button"
          onClick={() => setStep("end")}
        >
          Finisci Fermentazione
        </button>
      </div>

      {step === "start" && (
        <>
          <h2>Seleziona Lotti dal Patio</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Data</th>
                <th>Volume</th>
                <th>Patio</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {patioLots.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selectedLots.find((l) => l.id === lot.id)}
                      onChange={() => handleSelectLot(lot)}
                    />
                  </td>
                  <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                  <td>{getDisplayVolume(lot)}</td>
                  <td>{lot.name}</td>
                  <td>{lot.type}</td>
                </tr>
              ))}

              {patioLots.length === 0 && (
                <tr>
                  <td style={{ textAlign: "center", color: "red" }}>
                    Nessun lotto disponibile
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="lot-ranges">
            {selectedLots.map((lot) => {
              const baseVol = getDisplayVolume(lot);
              const perc = lotVolumes[lot.id] || 0;
              const usedVol = Math.round((perc / 100) * baseVol);
              return (
                <div key={lot.id} className="lot-range-group">
                  <label>
                    <strong>
                      {lot.type} –{" "}
                      {new Date(lot.date).toLocaleDateString("it-IT")}
                    </strong>
                    <br />
                    Perc: {perc}% ({usedVol} L)
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={perc}
                      onChange={(e) =>
                        handleSliderChange(lot, parseInt(e.target.value))
                      }
                    />
                  </label>
                </div>
              );
            })}

            <div
              className="total-volume"
              style={{ color: "black", margin: "1rem 0" }}
            >
              <p>
                Volume totale selezionato:{" "}
                <strong>{calculateTotalPartialVolume()} L</strong>
              </p>
            </div>
          </div>

          <div>
            <label>
              Data Inizio:
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Ora Inizio:{" "}
              <input
                type="time"
                name="timeIn"
                value={form.timeIn}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeIn: e.target.value }))
                }
              required
              />
            </label>

            <label>
              Tipo Fermentazione:{" "}
              <select
                value={fermentationType}
                onChange={(e) => setFermentationType(e.target.value)}
                required
              >
                <option value="Barrel">Botti</option>
                <option value="Tank">Tank</option>
                <option value="Rotative">Rotativo</option>
                <option value="Bag">Big Bag</option>
              </select>{" "}
            </label>
          </div>

          <div className="button-container">
            <button className="action-button" onClick={handleSubmitStart}>
              Conferma
            </button>
            <button className="action-button" onClick={handleCancel}>
              Annulla
            </button>
          </div>
        </>
      )}

      {step === "end" && (
        <>
          <h2>Lotti Attualmente in Fermentazione</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Data</th>
                <th>Volume</th>
                <th>Metodo</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {activeFermentations.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selectedLots.find((l) => l.id === lot.id)}
                      onChange={() => handleSelectLot(lot)}
                    />
                  </td>
                  <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                  <td>{lot.volume}</td>
                  <td>{lot.method}</td>
                  <td>{lot.type}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <label>
              Data Fine:
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Ora Fine:{" "}
              <input
                type="time"
                name="timeOut"
                value={form.timeOut}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeOut: e.target.value }))
                }
                required
              />
            </label>

            <label>
              Patio:
              <select
                name="patio"
                value={form.patio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, patio: e.target.value }))
                }
                required
              >
                <option value="">Seleziona un patio</option>
                {patioOptions.map((patio) => (
                  <option key={patio.id} value={patio.name}>
                    {patio.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-container">
            <button className="action-button" onClick={handleSubmitEnd}>
              Conferma
            </button>
            <button className="action-button" onClick={handleCancel}>
              Annulla
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Fermentation;
