import React from "react";
import { useNavigate } from "react-router-dom";
import ProtectedLink from "../../../components/ProtectedLink";
import { useLang } from "../../../LanguageContext";
import "../Traceability.css";




const ManageLot = () => {
  const { t } = useLang();
  const navigate = useNavigate();

  const STEPS = [
  { label: t("newLot"),       path: "new-lot",      permission: "traceability" },
  { label: t("washDivide"), path: "wash-devide",  permission: "traceability" },
  { label: t("drying"),        path: "drying",        permission: "traceability" },
  { label: t("fermentation"),  path: "fermentation",  permission: "traceability" },
  { label: t("tulha"),       path: "resting",       permission: "traceability" },
  { label: t("cleaning"),      path: "cleaning",      permission: "traceability" },
  { label: t("stocking"),      path: "stocking",      permission: "stocking" },
  { label: t("selling"),       path: "selling",       permission: "selling" },
];

  return (
    <div className="form-container">
      <h2>{t("manageLot")}</h2>
      <p className="page-subtitle">{t("manageLotSubtitle")}</p>
      <div className="button-container-nav">
        {STEPS.map((step) => (
          <ProtectedLink key={step.path} permission={step.permission}>
            <button
              className="action-button"
              onClick={() => navigate(`/dashboard/traceability/manage-lot/${step.path}`)}
            >
              {step.label}
            </button>
          </ProtectedLink>
        ))}
      </div>
    </div>
  );
};

export default ManageLot;