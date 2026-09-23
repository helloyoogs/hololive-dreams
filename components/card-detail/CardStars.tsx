export function Stars({
    rarity,
}: {
    rarity: number;
}) {
    return (
        <div className="flex gap-1">
            {Array.from(
                { length: 5 },
                (_, index) => (
                    <span
                        key={index}
                        className={
                            index < rarity
                                ? "text-yellow-300"
                                : "text-slate-700"
                        }
                    >
                        ★
                    </span>
                ),
            )}
        </div>
    );
}
