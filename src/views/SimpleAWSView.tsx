import React, { useEffect, useState, useMemo } from "react";
import {
  spacing,
  radius,
  shadows,
  typography,
  lightTheme,
  darkTheme,
  type Theme,
} from "../styles/tokens";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
}

interface OnlineStatus {
  isOnline: boolean;
  lastCheck: Date;
  error?: string;
}

// ─── Theme Hook ──────────────────────────────────────────────────────────────

function useTheme(): Theme {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark ? darkTheme : lightTheme;
}

// ─── Injected Styles ─────────────────────────────────────────────────────────
// CSS classes para hover/focus/transitions — impossível com inline styles puro.

function GlobalStyles({ t }: { t: Theme }) {
  const css = useMemo(
    () => `
    /* ── Reset & Base ─────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${t.bg.app}; font-family: ${typography.family.sans}; }

    /* ── Scrollbar ────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.border.default}; border-radius: ${radius.full}px; }

    /* ── Buttons ──────────────────────────────────── */
    .aw-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: ${spacing.sm}px;
      font-family: ${typography.family.sans}; font-weight: ${typography.weight.semibold};
      font-size: ${typography.size.base}px; line-height: 1;
      border: none; border-radius: ${radius.md}px; cursor: pointer;
      padding: ${spacing.sm}px ${spacing.lg}px;
      transition: background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      outline: none;
    }
    .aw-btn:focus-visible { box-shadow: ${shadows.focus}; }
    .aw-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .aw-btn-primary { background: ${t.action.primary}; color: ${t.action.primaryFg}; }
    .aw-btn-primary:hover:not(:disabled) { background: ${t.action.primaryHover}; }

    .aw-btn-success { background: ${t.action.success}; color: ${t.action.successFg}; }
    .aw-btn-success:hover:not(:disabled) { background: ${t.action.successHover}; }

    .aw-btn-danger { background: ${t.action.danger}; color: ${t.action.dangerFg}; }
    .aw-btn-danger:hover:not(:disabled) { background: ${t.action.dangerHover}; }
    .aw-btn-danger:focus-visible { box-shadow: ${shadows.focusDanger}; }

    .aw-btn-ghost {
      background: transparent; color: ${t.text.secondary};
      border: 1px solid ${t.border.default};
    }
    .aw-btn-ghost:hover:not(:disabled) { background: ${t.bg.surfaceHover}; color: ${t.text.primary}; }

    .aw-btn-sm { font-size: ${typography.size.sm}px; padding: ${spacing.xs}px ${spacing.md}px; }
    .aw-btn-lg { font-size: ${typography.size.lg}px; padding: ${spacing.md}px ${spacing.xl}px; }
    .aw-btn-full { width: 100%; }

    /* ── Inputs ───────────────────────────────────── */
    .aw-input, .aw-textarea, .aw-select {
      width: 100%; font-family: ${typography.family.sans}; font-size: ${typography.size.md}px;
      color: ${t.text.primary}; background: ${t.bg.input};
      border: 1px solid ${t.border.default}; border-radius: ${radius.md}px;
      padding: ${spacing.sm + 2}px ${spacing.md}px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      outline: none;
    }
    .aw-input:hover, .aw-textarea:hover, .aw-select:hover {
      border-color: ${t.border.strong}; background: ${t.bg.inputHover};
    }
    .aw-input:focus, .aw-textarea:focus, .aw-select:focus {
      border-color: ${t.border.focus}; box-shadow: ${shadows.focus};
    }
    .aw-input::placeholder, .aw-textarea::placeholder { color: ${t.text.placeholder}; }
    .aw-textarea { resize: vertical; font-family: ${typography.family.mono}; font-size: ${typography.size.sm}px; line-height: 1.6; }
    .aw-select { cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right ${spacing.md}px center;
      padding-right: ${spacing['2xl']}px;
    }

    /* ── Segmented Control ────────────────────────── */
    .aw-seg { display: flex; background: ${t.bg.muted}; border-radius: ${radius.md}px; padding: 3px; gap: 2px; }
    .aw-seg-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: ${spacing.xs}px;
      padding: ${spacing.sm}px ${spacing.lg}px; border: none; border-radius: ${radius.sm + 1}px;
      font-family: ${typography.family.sans}; font-size: ${typography.size.base}px;
      font-weight: ${typography.weight.medium}; cursor: pointer;
      background: transparent; color: ${t.text.muted};
      transition: all 0.2s ease;
    }
    .aw-seg-btn:hover { color: ${t.text.secondary}; }
    .aw-seg-btn.active {
      background: ${t.bg.surface}; color: ${t.text.primary};
      box-shadow: ${shadows.sm}; font-weight: ${typography.weight.semibold};
    }

    /* ── Status Dot Pulse ─────────────────────────── */
    @keyframes aw-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.5); }
    }
    .aw-dot { display: inline-block; width: 8px; height: 8px; border-radius: ${radius.full}px; }
    .aw-dot-online { background: ${t.status.online.dot}; animation: aw-pulse 2s ease-in-out infinite; }
    .aw-dot-offline { background: ${t.status.offline.dot}; }

    /* ── Card ─────────────────────────────────────── */
    .aw-card {
      background: ${t.bg.surface}; border: 1px solid ${t.border.default};
      border-radius: ${radius.lg}px; padding: ${spacing.lg}px;
      box-shadow: ${shadows.sm};
    }

    /* ── Divider ──────────────────────────────────── */
    .aw-divider {
      display: flex; align-items: center; gap: ${spacing.md}px;
      margin: ${spacing.lg}px 0; color: ${t.text.muted};
      font-size: ${typography.size.xs}px; text-transform: uppercase;
      letter-spacing: 0.05em; font-weight: ${typography.weight.medium};
    }
    .aw-divider::before, .aw-divider::after {
      content: ''; flex: 1; height: 1px; background: ${t.border.default};
    }

    /* ── Feedback Toast ───────────────────────────── */
    .aw-toast {
      border-radius: ${radius.md}px; padding: ${spacing.md}px ${spacing.lg}px;
      font-size: ${typography.size.base}px; font-weight: ${typography.weight.medium};
      border-left: 3px solid; animation: aw-slideIn 0.25s ease-out;
    }
    @keyframes aw-slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Label ────────────────────────────────────── */
    .aw-label {
      display: block; font-size: ${typography.size.sm}px; font-weight: ${typography.weight.semibold};
      color: ${t.text.secondary}; margin-bottom: ${spacing.xs + 2}px;
      letter-spacing: 0.01em;
    }
    .aw-label-required::after { content: ' *'; color: ${t.action.danger}; }

    /* ── Collapsible Tips ─────────────────────────── */
    .aw-tips-toggle {
      display: flex; align-items: center; gap: ${spacing.sm}px;
      background: none; border: none; cursor: pointer;
      font-family: ${typography.family.sans}; font-size: ${typography.size.sm}px;
      font-weight: ${typography.weight.semibold}; color: ${t.text.muted};
      padding: ${spacing.sm}px 0; transition: color 0.15s ease;
    }
    .aw-tips-toggle:hover { color: ${t.text.secondary}; }
    .aw-tips-list {
      margin: ${spacing.sm}px 0 0 0; padding-left: ${spacing.xl}px;
      font-size: ${typography.size.sm}px; color: ${t.text.secondary};
      line-height: 1.8;
    }
  `,
    [t],
  );

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const SimpleAWSView: React.FC = () => {
  const t = useTheme();

  // ── State ────────────────────────────────────────
  const [credentials, setCredentials] = useState<AWSCredentials>({
    accessKeyId: "",
    secretAccessKey: "",
    sessionToken: "",
    region: "us-east-1",
  });
  const [profileName, setProfileName] = useState("default");
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: false,
    lastCheck: new Date(),
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [credentialsText, setCredentialsText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // ── Effects ──────────────────────────────────────
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(async () => {
        const currentStatus = await window.electron.aws.getStatus();
        setStatus(currentStatus);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  useEffect(() => {
    if (showAdvanced) {
      loadCredentialsFromProfile();
    }
  }, [showAdvanced]);

  // ── Data Loading ─────────────────────────────────
  const loadInitialData = async () => {
    try {
      const profiles = await window.electron.aws.listProfiles();
      if (profiles.length > 0 && !profiles.includes("default")) {
        setProfileName(profiles[0]);
      }
      const currentStatus = await window.electron.aws.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    }
  };

  const loadCredentialsFromProfile = async () => {
    try {
      const profiles = await (window.electron as any).aws.listProfiles();
      if (profiles.length > 0) {
        const currentProfile = profileName || profiles[0];
        setProfileName(currentProfile);
        const storedProfiles = await (window.electron as any).storage.getProfiles();
        const profile = storedProfiles.find((p: any) => p.name === currentProfile);

        if (profile) {
          setCredentials({
            accessKeyId: profile.accessKeyId || "",
            secretAccessKey: profile.secretAccessKey || "",
            sessionToken: profile.sessionToken || "",
            region: profile.region || "us-east-1",
          });
        } else {
          await (window.electron as any).aws.importFromExistingCredentials();
          const updatedProfiles = await (window.electron as any).aws.listProfiles();
          if (updatedProfiles.includes(currentProfile)) {
            const updatedStored = await (window.electron as any).storage.getProfiles();
            const updatedProfile = updatedStored.find(
              (p: any) => p.name === currentProfile,
            );
            if (updatedProfile) {
              setCredentials({
                accessKeyId: updatedProfile.accessKeyId || "",
                secretAccessKey: updatedProfile.secretAccessKey || "",
                sessionToken: updatedProfile.sessionToken || "",
                region: updatedProfile.region || "us-east-1",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar credenciais do perfil:", error);
    }
  };

  // ── Handlers ─────────────────────────────────────
  const handleImportFromText = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!credentialsText.trim()) {
        setMessage("error:Cole o texto das credenciais primeiro");
        return;
      }
      const result =
        await window.electron.aws.parseAndSaveCredentialsText(credentialsText);
      if (result.success) {
        setMessage(`success:${result.message}`);
        setCredentialsText("");
        const profiles = await window.electron.aws.listProfiles();
        if (profiles.length > 0) setProfileName(profiles[0]);
        await handleTestConnection();
      } else {
        setMessage(`error:${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao importar texto:", error);
      setMessage("error:Erro ao importar credenciais do texto");
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromExisting = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await window.electron.aws.importFromExistingCredentials();
      if (result.success) {
        setMessage(`success:${result.message}`);
        const profiles = await window.electron.aws.listProfiles();
        if (profiles.length > 0) setProfileName(profiles[0]);
        await handleTestConnection();
      } else {
        setMessage(`error:${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao importar existente:", error);
      setMessage("error:Erro ao importar credenciais existentes");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCredentials = async () => {
    setLoading(true);
    setMessage("");
    try {
      const success = await window.electron.aws.clearCredentials();
      if (success) {
        setMessage(
          "success:Arquivos ~/.aws/credentials e ~/.aws/config limpos com sucesso",
        );
        setCredentials({
          accessKeyId: "",
          secretAccessKey: "",
          sessionToken: "",
          region: "us-east-1",
        });
        setProfileName("default");
        setCredentialsText("");
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          error: "Nenhuma credencial configurada",
        });
      } else {
        setMessage("error:Erro ao limpar arquivos de credenciais");
      }
    } catch (error) {
      console.error("Erro ao limpar credenciais:", error);
      setMessage("error:Erro ao limpar credenciais");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        setMessage("error:Access Key ID e Secret Access Key são obrigatórios");
        return;
      }
      const success = await window.electron.aws.saveCredentials(
        credentials,
        profileName,
      );
      if (success) {
        setMessage(
          `success:Credenciais salvas para o perfil "${profileName}"`,
        );
        await handleTestConnection();
      } else {
        setMessage("error:Erro ao salvar credenciais");
      }
    } catch (error) {
      console.error("Erro ao salvar credenciais:", error);
      setMessage("error:Erro ao salvar credenciais");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setMessage("loading:Testando conexão...");
    try {
      const isOnline =
        await window.electron.aws.testSimpleConnection(profileName);
      if (isOnline) {
        setMessage("success:Conexão bem-sucedida! Você está online.");
        setStatus({ isOnline: true, lastCheck: new Date() });
      } else {
        setMessage("error:Falha na conexão. Verifique suas credenciais.");
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          error: "Falha na autenticação",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      let errorMessage = "Erro ao testar conexão";
      let errorDetails = "Falha na autenticação";

      if (error instanceof Error) {
        if (error.message.includes("Token de sessão expirado")) {
          errorMessage = "Token de sessão expirado!";
          errorDetails = "Obtenha novas credenciais AWS temporárias";
        } else if (error.message.includes("Access Key ID inválido")) {
          errorMessage = "Access Key ID inválido!";
          errorDetails = "Verifique a chave de acesso";
        } else if (error.message.includes("Secret Access Key inválido")) {
          errorMessage = "Secret Access Key inválido!";
          errorDetails = "Verifique a chave secreta";
        } else if (error.message.includes("Nenhuma credencial encontrada")) {
          errorMessage = "Nenhuma credencial encontrada!";
          errorDetails = "Configure as credenciais para este perfil";
        } else {
          errorMessage = error.message;
          errorDetails = "Verifique suas credenciais AWS";
        }
      }

      setMessage(`error:${errorMessage}`);
      setStatus({
        isOnline: false,
        lastCheck: new Date(),
        error: errorDetails,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      await window.electron.aws.stopMonitoring();
      setIsMonitoring(false);
      setMessage("info:Monitoramento parado");
    } else {
      await window.electron.aws.startMonitoring(profileName, 30);
      setIsMonitoring(true);
      setMessage("info:Monitoramento iniciado (verifica a cada 30s)");
    }
  };

  // ── Helpers ──────────────────────────────────────
  const formatLastCheck = (date: Date): string =>
    new Date(date).toLocaleTimeString("pt-BR");

  const getMessageType = (): "success" | "error" | "info" | "loading" => {
    if (message.startsWith("success:")) return "success";
    if (message.startsWith("error:")) return "error";
    if (message.startsWith("loading:")) return "loading";
    return "info";
  };

  const getMessageText = (): string => {
    const idx = message.indexOf(":");
    return idx !== -1 ? message.slice(idx + 1) : message;
  };

  const statusColors = status.isOnline ? t.status.online : t.status.offline;

  // ── Render ───────────────────────────────────────
  return (
    <>
      <GlobalStyles t={t} />

      <div
        style={{
          height: "100vh",
          background: t.bg.app,
          padding: `${spacing.lg}px`,
          fontFamily: typography.family.sans,
          color: t.text.primary,
          overflow: "auto",
        }}
      >
        <div style={{ maxWidth: 540, margin: "0 auto" }}>

          {/* ── Status Bar ──────────────────────────── */}
          <div
            className="aw-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `${spacing.sm}px ${spacing.md}px`,
              marginBottom: spacing.md,
              background: statusColors.bg,
              borderColor: statusColors.border,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
              <span
                className={`aw-dot ${status.isOnline ? "aw-dot-online" : "aw-dot-offline"}`}
              />
              <div>
                <span
                  style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: statusColors.text,
                  }}
                >
                  {status.isOnline ? "Online" : "Offline"}
                </span>
                <span
                  style={{
                    fontSize: typography.size.xs,
                    color: statusColors.text,
                    opacity: 0.7,
                    marginLeft: spacing.sm,
                  }}
                >
                  {formatLastCheck(status.lastCheck)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: spacing.sm }}>
              <button
                className="aw-btn aw-btn-primary aw-btn-sm"
                onClick={handleTestConnection}
                disabled={loading}
              >
                Testar
              </button>
              <button
                className={`aw-btn aw-btn-sm ${isMonitoring ? "aw-btn-danger" : "aw-btn-ghost"}`}
                onClick={handleToggleMonitoring}
              >
                {isMonitoring ? "Parar" : "Monitorar"}
              </button>
            </div>
          </div>

          {/* ── Feedback Message ────────────────────── */}
          {message && (
            <div
              className="aw-toast"
              style={{
                marginBottom: spacing.md,
                ...(getMessageType() === "success" && {
                  background: t.feedback.success.bg,
                  borderColor: t.feedback.success.border,
                  color: t.feedback.success.text,
                }),
                ...(getMessageType() === "error" && {
                  background: t.feedback.error.bg,
                  borderColor: t.feedback.error.border,
                  color: t.feedback.error.text,
                }),
                ...(getMessageType() === "info" && {
                  background: t.feedback.info.bg,
                  borderColor: t.feedback.info.border,
                  color: t.feedback.info.text,
                }),
                ...(getMessageType() === "loading" && {
                  background: t.feedback.warning.bg,
                  borderColor: t.feedback.warning.border,
                  color: t.feedback.warning.text,
                }),
              }}
            >
              {getMessageText()}
            </div>
          )}

          {/* ── Mode Tabs ───────────────────────────── */}
          <div className="aw-seg" style={{ marginBottom: spacing.md }}>
            <button
              className={`aw-seg-btn ${!showAdvanced ? "active" : ""}`}
              onClick={() => setShowAdvanced(false)}
            >
              Credenciais
            </button>
            <button
              className={`aw-seg-btn ${showAdvanced ? "active" : ""}`}
              onClick={() => setShowAdvanced(true)}
            >
              Importação Rápida
            </button>
          </div>

          {/* ── Quick Import Panel ──────────────────── */}
          {showAdvanced && (
            <div className="aw-card" style={{ marginBottom: spacing.md }}>
              <button
                className="aw-btn aw-btn-success aw-btn-full"
                onClick={handleImportFromExisting}
                disabled={loading}
              >
                Importar de ~/.aws/credentials
              </button>

              <div className="aw-divider">ou cole abaixo</div>

              <textarea
                className="aw-textarea"
                value={credentialsText}
                onChange={(e) => setCredentialsText(e.target.value)}
                placeholder={`[584532893736_AdministratorAccess]\naws_access_key_id=ASIAYQGHAEAUP67LJIP3\naws_secret_access_key=hryRrE3q228beXiJG...\naws_session_token=IQoJb3JpZ2luX2VjEPX...`}
                rows={4}
              />

              <div
                style={{
                  display: "flex",
                  gap: spacing.sm,
                  marginTop: spacing.md,
                }}
              >
                <button
                  className="aw-btn aw-btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleImportFromText}
                  disabled={loading || !credentialsText.trim()}
                >
                  Importar do Texto
                </button>
                <button
                  className="aw-btn aw-btn-danger"
                  onClick={handleClearCredentials}
                  disabled={loading}
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* ── Manual Credentials Form ─────────────── */}
          {!showAdvanced && (
            <div className="aw-card" style={{ marginBottom: spacing.md }}>
              {/* Profile Name */}
              <div style={{ marginBottom: spacing.md }}>
                <label className="aw-label">Nome do Perfil</label>
                <input
                  className="aw-input"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="default"
                />
              </div>

              {/* Access Key */}
              <div style={{ marginBottom: spacing.md }}>
                <label className="aw-label aw-label-required">Access Key ID</label>
                <input
                  className="aw-input"
                  type="text"
                  value={credentials.accessKeyId}
                  onChange={(e) =>
                    setCredentials({ ...credentials, accessKeyId: e.target.value })
                  }
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>

              {/* Secret Key */}
              <div style={{ marginBottom: spacing.md }}>
                <label className="aw-label aw-label-required">
                  Secret Access Key
                </label>
                <input
                  className="aw-input"
                  type="password"
                  value={credentials.secretAccessKey}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      secretAccessKey: e.target.value,
                    })
                  }
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>

              {/* Session Token */}
              <div style={{ marginBottom: spacing.md }}>
                <label className="aw-label">Session Token</label>
                <textarea
                  className="aw-textarea"
                  value={credentials.sessionToken}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      sessionToken: e.target.value,
                    })
                  }
                  placeholder="Token de sessão temporária (opcional)"
                  rows={2}
                />
              </div>

              {/* Region */}
              <div style={{ marginBottom: spacing.lg }}>
                <label className="aw-label">Região</label>
                <select
                  className="aw-select"
                  value={credentials.region}
                  onChange={(e) =>
                    setCredentials({ ...credentials, region: e.target.value })
                  }
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                  <option value="sa-east-1">sa-east-1 (São Paulo)</option>
                </select>
              </div>

              {/* Save */}
              <button
                className="aw-btn aw-btn-primary aw-btn-full"
                onClick={handleSaveCredentials}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Credenciais"}
              </button>
            </div>
          )}

          {/* ── Tips Section ────────────────────────── */}
          <div>
            <button
              className="aw-tips-toggle"
              onClick={() => setShowTips(!showTips)}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: showTips ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Como usar
            </button>

            {showTips && (
              <ol className="aw-tips-list">
                <li>
                  Use <strong>Importação Rápida</strong> para colar credenciais
                  completas
                </li>
                <li>
                  Ou preencha os campos manualmente na aba{" "}
                  <strong>Credenciais</strong>
                </li>
                <li>
                  Os arquivos ~/.aws são sempre limpos antes de salvar novas
                  credenciais
                </li>
                <li>
                  Use <strong>Limpar</strong> para apagar todas as credenciais
                  existentes
                </li>
                <li>
                  Use <strong>Testar</strong> para verificar se está online
                </li>
                <li>
                  Ative <strong>Monitorar</strong> para verificação automática do
                  status
                </li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
