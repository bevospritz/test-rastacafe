// src/components/BackButton.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../LanguageContext";

const BackButton = ({ to }) => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <button
      type="button"
      className="back-button"
      onClick={() => to ? navigate(to) : navigate(-1)}      
    >
      ← {t("back")}
    </button>
  );
};

export default BackButton;