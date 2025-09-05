import { Oddzial } from "./Oddzialcard";
import { useMemo, useState, useCallback } from "react";
import { MAX_ARTIFACTS_PER_GENERAŁ, MAX_BANNERS_TOTAL, areBannersAllowed } from "./limits";
import pl from "./data/pl.json";
import en from "./data/en.json";

type SelectedUnit = {
  oddzial: Oddzial;
  count: number;
  id: string;
  type:
    | "podstawowy"
    | "elitarny"
    | "rzadki"
    | "unikalny"
    | "bohater_grupa"
    | "bohater_model"
    | "bohater_mag"
    | "bohater_generał";
  Spells?: { nazwa: string; koszt: number}[];
  Items?: { nazwa: string; koszt: number}[];
  Banners?: { nazwa: string; koszt: number}[];
  Artifacts?: { nazwa: string; koszt: number}[];
};

type Props = {
  selectedUnits: SelectedUnit[];
  gamePoints: number;
  totalPoints: number;
  canStartGame: boolean;
  onIncreaseUnit: (id: string) => void;
  onDecreaseUnit: (id: string) => void;
  onRemoveUnit: (id: string) => void;

  onAddSpells: (unitId: string, spell: { nazwa: string; koszt: number }) => void;
  onRemoveSpells: (unitId: string, spellName: string) => void;
  Spells: { nazwa: string; koszt: number }[];

  onAddItems: (unitId: string, item: { nazwa: string; koszt: number }) => void;
  onRemoveItems: (unitId: string, itemName: string) => void;
  Items: { nazwa: string; koszt: number }[];

  // required permission callback (parent must decide)
  canTakeItems: (unit: SelectedUnit) => boolean;

  onAddArtifacts?: (unitId: string, artifact: { nazwa: string; koszt: number }) => void;
  onRemoveArtifacts?: (unitId: string, artifactName: string) => void;
   Artifacts?: { nazwa: string; koszt: number }[];

  onAddBanners?: (unitId: string, banner: { nazwa: string; koszt: number }) => void;
  onRemoveBanners?: (unitId: string, bannerName: string) => void;
  Banners?: { nazwa: string; koszt: number }[];
  lang: "pl" | "en"; // <-- ADD THIS LINE
};

export function SelectedUnitsList({
  selectedUnits,
  gamePoints,
  totalPoints,
  canStartGame,
  onIncreaseUnit,
  onDecreaseUnit,
  onRemoveUnit,
  onAddSpells,
  onRemoveSpells,
  Spells,
  onAddItems,
  onRemoveItems,
  Items,
  canTakeItems, // now required
  Artifacts,
  Banners,
  onAddArtifacts,
  onRemoveArtifacts,
  onAddBanners,
  onRemoveBanners,
  lang, // <-- add lang here
}: Props) {

// Add index signature to allow string indexing
type TranslationMap = { [key: string]: string };
const translations: { pl: TranslationMap; en: TranslationMap } = { pl, en };

// Use the lang prop in your translation function:
const translate = useCallback(
  (key: string, params?: Record<string, string | number>) => {
    let str = translations[lang as "pl" | "en"][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  },
  [lang]
); // Translation function


  // Group units by type
  const groupedUnits = useMemo(() => {
    const typeOrder = [
      "podstawowy",
      "elitarny",
      "rzadki",
      "unikalny",
      "bohater_grupa",
      "bohater_generał",
      "bohater_mag",
      "bohater_model"
    ];
    const groups: { [type: string]: SelectedUnit[] } = {};
    selectedUnits.forEach(unit => {
      if (!groups[unit.type]) groups[unit.type] = [];
      groups[unit.type].push(unit);
    });
    // Flatten groups in typeOrder
    return typeOrder.flatMap(type => groups[type] || []);
  }, [selectedUnits]);

  // Army‑wide banner count (needed for disabling further banner choices)
  const totalArmyBanners = useMemo(
    () =>
      selectedUnits
        .filter(u => u.type === "bohater_grupa")
        .reduce((s, u) => s + (u.Banners?.length || 0), 0),
    [selectedUnits]
  );

  return (
    <div>
      <div className="mt-4 font-bold text-xl text-gray-900">
        {translate("pointsSummaryFull", { totalPoints, gamePoints })}
      </div>
      {!canStartGame && (
        <div className="text-red-600 font-semibold">
          {translate("mustSelectRequiredUnits")}
        </div>
      )}
      <div className="flex flex-col gap-2 items-start w-full max-w-md">
        <h2 className="font-bold text-lg mb-2 text-gray-900">
          {translate("selectedUnitsHeader")}
        </h2>
        {groupedUnits.length === 0 ? (
          <div className="text-gray-500">{translate("noUnitsSelected")}</div>
        ) : (
          groupedUnits.map((unit) => {
            // DEBUG: log unit type
            // console.log("Rendering unit type:", unit.type, unit.oddzial.nazwa);
            const maxSize = Number(unit.oddzial.maximum_unit_size) || 99;
            const minSize = Number(unit.oddzial.minimal_unit_size) || 1;
            // use parent-provided permission for general item types (magic items/spells)
            const showItems = canTakeItems(unit);
            
            // Per-unit counts / limits (used for disabling selects)
            const artifactCount = unit.Artifacts?.length || 0;
            const artifactSelectDisabled = artifactCount >= MAX_ARTIFACTS_PER_GENERAŁ;

            const bannerCountThisUnit = unit.Banners?.length || 0;
            const bannerSelectDisabled =
              !areBannersAllowed(gamePoints) ||
              totalArmyBanners >= MAX_BANNERS_TOTAL;

              // For mag limitations
              const maxSpellPoints = Number(unit.oddzial.max_spell_value) || 0;
              const maxSpells = Number(unit.oddzial.max_number_spells) || 0;
              const currentSpells = unit.Spells || [];
              const spellPointsUsed = currentSpells.reduce((sum, s) => sum + s.koszt, 0);
              const spellLimitReached = currentSpells.length >= maxSpells;
              const spellPointsLimitReached = spellPointsUsed >= maxSpellPoints;

              const maxItemPoints = Number(unit.oddzial.max_items_value) || 0;
              const maxItems = Number(unit.oddzial.max_number_items) || 0;
              const currentItems = unit.Items || [];
              const itemPointsUsed = currentItems.reduce((sum, i) => sum + i.koszt, 0);
              const itemLimitReached = currentItems.length >= maxItems;
              const itemPointsLimitReached = itemPointsUsed >= maxItemPoints;

             return (
               <div
                 key={unit.id}
                 className="border-b py-1 px-2 w-full bg-blue-50 text-gray-900"
                 style={{ fontSize: "1rem", minHeight: "36px" }}
               >
                 <div className="flex items-center justify-between">
                   <span className="font-bold w-8 text-center">{unit.count}</span>
                   <span className="mx-2 flex-1 truncate">
                     {/* Use translated unit name if available */}
                     {translate(unit.oddzial.nazwa) || unit.oddzial.nazwa}
                   </span>
                   <span className="font-semibold text-blue-700 w-16 text-center">
                     {unit.count * Number(unit.oddzial.punkty)} {translate("unitPoints")}
                   </span>
                   <button
                     className={`mx-1 bg-green-500 hover:bg-green-600 text-white font-bold rounded w-7 h-7 flex items-center justify-center ${
                       unit.count >= maxSize
                         ? "opacity-50 cursor-not-allowed"
                         : ""
                     }`}
                     onClick={() => onIncreaseUnit(unit.id)}
                     disabled={unit.count >= maxSize}
                     title={translate("add")}
                   >
                     +
                   </button>
                   <button
                     className={`mx-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded w-7 h-7 flex items-center justify-center ${
                       unit.count <= minSize
                         ? "opacity-50 cursor-not-allowed"
                         : ""
                     }`}
                     onClick={() => onDecreaseUnit(unit.id)}
                     disabled={unit.count <= minSize}
                     title={translate("subtract")}
                   >
                     –
                   </button>
                   <button
                     className="mx-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded w-7 h-7 flex items-center justify-center"
                     onClick={() => onRemoveUnit(unit.id)}
                     title={translate("delete")}
                   >
                     ×
                   </button>
                 </div>

                 {/* If the unit is a mage, show spell management */}
                 {unit.type === "bohater_mag" && onAddSpells && onRemoveSpells && Spells && (
                   <div className="ml-6 mt-2 mb-2 text-sm w-full">
                     <div className="font-semibold">{translate("spellsHeader")}</div>
                     <ul className="ml-4 list-disc">
                       {(unit.Spells || []).map((spell) => (
                         <li key={spell.nazwa} className="flex justify-between">
                           <span>
                             {translate(spell.nazwa) || spell.nazwa} ({spell.koszt} {translate("unitPoints")})
                           </span>
                           <button
                             className="ml-2 text-red-600"
                             onClick={() => onRemoveSpells(unit.id, spell.nazwa)}
                           >
                             X
                           </button>
                         </li>
                       ))}
                     </ul>
                     {/* Spell limitations messages */}
                     {(spellLimitReached || spellPointsLimitReached) && (
                       <div className="text-red-600 text-xs mb-1">
                         {spellLimitReached && translate("spellLimitReachedMsg", { maxSpells })}
                         {spellPointsLimitReached && translate("spellPointsLimitReachedMsg", { maxSpellPoints })}
                       </div>
                     )}
                     {/* Filter out already chosen spells */}
                     <select
                       className="mt-1 border rounded px-2 py-1"
                       defaultValue=""
                       disabled={spellLimitReached || spellPointsLimitReached}
                       onChange={(e) => {
                         const spellName = e.target.value;
                         if (!spellName) return;
                         const spell = Spells.find((s) => s.nazwa === spellName);
                         if (spell) onAddSpells(unit.id, spell);
                         e.target.value = ""; // reset select
                       }}
                     >
                       <option value="">{translate("addSpellOption")}</option>
                       {Spells.filter(s => !(unit.Spells || []).some(us => us.nazwa === s.nazwa)).map((s) => (
                         <option key={s.nazwa} value={s.nazwa}>
                           {translate(s.nazwa) || s.nazwa} ({s.koszt} {translate("unitPoints")})
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {/* Artifacts - render for Generał even if canTakeItems computed false elsewhere */}
                 {Artifacts && onAddArtifacts && onRemoveArtifacts && unit.type === "bohater_generał" && (
                   <div className="ml-6 mt-2 mb-2 text-sm w-full">
                     <div className="font-semibold flex items-center gap-2">
                       {translate("artifactsHeader")}
                       {artifactCount >= MAX_ARTIFACTS_PER_GENERAŁ && (
                         <span className="text-red-600 text-xs">
                           {translate("artifactLimitReachedMsg", { maxArtifacts: MAX_ARTIFACTS_PER_GENERAŁ })}
                         </span>
                       )}
                     </div>
                     <ul className="ml-4 list-disc">
                       {(unit.Artifacts || []).map((artifact) => (
                         <li key={artifact.nazwa} className="flex justify-between">
                           <span>
                             {translate(artifact.nazwa) || artifact.nazwa} ({artifact.koszt} {translate("unitPoints")})
                           </span>
                           <button
                             className="ml-2 text-red-600"
                             onClick={() => onRemoveArtifacts(unit.id, artifact.nazwa)}
                           >
                             X
                           </button>
                         </li>
                       ))}
                     </ul>
                     <select
                       className="mt-1 border rounded px-2 py-1 disabled:opacity-50"
                       disabled={artifactSelectDisabled}
                       onChange={(e) => {
                         const name = e.target.value;
                         if (!name) return;
                         const found = Artifacts.find(a => a.nazwa === name);
                         if (found) onAddArtifacts(unit.id, found);
                         e.target.value = "";
                       }}
                       defaultValue=""
                     >
                       <option value="">{translate("addArtifactOption")}</option>
                       {Artifacts.map((a) => (
                         <option key={a.nazwa} value={a.nazwa}>
                           {translate(a.nazwa) || a.nazwa} ({a.koszt} {translate("unitPoints")})
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {/* Banners - render for Grupa Dowódcza even if canTakeItems computed false elsewhere */}
                 {Banners && onAddBanners && onRemoveBanners && unit.type === "bohater_grupa" && (
                   <div className="ml-6 mt-2 mb-2 text-sm w-full">
                     <div className="font-semibold flex items-center gap-2">
                       {translate("bannersHeader")}
                       {!areBannersAllowed(gamePoints) && (
                         <span className="text-red-600 text-xs">{translate("bannerAvailableFromMsg")}</span>
                       )}
                       {areBannersAllowed(gamePoints) && totalArmyBanners >= MAX_BANNERS_TOTAL && (
                         <span className="text-red-600 text-xs">{translate("bannerArmyLimitReachedMsg", { maxBanners: MAX_BANNERS_TOTAL })}</span>
                       )}
                     </div>
                     <ul className="ml-4 list-disc">
                       {(unit.Banners || []).map((banner) => (
                         <li key={banner.nazwa} className="flex justify-between">
                           <span>
                             {translate(banner.nazwa) || banner.nazwa} ({banner.koszt} {translate("unitPoints")})
                           </span>
                           <button
                             className="ml-2 text-red-600"
                             onClick={() => onRemoveBanners(unit.id, banner.nazwa)}
                           >
                             X
                           </button>
                         </li>
                       ))}
                     </ul>
                     <select
                       className="mt-1 border rounded px-2 py-1 disabled:opacity-50"
                       disabled={bannerSelectDisabled}
                       onChange={(e) => {
                         const name = e.target.value;
                         if (!name) return;
                         const found = Banners.find(b => b.nazwa === name);
                         if (found) onAddBanners(unit.id, found);
                         e.target.value = "";
                       }}
                       defaultValue=""
                     >
                       <option value="">{translate("addBannerOption")}</option>
                       {Banners.map((b) => (
                         <option key={b.nazwa} value={b.nazwa}>
                           {translate(b.nazwa) || b.nazwa} ({b.koszt} {translate("unitPoints")})
                         </option>
                       ))}
                     </select>
                   </div>
                 )}

                 {/* Regular magic items (kept under showItems so spells/items permission still respected) */}
                 {showItems && (
                   <div className="ml-6 mt-2 mb-2 text-sm w-full">
                     <div className="font-semibold">{translate("magicItemsHeader")}</div>
                     <ul className="ml-4 list-disc">
                       {(unit.Items || []).map((item) => (
                         <li key={item.nazwa} className="flex justify-between">
                           <span>
                             {translate(item.nazwa) || item.nazwa} ({item.koszt} {translate("unitPoints")})
                           </span>
                           <button
                             className="ml-2 text-red-600"
                             onClick={() => onRemoveItems(unit.id, item.nazwa)}
                           >
                             X
                           </button>
                         </li>
                       ))}
                     </ul>
                     {/* Item limitations messages */}
                     {(itemLimitReached || itemPointsLimitReached) && (
                       <div className="text-red-600 text-xs mb-1">
                         {itemLimitReached && translate("itemLimitReachedMsg", { maxItems })}
                         {itemPointsLimitReached && translate("itemPointsLimitReachedMsg", { maxItemPoints })}
                       </div>
                     )}
                     {/* Filter out already chosen items */}
                     <select
                       className="mt-1 border rounded px-2 py-1"
                       defaultValue=""
                       disabled={itemLimitReached || itemPointsLimitReached}
                       onChange={(e) => {
                         const itemName = e.target.value;
                         if (!itemName) return;
                         const item = Items.find((i) => i.nazwa === itemName);
                         if (item) onAddItems(unit.id, item);
                         e.target.value = ""; // reset select
                       }}
                     >
                       <option value="">{translate("addItemOption")}</option>
                       {Items.filter(i => !(unit.Items || []).some(ui => ui.nazwa === i.nazwa)).map((i) => (
                         <option key={i.nazwa} value={i.nazwa}>
                           {translate(i.nazwa) || i.nazwa} ({i.koszt} {translate("unitPoints")})
                         </option>
                       ))}
                     </select>
                   </div>
                 )}
               </div>
             );
           })
         )}

         {canStartGame && (
           <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold mt-2">
             {translate("startGameButton")}
           </button>
         )}
       </div>
     </div>
   );
}