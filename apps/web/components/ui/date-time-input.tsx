interface DateTimeInputProps {
  idPrefix: string;
  label: string;
  /** "YYYY-MM-DDTHH:mm" (mesmo formato de <input type="datetime-local">) ou "". */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minDate?: string;
}

/** Campo de data e campo de hora separados — o datetime-local nativo combinado confunde (um só seletor pra duas coisas). Mantém o mesmo formato de valor "YYYY-MM-DDTHH:mm" por baixo, então o resto do código nem percebe a troca. */
export function DateTimeInput({ idPrefix, label, value, onChange, required, minDate }: DateTimeInputProps) {
  const [dataParte, horaParte] = value ? value.split("T") : ["", ""];

  function atualizar(novaData: string, novaHora: string) {
    if (!novaData) {
      onChange("");
      return;
    }
    onChange(`${novaData}T${novaHora || "00:00"}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div className="grid grid-cols-2 gap-3">
        <input
          id={`${idPrefix}-data`}
          type="date"
          required={required}
          min={minDate}
          value={dataParte}
          onChange={(e) => atualizar(e.target.value, horaParte)}
          className="h-12 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <input
          id={`${idPrefix}-hora`}
          type="time"
          required={required}
          value={horaParte}
          onChange={(e) => atualizar(dataParte, e.target.value)}
          className="h-12 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
    </div>
  );
}
