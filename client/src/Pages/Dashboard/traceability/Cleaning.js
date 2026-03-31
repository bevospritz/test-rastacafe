import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../../LanguageContext";
import { useOffline } from "../../../OfflineContext";
import useOfflineRequest from "../../../hooks/useOfflineRequest";
import PendingBanner from "../../../components/PendingBanner";
import BackButton from "../../../components/BackButton";
import "../Traceability.css";

const BASE_URL = "http://localhost:5000";

const toYMD = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
};
const today = toYMD(new Date());

const Cleaning = () => {
  const { t } = useLang();
  const { isOnline } = useOffline();
  const { get, post } = useOfflineRequest();
  const [tulhas, setTulhas] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [selectedTulhas, setSelectedTulhas] = useState([]);
  const [tulhaVolumes, setTulhaVolumes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    weight: "",
    bags: "",
    umidity: "",
    cata: "",
    deposit: "",
  });

  const minDate =
    selectedTulhas.length > 0
      ? selectedTulhas.reduce((max, t) => {
          const d = toYMD(t.lots?.[0]?.dateIn);
          return d && d > max ? d : max;
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
    get(`${BASE_URL}/api/restforcleaning`)
      .then((data) => setTulhas(data || []))
      .catch((err) => {
        console.error("Errore caricamento tulhas:", err);
        setTulhas([]);
      });

    get(`${BASE_URL}/api/deposits`)
      .then((data) => setDeposits(data || []))
      .catch((err) => {
        console.error("Errore caricamento deposits:", err);
        setDeposits([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTulha = (tulha) => {
    const key = tulha.tulha;
    const isSelected = !!selectedTulhas.find((t) => t.tulha === key);
    if (isSelected) {
      setSelectedTulhas((prev) => prev.filter((t) => t.tulha !== key));
      setTulhaVolumes((prev) => {
        const u = { ...prev };
        delete u[key];
        return u;
      });
    } else {
      setSelectedTulhas((prev) => [...prev, tulha]);
      setTulhaVolumes((prev) => ({ ...prev, [key]: 100 }));
    }
  };

  const handleSliderChange = (key, value) =>
    setTulhaVolumes((prev) => ({ ...prev, [key]: value }));

  const getUsedVolume = (tulha) =>
    Math.round(((tulhaVolumes[tulha.tulha] || 0) / 100) * tulha.totalVolume);

  const totalVolume = selectedTulhas.reduce(
    (sum, t) => sum + getUsedVolume(t),
    0,
  );

  const getFifoStates = (lots, volumeUsed) => {
    const sortedLots = [...lots].sort((a, b) => {
      if (!a.dateIn) return 1;
      if (!b.dateIn) return -1;
      return new Date(a.dateIn) - new Date(b.dateIn);
    });
    let remaining = volumeUsed;
    return sortedLots.map((lot) => {
      if (remaining <= 0) return { ...lot, fifoState: "untouched" };
      if (remaining >= lot.volume) {
        remaining -= lot.volume;
        return { ...lot, fifoState: "consumed" };
      }
      const partialLeft = lot.volume - remaining;
      remaining = 0;
      return { ...lot, fifoState: "partial", partialLeft };
    });
  };

  const generateNLot = async () => {
    try {
      const data = await get(`${BASE_URL}/api/cleaning/last-nlot`);
      const last = data.cleaning_nLot || "C00000";
      return (
        "C" + (parseInt(last.substring(1)) + 1).toString().padStart(5, "0")
      );
    } catch {
      return "C00001";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const error = validateDate(form.date);
    if (error) {
      alert(error);
      return;
    }
    if (selectedTulhas.length === 0) {
      alert(t("selectAtLeastOne"));
      return;
    }

    setIsSubmitting(true);
    try {
      const nLot = await generateNLot();
      const cleaningPayload = {
        date: form.date,
        volume: totalVolume,
        weight: parseInt(form.weight),
        bags: parseInt(form.bags),
        umidity: form.umidity ? parseFloat(form.umidity) : null,
        cata: form.cata ? parseInt(form.cata) : null,
        deposit: form.deposit || null,
        cleaning_nLot: nLot,
        lots: selectedTulhas.map((t) => ({
          tulha: t.tulha,
          volumeUsed: getUsedVolume(t),
          rest_ids: t.lots.map((l) => l.rest_id),
        })),
      };

      const res = await post(`${BASE_URL}/api/cleaning`, cleaningPayload);
      alert(
        res.offline
          ? t("savedOffline")
          : t("cleaningRegistered", { lot: nLot }),
      );
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore durante il cleaning:", err);
      alert(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");
  const isFormValid =
    form.date && form.weight && form.deposit && selectedTulhas.length > 0;

  return (
    <div className="form-container">
      <BackButton to="/dashboard/traceability/manage-lot" />
      <h2>{t("cleaningTitle")}</h2>

      <PendingBanner blockSubmit={false} />

      {!isOnline && (
        <div
          style={{
            padding: "8px 14px",
            marginBottom: "1rem",
            backgroundColor: "#fff3e0",
            border: "1px solid #ffcc80",
            borderRadius: "6px",
            fontSize: "0.85rem",
            color: "#e65100",
          }}
        >
          ⚠️ {t("offlineBanner")}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h3>{t("selectTulhas")}</h3>
        {tulhas.length === 0 ? (
          <p className="empty-state">{t("noDepoForCleaning")}</p>
        ) : (
          <div className="tulha-grid">
            {tulhas.map((tulha) => {
              const isSelected = !!selectedTulhas.find(
                (t) => t.tulha === tulha.tulha,
              );
              const usedVolume = isSelected ? getUsedVolume(tulha) : 0;
              const lotsWithFifo = getFifoStates(tulha.lots || [], usedVolume);
              return (
                <div
                  key={tulha.tulha}
                  className={`tulha-card ${isSelected ? "selected" : ""}`}
                >
                  <div
                    className="tulha-card-header"
                    onClick={() => toggleTulha(tulha)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                    />
                    <div>
                      <div className="tulha-card-title">
                        {t("tulha")} {tulha.tulha}
                      </div>
                      <div className="tulha-card-volume">
                        {tulha.totalVolume.toLocaleString("it-IT")}{" "}
                        {t("totalLiters")}
                        {" · "}
                        {tulha.lots.length} lote
                        {tulha.lots.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <hr className="card-divider" />
                  <div className="sublot-list">
                    {lotsWithFifo.map((lot, i) => {
                      const fifoClass = isSelected
                        ? lot.fifoState === "consumed"
                          ? "consumed"
                          : lot.fifoState === "partial"
                            ? "partial"
                            : ""
                        : i === 0
                          ? "fifo-first"
                          : "";
                      return (
                        <div key={i} className={`sublot-row ${fifoClass}`}>
                          <span className="sublot-date">
                            {lot.dateIn
                              ? new Date(lot.dateIn).toLocaleDateString("it-IT")
                              : "-"}
                          </span>
                          <span className="sublot-type">{lot.type || "-"}</span>
                          <span className="sublot-volume">
                            {lot.fifoState === "partial" && isSelected
                              ? `${lot.partialLeft.toLocaleString("it-IT")} L rim.`
                              : `${lot.volume.toLocaleString("it-IT")} L`}
                          </span>
                          <span className="sublot-nlot">{lot.rest_nLot}</span>
                        </div>
                      );
                    })}
                  </div>
                  {isSelected && (
                    <div className="slider-container">
                      <div className="slider-label">
                        <strong>{t("volumeToClean")}:</strong>{" "}
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
                          handleSliderChange(
                            tulha.tulha,
                            parseInt(e.target.value),
                          )
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
            {t("totalVolumeToClean")}:{" "}
            <strong>{totalVolume.toLocaleString("it-IT")} L</strong>
            {" · "}
            <span className="total-volume-muted">
              {selectedTulhas.length} tulha
              {selectedTulhas.length > 1 ? "s" : ""} {t("selected")}
              {selectedTulhas.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        <h3>{t("cleaningData")}</h3>

        <label>
          {t("date")}:
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
          {t("cleanedWeight")}:
          <input
            type="number"
            min="0"
            value={form.weight}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, weight: e.target.value }))
            }
            placeholder="es. 3600"
            required
          />
        </label>

        <label>
          {t("bags")}:
          <input
            type="number"
            min="0"
            value={form.bags}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bags: e.target.value }))
            }
            placeholder="es. 60"
          />
        </label>

        <label>
          {t("humidity")}:
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.umidity}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, umidity: e.target.value }))
            }
            placeholder="es. 11.5"
          />
        </label>

        <label>
          {t("defects")}:
          <input
            type="number"
            min="0"
            max="100"
            value={form.cata}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cata: e.target.value }))
            }
            placeholder="es. 5"
          />
        </label>

        <label>
          {t("destination")}:
          <select
            value={form.deposit}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deposit: e.target.value }))
            }
            required
          >
            <option value="">— {t("noDeposit")} —</option>
            {deposits.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <div className="button-container">
          <button
            type="submit"
            className="action-button"
            disabled={!isFormValid || isSubmitting || !!validateDate(form.date)}
          >
            {isSubmitting ? t("saving") : t("confirm")}
          </button>
          <button
            type="button"
            className="action-button cancel"
            onClick={handleCancel}
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Cleaning;
