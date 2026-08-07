import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";

interface HealthData {
  status: string;
  database: "up" | "down";
}

// Mesmos tokens de cor do design system web (packages/config/tailwind-preset.js) —
// aqui hardcoded porque o RN não lê o preset Tailwind diretamente.
const cores = {
  fundo: "#F8FAFC",
  texto: "#0F172A",
  textoSecundario: "#64748B",
  sucesso: "#16A34A",
  perigo: "#DC2626",
};

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string) ?? "http://localhost:3000";
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((body) => setHealth(body.data))
      .catch(() => setErro("Não foi possível conectar à API."));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.titulo}>NOVYX Ingressos</Text>
      <Text style={styles.subtitulo}>App de check-in (esqueleto)</Text>

      <View style={styles.card}>
        {erro && <Text style={{ color: cores.perigo }}>{erro}</Text>}
        {health && (
          <>
            <Text style={{ color: cores.sucesso }}>API: {health.status}</Text>
            <Text style={{ color: health.database === "up" ? cores.sucesso : cores.perigo }}>
              Banco de dados: {health.database}
            </Text>
          </>
        )}
        {!health && !erro && <Text style={{ color: cores.textoSecundario }}>Carregando...</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "600",
    color: cores.texto,
  },
  subtitulo: {
    fontSize: 14,
    color: cores.textoSecundario,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    gap: 6,
  },
});
