interface Point {
  label: string;
  value: number;
}

/** Histogramme leger en CSS pur (aucune dependance). */
export function BarChart({
  data,
  title,
  formatValue,
}: {
  data: Point[];
  title?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      {title && (
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue ? formatValue(total) : total} au total
          </p>
        </div>
      )}
      <div className="flex h-32 items-end gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex-1 rounded-t bg-gradient-to-t from-brand-green to-emerald-400 transition-all hover:from-brand-orange hover:to-amber-400"
            style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
          >
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition group-hover:opacity-100">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
