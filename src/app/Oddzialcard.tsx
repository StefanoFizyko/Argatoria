import React, { useState } from "react";

export type Oddzial = {
  nazwa: string;
  punkty: string;
  typ?: string;
  minimal_unit_size?: number;
  maximum_unit_size?: number;
  _LD?: string;
  _M?: string;
  _WS?: string;
  _S?: string;
  _T?: string;
  _A?: string;
  _W?: string;
  _zasady_specjalne?: string[];
  max_spell_value: string;
  max_number_spells: string;
  max_number_items: string;
  max_items_value: string;
};

export const OddzialCard = React.memo(function OddzialCard({
  oddzial,
  bg,
  onAdd,
  addDisabled,
  t,
  lang,
}: {
  oddzial: Oddzial;
  bg: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: "pl" | "en";
}) {
  const [showDetails, setShowDetails] = useState(false);

  const zasady = oddzial._zasady_specjalne ?? [];

  return (
    <div className="flex items-center w-full mb-2">
      {/* Card box */}
      <div
        className={`border p-2 rounded ${bg} text-gray-900 flex-1`}
        style={{ minWidth: 0 }}
      >
        {/* Name and points in one row */}
        <div className="flex flex-row items-center justify-between mb-2">
          <span className="font-bold">{oddzial.nazwa}</span>
          <span className="font-semibold text-blue-700">
            {t("unitPoints")}: {oddzial.punkty}
          </span>
        </div>

        {/* Expand/collapse button */}
        <button
          className="text-sm text-blue-600 mb-2"
          onClick={() => setShowDetails(v => !v)}
          aria-expanded={showDetails}
        >
          {showDetails ? t("hideDetails") : t("showDetails")}
        </button>

        {/* Details shown only when expanded */}
        {showDetails && (
          <div>
            {/* Stats */}
            {(oddzial._LD || oddzial._M || oddzial._WS || oddzial._S || oddzial._T || oddzial._A || oddzial._W) && (
              <div className="flex flex-row gap-4 mb-2">
                {oddzial._LD && <div>LD: {oddzial._LD}</div>}
                {oddzial._M && <div>M: {oddzial._M}</div>}
                {oddzial._WS && <div>WS: {oddzial._WS}</div>}
                {oddzial._S && <div>S: {oddzial._S}</div>}
                {oddzial._T && <div>T: {oddzial._T}</div>}
                {oddzial._A && <div>A: {oddzial._A}</div>}
                {oddzial._W && <div>W: {oddzial._W}</div>}
              </div>
            )}

            {/* Min/max info only if present */}
            {(oddzial.minimal_unit_size || oddzial.maximum_unit_size) && (
              <div className="text-xs text-gray-500 mb-2">
                {t("minMax", {
                  min: oddzial.minimal_unit_size ?? "-",
                  max: oddzial.maximum_unit_size ?? "-",
                })}
              </div>
            )}

            {/* Special rules */}
            {zasady.length > 0 && (
              <div>
                <span className="font-semibold">{t("specialRulesUnit")}</span>
                <ul className="list-disc ml-6">
                  {zasady.map((zasada, i) => (
                    <li key={i}>{zasada}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plus button outside the box, always reserve space */}
      <div style={{ width: "2.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {onAdd ? (
          <button
            className={`bg-green-500 hover:bg-green-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center ${
              addDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={onAdd}
            title={t("addUnit")}
            disabled={addDisabled}
          >
            +
          </button>
        ) : (
          // Empty placeholder to keep height/width
          <span style={{ display: "inline-block", width: "2rem", height: "2rem" }} />
        )}
      </div>
    </div>
  );
});