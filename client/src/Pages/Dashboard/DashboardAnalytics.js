import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "./DashboardAnalytics.css";

// Palette caffè — terrose e calde
const COLORS = {
  CD:      "#c0392b",
  Green:   "#27ae60",
  Dry:     "#e67e22",
  Natural: "#8b6343",
  BigDry:  "#d4ac0d",
  CDGreen: "#16a085",
};
const PIE_COLORS = Object.values(COLORS);

// Formatter numeri
const fmtNum = (n) => Number(n || 0).toLocaleString("it-IT");
const fmtDec = (n, d = 2) => Number(n || 0).toFixed(d);

// KPI card
const KpiCard = ({ label, value, unit, sub, color = "#8b6343" }) => (
  <div className="kpi-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="kpi-value" style={{ color }}>{value}</div>
    {unit && <div className="kpi-unit">{unit}</div>}
    <div className="kpi-label">{label}</div>
    {sub && <div className="kpi-sub">{sub}</div>}
  </div>
);

// Tooltip personalizzato
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{fmtNum(p.value)} L</strong>
        </p>
      ))}
    </div>
  );
};

const DashboardAnalytics = () => {
  const [plots, setPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carica lista appezzamenti
  useEffect(() => {
    axios.get("http://localhost:5000/api/plots")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setPlots(res.data);
          setSelectedPlot(res.data[0].codename);
        }
      })
      .catch((err) => console.error("Errore caricamento plots:", err));
  }, []);

  // Carica dati dashboard quando cambia l'appezzamento
  useEffect(() => {
    if (!selectedPlot) return;
    setLoading(true);
    setData(null);
    axios.get(`http://localhost:5000/api/dashboard/plot/${selectedPlot}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("Errore caricamento dashboard:", err))
      .finally(() => setLoading(false));
  }, [selectedPlot]);

  // Calcola renda (litri/kg)
  const renda = data?.renda?.weightSold > 0
    ? (data.renda.litersHarvested / data.renda.weightSold).toFixed(2)
    : "—";

  // Dati torta tipi
  const pieData = (data?.typesDist || []).map((t) => ({
    name: t.type,
    value: Number(t.volume),
  }));

  // Dati andamento temporale
  const areaData = (data?.harvestOverTime || []).map((d) => ({
    mese: d.month,
    Litri: Number(d.volume),
  }));

  return (
    <div className="dash-root">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Analisi produzione per appezzamento</p>
        </div>
        <div className="plot-selector-wrap">
          <label className="plot-selector-label">Appezzamento</label>
          <select
            className="plot-selector"
            value={selectedPlot}
            onChange={(e) => setSelectedPlot(e.target.value)}
          >
            {plots.map((p) => (
              <option key={p.id} value={p.codename}>{p.codename} — {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="dash-loading">
          <div className="loading-spinner" />
          <p>Caricamento dati...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Info appezzamento */}
          <div className="plot-info-bar">
            <span>🌱 <strong>{data.plot.codename}</strong> — {data.plot.name}</span>
            <span>Varietà: <strong>{data.plot.variety || "—"}</strong></span>
            <span>Superficie: <strong>{data.plot.surface ? `${data.plot.surface} ha` : "—"}</strong></span>
            <span>Anno impianto: <strong>{data.plot.age || "—"}</strong></span>
            <span>Stato: <strong>{data.plot.state || "—"}</strong></span>
          </div>

          {/* KPI */}
          <div className="kpi-grid">
            <KpiCard
              label="Litri raccolti"
              value={fmtNum(data.harvest.totalVolume)}
              unit="L"
              sub={`${data.harvest.nLots} raccolt${data.harvest.nLots === 1 ? "a" : "e"}`}
              color="#8b6343"
            />
            <KpiCard
              label="Renda"
              value={renda}
              unit="L/kg"
              sub="litri raccolti per kg pulito"
              color="#c0392b"
            />
            <KpiCard
              label="Peso pulito"
              value={fmtNum(data.renda.weightSold)}
              unit="kg"
              sub="peso totale al deposito"
              color="#27ae60"
            />
            <KpiCard
              label="Renda stimata"
              value={data.plot.renda_forecast ? `${fmtDec(data.plot.renda_forecast)}` : "—"}
              unit="L/kg"
              sub="previsione iniziale"
              color="#e67e22"
            />
          </div>

          {/* Grafici */}
          <div className="charts-grid">

            {/* Andamento raccolta nel tempo */}
            <div className="chart-card chart-wide">
              <div className="chart-header">
                <h3 className="chart-title">📈 Andamento Raccolta</h3>
                <p className="chart-desc">Litri raccolti per mese</p>
              </div>
              {areaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradLitri" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b6343" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b6343" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d8" />
                    <XAxis dataKey="mese" tick={{ fontSize: 11, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#888" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Litri" stroke="#8b6343" strokeWidth={2}
                      fill="url(#gradLitri)" name="Litri" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">Nessun dato di raccolta disponibile</p>
              )}
            </div>

            {/* Distribuzione tipi — Torta */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">🔵 Distribuzione Tipi</h3>
                <p className="chart-desc">CD, Green, Dry, Natural, BigDry</p>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${fmtNum(v)} L`} />
                    <Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">Nessun dato di lavorazione disponibile</p>
              )}
            </div>

            {/* Volume per tipo — Barre */}
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">📊 Volume per Tipo</h3>
                <p className="chart-desc">Litri per categoria di lavorazione</p>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pieData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d8" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#888" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => `${fmtNum(v)} L`} />
                    <Bar dataKey="value" name="Litri" radius={[4, 4, 0, 0]}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">Nessun dato disponibile</p>
              )}
            </div>

            {/* Confronto renda stimata vs reale */}
            <div className="chart-card chart-wide">
              <div className="chart-header">
                <h3 className="chart-title">⚖️ Renda: Stimata vs Reale</h3>
                <p className="chart-desc">Confronto tra previsione e risultato effettivo</p>
              </div>
              {data.plot.renda_forecast ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "Stimata", value: parseFloat(data.plot.renda_forecast) },
                      { name: "Reale", value: renda !== "—" ? parseFloat(renda) : 0 },
                    ]}
                    margin={{ top: 10, right: 40, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }} unit=" L/kg" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#555" }} width={60} />
                    <Tooltip formatter={(v) => `${v} L/kg`} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      <Cell fill="#e67e22" />
                      <Cell fill={renda !== "—" && parseFloat(renda) >= parseFloat(data.plot.renda_forecast) ? "#27ae60" : "#c0392b"} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">Renda stimata non disponibile per questo appezzamento</p>
              )}
            </div>

          </div>
        </>
      )}

      {!loading && !data && selectedPlot && (
        <div className="dash-empty">
          <p>Nessun dato disponibile per l'appezzamento <strong>{selectedPlot}</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardAnalytics;