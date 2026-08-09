import { formatarCentavosComoReais } from "@/lib/formatters";

interface CurrencyInputProps {
  id: string;
  label: string;
  /** Valor em centavos — evita erro de ponto flutuante com dinheiro. */
  valorCentavos: number;
  onChange: (centavos: number) => void;
  className?: string;
}

/** Digita como calculadora: cada dígito empurra da direita, sempre formatado como "R$ 0,00". */
export function CurrencyInput({ id, label, valorCentavos, onChange, className = "" }: CurrencyInputProps) {
  function onInputChange(texto: string) {
    const digitos = texto.replace(/\D/g, "");
    onChange(digitos ? Number(digitos) : 0);
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        value={formatarCentavosComoReais(valorCentavos)}
        onChange={(e) => onInputChange(e.target.value)}
        className="h-12 rounded-xl border border-border/15 bg-background/60 px-4 text-sm text-foreground shadow-inner outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  );
}
