"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavigationLoadingValue {
  navegando: boolean;
  iniciar: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingValue | null>(null);

/**
 * Cobre o intervalo entre "usuário clicou" e "a próxima página realmente apareceu" — sem isso,
 * uma ação assíncrona seguida de router.push() dá a impressão de que travou (nenhum feedback
 * visual entre o clique e a troca de tela). iniciar() liga a barra; ela desliga sozinha assim
 * que o pathname muda (ou depois de um timeout de segurança, caso a navegação seja cancelada).
 */
export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const [navegando, setNavegando] = useState(false);
  const pathname = usePathname();
  const pathnameAnterior = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== pathnameAnterior.current) {
      pathnameAnterior.current = pathname;
      setNavegando(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [pathname]);

  function iniciar() {
    setNavegando(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setNavegando(false), 8000);
  }

  return (
    <NavigationLoadingContext.Provider value={{ navegando, iniciar }}>
      <TopProgressBar visivel={navegando} />
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading(): NavigationLoadingValue {
  const ctx = useContext(NavigationLoadingContext);
  if (!ctx) {
    throw new Error("useNavigationLoading precisa estar dentro de <NavigationLoadingProvider>.");
  }
  return ctx;
}

function TopProgressBar({ visivel }: { visivel: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-primary/10 transition-opacity duration-200 ${
        visivel ? "opacity-100" : "opacity-0"
      }`}
    >
      {visivel && (
        <div className="h-full w-1/3 animate-[nav-progress_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary to-violet-600" />
      )}
    </div>
  );
}
