import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import { useLang } from "../../LanguageContext";
import "./Traceability.css";

const TypeBadge = ({ type }) => {
  if (!type) return "—";
  const typeMap = {
    CD: "type-cd",
    Natural: "type-natural",
    Green: "type-green",
    Dry: "type-dry",
    BigDry: "type-bigdry",
    CDGreen: "type-cdgreen",
    WashedNatural: "type-washednnatural",
  };
  const types = String(type).split(", ");
  return (
    <span style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
      {types.map((tp, i) => (
        <span key={i} className={`type-badge ${typeMap[tp.trim()] || ""}`}>
          {tp.trim()}
        </span>
      ))}
    </span>
  );
};

const Traceability = () => {
  const { t } = useLang();
  const CARDS = useMemo(
    () => [
      {
        key: "newLots",
        className: "card-nuovi-lotti",
        title: t("newLots"),
        endpoint: "/api/newlot",
        empty: t("noNewLots"),
        columns: ["Data", "Talhão", "Volume", "Metodo", "Tipo"],
        renderRow: (lot) => (
          <tr key={lot.id}>
            <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
            <td>{lot.plot}</td>
            <td>{lot.volume?.toLocaleString("it-IT")}</td>
            <td>{lot.method}</td>
            <td>
              <TypeBadge type={lot.type} />
            </td>
          </tr>
        ),
      },
      {
        key: "patios",
        className: "card-patios",
        title: t("patios"),
        endpoint: "/api/patiocard",
        empty: t("noPatios"),
        columns: ["Data", "Talhão", "Terreiro", "Volume", "Tipo"],
        renderRow: (patio) => (
          <tr key={patio.id}>
            <td>{new Date(patio.date).toLocaleDateString("it-IT")}</td>
            <td>{patio.plots}</td>
            <td>{patio.name}</td>
            <td>{patio.volume?.toLocaleString("it-IT")}</td>
            <td
              className={
                patio.type === "fermented" ? "highlight-fermented" : ""
              }
            >
              <TypeBadge type={patio.type} />
            </td>
          </tr>
        ),
      },
      {
        key: "dryers",
        className: "card-dryer",
        title: t("dryers"),
        endpoint: "/api/dryercard",
        empty: t("noDryers"),
        columns: ["Data", "Talhão", "Secador", "Volume", "Tipo"],
        renderRow: (dryer) => (
          <tr key={dryer.id}>
            <td>{new Date(dryer.date).toLocaleDateString("it-IT")}</td>
            <td>{dryer.plots}</td>
            <td>{dryer.name}</td>
            <td>{dryer.volume?.toLocaleString("it-IT")}</td>
            <td>
              <TypeBadge type={dryer.type} />
            </td>
          </tr>
        ),
      },
      {
        key: "fermentations",
        className: "card-fermentazioni",
        title: t("fermentations"),
        endpoint: "/api/fermentationcard",
        empty: t("noFermentations"),
        columns: ["Data", "Talhão", "Volume", "Metodo", "Tipo"],
        renderRow: (f) => (
          <tr key={f.id}>
            <td>{new Date(f.date).toLocaleDateString("it-IT")}</td>
            <td>{f.plots}</td>
            <td>{f.volume?.toLocaleString("it-IT")}</td>
            <td>{f.method}</td>
            <td>
              <TypeBadge type={f.type} />
            </td>
          </tr>
        ),
      },
      {
        key: "rests",
        className: "card-rest",
        title: t("rests"),
        endpoint: "/api/restcard",
        empty: t("noRests"),
        columns: ["Data", "Talhão", "Tulha", "Volume", "Tipo"],
        renderRow: (r) => (
          <tr key={r.id}>
            <td>{new Date(r.date).toLocaleDateString("it-IT")}</td>
            <td>{r.plots}</td>
            <td>{r.name}</td>
            <td>{r.volume?.toLocaleString("it-IT")}</td>
            <td>
              <TypeBadge type={r.type} />
            </td>
          </tr>
        ),
      },
      {
        key: "stocking",
        className: "card-stocking",
        title: t("stocking"),
        endpoint: "/api/stockingcard",
        empty: t("noStocking"),
        columns: ["Data", "Lote", "Talhão", "Sacas", "Tipo", "Armazem"],
        renderRow: (s) => (
          <tr key={s.id}>
            <td>{new Date(s.date).toLocaleDateString("it-IT")}</td>
            <td>{s.name}</td>
            <td>{s.plots || "—"}</td>
            <td>{s.bags ?? "—"}</td>
            <td>
              <TypeBadge type={s.type} />
            </td>
            <td>
              {s.deposit || (
                <span style={{ color: "#aaa", fontStyle: "italic" }}>
                  {t("directSale")}
                </span>
              )}
            </td>
          </tr>
        ),
      },
    ],
    [t],
  );

  const [showTraceability, setShowTraceability] = useState(true);
  const [cardData, setCardData] = useState({
    newLots: [],
    patios: [],
    dryers: [],
    fermentations: [],
    rests: [],
    stocking: [],
  });

  const navigate = useNavigate();
  const location = useLocation();
  const TYPE_MAP = {
    newLots: "newlot",
    patios: "patio",
    dryers: "dryer",
    fermentations: "fermentation",
    rests: "rest",
    stocking: "cleaning",
  };

  useEffect(() => {
    console.log("pathname:", location.pathname);
    console.log("includes lots:", location.pathname.includes("lots"));
    setShowTraceability(
      !location.pathname.includes("manage-lot") &&
        !location.pathname.includes("lot-history") &&
        !location.pathname.includes("/lots"),
    );
  }, [location]);

  useEffect(() => {
    const fetchData = () => {
      CARDS.forEach((card) => {
        axios
          .get(`http://localhost:5000${card.endpoint}`)
          .then((res) => {
            setCardData((prev) => ({
              ...prev,
              [card.key]: Array.isArray(res.data) ? res.data : [],
            }));
          })
          .catch((err) =>
            console.error(`Errore caricamento ${card.title}:`, err),
          );
      });
    };

    fetchData();
    window.addEventListener("focus", fetchData);
    return () => window.removeEventListener("focus", fetchData);
  }, [CARDS]);

  return (
    <div>
      {showTraceability && (
        <div className="traceability-wrapper">
          <h2 style={{ color: "#ffffff" }}>
            {t("traceability").toUpperCase()}
          </h2>
          <p className="page-subtitle">{t("traceabilitySubtitle")}</p>

          <div className="traceability-actions">
            <button
              className="action-button"
              onClick={() => navigate("/dashboard/traceability/manage-lot")}
            >
              {t("manageLot")}
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/dashboard/traceability/lot-history")}
            >
              {t("lotHistory")}
            </button>
          </div>

          <div className="card-container">
            {CARDS.map((card) => {
              const data = cardData[card.key];
              return (
                <div
                  key={card.key}
                  className={`card ${card.className}`}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(
                      `/dashboard/traceability/lots/${TYPE_MAP[card.key]}`,
                    )
                  }
                >
                  <h2>{card.title?.toUpperCase()}</h2>
                  {data.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          {card.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{data.map(card.renderRow)}</tbody>
                    </table>
                  ) : (
                    <p className="text-muted">{card.empty}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default Traceability;
