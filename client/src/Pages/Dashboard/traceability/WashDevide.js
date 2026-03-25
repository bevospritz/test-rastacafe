import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import "../Traceability.css";

Modal.setAppElement("#root");

const STEPS = ["Dry vs Mature+Green", "Peneirão", "Despolpador", "Riepilogo"];

const StepIndicator = ({ current, total }) => (
  <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "1rem" }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: "28px", height: "6px", borderRadius: "3px",
        backgroundColor: i <= current ? "var(--color-primary)" : "#ddd",
        transition: "background-color 0.2s",
      }} />
    ))}
  </div>
);

// Formatta data in YYYY-MM-DD per confronti e attributo min
const toYMD = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return date.toISOString().split("T")[0];
};

const today = toYMD(new Date());

const WashDevide = () => {
  const [newLots, setNewLots] = useState([]);
  const [selectedLots, setSelectedLots] = useState([]);
  const [patioOptions, setPatioOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isWashed, setIsWashed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Sliders
  const [matureGreen, setMatureGreen] = useState(50);
  const [dryFiltered, setDryFiltered] = useState(50);
  const [cdDepulped, setCdDepulped] = useState(50);

  // Opzioni lavorazione
  const [isFiltered, setIsFiltered] = useState(false);
  const [isDepulped, setIsDepulped] = useState(false);
  const [isDesmucilado, setIsDesmucilado] = useState(false);
  const [isCentrifuged, setIsCentrifuged] = useState(false);

  // Selezione patio per ogni lotto
  const [patioSelections, setPatioSelections] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:5000/api/newlot")
      .then((res) => {
        const lots = Array.isArray(res.data) ? res.data : res.data.data;
        setNewLots(Array.isArray(lots) ? lots : []);
      })
      .catch(() => setNewLots([]));

    axios.get("http://localhost:5000/api/elements")
      .then((res) => {
        const onlyPatio = res.data.filter((o) => o.element === "Patio");
        setPatioOptions(onlyPatio);
      })
      .catch((err) => console.error("Errore caricamento patio:", err));
  }, []);

  const handleLotChange = (lot) => {
    setSelectedLots((prev) => {
      const exists = prev.find((item) => item.id === lot.id);
      return exists ? prev.filter((item) => item.id !== lot.id) : [...prev, lot];
    });
  };

  // Data più recente tra i lotti selezionati → minDate per il passo successivo
  const minDate = selectedLots.length > 0
    ? selectedLots.reduce((max, lot) => {
        const d = toYMD(lot.date);
        return d > max ? d : max;
      }, "1900-01-01")
    : null;

  // Validazione data inserita
  const validateDate = (date) => {
    if (!date) return "Seleziona una data.";
    if (date > today) return `La data non può essere nel futuro (oggi: ${new Date().toLocaleDateString("it-IT")}).`;
    if (minDate && date < minDate) {
      return `La data non può essere precedente alla data di raccolta più recente (${new Date(minDate).toLocaleDateString("it-IT")}).`;
    }
    return null; // valida
  };

  const totalVolume = Math.round(selectedLots.reduce((acc, lot) => acc + lot.volume, 0));
  const matureGreenVolume = Math.round((totalVolume * matureGreen) / 100);
  const dryVolume = Math.round(totalVolume - matureGreenVolume);
  const bigDryVolume = Math.round((dryVolume * dryFiltered) / 100);
  const dryAfterFilter = dryVolume - bigDryVolume;
  const cdVolume = Math.round((matureGreenVolume * cdDepulped) / 100);
  const greenVolume = matureGreenVolume - cdVolume;

  const buildLots = () => {
    const patio_nLot = selectedLots[0]?.patio_nLot || null;

    if (!isWashed) {
      return [{ key: "natural", type: "Natural", volume: totalVolume, patio_nLot, depulped: 0, demucil: 0, centrifug: 0 }];
    }

    const lots = [];

    if (isFiltered) {
      lots.push({ key: "bigDry", type: "BigDry", volume: bigDryVolume, patio_nLot, depulped: 0, demucil: 0, centrifug: 0 });
      lots.push({ key: "dry", type: "Dry", volume: dryAfterFilter, patio_nLot, depulped: 0, demucil: 0, centrifug: 0 });
    } else {
      lots.push({ key: "dry", type: "Dry", volume: dryVolume, patio_nLot, depulped: 0, demucil: 0, centrifug: 0 });
    }

    if (isDepulped) {
      lots.push({ key: "cd", type: "CD", volume: cdVolume, patio_nLot, depulped: 1, demucil: isDesmucilado ? 1 : 0, centrifug: isCentrifuged ? 1 : 0 });
      lots.push({ key: "green", type: "Green", volume: greenVolume, patio_nLot, depulped: 0, demucil: 0, centrifug: 0 });
    } else {
      lots.push({ key: "natural_washed", type: "Natural", volume: matureGreenVolume, patio_nLot, depulped: 0, demucil: 0, centrifug: 0 });
    }

    return lots;
  };

  const previewLots = buildLots();

  const setPatio = (key, value) => {
    setPatioSelections((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalVolume === 0) { alert("Nessun lotto selezionato."); return; }

    const error = validateDate(selectedDate);
    if (error) { alert(error); return; }

    const initial = {};
    previewLots.forEach((l) => { initial[l.key] = patioOptions[0]?.name || ""; });
    setPatioSelections(initial);
    setCurrentStep(0);
    setIsModalOpen(true);
  };

  const handleCancel = () => navigate("/dashboard/traceability/manage-lot");
  const handleCancelModal = () => setIsModalOpen(false);
  const handleNextStep = () => { if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1); };
  const handlePrevStep = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  const handleConfirm = async () => {
    for (const lot of previewLots) {
      if (!patioSelections[lot.key]) {
        alert(`Seleziona un patio per il lotto ${lot.type}.`);
        return;
      }
    }

    try {
      const dataToSend = previewLots.map((lot) => ({
        name: patioSelections[lot.key],
        volume: lot.volume,
        type: lot.type,
        date: selectedDate,
        patio_nLot: lot.patio_nLot,
        status: "active",
        fermented: 0,
        depulped: lot.depulped,
        demucil: lot.demucil,
        centrifug: lot.centrifug,
      }));

      const response = await axios.post("http://localhost:5000/api/patio", dataToSend);
      const patioIds = response.data.patioIds;
      if (!patioIds) throw new Error("patioIds non trovato");

      const patioPrevNlotData = patioIds.flatMap((id) =>
        selectedLots.map((lot) => ({
          patio_id: id,
          prev_nLot_newlot: lot.newlot_nLot,
        }))
      );
      await axios.post("http://localhost:5000/api/patio_prevnlot", patioPrevNlotData);

      await Promise.all(
        selectedLots.map((lot) =>
          axios.patch(`http://localhost:5000/api/newlot/${lot.id}`, { worked: 1 })
        )
      );

      alert("Dati inviati con successo!");
      setIsModalOpen(false);
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore:", err);
      alert("Errore nell'invio dei dati. Per favore riprova.");
    }
  };

  // Messaggio di avviso data sotto il campo
  const dateError = selectedDate ? validateDate(selectedDate) : null;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
              Volume totale: <strong>{totalVolume.toLocaleString("it-IT")} L</strong>
            </p>
            <label>
              Mature+Green: <strong>{matureGreen}%</strong> ({matureGreenVolume.toLocaleString("it-IT")} L)
              <input type="range" min="0" max="100" value={matureGreen}
                onChange={(e) => setMatureGreen(parseInt(e.target.value))} />
              Dry: <strong>{100 - matureGreen}%</strong> ({dryVolume.toLocaleString("it-IT")} L)
            </label>
          </div>
        );

      case 1:
        return (
          <div>
            <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
              Volume Dry: <strong>{dryVolume.toLocaleString("it-IT")} L</strong>
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
              <input type="checkbox" checked={isFiltered} onChange={() => setIsFiltered(!isFiltered)} />
              Peneirão (separa BigDry da Dry)
            </label>
            {isFiltered && (
              <div className="lot-ranges" style={{ padding: "1rem" }}>
                <label>
                  BigDry: <strong>{dryFiltered}%</strong> ({bigDryVolume.toLocaleString("it-IT")} L)
                  <input type="range" min="0" max="100" value={dryFiltered}
                    onChange={(e) => setDryFiltered(parseInt(e.target.value))} />
                  Dry: <strong>{100 - dryFiltered}%</strong> ({dryAfterFilter.toLocaleString("it-IT")} L)
                </label>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <p className="text-muted" style={{ marginBottom: "0.75rem" }}>
              Volume Mature+Green: <strong>{matureGreenVolume.toLocaleString("it-IT")} L</strong>
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
              <input type="checkbox" checked={isDepulped} onChange={() => setIsDepulped(!isDepulped)} />
              Despolpador (separa CD da Green)
            </label>
            {isDepulped && (
              <div className="lot-ranges" style={{ padding: "1rem" }}>
                <label>
                  CD: <strong>{cdDepulped}%</strong> ({cdVolume.toLocaleString("it-IT")} L)
                  <input type="range" min="0" max="100" value={cdDepulped}
                    onChange={(e) => setCdDepulped(parseInt(e.target.value))} />
                  Green: <strong>{100 - cdDepulped}%</strong> ({greenVolume.toLocaleString("it-IT")} L)
                </label>
                <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-light)" }}>
                  <div className="info-section-title" style={{ marginBottom: "0.5rem" }}>Lavorazioni aggiuntive sul CD</div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <input type="checkbox" checked={isDesmucilado} onChange={() => setIsDesmucilado(!isDesmucilado)} />
                    Desmucilador
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="checkbox" checked={isCentrifuged} onChange={() => setIsCentrifuged(!isCentrifuged)} />
                    Centrifuga
                  </label>
                </div>
              </div>
            )}
            {!isDepulped && (
              <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Senza despolpador il Mature+Green sarà classificato come <strong>Natural</strong>
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <div className="info-section-title" style={{ marginBottom: "0.75rem" }}>
              Assegna ogni lotto a un patio
            </div>
            {previewLots.map((lot) => (
              <div key={lot.key} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.5rem 0", borderBottom: "1px solid var(--color-border-light)", gap: "1rem",
              }}>
                <div>
                  <span style={{ fontWeight: "600", marginRight: "8px" }}>{lot.type}</span>
                  <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                    {lot.volume.toLocaleString("it-IT")} L
                  </span>
                  {lot.type === "CD" && (lot.demucil || lot.centrifug) && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", marginLeft: "6px" }}>
                      {[lot.demucil && "Desmucil.", lot.centrifug && "Centrifuga"].filter(Boolean).join(" + ")}
                    </span>
                  )}
                </div>
                <select
                  value={patioSelections[lot.key] || ""}
                  onChange={(e) => setPatio(lot.key, e.target.value)}
                  style={{ minWidth: "120px" }}
                  required
                >
                  <option value="">Seleziona</option>
                  {patioOptions.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="total-volume-box" style={{ marginTop: "1rem" }}>
              Totale: <strong>{totalVolume.toLocaleString("it-IT")} L</strong>
              {" · "}{previewLots.length} lott{previewLots.length > 1 ? "i" : "o"}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="form-container">
      <h2>Wash & Divide</h2>
      <form onSubmit={handleSubmit}>

        <h3>Seleziona Lotti</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Data</th>
              <th>Talhão</th>
              <th>Volume</th>
              <th>Metodo</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {newLots.length > 0 ? newLots.map((lot) => (
              <tr key={lot.id}>
                <td>
                  <input type="checkbox"
                    checked={!!selectedLots.find((s) => s.id === lot.id)}
                    onChange={() => handleLotChange(lot)} />
                </td>
                <td>{new Date(lot.date).toLocaleDateString("it-IT")}</td>
                <td>{lot.plot}</td>
                <td>{lot.volume.toLocaleString("it-IT")}</td>
                <td>{lot.method}</td>
                <td>{lot.type}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="empty-state">Nessun lotto disponibile</td></tr>
            )}
          </tbody>
        </table>

        <label>
          Data:
          <input
            type="date"
            value={selectedDate}
            min={minDate || undefined}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
          {/* Avviso in tempo reale sotto il campo */}
          {dateError && (
            <span style={{ color: "var(--color-danger)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
              ⚠️ {dateError}
            </span>
          )}
          {/* Suggerimento data minima se ci sono lotti selezionati */}
          {minDate && !dateError && selectedLots.length > 0 && (
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "4px", display: "block" }}>
              Data minima: {new Date(minDate).toLocaleDateString("it-IT")}
            </span>
          )}
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <input type="checkbox" checked={isWashed} onChange={() => setIsWashed(!isWashed)} />
          Washing
        </label>

        <div className="button-container">
          <button type="submit" className="action-button"
            disabled={!selectedDate || selectedLots.length === 0 || !!dateError}>
            Avanti
          </button>
          <button type="button" className="action-button cancel" onClick={handleCancel}>
            Annulla
          </button>
        </div>
      </form>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCancelModal}
        contentLabel="Lavorazione Lotti"
        className="modal-content"
        overlayClassName="modal"
      >
        {isWashed ? (
          <>
            <div className="modal-header">
              <h2>{STEPS[currentStep]}</h2>
              <StepIndicator current={currentStep} total={STEPS.length} />
            </div>
            <div className="modal-body">
              {renderStep()}
            </div>
            <div className="modal-footer">
              {currentStep === 0 ? (
                <button type="button" className="action-button cancel" onClick={handleCancelModal}>Annulla</button>
              ) : (
                <button type="button" className="action-button" onClick={handlePrevStep}>← Indietro</button>
              )}
              {currentStep < STEPS.length - 1 ? (
                <button type="button" className="action-button" onClick={handleNextStep}>Avanti →</button>
              ) : (
                <button type="button" className="action-button save" onClick={handleConfirm}>Conferma</button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h2>Lotto Naturale</h2>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ marginBottom: "1rem" }}>
                Volume: <strong>{totalVolume.toLocaleString("it-IT")} L</strong>
              </p>
              <label>Patio:
                <select
                  value={patioSelections["natural"] || ""}
                  onChange={(e) => setPatio("natural", e.target.value)}
                  required
                >
                  <option value="">Seleziona</option>
                  {patioOptions.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="action-button cancel" onClick={handleCancelModal}>Annulla</button>
              <button type="button" className="action-button save" onClick={handleConfirm}>Conferma</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default WashDevide;