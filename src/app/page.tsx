"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import unitsData from "./data/units2.json";
import SpellsData from "./data/spells.json";
import ItemsData from "./data/magic_items.json"; // regular items (already present in your file)
import ArtifactsData from "./data/artifacts.json";
import BannersData from "./data/magical_banners.json";
import { Oddzial, OddzialCard } from "./Oddzialcard";
import { FrakcjeList } from "./FrakcjeList";
import { SelectedUnitsList } from "./selectedUnitsList";
import {
  getMinPodstawowe,
  getMaxRzadkie,
  getMaxUnikalne,
  getGrupaDowodczaLimits,
  getCzempionLimits,
  // ENFORCE: 1 mag per every full 500 points
  getMagLimit,
  MIN_BOHATEROWIE_TOTAL,
  MAX_GENERAŁ,
  MAX_ARTIFACTS_PER_GENERAŁ,
  MAX_BANNERS_TOTAL,
  areBannersAllowed,
} from "./limits";

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
    | "bohater_mag"
    | "bohater_generał"
    | "bohater_model";
  Spells?: { nazwa: string; koszt: number }[];
  Items?: { nazwa: string; koszt: number }[];
  Artifacts?: { nazwa: string; koszt: number }[];
  Banners?: { nazwa: string; koszt: number }[];
};

// Define a type for the frakcje object
type FrakcjeData = {
  [key: string]: {
    special_rule?: string | string[];
    flavor_text?: string[] | string;
    ["oddziały podstawowe"]?: Oddzial[];
    ["oddziały elitarne"]?: Oddzial[];
    ["oddziały rzadkie"]?: Oddzial[];
    ["oddziały unikalne"]?: Oddzial[];
    ["bohaterowie"]?: Oddzial[];
    // ...other possible keys
  };
};

export default function Home() {
  const [step, setStep] = useState<"setup" | "frakcja" | "oddzialy">("setup");
  const [selectedFrakcja, setSelectedFrakcja] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<SelectedUnit[]>([]);
  const [gamePoints, setGamePoints] = useState<number>(800);
  const [showArmyRules, setShowArmyRules] = useState(false);
  const router = useRouter();

  const frakcjeNames = useMemo(() => Object.keys(unitsData.frakcje ?? {}), []);
  const selectedFrakcjaData = useMemo(
    () => selectedFrakcja ? ((unitsData.frakcje as unknown) as FrakcjeData)[selectedFrakcja] : null,
    [selectedFrakcja]
  );
  const podstawoweOddzialy = useMemo(
    () => selectedFrakcjaData?.["oddziały podstawowe"] ?? [],
    [selectedFrakcjaData]
  );
  const elitarneOddzialy = useMemo(
    () => selectedFrakcjaData?.["oddziały elitarne"] ?? [],
    [selectedFrakcjaData]
  );
  const rzadkieOddzialy = useMemo(
    () => selectedFrakcjaData?.["oddziały rzadkie"] ?? [],
    [selectedFrakcjaData]
  );
  const unikalneOddzialy = useMemo(
    () => selectedFrakcjaData?.["oddziały unikalne"] ?? [],
    [selectedFrakcjaData]
  );
  const bohaterowie = useMemo(
    () => selectedFrakcjaData?.["bohaterowie"] ?? [],
    [selectedFrakcjaData]
  );

  const allSpells = useMemo(() => SpellsData.Spells, []);
  const allItems = useMemo(() => ItemsData.Items, []);
  // FIX: load artifacts array safely (allow different JSON shapes)
  const allArtifacts = useMemo(
    () => ArtifactsData?.Artifacts ?? [],
    []
  );
  const allBanners = useMemo(() => BannersData.Banners, []);

  const handleSetupNext = () => setStep("frakcja");

  const handleFrakcjaClick = (frakcja: string) => {
    setSelectedFrakcja(frakcja);
    setStep("oddzialy");
    setSelectedUnits([]);
  };

  const handleBack = () => {
    setStep("frakcja");
    setSelectedFrakcja(null);
    setSelectedUnits([]);
  };

  const handleAddPodstawowy = useCallback((oddzial: Oddzial) => {
    const minSize = Number(oddzial.minimal_unit_size) || 1;
    setSelectedUnits((prev) => [
      ...prev,
      {
        oddzial,
        count: minSize,
        id: oddzial.nazwa + "_" + Math.random().toString(36).slice(2, 8),
        type: "podstawowy",
      },
    ]);
  }, []);

  const handleAddElitarny = useCallback(
    (oddzial: Oddzial) => {
      const podstawoweCount = selectedUnits.filter(
        (u) => u.type === "podstawowy"
      ).length;
      const elitarneCount = selectedUnits.filter(
        (u) => u.type === "elitarny"
      ).length;
      if (elitarneCount >= podstawoweCount) return;
      const minSize = Number(oddzial.minimal_unit_size) || 1;
      setSelectedUnits((prev) => [
        ...prev,
        {
          oddzial,
          count: minSize,
          id: oddzial.nazwa + "_" + Math.random().toString(36).slice(2, 8),
          type: "elitarny",
        },
      ]);
    },
    [selectedUnits]
  );

  const handleAddRzadki = useCallback(
    (oddzial: Oddzial) => {
      const rzadkieCount = selectedUnits.filter((u) => u.type === "rzadki").length;
      const maxRzadkie = getMaxRzadkie(gamePoints);
      if (rzadkieCount >= maxRzadkie) return;
      const minSize = Number(oddzial.minimal_unit_size) || 1;
      setSelectedUnits((prev) => [
        ...prev,
        {
          oddzial,
          count: minSize,
          id: oddzial.nazwa + "_" + Math.random().toString(36).slice(2, 8),
          type: "rzadki",
        },
      ]);
    },
    [selectedUnits, gamePoints]
  );

  const handleAddUnikalny = useCallback(
    (oddzial: Oddzial) => {
      const unikalneCount = selectedUnits.filter((u) => u.type === "unikalny").length;
      const maxUnikalne = getMaxUnikalne(gamePoints);
      if (unikalneCount >= maxUnikalne) return;
      const minSize = Number(oddzial.minimal_unit_size) || 1;
      setSelectedUnits((prev) => [
        ...prev,
        {
          oddzial,
          count: minSize,
          id: oddzial.nazwa + "_" + Math.random().toString(36).slice(2, 8),
          type: "unikalny",
        },
      ]);
    },
    [selectedUnits, gamePoints]
  );

  const handleAddBohater = useCallback((oddzial: Oddzial) => {
    const minSize = Number(oddzial.minimal_unit_size) || 1;
    let subtype = "model";
    if (oddzial.typ) {
      const typLower = oddzial.typ.toLowerCase();
      if (typLower.includes("grupa")) subtype = "grupa";
      else if (typLower.includes("mag")) subtype = "mag";
      else if (typLower.includes("generał")) subtype = "generał";
    }
    setSelectedUnits((prev) => [
      ...prev,
      {
        oddzial,
        count: minSize,
        id: oddzial.nazwa + "_" + Math.random().toString(36).slice(2, 8),
        type: `bohater_${subtype}` as
          | "bohater_grupa"
          | "bohater_mag"
          | "bohater_generał"
          | "bohater_model",
      },
    ]);
  }, []);

  // ✅ Spell handling
  const handleAddSpells = (
    unitId: string,
    spell: { nazwa: string; koszt: number}
  ) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;

        const maxPoints = Number(u.oddzial.max_spell_value) || 0;
        const maxSpells = Number(u.oddzial.max_number_spells) || 0;
        const currentSpells = u.Spells || [];
        const totalPoints = currentSpells.reduce(
          (sum, s) => sum + s.koszt,
          0
        );

        if (currentSpells.length >= maxSpells) return u;
        if (totalPoints + spell.koszt > maxPoints) return u;

        return { ...u, Spells: [...currentSpells, spell] };
      })
    );
  };

  const handleRemoveSpell = (unitId: string, spellName: string) => {
    setSelectedUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              Spells: (u.Spells || []).filter((s) => s.nazwa !== spellName),
            }
          : u
      )
    );
  };

  // ✅ Magic Items handling
  const handleAddItem = (
    unitId: string,
    item: { nazwa: string; koszt: number }
  ) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;

        const maxPoints = Number(u.oddzial.max_items_value) || 0;
        const maxItems = Number(u.oddzial.max_number_items) || 0;
        const currentItems = u.Items || [];
        const totalPoints = currentItems.reduce(
          (sum, s) => sum + s.koszt,
          0
        );

        if (currentItems.length >= maxItems) return u;
        if (totalPoints + item.koszt > maxPoints) return u;

        return { ...u, Items: [...currentItems, item] };
      })
    );
  };

  const handleRemoveItem = (unitId: string, itemName: string) => {
    setSelectedUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              Items: (u.Items || []).filter((i) => i.nazwa !== itemName),
            }
          : u
      )
    );
  };

  // Corrected handlers for adding/removing artifacts and banners (similar to items/spells)
  const handleAddArtifact = (
    unitId: string,
    artifact: { nazwa: string; koszt: number }
  ) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        // Only allow for generals
        if (u.type !== "bohater_generał") return u;

        const maxPoints = Number(u.oddzial.max_items_value) || 0;
        const maxArtifacts = MAX_ARTIFACTS_PER_GENERAŁ;
        const currentArtifacts = u.Artifacts || [];
        const totalPoints = currentArtifacts.reduce((sum, a) => sum + a.koszt, 0);

        if (currentArtifacts.length >= maxArtifacts) return u;
        if (maxPoints > 0 && totalPoints + artifact.koszt > maxPoints) return u;

        return { ...u, Artifacts: [...currentArtifacts, artifact] };
      })
    );
  };

  const handleRemoveArtifact = (unitId: string, artifactName: string) => {
    setSelectedUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              Artifacts: (u.Artifacts || []).filter((a) => a.nazwa !== artifactName),
            }
          : u
      )
    );
  };

  const handleAddBanner = (
    unitId: string,
    banner: { nazwa: string; koszt: number }
  ) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        // Only allow for grupa dowódcza units
        if (u.type !== "bohater_grupa") return u;

        // Army-wide banners count (recompute per update)
        const armyBanners = prev
          .filter(x => x.type === "bohater_grupa")
          .reduce((s, x) => s + ((x.Banners || []).length), 0);

        const maxPoints = Number(u.oddzial.max_items_value) || 0;
        const maxBannersPerUnit = 1; // typically one banner per grupa unit, enforce at unit level
        const currentBanners = u.Banners || [];
        const totalPoints = currentBanners.reduce((sum, b) => sum + b.koszt, 0);

        if (currentBanners.length >= maxBannersPerUnit) return u;
        if (armyBanners >= MAX_BANNERS_TOTAL) return u; // enforce global limit
        if (maxPoints > 0 && totalPoints + banner.koszt > maxPoints) return u;

        return { ...u, Banners: [...currentBanners, banner] };
      })
    );
  };

  const handleRemoveBanner = (unitId: string, bannerName: string) => {
    setSelectedUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              Banners: (u.Banners || []).filter((b) => b.nazwa !== bannerName),
            }
          : u
      )
    );
  };

  // compute current banners count across all Grupa Dowódcza units
  const grupaDowodczaBannersCount = selectedUnits
    .filter((u) => u.type === "bohater_grupa")
    .reduce((sum, u) => sum + ((u.Banners || []).length), 0);

  // per-unit permission function (single source of truth)
  // Regular magic Items and Spells are only for mages.
  function canTakeItems(unit: SelectedUnit) {
    return unit.type === "bohater_mag";
  }
function canTakeArtifacts(unit: SelectedUnit) {
  return unit.type === "bohater_generał";
}
function canTakeBanner(unit: SelectedUnit) {
  return unit.type === "bohater_grupa";
}
// --- LIMITS ---
const minPodstawowe = getMinPodstawowe(gamePoints);
const maxRzadkie = getMaxRzadkie(gamePoints);
const maxUnikalne = getMaxUnikalne(gamePoints);
const [minGrupa, maxGrupa] = getGrupaDowodczaLimits(gamePoints);
const [minCzempion, maxCzempion] = getCzempionLimits(gamePoints);
// ENFORCE: 1 mag per every full 500 points
const maxMag = Math.floor(gamePoints / 500);

// --- COUNTS ---
  const podstawoweCount = selectedUnits.filter(u => u.type === "podstawowy").length;
  const elitarneCount = selectedUnits.filter(u => u.type === "elitarny").length;
  const rzadkieCount = selectedUnits.filter(u => u.type === "rzadki").length;
  const unikalneCount = selectedUnits.filter(u => u.type === "unikalny").length;
  const maxElitarne = podstawoweCount;

  const bohaterowieUnits = selectedUnits.filter(u => u.type.startsWith("bohater"));
  const generałCount = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("generał")).length;
  const grupaDowodczaCount = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("grupa")).length;
  const czempionCount = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("czempion")).length;
  const magCount = bohaterowieUnits.filter(u => u.type === "bohater_mag").length;
  const bohaterowieTotal = bohaterowieUnits.length;



  // Count artifacts for Generał
  const generałUnits = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("generał"));
  const generałArtifacts = generałUnits.reduce((sum, u) => sum + (u.Artifacts?.length || 0), 0);

  // Count banners for Grupa Dowódcza
  const grupaDowodczaUnits = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("grupa"));
  const grupaDowodczaBanners = grupaDowodczaUnits.reduce((sum, u) => sum + (u.Banners?.length || 0), 0);


  // --- VALIDATION ---
  const bohaterowieValid =
    generałCount <= MAX_GENERAŁ &&
    grupaDowodczaCount >= minGrupa &&
    grupaDowodczaCount <= maxGrupa &&
    czempionCount >= minCzempion &&
    czempionCount <= maxCzempion &&
    magCount <= maxMag &&
    bohaterowieTotal >= MIN_BOHATEROWIE_TOTAL;

  // Update totalPoints calculation to include spells, items, artifacts, banners
  const totalPoints = selectedUnits.reduce(
    (sum, unit) =>
      sum +
      unit.count * Number(unit.oddzial.punkty) +
      (unit.Spells?.reduce((s, spell) => s + spell.koszt, 0) || 0) +
      (unit.Items?.reduce((s, item) => s + item.koszt, 0) || 0) +
      (unit.Artifacts?.reduce((s, artifact) => s + artifact.koszt, 0) || 0) +
      (unit.Banners?.reduce((s, banner) => s + banner.koszt, 0) || 0),
    0
  );

  const canStartGame =
    podstawoweCount >= minPodstawowe &&
    elitarneCount >= 2 &&
    elitarneCount <= maxElitarne &&
    rzadkieCount <= maxRzadkie &&
    unikalneCount <= maxUnikalne &&
    totalPoints <= gamePoints &&
    bohaterowieValid;

  // Validation for items
  const canGenerałTakeItem = generałArtifacts < MAX_ARTIFACTS_PER_GENERAŁ;
  const canGrupaTakeBanner = areBannersAllowed(gamePoints) && grupaDowodczaBanners < MAX_BANNERS_TOTAL;

  // Add missing handler for increasing unit count
  const handleIncreaseUnit = (id: string) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        const maxSize = Number(u.oddzial.maximum_unit_size) || 99;
        return u.id === id && u.count < maxSize
          ? { ...u, count: u.count + 1 }
          : u;
      })
    );
  };

  // Add missing handler for decreasing unit count
  const handleDecreaseUnit = (id: string) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        const minSize = Number(u.oddzial.minimal_unit_size) || 1;
        return u.id === id && u.count > minSize
          ? { ...u, count: u.count - 1 }
          : u;
      })
    );
  };

  // Add missing handler for removing unit
  const handleRemoveUnit = (id: string) => {
    setSelectedUnits((prev) => prev.filter((u) => u.id !== id));
  };

  // Export handler: save data to localStorage and navigate
  const handleExportArmy = () => {
    const exportData = {
      selectedUnits,
      selectedFrakcja,
      selectedFrakcjaData,
      gamePoints,
      totalPoints,
    };
    localStorage.setItem("armyExport", JSON.stringify(exportData));
    router.push("/export");
  };

  return (
    <div className="flex flex-row gap-8 w-full min-h-screen p-4 bg-white text-gray-900">
      {/* Left column */}
      <div
        className="flex flex-col gap-4 items-start"
        style={{ width: "50%" }}
      >
        {step === "setup" && (
          <div>
            <h2 className="font-bold text-lg mb-2 text-gray-900">
              Ustawienia gry
            </h2>
            <label className="mb-2 block">
              Punkty gry:
              <input
                type="number"
                min={100}
                max={5000}
                value={gamePoints}
                onChange={(e) => setGamePoints(Number(e.target.value))}
                className="ml-2 border rounded px-2 py-1 w-24"
              />
            </label>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              onClick={handleSetupNext}
            >
              Dalej
            </button>
          </div>
        )}

        {step === "frakcja" && (
          <>
            <FrakcjeList
              frakcjeNames={frakcjeNames}
              onSelect={handleFrakcjaClick}
            />
          </>
        )}

        {step === "oddzialy" && selectedFrakcjaData && (
          <>
            <h2 className="font-bold text-lg mb-2 text-gray-900">
              Oddziały frakcji: {selectedFrakcja}
            </h2>

            {/* Army special rules bullet points */}
            {Array.isArray(selectedFrakcjaData.special_rule) && selectedFrakcjaData.special_rule.length > 0 && (
              <>
                <button
                  className="text-sm text-blue-600 mb-1"
                  onClick={() => setShowArmyRules(v => !v)}
                >
                  {showArmyRules
                    ? "Ukryj zasady armii"
                    : "Pokaż zasady armii"}
                </button>
                {showArmyRules && (
                  <div className="text-sm text-gray-500 mb-1">
                    Zasady armii:
                    <ul className="list-disc ml-6">
                      {selectedFrakcjaData.special_rule.map((rule: string, i: number) => (
                        <li key={i}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* flavor_text and single special_rule fallback */}
            {typeof selectedFrakcjaData.special_rule === "string" && (
              <div className="mt-2 mb-0.5 text-gray-500 text-sm whitespace-pre-line">
                {selectedFrakcjaData.special_rule}
                {Array.isArray(selectedFrakcjaData.flavor_text)
                  ? "\n" + selectedFrakcjaData.flavor_text.join("\n")
                  : selectedFrakcjaData.flavor_text || ""}
              </div>
            )}

            <h3 className="font-semibold mt-1 mb-1 text-gray-900">
              Oddziały podstawowe (minimum {minPodstawowe} oddziały wymagane):
            </h3>
            {podstawoweOddzialy.map((oddzial: Oddzial, idx: number) => (
              <OddzialCard
                key={oddzial.nazwa + idx}
                oddzial={oddzial}
                bg="bg-gray-100"
                onAdd={() => handleAddPodstawowy(oddzial)}
              />
            ))}

            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              Oddziały elitarne (minimum 2 oddziały w armii, maximum{" "}
              {maxElitarne} oddziały):
            </h3>
            {elitarneOddzialy.map((oddzial: Oddzial, idx: number) => (
              <OddzialCard
                key={oddzial.nazwa + idx}
                oddzial={oddzial}
                bg="bg-gray-200"
                onAdd={
                  elitarneCount < maxElitarne
                    ? () => handleAddElitarny(oddzial)
                    : undefined
                }
                addDisabled={elitarneCount >= maxElitarne}
              />
            ))}

            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              Oddziały rzadkie (max {maxRzadkie} w armii):
            </h3>
            {rzadkieOddzialy.map((oddzial: Oddzial, idx: number) => (
              <OddzialCard
                key={oddzial.nazwa + idx}
                oddzial={oddzial}
                bg="bg-yellow-100"
                onAdd={
                  rzadkieCount < maxRzadkie
                    ? () => handleAddRzadki(oddzial)
                    : undefined
                }
                addDisabled={rzadkieCount >= maxRzadkie}
              />
            ))}

            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              Oddziały unikalne (max {maxUnikalne} w armii):
            </h3>
            {unikalneOddzialy.map((oddzial: Oddzial, idx: number) => (
              <OddzialCard
                key={oddzial.nazwa + idx}
                oddzial={oddzial}
                bg="bg-pink-100"
                onAdd={
                  unikalneCount < maxUnikalne
                    ? () => handleAddUnikalny(oddzial)
                    : undefined
                }
                addDisabled={unikalneCount >= maxUnikalne}
              />
            ))}

            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              Bohaterowie:
            </h3>
            <div className="text-xs text-gray-600 mb-2">
              Limit: {MAX_GENERAŁ} Generał, {minGrupa}-{maxGrupa} Grupa Dowódcza, {minCzempion}-{maxCzempion} Czempion, max {maxMag} Mag, min {MIN_BOHATEROWIE_TOTAL} bohaterowie w armii
            </div>
            {!bohaterowieValid && (
              <div className="text-red-600 text-xs mb-2">
                Naruszenie limitów bohaterów: 
                {generałCount > MAX_GENERAŁ && " Tylko jeden Generał dozwolony."}
                {grupaDowodczaCount < minGrupa && ` Minimum ${minGrupa} Grupa Dowódcza.`}
                {grupaDowodczaCount > maxGrupa && ` Maksimum ${maxGrupa} Grupa Dowódcza.`}
                {czempionCount < minCzempion && ` Minimum ${minCzempion} Czempion.`}
                {czempionCount > maxCzempion && ` Maksimum ${maxCzempion} Czempion.`}
                {magCount > maxMag && ` Maksimum ${maxMag} Mag.`}
                {bohaterowieTotal < MIN_BOHATEROWIE_TOTAL && ` Minimum ${MIN_BOHATEROWIE_TOTAL} bohaterowie w armii.`}
              </div>
            )}
            {bohaterowie.map((oddzial: Oddzial, idx: number) => {
              let addDisabled = false;
              if (oddzial.typ?.toLowerCase().includes("generał") && generałCount >= MAX_GENERAŁ) addDisabled = true;
              if (oddzial.typ?.toLowerCase().includes("grupa") && grupaDowodczaCount >= maxGrupa) addDisabled = true;
              if (oddzial.typ?.toLowerCase().includes("czempion") && czempionCount >= maxCzempion) addDisabled = true;
              // ENFORCE mage limit
              if (oddzial.typ?.toLowerCase().includes("mag") && magCount >= maxMag) addDisabled = true;
              // Allow items for Generał and Grupa Dowódcza if limits allow
              let canTakeItems = false;
              if (oddzial.typ?.toLowerCase().includes("generał")) {
                canTakeItems = true;
              }
              if (oddzial.typ?.toLowerCase().includes("grupa")) {
                canTakeItems = canGrupaTakeBanner;
              }
              return (
                <OddzialCard
                  key={oddzial.nazwa + idx}
                  oddzial={oddzial}
                  bg="bg-green-100"
                  onAdd={() => handleAddBohater(oddzial)}
                  addDisabled={addDisabled}
                />
              );
            })}
            <button
              className="mt-4 bg-gray-100 text-black border border-black font-mono font-semibold px-2 py-1 rounded transition hover:bg-gray-200 w-auto text-sm"
              onClick={handleBack}
            >
              Powrót do frakcji
            </button>
          </>
        )}
      </div>

      {/* Right column */}
      <div className="flex flex-col w-1/2">
        {/* Editable points input always visible */}
        <div className="mb-2 flex items-center gap-10">
          <label className="font-semibold text-gray-900">
            Punkty gry:
            <input
              type="number"
              min={100}
              max={5000}
              value={gamePoints}
              onChange={(e) => setGamePoints(Number(e.target.value))}
              className="ml-2 border rounded px-2 py-1 w-24"
              style={{ fontWeight: "normal" }}
            />
          </label>
        </div>
        <SelectedUnitsList
          selectedUnits={selectedUnits}
          gamePoints={gamePoints}
          totalPoints={totalPoints}
          canStartGame={canStartGame}
          onIncreaseUnit={handleIncreaseUnit}
          onDecreaseUnit={handleDecreaseUnit}
          onRemoveUnit={handleRemoveUnit}
          onAddSpells={handleAddSpells}
          onRemoveSpells={handleRemoveSpell}
          Spells={allSpells}
          onAddItems={handleAddItem}
          onRemoveItems={handleRemoveItem}
          Items={allItems}
          Artifacts={allArtifacts}
          onAddArtifacts={handleAddArtifact}
          onRemoveArtifacts={handleRemoveArtifact}
          Banners={allBanners}
          onAddBanners={handleAddBanner}
          onRemoveBanners={handleRemoveBanner}
          canTakeItems={canTakeItems}
        />
        {/* Export button */}
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded font-bold mt-4"
          onClick={handleExportArmy}
          disabled={selectedUnits.length === 0}
        >
          Eksportuj armię (PDF/JPG)
        </button>
      </div>
    </div>
  );
}

