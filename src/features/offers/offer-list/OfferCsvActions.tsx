"use client";

import s from "./offerList.module.scss";

export default function OfferCsvActions() {
  const handleExport = () => {
    window.location.href = "/api/offers?format=csv";
  };

  return (
    <div className={s.csvTools}>
      <div className={s.csvActions}>
        <button
          type="button"
          className={s.toolbarButton}
          onClick={handleExport}
        >
          Export offers CSV
        </button>
      </div>
      <p className={s.csvHint}>
        CSV headers: `offerKey,clientName,clientEmail,clientPhone,validUntil,notes,productName,quantity`
      </p>
    </div>
  );
}
