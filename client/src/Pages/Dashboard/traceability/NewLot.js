import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../../LanguageContext";
import { useOffline } from "../../../OfflineContext";
import useOfflineRequest from "../../../hooks/useOfflineRequest";
import { addOfflineNLot } from "../../../db/offlineDB";
import PendingBanner from "../../../components/PendingBanner";
import BackButton from "../../../components/BackButton";
import "../Traceability.css";

const BASE_URL = "http://localhost:5000";

const NewLot = () => {
  const { t } = useLang();
  const { isOnline } = useOffline();
  const { get, post } = useOfflineRequest();
  const [form, setForm] = useState({
    plot: "", volume: "", date: "", method: "", type: "",
  });
  const [plots, setPlots] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    get(`${BASE_URL}/api/plots`)
      .then((data) => setPlots(data))
      .catch((err) => console.error("Errore caricamento plots:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNaN(form.volume) || Number(form.volume) <= 0) {
      alert(t("invalidVolume"));
      return;
    }

    const isConfirmed = window.confirm(
      `${t("confirmData")}\n\n${t("plot")}: ${form.plot}\n${t("volume")}: ${form.volume}\n${t("date")}: ${form.date}\n${t("method")}: ${form.method}\n${t("type")}: ${form.type}`
    );
    if (!isConfirmed) { alert(t("operationCancelled")); return; }

    try {
      // ID temporaneo per tracciare il lotto offline
      const tempNLot = `TEMP-${form.plot}-${form.date}-${Date.now()}`;
      const res = await post(`${BASE_URL}/api/newlot`, { ...form, tempNLot });

      if (res.offline) {
        // Salva il tempNLot come pending — non potrà essere processato finché non sincronizzato
        await addOfflineNLot(tempNLot);
        alert(t("savedOffline"));
      } else {
        alert(t("lotCreated"));
      }
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err);
      alert(t("error"));
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
    <BackButton to="/dashboard/traceability/manage-lot" />
      <h2>{t("newLot")}</h2>

      {/* Banner informativo — non bloccante in NewLot */}
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
        <label>{t("plot")}:
          <select name="plot" value={form.plot} onChange={handleChange} required>
            <option value="">{t("select")}</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.codename}>{plot.codename}</option>
            ))}
          </select>
        </label>

        <label>{t("volume")}:
          <input type="number" name="volume" value={form.volume}
            onChange={handleChange} required min={1} />
        </label>

        <label>{t("date")}:
          <input type="date" name="date" value={form.date}
            onChange={handleChange} required />
        </label>

        <label>{t("method")}:
          <select name="method" value={form.method} onChange={handleChange} required>
            <option value="">{t("select")}</option>
            <option value="Mechanical">{t("mechanical")}</option>
            <option value="Manual">{t("manual")}</option>
          </select>
        </label>

        <label>{t("type")}:
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="">{t("select")}</option>
            <option value="Natural">{t("natural")}</option>
            <option value="Vassoura">{t("vassoura")}</option>
          </select>
        </label>

        <div className="button-container">
          <button type="submit" className="action-button">{t("confirm")}</button>
          <button type="button" className="action-button cancel" onClick={handleCancel}>{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
};

export default NewLot;