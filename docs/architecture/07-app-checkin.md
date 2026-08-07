[← Voltar ao índice](README.md)

# App de check-in → app completo (React Native)

- Expo (bare workflow ou config plugin) para acesso nativo à câmera em iOS/Android.
- **Validação sempre online, sem modo offline** — decisão explícita para eliminar o risco de dois dispositivos validarem o mesmo QR (de pessoas diferentes) sem saber um do outro enquanto desconectados. Cada leitura de QR chama a API de check-in em tempo real; a confirmação de entrada só existe se o servidor confirmar a transação (lock otimista em `Ingresso.status`, ver [04-modelo-de-dados.md](04-modelo-de-dados.md) e [06-seguranca.md](06-seguranca.md)) — nunca há aceite "provisório" no dispositivo.
- **Resiliência de rede sem cair para validação offline**: endpoint de check-in extremamente leve (uma consulta indexada + lock), múltiplos links de internet no local do evento (Wi-Fi dedicado + 4G/5G como fallback de rede, não de lógica), e o serviço com autoscaling dedicado durante a janela do evento. Se a conexão cair de verdade, o app mostra erro claro ("sem conexão — tente novamente") e bloqueia a confirmação de entrada até validar com o servidor; a equipe tem um fluxo manual de contingência (ex: lista impressa) como último recurso, não uma aceitação automática no app.
- Por ser o mesmo app que evolui para o app do comprador, a base de navegação/autenticação já nasce pensada para múltiplos papéis de usuário (operador de check-in vs comprador final).
