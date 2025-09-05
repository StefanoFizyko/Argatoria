import { useEffect } from "react";

type FrakcjeListProps = {
  frakcjeNames: string[];
  onSelect: (frakcja: string) => void;
  lang: "pl" | "en";
  setLang: (lang: "pl" | "en") => void;
  t: (key: string) => string;
};

export function FrakcjeList({ frakcjeNames, onSelect, lang, setLang, t }: FrakcjeListProps) {
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Language switch buttons */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded ${lang === "pl" ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
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
      <h2 className="font-bold text-lg mb-2 text-gray-900 text-center">{t("chooseFaction")}</h2>
      <div className="flex flex-col gap-2 w-full max-w-xl">
        {frakcjeNames.map((frakcja) => (
          <button
            key={frakcja}
            className="bg-gray-200 text-gray-900 border border-black font-mono font-semibold px-4 py-2 rounded transition hover:bg-blue-200 w-full text-base"
            onClick={() => onSelect(frakcja)}
          >
            {frakcja}
          </button>
        ))}
      </div>
    </div>
  );
}