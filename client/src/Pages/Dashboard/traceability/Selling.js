import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useLang } from "../../../LanguageContext";
import "../Traceability.css";

Modal.setAppElement("#root");

const toYMD = (d) => {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
};
const today = toYMD(new Date());

const CERTIFICATIONS = ["Rainforest Alliance", "UTZ"];
const REQUIRED_FIELDS = [
  "bags",
  "weight_deposit",
  "umidity_deposit",
  "cata_deposit",
  "peneira_deposit",
];

const isLotComplete = (lot) =>
  REQUIRED_FIELDS.every((f) => lot[f] != null && lot[f] !== "");

const StatusBadge = ({ lot }) => {
  if (lot.status === "partial")
    return <span className="badge badge-direct">Parcial</span>;
  if (lot.status === "sold")
    return (
      <span
        className="badge"
        style={{ backgroundColor: "#e8f5e9", color: "#2e7d32" }}
      >
        Vendido
      </span>
    );
  return <span className="badge badge-deposit">Disponivel</span>;
};

const DetailRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className={`info-value ${!value ? "empty" : ""}`}>
      {value ?? "—"}
    </span>
  </div>
);

const Selling = () => {
  const { t } = useLang();
  const [lots, setLots] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [detailLot, setDetailLot] = useState(null);
  const [sellLot, setSellLot] = useState(null);
  const [lossLot, setLossLot] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isLossOpen, setIsLossOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellForm, setSellForm] = useState({
    date: "",
    buyer_id: "",
    price_per_bag: "",
    currency: "USD",
    notes: "",
    certification: "",
    certification_bonus: "",
  });
  const [bagsSold, setBagsSold] = useState("");
  const [lossForm, setLossForm] = useState({
    date: "",
    bags_lost: "",
    notes: "",
  });
  const [sellMinDate, setSellMinDate] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLots();
    fetchBuyers();
  }, []);

  const fetchLots = () => {
    axios
      .get("http://localhost:5000/api/selling")
      .then((res) => setLots(res.data || []))
      .catch((err) => console.error("Errore caricamento lotti:", err));
  };

  const fetchBuyers = () => {
    axios
      .get("http://localhost:5000/api/buyers")
      .then((res) => setBuyers(res.data || []))
      .catch((err) => console.error("Errore caricamento acquirenti:", err));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("it-IT") : "—");

  const getAvailableBags = (lot) =>
    lot.status === "partial" && lot.partial_bags != null
      ? lot.partial_bags
      : (lot.bags ?? "—");

  const getAvailableWeight = (lot) =>
    lot.status === "partial" && lot.partial_weight != null
      ? lot.partial_weight
      : (lot.weight_deposit ?? lot.weight ?? null);

  const calcTotal = () => {
    const bags = parseInt(bagsSold) || 0;
    const price = parseFloat(sellForm.price_per_bag) || 0;
    const bonus = parseFloat(sellForm.certification_bonus) || 0;
    const baseTotal = bags * price;
    const bonusTotal = bags * bonus;
    return { baseTotal, bonusTotal, grandTotal: baseTotal + bonusTotal };
  };

  const handleOpenDetail = (lot) => {
    setDetailLot(lot);
    setIsDetailOpen(true);
  };

  const handleOpenSell = (lot) => {
    if (!isLotComplete(lot)) {
      alert(t("lotDataNotComplited") + "\n\n" + t("fillBeforeSelling"));
      return;
    }

    setSellLot(lot);
    setBagsSold(getAvailableBags(lot).toString());
    setSellForm({
      date: "",
      buyer_id: "",
      price_per_bag: "",
      currency: "USD",
      notes: "",
      certification: "",
      certification_bonus: "",
    });
    setIsSellOpen(true);
    setSellMinDate(toYMD(lot.date));
  };

  const handleOpenLoss = (lot) => {
    setLossLot(lot);
    setLossForm({ date: "", bags_lost: "", notes: "" });
    setIsLossOpen(true);
  };

  const handleSellFormChange = (e) => {
    const { name, value } = e.target;
    setSellForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitSell = async (e) => {
    e.preventDefault();
    if (isSubmitting || !sellLot) return;

    const bags = parseInt(bagsSold) || 0;
    const available = getAvailableBags(sellLot);

    if (!sellForm.buyer_id) {
      alert(t("selectBuyer"));
      return;
    }
    if (bags <= 0) {
      alert(t("invalidBagsToSell"));
      return;
    }
    if (bags > available) {
      alert(t("insufficientBags", { available, bags }));
      return;
    }

    setIsSubmitting(true);
    try {
      const { grandTotal } = calcTotal();

      const payload = {
        date: sellForm.date,
        buyer_id: parseInt(sellForm.buyer_id),
        price_per_bag: sellForm.price_per_bag
          ? parseFloat(sellForm.price_per_bag)
          : null,
        currency: sellForm.currency,
        notes: sellForm.notes || null,
        certification: sellForm.certification || null,
        certification_bonus: sellForm.certification_bonus
          ? parseFloat(sellForm.certification_bonus)
          : null,
        lots: [
          {
            cleaning_id: sellLot.id,
            cleaning_nLot: sellLot.cleaning_nLot,
            bags_sold: bags,
            weight_sold: null,
          },
        ],
      };

      const res = await axios.post(
        "http://localhost:5000/api/selling",
        payload,
      );
      alert(
        t("saleRegistered", {
          lot: res.data.selling_nLot,
          currency: sellForm.currency,
          total: grandTotal.toFixed(2),
        }),
      );
      setIsSellOpen(false);
      fetchLots();
      navigate("/dashboard/traceability/manage-lot");
    } catch (err) {
      console.error("Errore vendita:", err);
      alert(t("savingError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLoss = async (e) => {
    e.preventDefault();
    if (isSubmitting || !lossLot) return;

    const bagsLost = parseInt(lossForm.bags_lost) || 0;
    const available = getAvailableBags(lossLot);

    if (bagsLost <= 0) {
      alert(t("invalidBagsToSell"));
      return;
    }
    if (bagsLost > available) {
      alert(t("loseMoreThanAvailable", { available }));
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/stock-adjustments", {
        cleaning_id: lossLot.id,
        bags_lost: bagsLost,
        date: lossForm.date,
        notes: lossForm.notes || null,
      });
      alert(t("lossRegistered", { lossLot, bagsLost }));
      setIsLossOpen(false);
      fetchLots();
    } catch (err) {
      console.error("Errore registrazione perdita:", err);
      alert(t("savingError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { baseTotal, bonusTotal, grandTotal } = calcTotal();

  return (
    <div className="form-container" style={{ maxWidth: "1000px" }}>
      <h2>{t("sellingTitle")}</h2>
      <p className="page-subtitle">{t("sellingSubtitle")}</p>

      {lots.length === 0 ? (
        <p className="empty-state">{t("noLotsAvailable")}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t("data")}</th>
              <th>{t("lot")}</th>
              <th>{t("type")}</th>
              <th>{t("bags")}</th>
              <th>{t("deposit")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => {
              const complete = isLotComplete(lot);
              const hasResidual =
                lot.status === "partial" && lot.partial_bags > 0;
              return (
                <tr key={lot.id}>
                  <td>{formatDate(lot.date)}</td>
                  <td>
                    <strong>{lot.cleaning_nLot}</strong>
                  </td>
                  <td>{lot.type || "—"}</td>
                  <td>{getAvailableBags(lot)}</td>
                  <td>
                    {lot.deposit || <span className="text-faint">—</span>}
                  </td>
                  <td>
                    <StatusBadge lot={lot} />
                  </td>
                  <td className="plots-actions-cell">
                    <button
                      className="action-button"
                      style={{
                        backgroundColor: "var(--color-edit)",
                        width: "auto",
                        marginTop: 0,
                        padding: "4px 10px",
                        fontSize: "0.82rem",
                        marginRight: "4px",
                      }}
                      onClick={() => handleOpenDetail(lot)}
                    >
                      {t("details")}
                    </button>
                    <button
                      className="action-button save"
                      style={{
                        width: "auto",
                        marginTop: 0,
                        padding: "4px 10px",
                        fontSize: "0.82rem",
                        marginRight: "4px",
                        opacity: lot.status === "sold" ? 0.4 : 1,
                      }}
                      onClick={() => handleOpenSell(lot)}
                      disabled={lot.status === "sold"}
                      title={
                        !complete
                          ? "Completa i dati in Stocking prima di vendere"
                          : ""
                      }
                    >
                      {complete ? t("sell") : ` ${t("⚠️ sell")}`}
                    </button>
                    {/* Bottone perdita — visibile solo se ci sono sacchi residui */}
                    {hasResidual && (
                      <button
                        className="action-button"
                        style={{
                          backgroundColor: "#e65100",
                          width: "auto",
                          marginTop: 0,
                          padding: "4px 10px",
                          fontSize: "0.82rem",
                        }}
                        onClick={() => handleOpenLoss(lot)}
                      >
                        📦 {t("loss")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal dettagli */}
      <Modal
        isOpen={isDetailOpen}
        onRequestClose={() => setIsDetailOpen(false)}
        contentLabel="Dettagli Lotto"
        className="modal-content"
        overlayClassName="modal"
      >
        {detailLot && (
          <>
            <div className="modal-header">
              <h2>
                {detailLot.cleaning_nLot} — {t("details")}
              </h2>
            </div>
            <div className="modal-body">
              <div className="info-section-title">{t("farmData")}</div>
              <DetailRow label={t("date")} value={formatDate(detailLot.date)} />
              <DetailRow
                label={t("volume")}
                value={
                  detailLot.volume
                    ? `${detailLot.volume.toLocaleString("it-IT")} L`
                    : null
                }
              />
              <DetailRow
                label={t("weight")}
                value={
                  detailLot.weight
                    ? `${detailLot.weight.toLocaleString("it-IT")} kg`
                    : null
                }
              />
              <DetailRow label={t("bags")} value={detailLot.bags} />
              <DetailRow
                label={t("humidity")}
                value={
                  detailLot.umidity != null ? `${detailLot.umidity}%` : null
                }
              />
              <DetailRow
                label={t("defects")}
                value={detailLot.cata != null ? `${detailLot.cata}%` : null}
              />
              <DetailRow
                label={t("peneira")}
                value={
                  detailLot.peneira != null ? `${detailLot.peneira}%` : null
                }
              />

              <div
                className="info-section-title"
                style={{ marginTop: "0.75rem" }}
              >
                {t("depositData")}
              </div>
              <DetailRow
                label={t("depositWeight")}
                value={
                  detailLot.weight_deposit
                    ? `${detailLot.weight_deposit.toLocaleString("it-IT")} kg`
                    : null
                }
              />
              <DetailRow
                label={t("depositHumidity")}
                value={
                  detailLot.umidity_deposit != null
                    ? `${detailLot.umidity_deposit}%`
                    : null
                }
              />
              <DetailRow
                label={t("depositCata")}
                value={
                  detailLot.cata_deposit != null
                    ? `${detailLot.cata_deposit}%`
                    : null
                }
              />
              <DetailRow
                label={t("depositPeneira")}
                value={
                  detailLot.peneira_deposit != null
                    ? `${detailLot.peneira_deposit}%`
                    : null
                }
              />
              <DetailRow label={t("bebida")} value={detailLot.bebida} />
              <DetailRow
                label={t("deposit")}
                value={detailLot.deposit || "Vendita diretta"}
              />

              {detailLot.status === "partial" && (
                <>
                  <div
                    className="info-section-title"
                    style={{ marginTop: "0.75rem" }}
                  >
                    {t("residueAvailable")}
                  </div>
                  <DetailRow
                    label={t("remainingBags")}
                    value={detailLot.partial_bags}
                  />
                  {detailLot.partial_weight && (
                    <DetailRow
                      label={t("remainingWeight")}
                      value={`${detailLot.partial_weight.toLocaleString("it-IT")} kg`}
                    />
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="action-button cancel"
                style={{ width: "auto" }}
                onClick={() => setIsDetailOpen(false)}
              >
                {t("close")}
              </button>
              <button
                className="action-button save"
                style={{ width: "auto" }}
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenSell(detailLot);
                }}
                disabled={detailLot.status === "sold"}
              >
                {t("sell")}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal vendita */}
      {/* Modal vendita */}
      <Modal
        isOpen={isSellOpen}
        onRequestClose={() => setIsSellOpen(false)}
        contentLabel={t("sellingTitle")}
        className="modal-content"
        overlayClassName="modal"
      >
        {sellLot && (
          <>
            <div className="modal-header">
              <h2>
                {t("saleTitle")} — {sellLot.cleaning_nLot}
              </h2>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmitSell}>
                <div
                  className="total-volume-box"
                  style={{ marginBottom: "1rem" }}
                >
                  {t("available")}:{" "}
                  <strong>{getAvailableBags(sellLot)} bags</strong>
                  {getAvailableWeight(sellLot) && (
                    <>
                      {" "}
                      ·{" "}
                      <strong>
                        {getAvailableWeight(sellLot).toLocaleString("it-IT")} kg
                      </strong>
                    </>
                  )}
                  {sellLot.peneira_deposit && (
                    <>
                      {" "}
                      · Peneira 17: <strong>{sellLot.peneira_deposit}%</strong>
                    </>
                  )}
                  {sellLot.bebida && (
                    <>
                      {" "}
                      · <strong>{sellLot.bebida}</strong>
                    </>
                  )}
                </div>

                <div className="info-section-title">{t("quantity")}</div>
                <label>
                  {t("bagsToSell")}:
                  <input
                    type="number"
                    min="1"
                    max={getAvailableBags(sellLot)}
                    value={bagsSold}
                    onChange={(e) => setBagsSold(e.target.value)}
                    required
                  />
                </label>

                <div className="info-section-title">{t("saleData")}</div>
                <label>
                  {t("date")}:
                  <input
                    type="date"
                    name="date"
                    value={sellForm.date}
                    min={sellMinDate}
                    max={today}
                    onChange={handleSellFormChange}
                    required
                  />
                </label>

                <label>
                  {t("buyer")}:
                  <select
                    name="buyer_id"
                    value={sellForm.buyer_id}
                    onChange={handleSellFormChange}
                    required
                  >
                    <option value="">{t("selectBuyer")}</option>
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {t("pricePerBag")}:
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <input
                      type="number"
                      name="price_per_bag"
                      value={sellForm.price_per_bag}
                      onChange={handleSellFormChange}
                      placeholder="Es. 280.00"
                      step="0.01"
                      min="0"
                      style={{ flex: 1 }}
                    />
                    <select
                      name="currency"
                      value={sellForm.currency}
                      onChange={handleSellFormChange}
                      style={{ width: "80px" }}
                    >
                      <option value="USD">USD</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </label>

                <div className="info-section-title">{t("certification")}</div>
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    marginBottom: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: 0,
                    }}
                  >
                    <input
                      type="radio"
                      name="certification"
                      value=""
                      checked={sellForm.certification === ""}
                      onChange={handleSellFormChange}
                    />
                    {t("noCertification")}
                  </label>
                  {CERTIFICATIONS.map((cert) => (
                    <label
                      key={cert}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: 0,
                      }}
                    >
                      <input
                        type="radio"
                        name="certification"
                        value={cert}
                        checked={sellForm.certification === cert}
                        onChange={handleSellFormChange}
                      />
                      {cert}
                    </label>
                  ))}
                </div>

                {sellForm.certification && (
                  <label>
                    {t("certBonus", {
                      cert: sellForm.certification,
                      currency: sellForm.currency,
                    })}
                    :
                    <input
                      type="number"
                      name="certification_bonus"
                      value={sellForm.certification_bonus}
                      onChange={handleSellFormChange}
                      placeholder="Es. 15.00"
                      step="0.01"
                      min="0"
                    />
                  </label>
                )}

                <label>
                  {t("notes")}:
                  <input
                    type="text"
                    name="notes"
                    value={sellForm.notes}
                    onChange={handleSellFormChange}
                    placeholder={t("notesPlaceholder")}
                  />
                </label>

                {bagsSold > 0 && sellForm.price_per_bag && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#f0f7ff",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-edit-border)",
                    }}
                  >
                    <div
                      className="info-section-title"
                      style={{ marginBottom: "0.5rem" }}
                    >
                      {t("summary")}
                    </div>
                    <div className="info-row">
                      <span className="info-label">
                        {t("bagsTimesPrice", {
                          bags: bagsSold,
                          price: sellForm.price_per_bag,
                          currency: sellForm.currency,
                        })}
                      </span>
                      <span className="info-value">
                        {sellForm.currency} {baseTotal.toFixed(2)}
                      </span>
                    </div>
                    {sellForm.certification && sellForm.certification_bonus && (
                      <div className="info-row">
                        <span className="info-label">
                          {t("certBonusRow", {
                            cert: sellForm.certification,
                            bags: bagsSold,
                            bonus: sellForm.certification_bonus,
                          })}
                        </span>
                        <span className="info-value text-success">
                          + {sellForm.currency} {bonusTotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div
                      className="info-row"
                      style={{
                        borderTop: "2px solid var(--color-edit-border)",
                        marginTop: "4px",
                        paddingTop: "4px",
                      }}
                    >
                      <span
                        className="info-label"
                        style={{ fontWeight: "700" }}
                      >
                        {t("total")}
                      </span>
                      <span
                        className="info-value"
                        style={{
                          fontSize: "1.1rem",
                          color: "var(--color-edit)",
                        }}
                      >
                        {sellForm.currency} {grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button cancel"
                    style={{ width: "auto" }}
                    onClick={() => setIsSellOpen(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="action-button save"
                    style={{ width: "auto" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("saving") : t("confirmSale")}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </Modal>

      {/* Modal perdita sacchi */}
      <Modal
        isOpen={isLossOpen}
        onRequestClose={() => setIsLossOpen(false)}
        contentLabel={t("registerLoss")}
        className="modal-content"
        overlayClassName="modal"
      >
        {lossLot && (
          <>
            <div className="modal-header">
              <h2>
                📦 {t("registerLoss")} — {lossLot.cleaning_nLot}
              </h2>
            </div>
            <div className="modal-body">
              <div
                className="total-volume-box"
                style={{
                  marginBottom: "1rem",
                  backgroundColor: "#fff3e0",
                  borderColor: "#ffcc80",
                }}
              >
                {t("residualBags")}:{" "}
                <strong>{getAvailableBags(lossLot)}</strong>
              </div>
              <form onSubmit={handleSubmitLoss}>
                <label>
                  {t("date")}:
                  <input
                    type="date"
                    value={lossForm.date}
                    onChange={(e) =>
                      setLossForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  {t("bagsLost")}:
                  <input
                    type="number"
                    min="1"
                    max={getAvailableBags(lossLot)}
                    value={lossForm.bags_lost}
                    onChange={(e) =>
                      setLossForm((prev) => ({
                        ...prev,
                        bags_lost: e.target.value,
                      }))
                    }
                    placeholder="Es. 2"
                    required
                  />
                </label>
                <label>
                  {t("notes")}:
                  <input
                    type="text"
                    value={lossForm.notes}
                    onChange={(e) =>
                      setLossForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={t("lossNotes")}
                  />
                </label>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="action-button cancel"
                    style={{ width: "auto" }}
                    onClick={() => setIsLossOpen(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="action-button"
                    style={{ width: "auto", backgroundColor: "#e65100" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("saving") : t("registerLoss")}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Selling;
