import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLang } from "../../../LanguageContext";
import "../Traceability.css";

const NewLot = () => {
  const { t } = useLang();
  const [form, setForm] = useState({
    plot: "",
    volume: "",
    date: "",
    method: "",
    type: "",
  });
  const [plots, setPlots] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/plots")
      .then((response) => setPlots(response.data))
      .catch((error) => console.error("Errore nel caricamento da plots:", error));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isNaN(form.volume) || Number(form.volume) <= 0) {
      alert("Il volume deve essere un numero valido maggiore di zero.");
      return;
    }

    const isConfirmed = window.confirm(
      `Confermi i seguenti dati?\n\nTalhão: ${form.plot}\nVolume: ${form.volume}\nData: ${form.date}\nMetodo: ${form.method}\nTipo: ${form.type}`
    );

    if (isConfirmed) {
      axios
        .post("http://localhost:5000/api/newlot", form)
        .then((response) => {
          console.log("Form confermato:", response.data);
          alert("Lotto creato con successo!");
          navigate("/dashboard/traceability/manage-lot");
        })
        .catch((error) => {
          console.error("Errore nel caricamento dei dati:", error);
          alert("Errore nel caricamento dei dati");
        });
    } else {
      alert("Operazione annullata.");
    }
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");

  return (
    <div className="form-container">
      <h2>{t("newLot")}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          {t("plot")}:
          <select name="plot" value={form.plot} onChange={handleChange} required>
            <option value="">{t("select")}</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.codename}>
                {plot.codename}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("volume")}:
          <input
            type="number"
            name="volume"
            value={form.volume}
            onChange={handleChange}
            required
            min={1}
          />
        </label>

        <label>
          {t("date")}:
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          {t("method")}:
          <select name="method" value={form.method} onChange={handleChange} required>
            <option value="">{t("select")}</option>
            <option value="Mechanical">{t("mechanical")}</option>
            <option value="Manual">{t("manual")}</option>
          </select>
        </label>

        <label>
          {t("type")}:
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