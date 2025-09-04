"use client";
import { useEffect, useState, useRef } from "react";

export default function ExportArmy() {
  const [army, setArmy] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = localStorage.getItem("armyExport");
    if (data) setArmy(JSON.parse(data));
  }, []);

  const handleExportPDF = async () => {
    if (!exportRef.current) return;

    // ✅ Open new tab synchronously
    const win = window.open("", "_blank");
    setLoading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#fff",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

      // ✅ Show PDF in the new tab
      if (win) {
        const blobUrl = pdf.output("bloburl");
        win.location.href = blobUrl.toString();
      }
    } catch (err) {
      alert("Błąd eksportu PDF: " + err);
    }

    setLoading(false);
  };

  const handleExportJPG = async () => {
    if (!exportRef.current) return;

    setLoading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#fff",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/jpeg");

      // Open image in new tab using window.open with data URL
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

  if (!army) return <div className="p-8">Brak danych do eksportu.</div>;

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Podsumowanie Armii</h1>
      <div
        ref={exportRef}
        className="bg-gray-50 p-6 rounded shadow w-full max-w-2xl"
        style={{ fontSize: "1.15rem", color: "#222" }}
      >
        <div className="mb-4">
          <span className="font-semibold text-lg">Frakcja:</span>{" "}
          <span className="font-bold">{army.selectedFrakcja}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-lg">Suma punktów:</span>{" "}
          <span className="font-bold">
            {army.totalPoints} / {army.gamePoints}
          </span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-lg">Zasady specjalne:</span>
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
          <span className="font-semibold text-lg">Wybrane jednostki:</span>
          <ul className="list-disc ml-6">
            {army.selectedUnits.map((unit: any) => (
              <li key={unit.id} className="mb-4">
                <div className="font-bold text-base">
                  {unit.oddzial.nazwa}{" "}
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
                {unit.Spells?.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    Zaklęcia:{" "}
                    {unit.Spells.map((i: { nazwa: string }) => i.nazwa).join(
                      ", "
                    )}
                  </div>
                )}
                {unit.Items?.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    Przedmioty:{" "}
                    {unit.Items.map((i: { nazwa: string }) => i.nazwa).join(
                      ", "
                    )}
                  </div>
                )}
                {unit.Artifacts?.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    Artefakty:{" "}
                    {unit.Artifacts.map((i: { nazwa: string }) => i.nazwa).join(
                      ", "
                    )}
                  </div>
                )}
                {unit.Banners?.length > 0 && (
                  <div className="text-sm mt-1 font-semibold text-blue-900">
                    Sztandary:{" "}
                    {unit.Banners.map((i: { nazwa: string }) => i.nazwa).join(
                      ", "
                    )}
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
          {loading ? "Eksportuję..." : "Otwórz PDF"}
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded font-bold text-lg"
          onClick={handleExportJPG}
          disabled={loading}
        >
          {loading ? "Eksportuję..." : "Otwórz JPG"}
        </button>
      </div>
    </div>
  );
}
