import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Traceability.css";

const toYMD = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
};
const today = toYMD(new Date());

const Drying = () => {
  const [patioLots, setPatioLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [lotVolumes, setLotVolumes] = useState({});
  const [dryers, setDryers] = useState([]);
  const [form, setForm] = useState({
    dryer: "",
    date: "",
    timeIn: "",
  });

  const minDate =
    selectedLots.length > 0
      ? selectedLots.reduce((max, lot) => {
          const d = toYMD(lot.date);
          return d > max ? d : max;
        }, "1900-01-01")
      : null;

  const validateDate = (date) => {
    if (!date) return "Seleziona una data.";
    if (date > today) return `La data non può essere nel futuro.`;
    if (minDate && date < minDate)
      return `La data non può essere precedente al patio più recente (${new Date(minDate).toLocaleDateString("it-IT")}).`;
    return null;
  };

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/patio")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
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

  const getDisplayVolume = (lot) => {
    return lot.status === "split" && lot.partial_volume != null
      ? lot.partial_volume
      : lot.volume;
  };

  // Logica CD centralizzata con confirm (uguale a Resting)
  const checkCDMix = (lot, currentSelected) => {
    const hasCD = currentSelected.some((l) => l.type === "CD");
    const isCD = lot.type === "CD";
    const hasNonCD = currentSelected.some((l) => l.type !== "CD");

    if (isCD && hasNonCD) {
      return window.confirm(
        "Attenzione: stai cercando di aggiungere un lotto CD a lotti di tipo diverso (Dry/Green/Natural).\n\nSei sicuro di voler mescolare i tipi?",
      );
    }
    if (!isCD && hasCD) {
      return window.confirm(
        "Attenzione: stai cercando di aggiungere un lotto " +
          lot.type +
          " a lotti di tipo CD.\n\nSei sicuro di voler mescolare i tipi?",
      );
    }
    return true;
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

    if (!checkCDMix(lot, selectedLots)) return;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateDate(form.date);
    if (error) {
      alert(error);
      return;
    }

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

    if (
      !dryerPayload.dryer ||
      typeof dryerPayload.volume !== "number" ||
      !dryerPayload.date ||
      !dryerPayload.timeIn ||
      !Array.isArray(dryerPayload.lots) ||
      dryerPayload.lots.length === 0
    ) {
      alert("Errore: dati incompleti, controlla i campi del form.");
      return;
    }

    try {
      const postRes = await axios.post(
        "http://localhost:5000/api/dryer",
        dryerPayload,
      );
      console.log("POST /api/dryer ok:", postRes.data);

      const patchPayload = {
        lots: selectedLots.map((lot) => ({
          id: lot.id,
          volumeUsed: Math.round(
            (lotVolumes[lot.id] / 100) * getDisplayVolume(lot),
          ),
        })),
      };

      await axios.patch(
        "http://localhost:5000/api/patio/update-lots",
        patchPayload,
      );

      alert("Dryer salvato e lotti aggiornati con successo!");
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err.response ? err.response.data : err.message);
      alert("Errore durante il salvataggio.");
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
      <h2>Drying</h2>
      <form onSubmit={handleSubmit}>
        <h3>Seleziona lotti dal Patio</h3>
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
                <td>{getDisplayVolume(lot).toLocaleString("it-IT")}</td>
                <td>{lot.name}</td>
                <td>{lot.type}</td>
              </tr>
            ))}
            {patioLots.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Nessun lotto disponibile
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Sliders lotti selezionati */}
        {selectedLots.length > 0 && (
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
                    Perc: {perc}% ({usedVol.toLocaleString("it-IT")} L)
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

            <div className="total-volume-box">
              Volume totale selezionato:{" "}
              <strong>
                {calculateTotalPartialVolume().toLocaleString("it-IT")} L
              </strong>
            </div>
          </div>
        )}

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
            min={minDate || undefined}
            max={today}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, date: e.target.value }))
            }
            required
          />
          {form.date && validateDate(form.date) && (
            <span
              style={{
                color: "var(--color-danger)",
                fontSize: "0.82rem",
                display: "block",
              }}
            >
              ⚠️ {validateDate(form.date)}
            </span>
          )}
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
            className="action-button cancel"
            onClick={handleCancel}
            disabled={!form.dryer || !form.date || !form.timeIn || selectedLots.length === 0 || !!validateDate(form.date)}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
};

export default Drying;
