"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAWSView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const tokens_1 = require("../styles/tokens");
// ─── Theme Hook ──────────────────────────────────────────────────────────────
function useTheme() {
    const [isDark, setIsDark] = (0, react_1.useState)(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
    (0, react_1.useEffect)(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e) => setIsDark(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isDark ? tokens_1.darkTheme : tokens_1.lightTheme;
}
// ─── Injected Styles ─────────────────────────────────────────────────────────
// CSS classes para hover/focus/transitions — impossível com inline styles puro.
function GlobalStyles({ t }) {
    const css = (0, react_1.useMemo)(() => `
    /* ── Reset & Base ─────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${t.bg.app}; font-family: ${tokens_1.typography.family.sans}; }

    /* ── Scrollbar ────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${t.border.default}; border-radius: ${tokens_1.radius.full}px; }

    /* ── Buttons ──────────────────────────────────── */
    .aw-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: ${tokens_1.spacing.sm}px;
      font-family: ${tokens_1.typography.family.sans}; font-weight: ${tokens_1.typography.weight.semibold};
      font-size: ${tokens_1.typography.size.base}px; line-height: 1;
      border: none; border-radius: ${tokens_1.radius.md}px; cursor: pointer;
      padding: ${tokens_1.spacing.sm}px ${tokens_1.spacing.lg}px;
      transition: background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      outline: none;
    }
    .aw-btn:focus-visible { box-shadow: ${tokens_1.shadows.focus}; }
    .aw-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    .aw-btn-primary { background: ${t.action.primary}; color: ${t.action.primaryFg}; }
    .aw-btn-primary:hover:not(:disabled) { background: ${t.action.primaryHover}; }

    .aw-btn-success { background: ${t.action.success}; color: ${t.action.successFg}; }
    .aw-btn-success:hover:not(:disabled) { background: ${t.action.successHover}; }

    .aw-btn-danger { background: ${t.action.danger}; color: ${t.action.dangerFg}; }
    .aw-btn-danger:hover:not(:disabled) { background: ${t.action.dangerHover}; }
    .aw-btn-danger:focus-visible { box-shadow: ${tokens_1.shadows.focusDanger}; }

    .aw-btn-ghost {
      background: transparent; color: ${t.text.secondary};
      border: 1px solid ${t.border.default};
    }
    .aw-btn-ghost:hover:not(:disabled) { background: ${t.bg.surfaceHover}; color: ${t.text.primary}; }

    .aw-btn-sm { font-size: ${tokens_1.typography.size.sm}px; padding: ${tokens_1.spacing.xs}px ${tokens_1.spacing.md}px; }
    .aw-btn-lg { font-size: ${tokens_1.typography.size.lg}px; padding: ${tokens_1.spacing.md}px ${tokens_1.spacing.xl}px; }
    .aw-btn-full { width: 100%; }

    /* ── Inputs ───────────────────────────────────── */
    .aw-input, .aw-textarea, .aw-select {
      width: 100%; font-family: ${tokens_1.typography.family.sans}; font-size: ${tokens_1.typography.size.md}px;
      color: ${t.text.primary}; background: ${t.bg.input};
      border: 1px solid ${t.border.default}; border-radius: ${tokens_1.radius.md}px;
      padding: ${tokens_1.spacing.sm + 2}px ${tokens_1.spacing.md}px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      outline: none;
    }
    .aw-input:hover, .aw-textarea:hover, .aw-select:hover {
      border-color: ${t.border.strong}; background: ${t.bg.inputHover};
    }
    .aw-input:focus, .aw-textarea:focus, .aw-select:focus {
      border-color: ${t.border.focus}; box-shadow: ${tokens_1.shadows.focus};
    }
    .aw-input::placeholder, .aw-textarea::placeholder { color: ${t.text.placeholder}; }
    .aw-textarea { resize: vertical; font-family: ${tokens_1.typography.family.mono}; font-size: ${tokens_1.typography.size.sm}px; line-height: 1.6; }
    .aw-select { cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right ${tokens_1.spacing.md}px center;
      padding-right: ${tokens_1.spacing['2xl']}px;
    }

    /* ── Segmented Control ────────────────────────── */
    .aw-seg { display: flex; background: ${t.bg.muted}; border-radius: ${tokens_1.radius.md}px; padding: 3px; gap: 2px; }
    .aw-seg-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: ${tokens_1.spacing.xs}px;
      padding: ${tokens_1.spacing.sm}px ${tokens_1.spacing.lg}px; border: none; border-radius: ${tokens_1.radius.sm + 1}px;
      font-family: ${tokens_1.typography.family.sans}; font-size: ${tokens_1.typography.size.base}px;
      font-weight: ${tokens_1.typography.weight.medium}; cursor: pointer;
      background: transparent; color: ${t.text.muted};
      transition: all 0.2s ease;
    }
    .aw-seg-btn:hover { color: ${t.text.secondary}; }
    .aw-seg-btn.active {
      background: ${t.bg.surface}; color: ${t.text.primary};
      box-shadow: ${tokens_1.shadows.sm}; font-weight: ${tokens_1.typography.weight.semibold};
    }

    /* ── Status Dot Pulse ─────────────────────────── */
    @keyframes aw-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.5); }
    }
    .aw-dot { display: inline-block; width: 8px; height: 8px; border-radius: ${tokens_1.radius.full}px; }
    .aw-dot-online { background: ${t.status.online.dot}; animation: aw-pulse 2s ease-in-out infinite; }
    .aw-dot-offline { background: ${t.status.offline.dot}; }

    /* ── Card ─────────────────────────────────────── */
    .aw-card {
      background: ${t.bg.surface}; border: 1px solid ${t.border.default};
      border-radius: ${tokens_1.radius.lg}px; padding: ${tokens_1.spacing.lg}px;
      box-shadow: ${tokens_1.shadows.sm};
    }

    /* ── Divider ──────────────────────────────────── */
    .aw-divider {
      display: flex; align-items: center; gap: ${tokens_1.spacing.md}px;
      margin: ${tokens_1.spacing.lg}px 0; color: ${t.text.muted};
      font-size: ${tokens_1.typography.size.xs}px; text-transform: uppercase;
      letter-spacing: 0.05em; font-weight: ${tokens_1.typography.weight.medium};
    }
    .aw-divider::before, .aw-divider::after {
      content: ''; flex: 1; height: 1px; background: ${t.border.default};
    }

    /* ── Feedback Toast ───────────────────────────── */
    .aw-toast {
      border-radius: ${tokens_1.radius.md}px; padding: ${tokens_1.spacing.md}px ${tokens_1.spacing.lg}px;
      font-size: ${tokens_1.typography.size.base}px; font-weight: ${tokens_1.typography.weight.medium};
      border-left: 3px solid; animation: aw-slideIn 0.25s ease-out;
    }
    @keyframes aw-slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Label ────────────────────────────────────── */
    .aw-label {
      display: block; font-size: ${tokens_1.typography.size.sm}px; font-weight: ${tokens_1.typography.weight.semibold};
      color: ${t.text.secondary}; margin-bottom: ${tokens_1.spacing.xs + 2}px;
      letter-spacing: 0.01em;
    }
    .aw-label-required::after { content: ' *'; color: ${t.action.danger}; }

    /* ── Collapsible Tips ─────────────────────────── */
    .aw-tips-toggle {
      display: flex; align-items: center; gap: ${tokens_1.spacing.sm}px;
      background: none; border: none; cursor: pointer;
      font-family: ${tokens_1.typography.family.sans}; font-size: ${tokens_1.typography.size.sm}px;
      font-weight: ${tokens_1.typography.weight.semibold}; color: ${t.text.muted};
      padding: ${tokens_1.spacing.sm}px 0; transition: color 0.15s ease;
    }
    .aw-tips-toggle:hover { color: ${t.text.secondary}; }
    .aw-tips-list {
      margin: ${tokens_1.spacing.sm}px 0 0 0; padding-left: ${tokens_1.spacing.xl}px;
      font-size: ${tokens_1.typography.size.sm}px; color: ${t.text.secondary};
      line-height: 1.8;
    }
  `, [t]);
    return (0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: css } });
}
// ─── Main Component ──────────────────────────────────────────────────────────
const SimpleAWSView = () => {
    const t = useTheme();
    // ── State ────────────────────────────────────────
    const [credentials, setCredentials] = (0, react_1.useState)({
        accessKeyId: "",
        secretAccessKey: "",
        sessionToken: "",
        region: "us-east-1",
    });
    const [profileName, setProfileName] = (0, react_1.useState)("default");
    const [status, setStatus] = (0, react_1.useState)({
        isOnline: false,
        lastCheck: new Date(),
    });
    const [isMonitoring, setIsMonitoring] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [message, setMessage] = (0, react_1.useState)("");
    const [credentialsText, setCredentialsText] = (0, react_1.useState)("");
    const [showAdvanced, setShowAdvanced] = (0, react_1.useState)(false);
    const [showTips, setShowTips] = (0, react_1.useState)(false);
    // ── Effects ──────────────────────────────────────
    (0, react_1.useEffect)(() => {
        loadInitialData();
    }, []);
    (0, react_1.useEffect)(() => {
        if (isMonitoring) {
            const interval = setInterval(async () => {
                const currentStatus = await window.electron.aws.getStatus();
                setStatus(currentStatus);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [isMonitoring]);
    (0, react_1.useEffect)(() => {
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
        }
        catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
        }
    };
    const loadCredentialsFromProfile = async () => {
        try {
            const profiles = await window.electron.aws.listProfiles();
            if (profiles.length > 0) {
                const currentProfile = profileName || profiles[0];
                setProfileName(currentProfile);
                const storedProfiles = await window.electron.storage.getProfiles();
                const profile = storedProfiles.find((p) => p.name === currentProfile);
                if (profile) {
                    setCredentials({
                        accessKeyId: profile.accessKeyId || "",
                        secretAccessKey: profile.secretAccessKey || "",
                        sessionToken: profile.sessionToken || "",
                        region: profile.region || "us-east-1",
                    });
                }
                else {
                    await window.electron.aws.importFromExistingCredentials();
                    const updatedProfiles = await window.electron.aws.listProfiles();
                    if (updatedProfiles.includes(currentProfile)) {
                        const updatedStored = await window.electron.storage.getProfiles();
                        const updatedProfile = updatedStored.find((p) => p.name === currentProfile);
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
        }
        catch (error) {
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
            const result = await window.electron.aws.parseAndSaveCredentialsText(credentialsText);
            if (result.success) {
                setMessage(`success:${result.message}`);
                setCredentialsText("");
                const profiles = await window.electron.aws.listProfiles();
                if (profiles.length > 0)
                    setProfileName(profiles[0]);
                await handleTestConnection();
            }
            else {
                setMessage(`error:${result.message}`);
            }
        }
        catch (error) {
            console.error("Erro ao importar texto:", error);
            setMessage("error:Erro ao importar credenciais do texto");
        }
        finally {
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
                if (profiles.length > 0)
                    setProfileName(profiles[0]);
                await handleTestConnection();
            }
            else {
                setMessage(`error:${result.message}`);
            }
        }
        catch (error) {
            console.error("Erro ao importar existente:", error);
            setMessage("error:Erro ao importar credenciais existentes");
        }
        finally {
            setLoading(false);
        }
    };
    const handleClearCredentials = async () => {
        setLoading(true);
        setMessage("");
        try {
            const success = await window.electron.aws.clearCredentials();
            if (success) {
                setMessage("success:Arquivos ~/.aws/credentials e ~/.aws/config limpos com sucesso");
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
            }
            else {
                setMessage("error:Erro ao limpar arquivos de credenciais");
            }
        }
        catch (error) {
            console.error("Erro ao limpar credenciais:", error);
            setMessage("error:Erro ao limpar credenciais");
        }
        finally {
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
            const success = await window.electron.aws.saveCredentials(credentials, profileName);
            if (success) {
                setMessage(`success:Credenciais salvas para o perfil "${profileName}"`);
                await handleTestConnection();
            }
            else {
                setMessage("error:Erro ao salvar credenciais");
            }
        }
        catch (error) {
            console.error("Erro ao salvar credenciais:", error);
            setMessage("error:Erro ao salvar credenciais");
        }
        finally {
            setLoading(false);
        }
    };
    const handleTestConnection = async () => {
        setLoading(true);
        setMessage("loading:Testando conexão...");
        try {
            const isOnline = await window.electron.aws.testSimpleConnection(profileName);
            if (isOnline) {
                setMessage("success:Conexão bem-sucedida! Você está online.");
                setStatus({ isOnline: true, lastCheck: new Date() });
            }
            else {
                setMessage("error:Falha na conexão. Verifique suas credenciais.");
                setStatus({
                    isOnline: false,
                    lastCheck: new Date(),
                    error: "Falha na autenticação",
                });
            }
        }
        catch (error) {
            console.error("Erro ao testar conexão:", error);
            let errorMessage = "Erro ao testar conexão";
            let errorDetails = "Falha na autenticação";
            if (error instanceof Error) {
                if (error.message.includes("Token de sessão expirado")) {
                    errorMessage = "Token de sessão expirado!";
                    errorDetails = "Obtenha novas credenciais AWS temporárias";
                }
                else if (error.message.includes("Access Key ID inválido")) {
                    errorMessage = "Access Key ID inválido!";
                    errorDetails = "Verifique a chave de acesso";
                }
                else if (error.message.includes("Secret Access Key inválido")) {
                    errorMessage = "Secret Access Key inválido!";
                    errorDetails = "Verifique a chave secreta";
                }
                else if (error.message.includes("Nenhuma credencial encontrada")) {
                    errorMessage = "Nenhuma credencial encontrada!";
                    errorDetails = "Configure as credenciais para este perfil";
                }
                else {
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
        }
        finally {
            setLoading(false);
        }
    };
    const handleToggleMonitoring = async () => {
        if (isMonitoring) {
            await window.electron.aws.stopMonitoring();
            setIsMonitoring(false);
            setMessage("info:Monitoramento parado");
        }
        else {
            await window.electron.aws.startMonitoring(profileName, 30);
            setIsMonitoring(true);
            setMessage("info:Monitoramento iniciado (verifica a cada 30s)");
        }
    };
    // ── Helpers ──────────────────────────────────────
    const formatLastCheck = (date) => new Date(date).toLocaleTimeString("pt-BR");
    const getMessageType = () => {
        if (message.startsWith("success:"))
            return "success";
        if (message.startsWith("error:"))
            return "error";
        if (message.startsWith("loading:"))
            return "loading";
        return "info";
    };
    const getMessageText = () => {
        const idx = message.indexOf(":");
        return idx !== -1 ? message.slice(idx + 1) : message;
    };
    const statusColors = status.isOnline ? t.status.online : t.status.offline;
    // ── Render ───────────────────────────────────────
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(GlobalStyles, { t: t }), (0, jsx_runtime_1.jsx)("div", { style: {
                    height: "100vh",
                    background: t.bg.app,
                    padding: `${tokens_1.spacing.lg}px`,
                    fontFamily: tokens_1.typography.family.sans,
                    color: t.text.primary,
                    overflow: "auto",
                }, children: (0, jsx_runtime_1.jsxs)("div", { style: { maxWidth: 540, margin: "0 auto" }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "aw-card", style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: `${tokens_1.spacing.sm}px ${tokens_1.spacing.md}px`,
                                marginBottom: tokens_1.spacing.md,
                                background: statusColors.bg,
                                borderColor: statusColors.border,
                            }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("span", { className: `aw-dot ${status.isOnline ? "aw-dot-online" : "aw-dot-offline"}` }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { style: {
                                                        fontSize: tokens_1.typography.size.base,
                                                        fontWeight: tokens_1.typography.weight.semibold,
                                                        color: statusColors.text,
                                                    }, children: status.isOnline ? "Online" : "Offline" }), (0, jsx_runtime_1.jsx)("span", { style: {
                                                        fontSize: tokens_1.typography.size.xs,
                                                        color: statusColors.text,
                                                        opacity: 0.7,
                                                        marginLeft: tokens_1.spacing.sm,
                                                    }, children: formatLastCheck(status.lastCheck) })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: "flex", gap: tokens_1.spacing.sm }, children: [(0, jsx_runtime_1.jsx)("button", { className: "aw-btn aw-btn-primary aw-btn-sm", onClick: handleTestConnection, disabled: loading, children: "Testar" }), (0, jsx_runtime_1.jsx)("button", { className: `aw-btn aw-btn-sm ${isMonitoring ? "aw-btn-danger" : "aw-btn-ghost"}`, onClick: handleToggleMonitoring, children: isMonitoring ? "Parar" : "Monitorar" })] })] }), message && ((0, jsx_runtime_1.jsx)("div", { className: "aw-toast", style: {
                                marginBottom: tokens_1.spacing.md,
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
                            }, children: getMessageText() })), (0, jsx_runtime_1.jsxs)("div", { className: "aw-seg", style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("button", { className: `aw-seg-btn ${!showAdvanced ? "active" : ""}`, onClick: () => setShowAdvanced(false), children: "Credenciais" }), (0, jsx_runtime_1.jsx)("button", { className: `aw-seg-btn ${showAdvanced ? "active" : ""}`, onClick: () => setShowAdvanced(true), children: "Importa\u00E7\u00E3o R\u00E1pida" })] }), showAdvanced && ((0, jsx_runtime_1.jsxs)("div", { className: "aw-card", style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("button", { className: "aw-btn aw-btn-success aw-btn-full", onClick: handleImportFromExisting, disabled: loading, children: "Importar de ~/.aws/credentials" }), (0, jsx_runtime_1.jsx)("div", { className: "aw-divider", children: "ou cole abaixo" }), (0, jsx_runtime_1.jsx)("textarea", { className: "aw-textarea", value: credentialsText, onChange: (e) => setCredentialsText(e.target.value), placeholder: `[584532893736_AdministratorAccess]\naws_access_key_id=ASIAYQGHAEAUP67LJIP3\naws_secret_access_key=hryRrE3q228beXiJG...\naws_session_token=IQoJb3JpZ2luX2VjEPX...`, rows: 4 }), (0, jsx_runtime_1.jsxs)("div", { style: {
                                        display: "flex",
                                        gap: tokens_1.spacing.sm,
                                        marginTop: tokens_1.spacing.md,
                                    }, children: [(0, jsx_runtime_1.jsx)("button", { className: "aw-btn aw-btn-primary", style: { flex: 1 }, onClick: handleImportFromText, disabled: loading || !credentialsText.trim(), children: "Importar do Texto" }), (0, jsx_runtime_1.jsx)("button", { className: "aw-btn aw-btn-danger", onClick: handleClearCredentials, disabled: loading, children: "Limpar" })] })] })), !showAdvanced && ((0, jsx_runtime_1.jsxs)("div", { className: "aw-card", style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("label", { className: "aw-label", children: "Nome do Perfil" }), (0, jsx_runtime_1.jsx)("input", { className: "aw-input", type: "text", value: profileName, onChange: (e) => setProfileName(e.target.value), placeholder: "default" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("label", { className: "aw-label aw-label-required", children: "Access Key ID" }), (0, jsx_runtime_1.jsx)("input", { className: "aw-input", type: "text", value: credentials.accessKeyId, onChange: (e) => setCredentials({ ...credentials, accessKeyId: e.target.value }), placeholder: "AKIAIOSFODNN7EXAMPLE" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("label", { className: "aw-label aw-label-required", children: "Secret Access Key" }), (0, jsx_runtime_1.jsx)("input", { className: "aw-input", type: "password", value: credentials.secretAccessKey, onChange: (e) => setCredentials({
                                                ...credentials,
                                                secretAccessKey: e.target.value,
                                            }), placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: tokens_1.spacing.md }, children: [(0, jsx_runtime_1.jsx)("label", { className: "aw-label", children: "Session Token" }), (0, jsx_runtime_1.jsx)("textarea", { className: "aw-textarea", value: credentials.sessionToken, onChange: (e) => setCredentials({
                                                ...credentials,
                                                sessionToken: e.target.value,
                                            }), placeholder: "Token de sess\u00E3o tempor\u00E1ria (opcional)", rows: 2 })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: tokens_1.spacing.lg }, children: [(0, jsx_runtime_1.jsx)("label", { className: "aw-label", children: "Regi\u00E3o" }), (0, jsx_runtime_1.jsxs)("select", { className: "aw-select", value: credentials.region, onChange: (e) => setCredentials({ ...credentials, region: e.target.value }), children: [(0, jsx_runtime_1.jsx)("option", { value: "us-east-1", children: "us-east-1 (N. Virginia)" }), (0, jsx_runtime_1.jsx)("option", { value: "us-west-2", children: "us-west-2 (Oregon)" }), (0, jsx_runtime_1.jsx)("option", { value: "eu-west-1", children: "eu-west-1 (Ireland)" }), (0, jsx_runtime_1.jsx)("option", { value: "sa-east-1", children: "sa-east-1 (S\u00E3o Paulo)" })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "aw-btn aw-btn-primary aw-btn-full", onClick: handleSaveCredentials, disabled: loading, children: loading ? "Salvando..." : "Salvar Credenciais" })] })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("button", { className: "aw-tips-toggle", onClick: () => setShowTips(!showTips), children: [(0, jsx_runtime_1.jsx)("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: {
                                                transform: showTips ? "rotate(90deg)" : "rotate(0deg)",
                                                transition: "transform 0.2s ease",
                                            }, children: (0, jsx_runtime_1.jsx)("path", { d: "M9 18l6-6-6-6" }) }), "Como usar"] }), showTips && ((0, jsx_runtime_1.jsxs)("ol", { className: "aw-tips-list", children: [(0, jsx_runtime_1.jsxs)("li", { children: ["Use ", (0, jsx_runtime_1.jsx)("strong", { children: "Importa\u00E7\u00E3o R\u00E1pida" }), " para colar credenciais completas"] }), (0, jsx_runtime_1.jsxs)("li", { children: ["Ou preencha os campos manualmente na aba", " ", (0, jsx_runtime_1.jsx)("strong", { children: "Credenciais" })] }), (0, jsx_runtime_1.jsx)("li", { children: "Os arquivos ~/.aws s\u00E3o sempre limpos antes de salvar novas credenciais" }), (0, jsx_runtime_1.jsxs)("li", { children: ["Use ", (0, jsx_runtime_1.jsx)("strong", { children: "Limpar" }), " para apagar todas as credenciais existentes"] }), (0, jsx_runtime_1.jsxs)("li", { children: ["Use ", (0, jsx_runtime_1.jsx)("strong", { children: "Testar" }), " para verificar se est\u00E1 online"] }), (0, jsx_runtime_1.jsxs)("li", { children: ["Ative ", (0, jsx_runtime_1.jsx)("strong", { children: "Monitorar" }), " para verifica\u00E7\u00E3o autom\u00E1tica do status"] })] }))] })] }) })] }));
};
exports.SimpleAWSView = SimpleAWSView;
