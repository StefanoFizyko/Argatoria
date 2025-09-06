"use client";

// Import React hooks and Next.js router
import {useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

// Import data files for units, spells, items, artifacts, banners, and translations
import unitsDataPL from "./data/units2.json";
import unitsDataEN from "./data/units2_en.json";
import SpellsDataPL from "./data/spells.json";
import SpellsDataEN from "./data/spells_en.json";
import ItemsDataPL from "./data/magic_items.json";
import ItemsDataEN from "./data/magic_items_en.json";
import ArtifactsDataPL from "./data/artifacts.json";
import ArtifactsDataEN from "./data/artifacts_en.json";
import BannersDataPL from "./data/magical_banners.json";
import BannersDataEN from "./data/magical_banners_en.json";
import { Oddzial, OddzialCard } from "./Oddzialcard";
import { FrakcjeList } from "./FrakcjeList";
import { SelectedUnitsList } from "./selectedUnitsList";
import pl from "./data/pl.json";
import en from "./data/en.json";

// Type for translation objects
type TranslationStrings = {
  [key: string]: string;
};

// Import game rules and limits
import {
  getMinPodstawowe,
  getMaxRzadkie,
  getMaxUnikalne,
  getGrupaDowodczaLimits,
  getCzempionLimits,
  MIN_BOHATEROWIE_TOTAL,
  MAX_GENERAŁ,
  MAX_ARTIFACTS_PER_GENERAŁ,
  MAX_BANNERS_TOTAL,
  areBannersAllowed,
} from "./limits";

// Type for selected unit
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

// Type for faction data
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

// Translation object for both languages
const translations = { pl, en };

export default function Home() {
  // State for current step in the UI
  const [step, setStep] = useState<"setup" | "frakcja" | "oddzialy">("setup");
  // State for selected faction
  const [selectedFrakcja, setSelectedFrakcja] = useState<string | null>(null);
  // State for selected units in the army
  const [selectedUnits, setSelectedUnits] = useState<SelectedUnit[]>([]);
  // State for total game points
  const [gamePoints, setGamePoints] = useState<number>(800);
  // State for showing/hiding army rules
  const [showArmyRules, setShowArmyRules] = useState(false);
  // State for language selection
  const [lang, setLang] = useState<"pl" | "en">("pl");
  // Next.js router for navigation
  const router = useRouter();

  // Translation function using current language
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let str = (translations[lang] as TranslationStrings)[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, String(v));
        });
      }
      return str;
    },
    [lang]
  );

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedUnits = localStorage.getItem("selectedUnits");
    const savedFrakcja = localStorage.getItem("selectedFrakcja");
    const savedStep = localStorage.getItem("step");
    const savedLang = localStorage.getItem("lang");
    if (savedUnits) setSelectedUnits(JSON.parse(savedUnits));
    if (savedFrakcja) setSelectedFrakcja(savedFrakcja);
    if (savedStep) setStep(savedStep as "setup" | "frakcja" | "oddzialy");
    if (savedLang === "en" || savedLang === "pl") setLang(savedLang);
  }, []);

  // Save selected units to localStorage when changed
  useEffect(() => {
    localStorage.setItem("selectedUnits", JSON.stringify(selectedUnits));
  }, [selectedUnits]);

  // Save selected faction to localStorage when changed
  useEffect(() => {
    if (selectedFrakcja) localStorage.setItem("selectedFrakcja", selectedFrakcja);
  }, [selectedFrakcja]);

  // Save current step to localStorage when changed
  useEffect(() => {
    localStorage.setItem("step", step);
  }, [step]);

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // Select correct data files based on language
  const unitsData = lang === "pl" ? unitsDataPL : unitsDataEN;
  const SpellsData = lang === "pl" ? SpellsDataPL : SpellsDataEN;
  const ItemsData = lang === "pl" ? ItemsDataPL : ItemsDataEN;
  const ArtifactsData = lang === "pl" ? ArtifactsDataPL : ArtifactsDataEN;
  const BannersData = lang === "pl" ? BannersDataPL : BannersDataEN;

  // Memoized list of faction names
  const frakcjeNames = useMemo(() => Object.keys(unitsData.frakcje ?? {}), [unitsData, lang]);
  // Memoized data for selected faction
  const selectedFrakcjaData = useMemo(
    () => selectedFrakcja ? ((unitsData.frakcje as unknown) as FrakcjeData)[selectedFrakcja] : null,
    [selectedFrakcja, unitsData, lang]
  );
  // Memoized lists of units by type for selected faction
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

  // Memoized lists of spells, items, artifacts, banners
  const allSpells = useMemo(() => SpellsData.Spells, [SpellsData, lang]);
  const allItems = useMemo(() => ItemsData.Items, [ItemsData, lang]);
  const allArtifacts = useMemo(() => ArtifactsData?.Artifacts ?? [], [ArtifactsData, lang]);
  const allBanners = useMemo(() => BannersData.Banners, [BannersData, lang]);

  // Handler for moving to faction selection step
  const handleSetupNext = () => setStep("frakcja");

  // Handler for selecting a faction
  const handleFrakcjaClick = (frakcja: string) => {
    setSelectedFrakcja(frakcja);
    setStep("oddzialy");
    setSelectedUnits((prev) =>
      selectedFrakcja === frakcja ? prev : []
    );
  };

  // Handler for going back to faction selection
  const handleBack = () => {
    setStep("frakcja");
    setSelectedFrakcja(null);
    setSelectedUnits([]);
  };

  // Handler for adding a basic unit
  const handleAddPodstawowy = (oddzial: Oddzial) => {
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
  };

  // Handler for adding an elite unit (with limit check)
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

  // Handler for adding a rare unit (with limit check)
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

  // Handler for adding a unique unit (with limit check)
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

  // Handler for adding a hero unit (detects subtype)
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

  // Handler for adding a spell to a unit (with limits)
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

  // Handler for removing a spell from a unit
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

  // Handler for adding a magic item to a unit (with limits)
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

  // Handler for removing a magic item from a unit
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

  // Handler for adding an artifact to a general unit (with limits)
  const handleAddArtifact = (
    unitId: string,
    artifact: { nazwa: string; koszt: number }
  ) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
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

  // Handler for removing an artifact from a unit
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

  // Handler for adding a banner to a command group unit (with limits)
  const handleAddBanner = (
    unitId: string,
    banner: { nazwa: string; koszt: number }
  ) => {
    setSelectedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        if (u.type !== "bohater_grupa") return u;

        const armyBanners = prev
          .filter(x => x.type === "bohater_grupa")
          .reduce((s, x) => s + ((x.Banners || []).length), 0);

        const maxPoints = Number(u.oddzial.max_items_value) || 0;
        const maxBannersPerUnit = 1;
        const currentBanners = u.Banners || [];
        const totalPoints = currentBanners.reduce((sum, b) => sum + b.koszt, 0);

        if (currentBanners.length >= maxBannersPerUnit) return u;
        if (armyBanners >= MAX_BANNERS_TOTAL) return u;
        if (maxPoints > 0 && totalPoints + banner.koszt > maxPoints) return u;

        return { ...u, Banners: [...currentBanners, banner] };
      })
    );
  };

  // Handler for removing a banner from a unit
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

  // Count total banners in command group units
  const grupaDowodczaBannersCount = selectedUnits
    .filter((u) => u.type === "bohater_grupa")
    .reduce((sum, u) => sum + ((u.Banners || []).length), 0);

  // Permission functions for items, artifacts, banners
  function canTakeItems(unit: SelectedUnit) {
    return unit.type === "bohater_mag";
  }
  function canTakeArtifacts(unit: SelectedUnit) {
    return unit.type === "bohater_generał";
  }
  function canTakeBanner(unit: SelectedUnit) {
    return unit.type === "bohater_grupa";
  }

  // Calculate limits and counts for units
  const minPodstawowe = getMinPodstawowe(gamePoints);
  const maxRzadkie = getMaxRzadkie(gamePoints);
  const maxUnikalne = getMaxUnikalne(gamePoints);
  const [minGrupa, maxGrupa] = getGrupaDowodczaLimits(gamePoints);
  const [minCzempion, maxCzempion] = getCzempionLimits(gamePoints);
  const maxMag = Math.floor(gamePoints / 500);

  // Memoized counts of units by type
  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    selectedUnits.forEach(u => {
      counts[u.type] = (counts[u.type] || 0) + 1;
    });
    return counts;
  }, [selectedUnits]);

  // Individual counts for each unit type
  const podstawoweCount = unitCounts["podstawowy"] || 0;
  const elitarneCount = unitCounts["elitarny"] || 0;
  const rzadkieCount = unitCounts["rzadki"] || 0;
  const unikalneCount = unitCounts["unikalny"] || 0;
  const maxElitarne = podstawoweCount;

  // Filter hero units and count subtypes
  const bohaterowieUnits = selectedUnits.filter(u => u.type.startsWith("bohater"));
  const generałCount = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("generał")).length;
  const grupaDowodczaCount = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("grupa")).length;
  const czempionCount = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("czempion")).length;
  const magCount = bohaterowieUnits.filter(u => u.type === "bohater_mag").length;
  const bohaterowieTotal = bohaterowieUnits.length;

  // Count artifacts and banners for generals and command groups
  const generałUnits = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("generał"));
  const generałArtifacts = generałUnits.reduce((sum, u) => sum + (u.Artifacts?.length || 0), 0);

  const grupaDowodczaUnits = bohaterowieUnits.filter(u => u.oddzial.typ?.toLowerCase().includes("grupa"));
  const grupaDowodczaBanners = grupaDowodczaUnits.reduce((sum, u) => sum + (u.Banners?.length || 0), 0);

  // Check if hero selection is valid according to game rules
  const bohaterowieValid =
    generałCount <= MAX_GENERAŁ &&
    grupaDowodczaCount >= minGrupa &&
    grupaDowodczaCount <= maxGrupa &&
    czempionCount >= minCzempion &&
    czempionCount <= maxCzempion &&
    magCount <= maxMag &&
    bohaterowieTotal >= MIN_BOHATEROWIE_TOTAL;

  // Calculate total points for the army
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

  // Check if army can start the game (all requirements met)
  const canStartGame =
    podstawoweCount >= minPodstawowe &&
    elitarneCount >= 2 &&
    elitarneCount <= maxElitarne &&
    rzadkieCount <= maxRzadkie &&
    unikalneCount <= maxUnikalne &&
    totalPoints <= gamePoints &&
    bohaterowieValid;

  // Check if general can take more artifacts
  const canGenerałTakeItem = generałArtifacts < MAX_ARTIFACTS_PER_GENERAŁ;
  // Check if command group can take more banners
  const canGrupaTakeBanner = areBannersAllowed(gamePoints) && grupaDowodczaBanners < MAX_BANNERS_TOTAL;

  // Handler for increasing unit count
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

  // Handler for decreasing unit count
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

  // Handler for removing a unit from the army
  const handleRemoveUnit = (id: string) => {
    setSelectedUnits((prev) => prev.filter((u) => u.id !== id));
  };

  // Handler for exporting the army (saves to localStorage and navigates to export page)
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

  // Main render: two columns, left for setup/selection, right for army summary and export
  return (
    <div className="flex flex-row gap-8 w-full min-h-screen p-4 bg-white text-gray-900">
      {/* Left column: setup, faction selection, unit selection */}
      <div
        className="flex flex-col gap-4 items-start"
        style={{ width: "50%" }}
      >
        {/* Setup step: choose language and game points */}
        {step === "setup" && (
          <div>
            {/* Language switch button */}
            <div className="mb-4">
              <button
                className={`px-3 py-1 rounded mr-2 ${lang === "pl" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
                onClick={() => setLang("pl")}
              >
                Polski
              </button>
              <button
                className={`px-3 py-1 rounded ${lang === "en" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
                onClick={() => setLang("en")}
              >
                English
              </button>
            </div>
            <h2 className="font-bold text-lg mb-2 text-gray-900">
              {t("gameSettings")}
            </h2>
            <label className="mb-2 block">
              {t("gamePoints")}:
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
              {t("next")}
            </button>
          </div>
        )}

        {/* Faction selection step */}
        {step === "frakcja" && (
          <>
            <FrakcjeList
              frakcjeNames={frakcjeNames}
              onSelect={handleFrakcjaClick}
              lang={lang}
              setLang={setLang}
              t={t}
            />
          </>
        )}

        {/* Unit selection step */}
        {step === "oddzialy" && selectedFrakcjaData && (
          <>
            <h2 className="font-bold text-lg mb-2 text-gray-900">
              {t("factionUnits")}: {selectedFrakcja}
            </h2>

            {/* Army special rules bullet points */}
            {Array.isArray(selectedFrakcjaData.special_rule) && selectedFrakcjaData.special_rule.length > 0 && (
              <>
                <button
                  className="text-sm text-blue-600 mb-1"
                  onClick={() => setShowArmyRules(v => !v)}
                >
                  {showArmyRules
                    ? t("hideArmyRules")
                    : t("showArmyRules")}
                </button>
                {showArmyRules && (
                  <div className="text-sm text-gray-500 mb-1">
                    {t("armyRules")}:
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

            {/* Basic units selection */}
            <h3 className="font-semibold mt-1 mb-1 text-gray-900">
              {t("basicUnits")} ({t("minimumRequiredUnits", { min: minPodstawowe })}):
            </h3>
            {podstawoweOddzialy.map((oddzial: Oddzial, idx: number) => (
              <OddzialCard
                key={oddzial.nazwa + idx}
                oddzial={oddzial}
                bg="bg-gray-100"
                onAdd={() => handleAddPodstawowy(oddzial)}
                t={t}
                lang={lang}
              />
            ))}

            {/* Elite units selection */}
            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              {t("eliteUnits")} ({t("minimumEliteUnits", { max: maxElitarne })}):
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
                t={t}
                lang={lang}
              />
            ))}

            {/* Rare units selection */}
            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              {t("rareUnits")} ({t("maxRareUnits", { max: maxRzadkie })}):
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
                t={t}
                lang={lang}
              />
            ))}

            {/* Unique units selection */}
            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              {t("uniqueUnits")} ({t("maxUniqueUnits", { max: maxUnikalne })}):
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
                t={t}
                lang={lang}
              />
            ))}

            {/* Heroes selection */}
            <h3 className="font-semibold mt-4 mb-1 text-gray-900">
              {t("heroes")}:
            </h3>
            <div className="text-xs text-gray-600 mb-2">
              {t("heroesLimit", {
                maxGeneral: MAX_GENERAŁ,
                minGroup: minGrupa,
                maxGroup: maxGrupa,
                minChampion: minCzempion,
                maxChampion: maxCzempion,
                maxMage: maxMag,
                minHeroes: MIN_BOHATEROWIE_TOTAL,
              })}
            </div>
            {/* Show hero selection errors if any */}
            {!bohaterowieValid && (
              <div className="text-red-600 text-xs mb-2">
                {t("heroesLimitViolation")}
                {generałCount > MAX_GENERAŁ && " " + t("onlyOneGeneralAllowed")}
                {grupaDowodczaCount < minGrupa && " " + t("minimumGroupRequired", { minGroup: minGrupa })}
                {grupaDowodczaCount > maxGrupa && " " + t("maximumGroupAllowed", { maxGroup: maxGrupa })}
                {czempionCount < minCzempion && " " + t("minimumChampionRequired", { minChampion: minCzempion })}
                {czempionCount > maxCzempion && " " + t("maximumChampionAllowed", { maxChampion: maxCzempion })}
              </div>
            )}
            {/* Render hero cards */}
            {bohaterowie.map((oddzial: Oddzial, idx: number) => {
              let addDisabled = false;
              if (oddzial.typ?.toLowerCase().includes("generał") && generałCount >= MAX_GENERAŁ) addDisabled = true;
              if (oddzial.typ?.toLowerCase().includes("grupa") && grupaDowodczaCount >= maxGrupa) addDisabled = true;
              if (oddzial.typ?.toLowerCase().includes("czempion") && czempionCount >= maxCzempion) addDisabled = true;
              if (oddzial.typ?.toLowerCase().includes("mag") && magCount >= maxMag) addDisabled = true;
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
                  t={t}
                  lang={lang}
                />
              );
            })}
            {/* Back button to faction selection */}
            <button
              className="mt-4 bg-gray-100 text-black border border-black font-mono font-semibold px-2 py-1 rounded transition hover:bg-gray-200 w-auto text-sm"
              onClick={handleBack}
            >
              {t("backToFaction")}
            </button>
          </>
        )}
      </div>

      {/* Right column: army summary and export */}
      <div className="flex flex-col w-1/2">
        <div className="mb-2 flex items-center gap-10">
          <label className="font-semibold text-gray-900">
            {t("gamePoints")}:
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
        {/* Selected units list and controls */}
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
          lang={lang}
        />
        {/* Export army button */}
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded font-bold mt-4"
          onClick={handleExportArmy}
          disabled={selectedUnits.length === 0}
        >
          {t("exportArmy")}
        </button>
      </div>
      </div>
    );
  }

