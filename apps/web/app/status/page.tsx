"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface HealthData {
  status: string;
  database: "up" | "down";
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((body) => setHealth(body.data))
      .catch(() => setErro("Não foi possível conectar à API."));
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-md flex-col items-center justify-center px-4">
      <Card className="w-full">
        <h1 className="text-lg font-semibold text-foreground">Status</h1>
        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}
        {health && (
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">API</dt>
              <dd className="font-medium text-success">{health.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Banco de dados</dt>
              <dd className={`font-medium ${health.database === "up" ? "text-success" : "text-danger"}`}>
                {health.database}
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </main>
  );
}
