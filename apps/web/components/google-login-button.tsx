const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/** Navegação de página inteira de propósito (não é um fetch) — é assim que o fluxo de redirect OAuth funciona. */
export function GoogleLoginButton({ texto = "Continuar com Google" }: { texto?: string }) {
  return (
    <a
      href={`${API_URL}/auth/google`}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border/15 bg-card/70 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition-all hover:border-primary/30 hover:bg-primary/5"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
        <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z" />
      </svg>
      {texto}
    </a>
  );
}
