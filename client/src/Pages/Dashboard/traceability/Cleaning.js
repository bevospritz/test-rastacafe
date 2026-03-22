import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Traceability.css";

const Cleaning = () => {
  const [tulhas, setTulhas] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [selectedTulhas, setSelectedTulhas] = useState([]);
  const [tulhaVolumes, setTulhaVolumes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    weight: "",
    bigBag: "",
    umidity: "",
    cata: "",
    deposit: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/restforcleaning")
      .then((res) => setTulhas(res.data || []))
      .catch((err) => {
        console.error("Errore caricamento tulhas:", err);
        setTulhas([]);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/deposits")
      .then((res) => setDeposits(res.data || []))
      .catch((err) => {
        console.error("Errore caricamento deposits:", err);
        setDeposits([]);
      });
  }, []);

  const toggleTulha = (tulha) => {
    const key = tulha.tulha;
    const isSelected = !!selectedTulhas.find((t) => t.tulha === key);

    if (isSelected) {
      setSelectedTulhas((prev) => prev.filter((t) => t.tulha !== key));
      setTulhaVolumes((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      setSelectedTulhas((prev) => [...prev, tulha]);
      setTulhaVolumes((prev) => ({ ...prev, [key]: 100 }));
    }
  };

  const handleSliderChange = (key, value) => {
    setTulhaVolumes((prev) => ({ ...prev, [key]: value }));
  };

  const getUsedVolume = (tulha) => {
    const perc = tulhaVolumes[tulha.tulha] || 0;
    return Math.round((perc / 100) * tulha.totalVolume);
  };

  const totalVolume = selectedTulhas.reduce(
    (sum, t) => sum + getUsedVolume(t),
    0,
  );

  const generateNLot = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cleaning/last-nlot");
      const last = res.data.cleaning_nLot || "C00000";
      const nextNum = parseInt(last.substring(1)) + 1;
      return "C" + nextNum.toString().padStart(5, "0");
    } catch {
      return "C00001";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedTulhas.length === 0) {
      alert("Seleziona almeno una tulha");
      return;
    }

    setIsSubmitting(true);

    try {
      const nLot = await generateNLot();

      const lots = selectedTulhas.map((t) => ({
        tulha: t.tulha,
        volumeUsed: getUsedVolume(t),
        rest_ids: t.lots.map((l) => l.rest_id),
      }));

      const cleaningPayload = {
        date: form.date,
        volume: totalVolume,
        weight: parseInt(form.weight),
        bigBag: parseInt(form.bigBag),
        umidity: form.umidity ? parseFloat(form.umidity) : null,
        cata: form.cata ? parseInt(form.cata) : null,
        deposit: form.deposit || null,
        cleaning_nLot: nLot,
        lots,
      };

      await axios.post("http://localhost:5000/api/cleaning", cleaningPayload);
      alert(`Cleaning registrato con successo! Lotto: ${nLot}`);
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore durante il cleaning:", err);
      alert("Errore durante il salvataggio. Operazione annullata.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  const isFormValid =
    form.date && form.weight && form.bigBag && selectedTulhas.length > 0;

  return (
    <div className="form-container">
      <h2>Cleaning</h2>
      <form onSubmit={handleSubmit}>

        <h3>Seleziona Tulhe</h3>

        {tulhas.length === 0 ? (
          <p className="empty-state">Nessuna tulha disponibile per il cleaning</p>
        ) : (
          <div className="tulha-grid">
            {tulhas.map((tulha) => {
              const isSelected = !!selectedTulhas.find((t) => t.tulha === tulha.tulha);

              const sortedLots = [...(tulha.lots || [])].sort((a, b) => {
                if (!a.dateIn) return 1;
                if (!b.dateIn) return -1;
                return new Date(a.dateIn) - new Date(b.dateIn);
              });

              return (
                <div
                  key={tulha.tulha}
                  className={`tulha-card ${isSelected ? "selected" : ""}`}
                >
                  <div className="tulha-card-header" onClick={() => toggleTulha(tulha)}>
                    <input type="checkbox" checked={isSelected} onChange={() => {}} />
                    <div>
                      <div className="tulha-card-title">Tulha {tulha.tulha}</div>
                      <div className="tulha-card-volume">
                        {tulha.totalVolume.toLocaleString("it-IT")} L totali
                        {" · "}
                        {tulha.lots.length} lott{tulha.lots.length > 1 ? "i" : "o"}
                      </div>
                    </div>
                  </div>

                  <hr className="card-divider" />

                  <div className="sublot-list">
                    {sortedLots.map((lot, i) => (
                      <div key={i} className={`sublot-row ${i === 0 ? "fifo-first" : ""}`}>
                        <span className="sublot-date">
                          {lot.dateIn ? new Date(lot.dateIn).toLocaleDateString("it-IT") : "-"}
                        </span>
                        <span className="sublot-type">{lot.type || "-"}</span>
                        <span className="sublot-volume">
                          {lot.volume.toLocaleString("it-IT")} L
                        </span>
                        <span className="sublot-nlot">{lot.rest_nLot}</span>
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="slider-container">
                      <div className="slider-label">
                        <strong>Volume al cleaning:</strong>{" "}
                        {tulhaVolumes[tulha.tulha]}%{" "}
                        <span className="slider-value">
                          ({getUsedVolume(tulha).toLocaleString("it-IT")} L su{" "}
                          {tulha.totalVolume.toLocaleString("it-IT")} L)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tulhaVolumes[tulha.tulha] || 0}
                        onChange={(e) =>
                          handleSliderChange(tulha.tulha, parseInt(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedTulhas.length > 0 && (
          <div className="total-volume-box">
            Volume totale al cleaning:{" "}
            <strong>{totalVolume.toLocaleString("it-IT")} L</strong>
            {" · "}
            <span className="total-volume-muted">
              {selectedTulhas.length} tulha{selectedTulhas.length > 1 ? "s" : ""} selezionata{selectedTulhas.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        <h3>Dati Cleaning</h3>

        <label>
          Data:
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            required
          />
        </label>

        <label>
          Peso pulito (kg):
          <input
            type="number"
            min="0"
            value={form.weight}
            onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
            placeholder="es. 3600"
            required
          />
        </label>

        <label>
          N° Big Bags (60kg):
          <input
            type="number"
            min="0"
            value={form.bigBag}
            onChange={(e) => setForm((prev) => ({ ...prev, bigBag: e.target.value }))}
            placeholder="es. 60"
            required
          />
        </label>

        <label>
          Umidità (%):
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.umidity}
            onChange={(e) => setForm((prev) => ({ ...prev, umidity: e.target.value }))}
            placeholder="es. 11.5"
          />
        </label>

        <label>
          Difetti / Cata (%):
          <input
            type="number"
            min="0"
            max="100"
            value={form.cata}
            onChange={(e) => setForm((prev) => ({ ...prev, cata: e.target.value }))}
            placeholder="es. 5"
          />
        </label>

        <label>
          Deposito di destinazione:
          <select
            value={form.deposit}
            onChange={(e) => setForm((prev) => ({ ...prev, deposit: e.target.value }))}
          >
            <option value="">— Nessun deposito (vendita diretta) —</option>
            {deposits.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </label>

        <div className="button-container">
          <button
            type="submit"
            className="action-button"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Salvataggio..." : "Conferma"}
          </button>
          <button
            type="button"
            className="action-button cancel"
            onClick={handleCancel}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
};

export default Cleaning;