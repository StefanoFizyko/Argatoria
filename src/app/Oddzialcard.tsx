import { useState } from "react";

export type Oddzial = {
  nazwa: string;
  punkty: string;
  typ?: string; // for bohaterowie: "grupa" | "model" | "mag" | "generał"
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

export function OddzialCard({
  oddzial,
  bg,
  onAdd,
  addDisabled,
}: {
  oddzial: Oddzial;
  bg: string;
  onAdd?: () => void;
  addDisabled?: boolean;
}) {
  const [showZasady, setShowZasady] = useState(false);

  const zasady = oddzial._zasady_specjalne ??  [];

  return (
    <div
      className={`border p-2 rounded mb-2 w-full ${bg} text-gray-900 flex items-center`}
    >
      <div className="flex-1">


        <div className="font-bold mb-2">{oddzial.nazwa}</div>

{/* Always show points */}
<div className="font-semibold text-blue-700 mb-2">
  Punkty: {oddzial.punkty}
</div>


{/* Show typ for bohaterowie */}
{oddzial.typ && (
  <div className="text-sm italic text-gray-600 mb-1">
    Typ: {oddzial.typ}
  </div>
)}



{/* Only show stats if they exist */}
{(oddzial._LD || oddzial._M || oddzial._WS || oddzial._S) && (
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
        {!oddzial.typ && (oddzial.minimal_unit_size || oddzial.maximum_unit_size) && (
  <div className="text-xs text-gray-500 mb-2">
    Min: {oddzial.minimal_unit_size ?? "-"} / Max:{" "}
    {oddzial.maximum_unit_size ?? "-"}
  </div>
)}

        {/* Special rules */}
        {zasady.length > 0 && (
          <>
            <button
              className="text-sm text-blue-600"
              onClick={() => setShowZasady(v => !v)}
            >
              {showZasady
                ? "Ukryj zasady specjalne"
                : "Pokaż zasady specjalne"}
            </button>
            {showZasady && (
              <div>
                Zasady specjalne:
                <ul className="list-disc ml-6">
                  {zasady.map((zasada, i) => (
                    <li key={i}>{zasada}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {onAdd && (
        <button
          className={`ml-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center ${
            addDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={onAdd}
          title="Dodaj jednostkę"
          disabled={addDisabled}
        >
          +
        </button>
      )}
    </div>
  );
}