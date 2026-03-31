import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../../LanguageContext";
import { useOffline } from "../../../OfflineContext";
import useOfflineRequest from "../../../hooks/useOfflineRequest";
import { isNLotPending } from "../../../db/offlineDB";
import PendingBanner from "../../../components/PendingBanner";
import BackButton from "../../../components/BackButton";
import "../Traceability.css";

const BASE_URL = "http://localhost:5000";

const toYMD = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
};
const today = toYMD(new Date());

const Drying = () => {
  const { t } = useLang();
  const { isOnline } = useOffline();
  const { get, post, patch } = useOfflineRequest();
  const [patioLots, setPatioLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [lotVolumes, setLotVolumes] = useState({});
  const [dryers, setDryers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ dryer: "", date: "", timeIn: "" });

  const minDate = selectedLots.length > 0
    ? selectedLots.reduce((max, lot) => {
        const d = toYMD(lot.date);
        return d > max ? d : max;
      }, "1900-01-01")
    : null;

  const validateDate = (date) => {
    if (!date) return t("selectDate");
    if (date > today) return t("dateInFuture");
    if (minDate && date < minDate)
      return `${t("dateBeforeHarvest")} (${new Date(minDate).toLocaleDateString("it-IT")}).`;
    return null;
  };

  const navigate = useNavigate();

  useEffect(() => {
    get(`${BASE_URL}/api/patio`)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data;
        setPatioLots((arr || []).filter((lot) => lot.status !== "finished"));
      })
      .catch((err) => { console.error("Errore caricamento patio:", err); setPatioLots([]); });

    get(`${BASE_URL}/api/elements`)
      .then((data) => setDryers((data || []).filter((el) => el.element === "Dryer")))
      .catch((err) => console.error("Errore caricamento dryers:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Controlla se il lotto è stato creato offline
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateDate(form.date);
    if (error) { alert(error); return; }

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

    if (!dryerPayload.dryer || !dryerPayload.date || !dryerPayload.timeIn || dryerPayload.lots.length === 0) {
      alert(t("incompleteData"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await post(`${BASE_URL}/api/dryer`, dryerPayload);

      if (!res.offline) {
        const patchPayload = {
          lots: selectedLots.map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round((lotVolumes[lot.id] / 100) * getDisplayVolume(lot)),
          })),
        };
        await patch(`${BASE_URL}/api/patio/update-lots`, patchPayload);
      }

      alert(res.offline ? t("savedOffline") : t("dryerSaved"));
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
      <h2>{t("dryingTitle")}</h2>

      <PendingBanner blockSubmit={false} />

      {!isOnline && (
        <div style={{
          padding: "8px 14px", marginBottom: "1rem",
          backgroundColor: "#fff3e0", border: "1px solid #ffcc80",
          borderRadius: "6px", fontSize: "0.85rem", color: "#e65100"
        }}>
          ⚠️ {t("offlineBanner")}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3>{t("selectPatioLots")}</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>{t("date")}</th>
              <th>{t("volume")}</th>
              <th>{t("patio")}</th>
              <th>{t("type")}</th>
            </tr>
          </thead>
          <tbody>
            {patioLots.map((lot) => (
              <tr key={lot.id}>
                <td>
                  <input type="checkbox"
                    checked={!!selectedLots.find((l) => l.id === lot.id)}
                    onChange={() => handleSelectLot(lot)} />
                </td>
                <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                <td>{getDisplayVolume(lot).toLocaleString("it-IT")}</td>
                <td>{lot.name}</td>
                <td>{lot.type}</td>
              </tr>
            ))}
            {patioLots.length === 0 && (
              <tr><td colSpan={5} className="empty-state">{t("noLotsAvailable")}</td></tr>
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
                    <strong>{lot.type} – {new Date(lot.date).toLocaleDateString("it-IT")}</strong>
                    <br />
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

        <label>{t("dryer")}:
          <select name="dryer" value={form.dryer}
            onChange={(e) => setForm((prev) => ({ ...prev, dryer: e.target.value }))} required>
            <option value="">{t("select")}</option>
            {dryers.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
          </select>
        </label>

        <label>{t("date")}:
          <input type="date" name="date" value={form.date}
            min={minDate || undefined} max={today}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} required />
          {form.date && validateDate(form.date) && (
            <span style={{ color: "var(--color-danger)", fontSize: "0.82rem", display: "block" }}>
              ⚠️ {validateDate(form.date)}
            </span>
          )}
        </label>

        <label>{t("timeIn")}:
          <input type="time" name="timeIn" value={form.timeIn}
            onChange={(e) => setForm((prev) => ({ ...prev, timeIn: e.target.value }))} required />
        </label>

        <div className="button-container">
          <button type="submit" className="action-button"
            disabled={!form.dryer || !form.date || !form.timeIn || selectedLots.length === 0 || !!validateDate(form.date) || isSubmitting}>
            {isSubmitting ? t("saving") : t("confirm")}
          </button>
          <button type="button" className="action-button cancel" onClick={handleCancel}>
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Drying;