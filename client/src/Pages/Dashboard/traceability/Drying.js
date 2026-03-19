import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Traceability.css";

const Drying = () => {
  const [patioLots, setPatioLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [lotVolumes, setLotVolumes] = useState({}); // percentage per lot
  const [dryers, setDryers] = useState([]);
  const [form, setForm] = useState({
    dryer: "",
    date: "",
    timeIn: "",
  });
  const navigate = useNavigate();

  // Load patio lots and dryers
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/patio")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        // filter out finished, keep active and split
        const filtered = data.filter((lot) => lot.status !== "finished");
        setPatioLots(filtered);
      })
      .catch((err) => {
        console.error("Errore caricamento patio:", err);
        setPatioLots([]);
      });

    axios
      .get("http://localhost:5000/api/elements")
      .then((res) => {
        const onlyDryers = res.data.filter((el) => el.element === "Dryer");
        setDryers(onlyDryers);
      })
      .catch((err) => console.error("Errore caricamento dryers:", err));
  }, []);

  // Helper: get display volume based on status
  const getDisplayVolume = (lot) => {
    return lot.status === "split" && lot.partial_volume != null
      ? lot.partial_volume
      : lot.volume;
  };

  // Toggle selection
  const handleSelectLot = (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id);

    // Se sto deselezionando, tutto normale
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

  // Slider change only updates local state
  const handleSliderChange = (lot, value) => {
    setLotVolumes((prev) => ({ ...prev, [lot.id]: value }));
  };

  // Calculate total partial volume for submit
  const calculateTotalPartialVolume = () => {
    return selectedLots.reduce((sum, lot) => {
      const perc = lotVolumes[lot.id] || 0;
      const baseVol = getDisplayVolume(lot);
      return sum + Math.round((perc / 100) * baseVol);
    }, 0);
  };

  // Submit handler: POST dryer, then PATCH each lot
  const handleSubmit = async (e) => {
    e.preventDefault();

    // PAYLOAD per POST /api/dryer
    const dryerPayload = {
      dryer: form.dryer,
      volume: calculateTotalPartialVolume(),
      date: form.date,
      timeIn: form.timeIn,
      lots: selectedLots.map((lot) => ({
        prev_nLot_patio: lot.patio_nLot,
        volume: Math.round((lotVolumes[lot.id] / 100) * getDisplayVolume(lot)),
      })),
    };

    console.log("Payload inviato a /api/dryer:", dryerPayload);

    // VALIDAZIONE VELOCE (anti 500)
    if (
      !dryerPayload.dryer ||
      typeof dryerPayload.volume !== "number" ||
      !dryerPayload.date ||
      !dryerPayload.timeIn ||
      !Array.isArray(dryerPayload.lots) ||
      dryerPayload.lots.length === 0
    ) {
      console.error("Errore: Payload incompleto o malformato", dryerPayload);
      alert("Errore: dati incompleti, controlla i campi del form.");
      return;
    }

    try {
      // POST dryer
      const postRes = await axios.post(
        "http://localhost:5000/api/dryer",
        dryerPayload
      );
      console.log("POST /api/dryer ok:", postRes.data);
      console.log("Richiesta POST ricevuta su /api/dryer");

      // PATCH patio
      try {
        const patchPayload = {
          lots: selectedLots.map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round(
              (lotVolumes[lot.id] / 100) * getDisplayVolume(lot)
            ),
          })),
        };

        console.log("Payload inviato a /api/patio/update-lots:", patchPayload);

        const patchRes = await axios.patch(
          "http://localhost:5000/api/patio/update-lots",
          patchPayload
        );

        console.log("PATCH ok:", patchRes.data);
      } catch (error) {
        console.error(
          "Errore PATCH:",
          error.response ? error.response.data : error.message
        );
      }

      alert("Dryer salvato e lotti aggiornati con successo!");
    } catch (err) {
      console.error(
        "Errore POST /api/dryer:",
        err.response ? err.response.data : err.message
      );
      alert("Errore durante il salvataggio.");
    }

    navigate("/dashboard/traceability/manage-lot");
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
      <h1>Drying</h1>
      <form onSubmit={handleSubmit}>
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

        <label>
          Dryer:
          <select
            name="dryer"
            value={form.dryer}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dryer: e.target.value }))
            }
            required
          >
            <option value="">Seleziona</option>
            {dryers.map((d, i) => (
              <option key={i} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Data:
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
          Ora:
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

        <div className="button-container">
          <button
            type="submit"
            className="action-button"
            disabled={
              !form.dryer ||
              !form.date ||
              !form.timeIn ||
              selectedLots.length === 0
            }
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
    </div>
  );
};

export default Drying;
