type FrakcjeListProps = {
  frakcjeNames: string[];
  onSelect: (frakcja: string) => void;
};

export function FrakcjeList({ frakcjeNames, onSelect }: FrakcjeListProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="font-bold text-lg mb-2 text-gray-900 text-center">Wybierz frakcję:</h2>
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