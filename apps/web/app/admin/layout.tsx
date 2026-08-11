"use client";

import { AdminWorkspaceSidebar } from "@/components/admin-workspace-sidebar";
import { ProtectedPage } from "@/components/protected-page";

/** Painel do admin: sidebar própria, sem a navbar geral do site (Header já se esconde sozinho via useIsAdminWorkspace). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage somenteAdmin>
      {() => (
        <div className="min-h-screen bg-background">
          <AdminWorkspaceSidebar />
          <div className="lg:pl-64">{children}</div>
        </div>
      )}
    </ProtectedPage>
  );
}
