import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "RARO Tickets",
  description: "Venda e gestão de ingressos para eventos.",
};

// Aplica a classe "dark" antes da hidratação do React — evita flash de tema errado no load.
// Ver docs/frontend/design-system.md.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("raro-theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
