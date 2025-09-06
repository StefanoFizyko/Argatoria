"use client";
import { useEffect, useState, useRef } from "react";
import { jsPDF } from "jspdf";
import pl from "../data/pl.json";
import en from "../data/en.json";

const translations = { pl, en };

type ExportUnit = {
  oddzial: {
    nazwa: string;
    punkty: string;
    typ?: string;
    minimal_unit_size?: number;
    maximum_unit_size?: number;
    _zasady_specjalne?: string[];
    [key: string]: unknown;
  };
  count: number;
  id: string;
  type: string;
  Spells?: { nazwa: string; koszt: number }[];
  Items?: { nazwa: string; koszt: number }[];
  Artifacts?: { nazwa: string; koszt: number }[];
  Banners?: { nazwa: string; koszt: number }[];
};

type SelectedFrakcjaData = {
  special_rule?: string | string[];
  flavor_text?: string[];
  [key: string]: unknown;
};

type ExportArmyData = {
  selectedUnits: ExportUnit[];
  selectedFrakcja: string;
  selectedFrakcjaData: SelectedFrakcjaData;
  gamePoints: number;
  totalPoints: number;
};

export default function ExportArmy({
  lang = "pl",
  t = (key: string, params?: Record<string, string | number>) => {
    let str = (translations[lang] as Record<string, string>)[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  },
}: {
  lang?: "pl" | "en";
  t?: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [army, setArmy] = useState<ExportArmyData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentLang, setLang] = useState<"pl" | "en">(typeof window !== "undefined" ? (localStorage.getItem("armyLang") as "pl" | "en") || "pl" : "pl");
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = localStorage.getItem("armyExport");
    if (data) setArmy(JSON.parse(data));
    const storedLang = localStorage.getItem("armyLang");
    if (storedLang && (storedLang === "pl" || storedLang === "en")) {
      setLang(storedLang);
    }
  }, []);

  const handleExportPDF = async () => {
    if (!army) return;
    setLoading(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.setFont("helvetica");

      const left = 15;
      const right = 15;
      const wrapWidth = 150;
      let y = 20;
      const lineHeight = 5;
      const pageHeight = 297;
      const bottomMargin = 20;

      function checkPageBreak(pdf: jsPDF, y: number, pageHeight: number, bottomMargin: number) {
        if (y > pageHeight - bottomMargin) {
          pdf.addPage();
          pdf.setFont("helvetica");
          return 20;
        }
        return y;
      }

      // Title
      pdf.setFontSize(16);
      let wrapped = pdf.splitTextToSize(t("armySummary"), wrapWidth);
      pdf.text(wrapped, left, y);
      y += lineHeight * wrapped.length + 3;

      // Faction
      pdf.setFontSize(12);
      wrapped = pdf.splitTextToSize(`${t("faction")}: ${army.selectedFrakcja}`, wrapWidth);
      pdf.text(wrapped, left, y);
      y += lineHeight * wrapped.length;

      // Points
      wrapped = pdf.splitTextToSize(
        t("pointsSummaryFull", { totalPoints: army.totalPoints, gamePoints: army.gamePoints }),
        wrapWidth
      );
      pdf.text(wrapped, left, y);
      y += lineHeight * wrapped.length;

      // Special rules
      pdf.setFontSize(11);
      pdf.text(t("armySpecialRules"), left, y);
      y += lineHeight;

      const rules = Array.isArray(army.selectedFrakcjaData?.special_rule)
        ? army.selectedFrakcjaData.special_rule
        : [army.selectedFrakcjaData?.special_rule];

      rules.forEach((rule) => {
        if (rule) {
          const ruleLines = String(rule).split("\n");
          ruleLines.forEach((line) => {
            const wrapped = pdf.splitTextToSize(`- ${line}`, 100);
            pdf.text(wrapped, left + 5, y);
            y += lineHeight * wrapped.length;
            y = checkPageBreak(pdf, y, pageHeight, bottomMargin);
          });
        }
      });

      if (Array.isArray(army.selectedFrakcjaData?.flavor_text)) {
        y += 2;
        army.selectedFrakcjaData.flavor_text.forEach((txt) => {
          const txtLines = String(txt).split("\n");
          txtLines.forEach((line) => {
            const wrapped = pdf.splitTextToSize(`- ${line}`, 110);
            pdf.text(wrapped, left + 5, y);
            y += lineHeight * wrapped.length;
            y = checkPageBreak(pdf, y, pageHeight, bottomMargin);
          });
        });
      }

      // Units
      pdf.setFontSize(12);
      pdf.text(t("chosenUnits"), left, y);
      y += lineHeight;

      pdf.setFontSize(10);
      army.selectedUnits.forEach((unit) => {
        wrapped = pdf.splitTextToSize(
          `${unit.oddzial.nazwa} x${unit.count} (${unit.oddzial.punkty} ${t("unitPoints")})`,
          wrapWidth - 10
        );
        pdf.text(wrapped, left + 5, y);
        y += lineHeight * wrapped.length;

        const stats = Object.entries(unit.oddzial)
          .filter(
            ([k, v]) =>
              k.startsWith("_") &&
              v !== undefined &&
              v !== null &&
              String(v).trim() !== "" &&
              typeof v !== "object"
          )
          .map(([k, v]) => `${k.replace("_", "")}: ${String(v)}`)
          .join(", ");
        if (stats) {
          wrapped = pdf.splitTextToSize(`${t("stats")}: ${stats}`, wrapWidth - 15);
          pdf.text(wrapped, left + 10, y);
          y += lineHeight * wrapped.length;
        }

        if (
          unit.oddzial.minimal_unit_size !== undefined ||
          unit.oddzial.maximum_unit_size !== undefined
        ) {
          wrapped = pdf.splitTextToSize(
            t("minMax", {
              min: unit.oddzial.minimal_unit_size ?? "-",
              max: unit.oddzial.maximum_unit_size ?? "-",
            }),
            wrapWidth - 15
          );
          pdf.text(wrapped, left + 10, y);
          y += lineHeight * wrapped.length;
        }

        if (Array.isArray(unit.oddzial._zasady_specjalne) && unit.oddzial._zasady_specjalne.length > 0) {
          pdf.text(t("specialRulesUnit"), left + 10, y);
          y += lineHeight;
          unit.oddzial._zasady_specjalne.forEach((z) => {
            const ruleLines = String(z).split("\n");
            ruleLines.forEach((line) => {
              const wrapped = pdf.splitTextToSize(`- ${line}`, 100);
              pdf.text(wrapped, left + 15, y);
              y += lineHeight * wrapped.length;
              y = checkPageBreak(pdf, y, pageHeight, bottomMargin);
            });
            y += 1;
          });
        }

        if (unit.Spells && unit.Spells.length > 0) {
          wrapped = pdf.splitTextToSize(`${t("spellsHeader")} ${unit.Spells.map(i => i.nazwa).join(", ")}`, wrapWidth - 15);
          pdf.text(wrapped, left + 10, y);
          y += lineHeight * wrapped.length;
        }
        if (unit.Items && unit.Items.length > 0) {
          wrapped = pdf.splitTextToSize(`${t("magicItemsHeader")} ${unit.Items.map(i => i.nazwa).join(", ")}`, wrapWidth - 15);
          pdf.text(wrapped, left + 10, y);
          y += lineHeight * wrapped.length;
        }
        if (unit.Artifacts && unit.Artifacts.length > 0) {
          wrapped = pdf.splitTextToSize(`${t("artifactsHeader")} ${unit.Artifacts.map(i => i.nazwa).join(", ")}`, wrapWidth - 15);
          pdf.text(wrapped, left + 10, y);
          y += lineHeight * wrapped.length;
        }
        if (unit.Banners && unit.Banners.length > 0) {
          wrapped = pdf.splitTextToSize(`${t("bannersHeader")} ${unit.Banners.map(i => i.nazwa).join(", ")}`, wrapWidth - 15);
          pdf.text(wrapped, left + 10, y);
          y += lineHeight * wrapped.length;
        }

        y += 3;
        y = checkPageBreak(pdf, y, pageHeight, bottomMargin);
      });

      pdf.save(currentLang === "en" ? "army.pdf" : "armia.pdf");
    } catch (err) {
      alert((currentLang === "en" ? "Export error: " : "Błąd eksportu PDF: ") + err);
    }

    setLoading(false);
  };

  const handleExportJPG = async () => {
    if (!exportRef.current) return;
    setLoading(true);

    try {
      // Force all children to use standard colors
      const exportNode = exportRef.current;
      exportNode.querySelectorAll("*").forEach(el => {
        (el as HTMLElement).style.backgroundColor = "#fff";
        (el as HTMLElement).style.color = "#222";
      });
      exportNode.style.backgroundColor = "#fff";
      exportNode.style.color = "#222";

      const html2canvas = (await import("html2canvas")).default;
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#fff",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/jpeg");

      const win = window.open();
      if (win) {
        win.document.write(
          `<html><head><title>Armia JPG</title></head><body style="margin:0"><img src="${imgData}" style="width:100%;display:block;"/></body></html>`
        );
        win.document.close();
      } else {
        alert("Nie można otworzyć nowego okna. Upewnij się, że nie masz blokady popupów.");
      }
    } catch (err) {
      alert("Błąd eksportu JPG: " + err);
    }

    setLoading(false);
  };

  if (!army) return <div className="p-8">{t("noExportData")}</div>;

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{t("armySummary")}</h1>
      <div
        ref={exportRef}
        className="bg-gray-50 p-6 rounded shadow w-full max-w-2xl"
        style={{ fontSize: "1.15rem", color: "#222", backgroundColor: "#fff", filter: "none" }}
      >
        <div className="mb-4">
          <span className="font-semibold text-lg">{t("faction")}:</span>{" "}
          <span className="font-bold">{t(army.selectedFrakcja)}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-lg">{t("pointsSummary")}:</span>{" "}
          <span className="font-bold">
            {t("pointsSummaryFull", { totalPoints: army.totalPoints, gamePoints: army.gamePoints })}
          </span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-lg">{t("armySpecialRules")}:</span>
          <ul className="list-disc ml-6 text-base">
            {Array.isArray(army.selectedFrakcjaData?.special_rule) ? (
              army.selectedFrakcjaData.special_rule.map(
                (rule: string, i: number) => <li key={i}>{rule}</li>
              )
            ) : (
              <li>{army.selectedFrakcjaData?.special_rule}</li>
            )}
            {Array.isArray(army.selectedFrakcjaData?.flavor_text) &&
              army.selectedFrakcjaData.flavor_text.map(
                (txt: string, i: number) => <li key={"flavor" + i}>{txt}</li>
              )}
          </ul>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-lg">{t("chosenUnits")}:</span>
          <ul className="list-disc ml-6">
            {army.selectedUnits.map((unit: ExportUnit) => (
              <li key={unit.id} className="mb-4">
                <div className="font-bold text-base">
                  {t(unit.oddzial.nazwa)}{" "}
                  <span className="font-normal">x{unit.count}</span>
                </div>
                <div className="text-sm text-gray-800 mb-1">
                  {Object.entries(unit.oddzial)
                    .filter(
                      ([k, v]) =>
                        k.startsWith("_") &&
                        v !== undefined &&
                        v !== null &&
                        String(v).trim() !== "" &&
                        typeof v !== "object"
                    )
                    .map(([k, v]) => (
                      <span key={k} className="mr-2">
                        {k.replace("_", "")}: {String(v)}
                      </span>
                    ))}
                </div>
                {Array.isArray(unit.oddzial._zasady_specjalne) && (
                  <ul className="list-disc ml-4 text-sm text-gray-700">
                    {unit.oddzial._zasady_specjalne.map(
                      (z: string, i: number) => <li key={i}>{z}</li>
                    )}
                  </ul>
                )}
                {unit.Spells && unit.Spells.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    {t("spellsHeader")} {unit.Spells.map(i => i.nazwa).join(", ")}
                  </div>
                )}
                {unit.Items && unit.Items.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    {t("magicItemsHeader")} {unit.Items.map(i => i.nazwa).join(", ")}
                  </div>
                )}
                {unit.Artifacts && unit.Artifacts.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    {t("artifactsHeader")} {unit.Artifacts.map(i => i.nazwa).join(", ")}
                  </div>
                )}
                {unit.Banners && unit.Banners.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    {t("bannersHeader")} {unit.Banners.map(i => i.nazwa).join(", ")}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex gap-4 mt-8">
        <button
          className="bg-green-600 text-white px-6 py-3 rounded font-bold text-lg"
          onClick={handleExportPDF}
          disabled={loading}
        >
          {loading ? t("exporting") : t("openPDF")}
        </button>
      </div>
    </div>
  );
}
