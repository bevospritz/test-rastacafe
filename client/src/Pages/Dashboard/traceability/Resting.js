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

const toYMD = (d) => { if (!d) return null; return new Date(d).toISOString().split("T")[0]; };
const today = toYMD(new Date());

const Resting = () => {
  const { t } = useLang();
  const { isOnline } = useOffline();
  const { get, post, patch } = useOfflineRequest();
  const [selectedLots, setSelectedLots] = useState([]);
  const [dryerLots, setDryerLots] = useState([]);
  const [patioLots, setPatioLots] = useState([]);
  const [tulhas, setTulhas] = useState([]);
  const [lotVolumes, setLotVolumes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ tulha: "", date: "", timeIn: "" });

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
        setPatioLots((arr || [])
          .filter((lot) => (lot.status || "").toLowerCase().trim() !== "finished")
          .map((lot) => ({ ...lot, source: "patio" })));
      })
      .catch((err) => { console.error("Errore caricamento patio:", err); setPatioLots([]); });

    get(`${BASE_URL}/api/dryer`)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.data;
        setDryerLots((arr || [])
          .filter((lot) => (lot.status || "").toLowerCase().trim() !== "finished")
          .map((lot) => ({ ...lot, source: "dryer" })));
      })
      .catch((err) => console.error("Errore caricamento dryers:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    get(`${BASE_URL}/api/elements`)
      .then((data) => setTulhas((data || []).filter((el) => el.element === "Tulha")))
      .catch((err) => console.error("Errore caricamento tulhas:", err));
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

  const handleSelectPatioLot = async (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id && l.source === "patio");
    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => !(l.id === lot.id && l.source === "patio")));
      setLotVolumes((prev) => { const u = { ...prev }; delete u[`patio-${lot.id}`]; return u; });
      return;
    }
    // Controlla se il lotto patio è pending
    const pending = await isNLotPending(lot.patio_nLot);
    if (pending) { alert(t("lotPending")); return; }
    if (!checkCDMix(lot, selectedLots)) return;
    setSelectedLots((prev) => [...prev, { ...lot, source: "patio", patio_nLot: lot.patio_nLot, dryer_nLot: null }]);
    setLotVolumes((prev) => ({ ...prev, [`patio-${lot.id}`]: 100 }));
  };

  const handleSelectDryerLot = async (lot) => {
    const exists = selectedLots.find((l) => l.id === lot.id && l.source === "dryer");
    if (exists) {
      setSelectedLots((prev) => prev.filter((l) => !(l.id === lot.id && l.source === "dryer")));
      setLotVolumes((prev) => { const u = { ...prev }; delete u[`dryer-${lot.id}`]; return u; });
      return;
    }
    // Controlla se il lotto dryer è pending
    const pending = await isNLotPending(lot.dryer_nLot);
    if (pending) { alert(t("lotPending")); return; }
    if (!checkCDMix(lot, selectedLots)) return;
    setSelectedLots((prev) => [...prev, { ...lot, source: "dryer", dryer_nLot: lot.dryer_nLot, patio_nLot: null }]);
    setLotVolumes((prev) => ({ ...prev, [`dryer-${lot.id}`]: 100 }));
  };

  const handleSliderChange = (lot, value) =>
    setLotVolumes((prev) => ({ ...prev, [`${lot.source}-${lot.id}`]: value }));

  const calculateTotalPartialVolume = () =>
    selectedLots.reduce((sum, lot) => {
      const key = `${lot.source}-${lot.id}`;
      const perc = lotVolumes[key] || 0;
      return sum + Math.round((perc / 100) * getDisplayVolume(lot));
    }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedLots.length === 0) { alert(t("selectAtLeastOne")); return; }
    const error = validateDate(form.date);
    if (error) { alert(error); return; }

    setIsSubmitting(true);
    try {
      const restPayload = {
        tulha: form.tulha,
        volume: calculateTotalPartialVolume(),
        date: form.date,
        timeIn: form.timeIn,
        lots: selectedLots.map((lot) => ({
          prev_nLot_dryer: lot.source === "dryer" ? lot.dryer_nLot || null : null,
          prev_nLot_patio: lot.source === "patio" ? lot.patio_nLot : null,
        })),
      };

      const res = await post(`${BASE_URL}/api/rest`, restPayload);

      if (!res.offline) {
        const dryerPatchPayload = {
          lots: selectedLots.filter((lot) => lot.source === "dryer").map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round((lotVolumes[`dryer-${lot.id}`] / 100) * getDisplayVolume(lot)),
          })),
        };
        const patioPatchPayload = {
          lots: selectedLots.filter((lot) => lot.source === "patio").map((lot) => ({
            id: lot.id,
            volumeUsed: Math.round((lotVolumes[`patio-${lot.id}`] / 100) * getDisplayVolume(lot)),
          })),
        };
        const patches = [];
        if (dryerPatchPayload.lots.length > 0)
          patches.push(patch(`${BASE_URL}/api/rest/update-lots`, dryerPatchPayload));
        if (patioPatchPayload.lots.length > 0)
          patches.push(patch(`${BASE_URL}/api/patio/update-lots`, patioPatchPayload));
        await Promise.all(patches);
      }

      alert(res.offline ? t("savedOffline") : t("restSaved"));
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore REST:", err);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
    <BackButton to="/dashboard/traceability/manage-lot" />
      <h2>{t("restingTitle")}</h2>

      <PendingBanner blockSubmit={false} />

      {!isOnline && (
        <div style={{ padding: "8px 14px", marginBottom: "1rem", backgroundColor: "#fff3e0",
          border: "1px solid #ffcc80", borderRadius: "6px", fontSize: "0.85rem", color: "#e65100" }}>
          ⚠️ {t("offlineBanner")}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3>Patio</h3>
        <table>
          <thead>
            <tr><th></th><th>{t("date")}</th><th>{t("volume")}</th><th>{t("patio")}</th><th>{t("type")}</th></tr>
          </thead>
          <tbody>
            {patioLots.map((lot) => (
              <tr key={lot.id}>
                <td><input type="checkbox"
                  checked={!!selectedLots.find((l) => l.id === lot.id && l.source === "patio")}
                  onChange={() => handleSelectPatioLot(lot)} /></td>
                <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                <td>{getDisplayVolume(lot).toLocaleString("it-IT")}</td>
                <td>{lot.name}</td>
                <td>{lot.type}</td>
              </tr>
            ))}
            {patioLots.length === 0 && <tr><td colSpan={5} className="empty-state">{t("noLotsAvailable")}</td></tr>}
          </tbody>
        </table>

        <h3>{t("dryer")}</h3>
        <table>
          <thead>
            <tr><th></th><th>{t("date")}</th><th>{t("volume")}</th><th>{t("dryer")}</th><th>{t("type")}</th></tr>
          </thead>
          <tbody>
            {dryerLots.map((lot) => (
              <tr key={lot.id}>
                <td><input type="checkbox"
                  checked={!!selectedLots.find((l) => l.id === lot.id && l.source === "dryer")}
                  onChange={() => handleSelectDryerLot(lot)} /></td>
                <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                <td>{getDisplayVolume(lot).toLocaleString("it-IT")}</td>
                <td>{lot.name}</td>
                <td>{lot.type}</td>
              </tr>
            ))}
            {dryerLots.length === 0 && <tr><td colSpan={5} className="empty-state">{t("noLotsAvailable")}</td></tr>}
          </tbody>
        </table>

        {selectedLots.length > 0 && (
          <div className="lot-ranges">
            {selectedLots.map((lot) => {
              const key = `${lot.source}-${lot.id}`;
              const baseVol = getDisplayVolume(lot);
              const perc = lotVolumes[key] || 0;
              const usedVol = Math.round((perc / 100) * baseVol);
              return (
                <div key={key} className="lot-range-group">
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
              {t("totalSelectedVolume")}: <strong>{calculateTotalPartialVolume().toLocaleString("it-IT")} L</strong>
            </div>
          </div>
        )}

        <label>{t("tulha")}:
          <select name="tulha" value={form.tulha}
            onChange={(e) => setForm((prev) => ({ ...prev, tulha: e.target.value }))} required>
            <option value="">{t("select")}</option>
            {tulhas.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
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

        <label>{t("time")}:
          <input type="time" name="timeIn" value={form.timeIn}
            onChange={(e) => setForm((prev) => ({ ...prev, timeIn: e.target.value }))} required />
        </label>

        <div className="button-container">
          <button type="submit" className="action-button"
            disabled={!form.tulha || !form.date || !form.timeIn || selectedLots.length === 0 || !!validateDate(form.date) || isSubmitting}>
            {isSubmitting ? t("saving") : t("confirm")}
          </button>
          <button type="button" className="action-button cancel" onClick={handleCancel}>{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
};

export default Resting;