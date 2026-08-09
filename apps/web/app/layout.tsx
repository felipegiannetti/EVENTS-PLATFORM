import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { NavigationLoadingProvider } from "@/lib/navigation-loading";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "RARO Tickets — Eventos que conectam",
  description: "Descubra, crie e gerencie experiências inesquecíveis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <NavigationLoadingProvider>
            <Header />
            {children}
            <Footer />
          </NavigationLoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
