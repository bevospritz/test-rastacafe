import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Traceability.css";

// Helpers date
const toYMD = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
};
const today = toYMD(new Date());

const getMinDate = (lots, dateField = "date") => {
  if (!lots || lots.length === 0) return null;
  return lots.reduce((max, lot) => {
    const d = toYMD(lot[dateField]);
    return d && d > max ? d : max;
  }, "1900-01-01");
};

const validateDate = (date, minDate, label = "del passo precedente") => {
  if (!date) return "Seleziona una data.";
  if (date > today) return `La data non può essere nel futuro (oggi: ${new Date().toLocaleDateString("it-IT")}).`;
  if (minDate && date < minDate)
    return `La data non può essere precedente alla data ${label} (${new Date(minDate).toLocaleDateString("it-IT")}).`;
  return null;
};

// Componente input data riutilizzabile con feedback
const DateInput = ({ value, onChange, minDate, label }) => {
  const error = value ? validateDate(value, minDate) : null;
  return (
    <label>
      {label}:
      <input
        type="date"
        value={value}
        min={minDate || undefined}
        max={today}
        onChange={onChange}
        required
      />
      {error && (
        <span style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
          ⚠️ {error}
        </span>
      )}
      {minDate && !error && value && (
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
          Data minima: {new Date(minDate).toLocaleDateString("it-IT")}
        </span>
      )}
    </label>
  );
};

function Fermentation() {
  const [step, setStep] = useState(null);
  const [patioLots, setPatioLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [fermentationType, setFermentationType] = useState("Barrel");
  const [lotVolumes, setLotVolumes] = useState({});
  const [activeFermentations, setActiveFermentations] = useState([]);
  const [patioOptions, setPatioOptions] = useState([]);
  const [form, setForm] = useState({ patio: "", date: "", timeIn: "", timeOut: "" });

  const navigate = useNavigate();

  const fetchActiveFermentations = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/fermentation/active");
      setActiveFermentations(response.data);
    } catch (err) {
      console.error("Errore caricamento fermentazioni attive:", err);
    }
  };

  useEffect(() => {
    axios.get("http://localhost:5000/api/patio")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setPatioLots(data.filter((lot) => lot.status !== "finished"));
      })
      .catch(() => setPatioLots([]));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/elements")
      .then((res) => setPatioOptions(res.data.filter((e) => e.element === "Patio")))
      .catch((err) => console.error("Errore caricamento opzioni patio:", err));
  }, []);

  useEffect(() => { fetchActiveFermentations(); }, []);

  const getDisplayVolume = (lot) =>
    lot.status === "split" && lot.partial_volume != null ? lot.partial_volume : lot.volume;

  const checkCDMix = (lot, currentSelected) => {
    const hasCD = currentSelected.some((l) => l.type === "CD");
    const isCD = lot.type === "CD";
    const hasNonCD = currentSelected.some((l) => l.type !== "CD");
    if (isCD && hasNonCD)
      return window.confirm("Attenzione: stai aggiungendo un lotto CD a lotti di tipo diverso.\n\nSei sicuro di voler mescolare i tipi?");
    if (!isCD && hasCD)
      return window.confirm("Attenzione: stai aggiungendo un lotto " + lot.type + " a lotti di tipo CD.\n\nSei sicuro di voler mescolare i tipi?");
    return true;
  };

  const handleSelectLot = (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id);
    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => l.id !== lot.id));
      setLotVolumes((prev) => { const u = { ...prev }; delete u[lot.id]; return u; });
      return;
    }
    if (!checkCDMix(lot, selectedLots)) return;
    setSelectedLots((prev) => [...prev, lot]);
    setLotVolumes((prev) => ({ ...prev, [lot.id]: 100 }));
  };

  const handleSliderChange = (lot, value) => {
    setLotVolumes((prev) => ({ ...prev, [lot.id]: value }));
  };

  const calculateTotalPartialVolume = () =>
    selectedLots.reduce((sum, lot) => {
      const perc = lotVolumes[lot.id] || 0;
      return sum + Math.round((perc / 100) * getDisplayVolume(lot));
    }, 0);

  // minDate START — data più recente dei patio selezionati
  const minDateStart = getMinDate(selectedLots, "date");
  const dateErrorStart = form.date ? validateDate(form.date, minDateStart, "del patio selezionato") : null;

  // minDate END — data di inizio fermentazione più recente
  const minDateEnd = getMinDate(selectedLots, "date");
  const dateErrorEnd = form.date ? validateDate(form.date, minDateEnd, "di inizio fermentazione") : null;

  const resetStep = (newStep) => {
    setStep(newStep);
    setSelectedLots([]);
    setForm({ patio: "", date: "", timeIn: "", timeOut: "" });
  };

  const handleSubmitStart = async (e) => {
    e.preventDefault();
    if (selectedLots.length === 0) { alert("Seleziona almeno un lotto."); return; }
    const error = validateDate(form.date, minDateStart, "del patio selezionato");
    if (error) { alert(error); return; }

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

    try {
      await axios.post("http://localhost:5000/api/fermentation", fermentationPayload);
      await axios.patch("http://localhost:5000/api/patio/update-lots-fermentation", {
        lots: selectedLots.map((lot) => ({
          id: lot.id,
          volumeUsed: Math.round((lotVolumes[lot.id] / 100) * getDisplayVolume(lot)),
        })),
      });
      alert("Fermentazione salvata con successo!");
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err.response ? err.response.data : err.message);
      alert("Errore durante il salvataggio.");
    }
  };

  const handleSubmitEnd = async (e) => {
    e.preventDefault();
    if (selectedLots.length === 0) { alert("Seleziona almeno un lotto."); return; }
    const error = validateDate(form.date, minDateEnd, "di inizio fermentazione");
    if (error) { alert(error); return; }

    const patioPayload = {
      name: form.patio,
      volume: selectedLots[0].volume,
      type: selectedLots[0].type,
      date: form.date,
      status: "active",
      fermented: 1,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/patio", [patioPayload]);
      const patioIds = response.data.patioRecords?.map((p) => p.id) || [];
      if (patioIds.length === 0) throw new Error("Nessun patioId ottenuto.");

      const patioPrevnlotPayload = [];
      for (const lot of selectedLots) {
        let prev_nLot_newlot = null;
        try {
          const res = await axios.get(`http://localhost:5000/api/trace/prev-nlot-newlot/${lot.fermentation_nLot}`);
          prev_nLot_newlot = res.data.prev_nLot_newlot;
        } catch (err) {
          console.warn(`prev_nLot_newlot non trovato per ${lot.fermentation_nLot}`, err);
        }
        patioIds.forEach((patioId) => {
          patioPrevnlotPayload.push({
            patio_id: patioId,
            prev_nLot_fermentation: lot.fermentation_nLot,
            prev_nLot_newlot: prev_nLot_newlot || null,
          });
        });
      }

      await axios.post("http://localhost:5000/api/patio_prevnlot_fermentation", patioPrevnlotPayload);
      await axios.patch("http://localhost:5000/api/fermentation/update-lots", {
        lots: selectedLots.map((lot) => ({
          id: lot.id, dateOut: form.date, timeOut: form.timeOut, worked: 1,
        })),
      });

      alert("Fermentazione chiusa con successo!");
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err.response ? err.response.data : err.message);
      alert("Errore durante il salvataggio.");
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
      <h2>Fermentation</h2>

      <div className="button-container">
        <button type="button" className="action-button" onClick={() => resetStep("start")}>
          Inizia Fermentazione
        </button>
        <button type="button" className="action-button" onClick={() => resetStep("end")}>
          Finisci Fermentazione
        </button>
      </div>

      {step === "start" && (
        <>
          <h3>Seleziona Lotti dal Patio</h3>
          <table>
            <thead>
              <tr><th></th><th>Data</th><th>Volume</th><th>Patio</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              {patioLots.map((lot) => (
                <tr key={lot.id}>
                  <td><input type="checkbox" checked={!!selectedLots.find((l) => l.id === lot.id)} onChange={() => handleSelectLot(lot)} /></td>
                  <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                  <td>{getDisplayVolume(lot).toLocaleString("it-IT")}</td>
                  <td>{lot.name}</td>
                  <td>{lot.type}</td>
                </tr>
              ))}
              {patioLots.length === 0 && (
                <tr><td colSpan={5} className="empty-state">Nessun lotto disponibile</td></tr>
              )}
            </tbody>
          </table>

          {selectedLots.length > 0 && (
            <div className="lot-ranges">
              {selectedLots.map((lot) => {
                const baseVol = getDisplayVolume(lot);
                const perc = lotVolumes[lot.id] || 0;
                const usedVol = Math.round((perc / 100) * baseVol);
                return (
                  <div key={lot.id} className="lot-range-group">
                    <label>
                      <strong>{lot.type} – {new Date(lot.date).toLocaleDateString("it-IT")}</strong><br />
                      Perc: {perc}% ({usedVol.toLocaleString("it-IT")} L)
                      <input type="range" min="0" max="100" value={perc}
                        onChange={(e) => handleSliderChange(lot, parseInt(e.target.value))} />
                    </label>
                  </div>
                );
              })}
              <div className="total-volume-box">
                Volume totale: <strong>{calculateTotalPartialVolume().toLocaleString("it-IT")} L</strong>
              </div>
            </div>
          )}

          <DateInput
            label="Data Inizio"
            value={form.date}
            minDate={minDateStart}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />

          <label>
            Ora Inizio:
            <input type="time" value={form.timeIn}
              onChange={(e) => setForm((prev) => ({ ...prev, timeIn: e.target.value }))} required />
          </label>

          <label>
            Tipo Fermentazione:
            <select value={fermentationType} onChange={(e) => setFermentationType(e.target.value)} required>
              <option value="Barrel">Botti</option>
              <option value="Tank">Tank</option>
              <option value="Rotative">Rotativo</option>
              <option value="Bag">Big Bag</option>
            </select>
          </label>

          <div className="button-container">
            <button className="action-button" onClick={handleSubmitStart}
              disabled={!!dateErrorStart || !form.date || !form.timeIn || selectedLots.length === 0}>
              Conferma
            </button>
            <button className="action-button cancel" onClick={handleCancel}>Annulla</button>
          </div>
        </>
      )}

      {step === "end" && (
        <>
          <h3>Lotti in Fermentazione</h3>
          <table>
            <thead>
              <tr><th></th><th>Data</th><th>Volume</th><th>Metodo</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              {activeFermentations.map((lot) => (
                <tr key={lot.id}>
                  <td><input type="checkbox" checked={!!selectedLots.find((l) => l.id === lot.id)} onChange={() => handleSelectLot(lot)} /></td>
                  <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                  <td>{lot.volume.toLocaleString("it-IT")}</td>
                  <td>{lot.method}</td>
                  <td>{lot.type}</td>
                </tr>
              ))}
              {activeFermentations.length === 0 && (
                <tr><td colSpan={5} className="empty-state">Nessuna fermentazione attiva</td></tr>
              )}
            </tbody>
          </table>

          <DateInput
            label="Data Fine"
            value={form.date}
            minDate={minDateEnd}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />

          <label>
            Ora Fine:
            <input type="time" value={form.timeOut}
              onChange={(e) => setForm((prev) => ({ ...prev, timeOut: e.target.value }))} required />
          </label>

          <label>
            Patio:
            <select value={form.patio}
              onChange={(e) => setForm((prev) => ({ ...prev, patio: e.target.value }))} required>
              <option value="">Seleziona un patio</option>
              {patioOptions.map((patio) => (
                <option key={patio.id} value={patio.name}>{patio.name}</option>
              ))}
            </select>
          </label>

          <div className="button-container">
            <button className="action-button" onClick={handleSubmitEnd}
              disabled={!!dateErrorEnd || !form.date || !form.timeOut || !form.patio || selectedLots.length === 0}>
              Conferma
            </button>
            <button className="action-button cancel" onClick={handleCancel}>Annulla</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Fermentation;