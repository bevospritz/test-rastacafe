import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Traceability.css";

const Resting = () => {
  const [selectedLots, setSelectedLots] = useState([]);
  const [dryerLots, setDryerLots] = useState([]);
  const [patioLots, setPatioLots] = useState([]);
  const [tulhas, setTulhas] = useState([]);
  const [lotVolumes, setLotVolumes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    tulha: "",
    dateIn: "",
    timeIn: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/patio")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        const filtered = data
          .filter((lot) => (lot.status || "").toLowerCase().trim() !== "finished")
          .map((lot) => ({ ...lot, source: "patio" }));
        setPatioLots(filtered);
      })
      .catch((err) => {
        console.error("Errore caricamento patio:", err);
        setPatioLots([]);
      });

    axios
      .get("http://localhost:5000/api/dryer")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        const filtered = data
          .filter((lot) => (lot.status || "").toLowerCase().trim() !== "finished")
          .map((lot) => ({ ...lot, source: "dryer" }));
        setDryerLots(filtered);
      })
      .catch((err) => console.error("Errore caricamento dryers:", err));
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/elements")
      .then((res) => {
        const onlyTulhas = res.data.filter((el) => el.element === "Tulha");
        setTulhas(onlyTulhas);
      })
      .catch((err) => console.error("Errore caricamento tulhas:", err));
  }, []);

  const getDisplayVolume = (lot) => {
    return lot.status === "split" && lot.partial_volume != null
      ? lot.partial_volume
      : lot.volume;
  };

  const checkCDMix = (lot, currentSelected) => {
    const hasCD = currentSelected.some((l) => l.type === "CD");
    const isCD = lot.type === "CD";
    const hasNonCD = currentSelected.some((l) => l.type !== "CD");

    if (isCD && hasNonCD) {
      return window.confirm(
        "Attenzione: stai cercando di aggiungere un lotto CD a lotti di tipo diverso (Dry/Green/Natural).\n\nSei sicuro di voler mescolare i tipi?"
      );
    }
    if (!isCD && hasCD) {
      return window.confirm(
        "Attenzione: stai cercando di aggiungere un lotto " + lot.type + " a lotti di tipo CD.\n\nSei sicuro di voler mescolare i tipi?"
      );
    }
    return true;
  };

  const handleSelectPatioLot = (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id && l.source === "patio");

    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => !(l.id === lot.id && l.source === "patio")));
      setLotVolumes((prev) => {
        const updated = { ...prev };
        delete updated[`patio-${lot.id}`];
        return updated;
      });
      return;
    }

    if (!checkCDMix(lot, selectedLots)) return;

    setSelectedLots((prev) => [...prev, { ...lot, source: "patio", patio_nLot: lot.patio_nLot, dryer_nLot: null }]);
    setLotVolumes((prev) => ({ ...prev, [`patio-${lot.id}`]: 100 }));
  };

  const handleSelectDryerLot = (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id && l.source === "dryer");

    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => !(l.id === lot.id && l.source === "dryer")));
      setLotVolumes((prev) => {
        const updated = { ...prev };
        delete updated[`dryer-${lot.id}`];
        return updated;
      });
      return;
    }

    if (!checkCDMix(lot, selectedLots)) return;

    setSelectedLots((prev) => [...prev, { ...lot, source: "dryer", dryer_nLot: lot.dryer_nLot, patio_nLot: null }]);
    setLotVolumes((prev) => ({ ...prev, [`dryer-${lot.id}`]: 100 }));
  };

  const handleSliderChange = (lot, value) => {
    setLotVolumes((prev) => ({ ...prev, [`${lot.source}-${lot.id}`]: value }));
  };

  const calculateTotalPartialVolume = () => {
    return selectedLots.reduce((sum, lot) => {
      const key = `${lot.source}-${lot.id}`;
      const perc = lotVolumes[key] || 0;
      const baseVol = getDisplayVolume(lot);
      return sum + Math.round((perc / 100) * baseVol);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (selectedLots.length === 0) {
        alert("Nessun lotto selezionato");
        return;
      }

      const restPayload = {
        tulha: form.tulha,
        volume: calculateTotalPartialVolume(),
        dateIn: form.dateIn,
        timeIn: form.timeIn,
        lots: selectedLots.map((lot) => ({
          prev_nLot_dryer: lot.source === "dryer" ? lot.dryer_nLot || null : null,
          prev_nLot_patio: lot.source === "patio" ? lot.patio_nLot : null,
        })),
      };

      const dryerPatchPayload = {
        lots: selectedLots
          .filter((lot) => lot.source === "dryer")
          .map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round((lotVolumes[`dryer-${lot.id}`] / 100) * getDisplayVolume(lot)),
          })),
      };

      const patioPatchPayload = {
        lots: selectedLots
          .filter((lot) => lot.source === "patio")
          .map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round((lotVolumes[`patio-${lot.id}`] / 100) * getDisplayVolume(lot)),
          })),
      };

      const restRes = await axios.post("http://localhost:5000/api/rest", restPayload);
      console.log("Payload inviato a /api/rest:", restRes.data);

      const patches = [];
      if (dryerPatchPayload.lots.length > 0)
        patches.push(axios.patch("http://localhost:5000/api/rest/update-lots", dryerPatchPayload));
      if (patioPatchPayload.lots.length > 0)
        patches.push(axios.patch("http://localhost:5000/api/patio/update-lots", patioPatchPayload));

      await Promise.all(patches);

      alert("Rest salvato correttamente");
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("💀 ERRORE TRANSAZIONE REST:", err);
      alert("Errore durante il salvataggio. Operazione annullata.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
      <h2>Resting</h2>
      <form onSubmit={handleSubmit}>

        <h3>Patio</h3>
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
                    checked={!!selectedLots.find((l) => l.id === lot.id && l.source === "patio")}
                    onChange={() => handleSelectPatioLot(lot)}
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
                <td colSpan={5} className="empty-state">Nessun lotto disponibile</td>
              </tr>
            )}
          </tbody>
        </table>

        <h3>Dryer</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Data</th>
              <th>Volume</th>
              <th>Dryer</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {dryerLots.map((lot) => (
              <tr key={lot.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!selectedLots.find((l) => l.id === lot.id && l.source === "dryer")}
                    onChange={() => handleSelectDryerLot(lot)}
                  />
                </td>
                <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                <td>{getDisplayVolume(lot).toLocaleString("it-IT")}</td>
                <td>{lot.name}</td>
                <td>{lot.type}</td>
              </tr>
            ))}
            {dryerLots.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">Nessun lotto disponibile</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Sliders lotti selezionati */}
        {selectedLots.length > 0 && (
          <div className="lot-ranges">
            {selectedLots.map((lot) => {
              const baseVol = getDisplayVolume(lot);
              const key = `${lot.source}-${lot.id}`;
              const perc = lotVolumes[key] || 0;
              const usedVol = Math.round((perc / 100) * baseVol);

              return (
                <div key={key} className="lot-range-group">
                  <label>
                    <strong>{lot.type} – {new Date(lot.date).toLocaleDateString("it-IT")}</strong>
                    <br />
                    Perc: {perc}% ({usedVol.toLocaleString("it-IT")} L)
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={perc}
                      onChange={(e) => handleSliderChange(lot, parseInt(e.target.value))}
                    />
                  </label>
                </div>
              );
            })}

            <div className="total-volume-box">
              Volume totale selezionato:{" "}
              <strong>{calculateTotalPartialVolume().toLocaleString("it-IT")} L</strong>
            </div>
          </div>
        )}

        <label>
          Tulha:
          <select
            name="tulha"
            value={form.tulha}
            onChange={(e) => setForm((prev) => ({ ...prev, tulha: e.target.value }))}
            required
          >
            <option value="">Seleziona</option>
            {tulhas.map((d, i) => (
              <option key={i} value={d.name}>{d.name}</option>
            ))}
          </select>
        </label>

        <label>
          Data:
          <input
            type="date"
            name="dateIn"
            value={form.dateIn}
            onChange={(e) => setForm((prev) => ({ ...prev, dateIn: e.target.value }))}
            required
          />
        </label>

        <label>
          Ora:
          <input
            type="time"
            name="timeIn"
            value={form.timeIn}
            onChange={(e) => setForm((prev) => ({ ...prev, timeIn: e.target.value }))}
            required
          />
        </label>

        <div className="button-container">
          <button
            type="submit"
            className="action-button"
            disabled={!form.tulha || !form.dateIn || !form.timeIn || selectedLots.length === 0}
          >
            {isSubmitting ? "Salvataggio..." : "Conferma"}
          </button>
          <button type="button" className="action-button cancel" onClick={handleCancel}>
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
};

export default Resting;