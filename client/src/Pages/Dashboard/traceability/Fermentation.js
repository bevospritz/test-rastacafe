import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../../LanguageContext";
import { useOffline } from "../../../OfflineContext";
import useOfflineRequest from "../../../hooks/useOfflineRequest";
import { isNLotPending } from "../../../db/offlineDB";
import PendingBanner from "../../../components/PendingBanner";
import BackButton from "../../../components/BackButton";
import "../Traceability.css";

const BASE_URL = "http://localhost:5000";

const toYMD = (d) => { if (!d) return null; return new Date(d).toISOString().split("T")[0]; };
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

const DateInput = ({ value, onChange, minDate, label }) => {
  const error = value ? validateDate(value, minDate) : null;
  return (
    <label>
      {label}:
      <input type="date" value={value} min={minDate || undefined} max={today} onChange={onChange} required />
      {error && <span style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>⚠️ {error}</span>}
      {minDate && !error && value && (
        <span style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
          Data minima: {new Date(minDate).toLocaleDateString("it-IT")}
        </span>
      )}
    </label>
  );
};

function Fermentation() {
  const { t } = useLang();
  const { isOnline } = useOffline();
  const { get, post, patch } = useOfflineRequest();
  const [step, setStep] = useState(null);
  const [patioLots, setPatioLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [fermentationType, setFermentationType] = useState("Barrel");
  const [lotVolumes, setLotVolumes] = useState({});
  const [activeFermentations, setActiveFermentations] = useState([]);
  const [patioOptions, setPatioOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ patio: "", date: "", timeIn: "", timeOut: "" });

  const navigate = useNavigate();

  const fetchActiveFermentations = async () => {
    try {
      const data = await get(`${BASE_URL}/api/fermentation/active`);
      setActiveFermentations(data);
    } catch (err) {
      console.error("Errore caricamento fermentazioni attive:", err);
    }
  };

  useEffect(() => {
    get(`${BASE_URL}/api/patio`)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data;
        setPatioLots((arr || []).filter((lot) => lot.status !== "finished"));
      })
      .catch(() => setPatioLots([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    get(`${BASE_URL}/api/elements`)
      .then((data) => setPatioOptions((data || []).filter((e) => e.element === "Patio")))
      .catch((err) => console.error("Errore caricamento opzioni patio:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchActiveFermentations(); }, []); // eslint-disable-line

  const getDisplayVolume = (lot) =>
    lot.status === "split" && lot.partial_volume != null ? lot.partial_volume : lot.volume;

  const checkCDMix = (lot, currentSelected) => {
    const hasCD = currentSelected.some((l) => l.type === "CD");
    const isCD = lot.type === "CD";
    const hasNonCD = currentSelected.some((l) => l.type !== "CD");
    if (isCD && hasNonCD) return window.confirm(t("cdMixWarning"));
    if (!isCD && hasCD) return window.confirm(`${t("mixWarning")} ${lot.type}?`);
    return true;
  };

  const handleSelectLot = async (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id);
    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => l.id !== lot.id));
      setLotVolumes((prev) => { const u = { ...prev }; delete u[lot.id]; return u; });
      return;
    }
    // Controlla se il lotto patio è pending
    const pending = await isNLotPending(lot.patio_nLot);
    if (pending) { alert(t("lotPending")); return; }
    if (!checkCDMix(lot, selectedLots)) return;
    setSelectedLots((prev) => [...prev, lot]);
    setLotVolumes((prev) => ({ ...prev, [lot.id]: 100 }));
  };

  const handleSliderChange = (lot, value) =>
    setLotVolumes((prev) => ({ ...prev, [lot.id]: value }));

  const calculateTotalPartialVolume = () =>
    selectedLots.reduce((sum, lot) => {
      const perc = lotVolumes[lot.id] || 0;
      return sum + Math.round((perc / 100) * getDisplayVolume(lot));
    }, 0);

  const minDateStart = getMinDate(selectedLots, "date");
  const dateErrorStart = form.date ? validateDate(form.date, minDateStart, "del patio selezionato") : null;
  const minDateEnd = getMinDate(selectedLots, "date");
  const dateErrorEnd = form.date ? validateDate(form.date, minDateEnd, "di inizio fermentazione") : null;

  const resetStep = (newStep) => {
    setStep(newStep);
    setSelectedLots([]);
    setForm({ patio: "", date: "", timeIn: "", timeOut: "" });
  };

  const handleSubmitStart = async (e) => {
    e.preventDefault();
    if (selectedLots.length === 0) { alert(t("selectAtLeastOne")); return; }
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

    setIsSubmitting(true);
    try {
      const res = await post(`${BASE_URL}/api/fermentation`, fermentationPayload);
      if (!res.offline) {
        await patch(`${BASE_URL}/api/patio/update-lots-fermentation`, {
          lots: selectedLots.map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round((lotVolumes[lot.id] / 100) * getDisplayVolume(lot)),
          })),
        });
      }
      alert(res.offline ? t("savedOffline") : t("fermentationStarted"));
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err.response ? err.response.data : err.message);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEnd = async (e) => {
    e.preventDefault();
    if (selectedLots.length === 0) { alert(t("selectAtLeastOne")); return; }
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

    setIsSubmitting(true);
    try {
      const response = await post(`${BASE_URL}/api/patio`, [patioPayload]);

      if (!response.offline) {
        const patioIds = response.patioRecords?.map((p) => p.id) || [];
        if (patioIds.length === 0) throw new Error("Nessun patioId ottenuto.");

        const patioPrevnlotPayload = [];
        for (const lot of selectedLots) {
          let prev_nLot_newlot = null;
          try {
            const res = await get(`${BASE_URL}/api/trace/prev-nlot-newlot/${lot.fermentation_nLot}`);
            prev_nLot_newlot = res.prev_nLot_newlot;
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
        await post(`${BASE_URL}/api/patio_prevnlot_fermentation`, patioPrevnlotPayload);
        await patch(`${BASE_URL}/api/fermentation/update-lots`, {
          lots: selectedLots.map((lot) => ({
            id: lot.id, dateOut: form.date, timeOut: form.timeOut, worked: 1,
          })),
        });
      }

      alert(response.offline ? t("savedOffline") : t("fermentationEnded"));
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err.response ? err.response.data : err.message);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
    <BackButton to="/dashboard/traceability/manage-lot" />
      <h2>{t("fermentationTitle")}</h2>

      <PendingBanner blockSubmit={false} />

      {!isOnline && (
        <div style={{ padding: "8px 14px", marginBottom: "1rem", backgroundColor: "#fff3e0",
          border: "1px solid #ffcc80", borderRadius: "6px", fontSize: "0.85rem", color: "#e65100" }}>
          ⚠️ {t("offlineBanner")}
        </div>
      )}

      <div className="button-container">
        <button type="button" className="action-button" onClick={() => resetStep("start")}>{t("startFermentation")}</button>
        <button type="button" className="action-button" onClick={() => resetStep("end")}>{t("endFermentation")}</button>
      </div>

      {step === "start" && (
        <>
          <h3>{t("selectPatioLots")}</h3>
          <table>
            <thead>
              <tr><th></th><th>{t("date")}</th><th>{t("volume")}</th><th>{t("patio")}</th><th>{t("type")}</th></tr>
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
              {patioLots.length === 0 && <tr><td colSpan={5} className="empty-state">{t("noLotsAvailable")}</td></tr>}
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
                {t("totalVolumeSelected")}: <strong>{calculateTotalPartialVolume().toLocaleString("it-IT")} L</strong>
              </div>
            </div>
          )}

          <DateInput label={t("startDate")} value={form.date} minDate={minDateStart}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />

          <label>{t("timeIn")}:
            <input type="time" value={form.timeIn}
              onChange={(e) => setForm((prev) => ({ ...prev, timeIn: e.target.value }))} required />
          </label>

          <label>{t("fermentationType")}:
            <select value={fermentationType} onChange={(e) => setFermentationType(e.target.value)} required>
              <option value="Barrel">{t("barrel")}</option>
              <option value="Tank">{t("tank")}</option>
              <option value="Rotative">{t("rotative")}</option>
              <option value="Bag">{t("bigBag")}</option>
            </select>
          </label>

          <div className="button-container">
            <button className="action-button" onClick={handleSubmitStart}
              disabled={!!dateErrorStart || !form.date || !form.timeIn || selectedLots.length === 0 || isSubmitting}>
              {isSubmitting ? t("saving") : t("confirm")}
            </button>
            <button className="action-button cancel" onClick={handleCancel}>{t("cancel")}</button>
          </div>
        </>
      )}

      {step === "end" && (
        <>
          <h3>{t("lotsFermenting")}</h3>
          <table>
            <thead>
              <tr><th></th><th>{t("date")}</th><th>{t("volume")}</th><th>{t("method")}</th><th>{t("type")}</th></tr>
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
              {activeFermentations.length === 0 && <tr><td colSpan={5} className="empty-state">{t("noFermentations")}</td></tr>}
            </tbody>
          </table>

          <DateInput label={t("endDate")} value={form.date} minDate={minDateEnd}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />

          <label>{t("endTime")}:
            <input type="time" value={form.timeOut}
              onChange={(e) => setForm((prev) => ({ ...prev, timeOut: e.target.value }))} required />
          </label>

          <label>{t("patio")}:
            <select value={form.patio}
              onChange={(e) => setForm((prev) => ({ ...prev, patio: e.target.value }))} required>
              <option value="">{t("selectPatio")}</option>
              {patioOptions.map((patio) => <option key={patio.id} value={patio.name}>{patio.name}</option>)}
            </select>
          </label>

          <div className="button-container">
            <button className="action-button" onClick={handleSubmitEnd}
              disabled={!!dateErrorEnd || !form.date || !form.timeOut || !form.patio || selectedLots.length === 0 || isSubmitting}>
              {isSubmitting ? t("saving") : t("confirm")}
            </button>
            <button className="action-button cancel" onClick={handleCancel}>{t("cancel")}</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Fermentation;