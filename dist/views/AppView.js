"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AppView = () => {
    const [activeTab, setActiveTab] = (0, react_1.useState)("profiles");
    const [profiles, setProfiles] = (0, react_1.useState)([]);
    const [selectedProfile, setSelectedProfile] = (0, react_1.useState)(null);
    const [credentials, setCredentials] = (0, react_1.useState)("");
    const [connectionStatus, setConnectionStatus] = (0, react_1.useState)({
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        error: null,
    });
    const [settings, setSettings] = (0, react_1.useState)({
        autoConnect: false,
        minimizeToTray: true,
        showNotifications: true,
        tokenWarningMinutes: 30,
        autoReconnect: true,
    });
    const [connectionHistory, setConnectionHistory] = (0, react_1.useState)([]);
    const [dependencies, setDependencies] = (0, react_1.useState)(null);
    const [instances, setInstances] = (0, react_1.useState)([]);
    const [loadingInstances, setLoadingInstances] = (0, react_1.useState)(false);
    const [formData, setFormData] = (0, react_1.useState)({
        name: "",
        region: "us-east-1",
        instanceId: "",
        localPort: "5432",
        remotePort: "5432",
    });
    const [customCommand, setCustomCommand] = (0, react_1.useState)("");
    const [commandOutput, setCommandOutput] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        loadInitialData();
        setupListeners();
    }, []);
    const loadInitialData = async () => {
        try {
            const [loadedProfiles, loadedSettings, status, deps] = await Promise.all([
                window.electron.storage.getProfiles(),
                window.electron.storage.getSettings(),
                window.electron.connection.getStatus(),
                window.electron.dependencies.check(),
            ]);
            setProfiles(loadedProfiles);
            setSettings(loadedSettings);
            setConnectionStatus(status);
            setDependencies(deps);
            const history = await window.electron.storage.getConnectionHistory();
            setConnectionHistory(history.slice(-20).reverse());
        }
        catch (error) {
            console.error("Erro ao carregar dados:", error);
        }
    };
    const setupListeners = () => {
        window.electron.on("connection:status", (status) => {
            setConnectionStatus(status);
        });
        window.electron.on("token:warning", (event) => {
            window.electron.notification.show("Token Expirando", `Token expira em ${event.minutesRemaining} minutos`);
        });
        window.electron.on("token:expired", () => {
            window.electron.notification.show("Token Expirado", "Sua sessão foi encerrada devido à expiração do token");
        });
    };
    const handleParseCredentials = async () => {
        if (!credentials.trim())
            return;
        const parsed = await window.electron.aws.parseCredentials(credentials);
        const newProfiles = parsed.map((p) => ({
            id: crypto.randomUUID(),
            name: p.name,
            region: "us-east-1",
            instanceId: "",
            localPort: 5432,
            remotePort: 5432,
            accessKeyId: p.accessKeyId,
            secretAccessKey: p.secretAccessKey,
            sessionToken: p.sessionToken,
            expiration: p.expiration,
        }));
        const updated = [...profiles, ...newProfiles];
        setProfiles(updated);
        for (const profile of newProfiles) {
            await window.electron.storage.saveProfile(profile);
        }
        setCredentials("");
    };
    const handleAddProfile = async (e) => {
        e.preventDefault();
        const profile = {
            id: crypto.randomUUID(),
            name: formData.name,
            region: formData.region,
            instanceId: formData.instanceId,
            localPort: parseInt(formData.localPort),
            remotePort: parseInt(formData.remotePort),
        };
        await window.electron.storage.saveProfile(profile);
        setProfiles([...profiles, profile]);
        setFormData({
            name: "",
            region: "us-east-1",
            instanceId: "",
            localPort: "5432",
            remotePort: "5432",
        });
    };
    const handleDeleteProfile = async (id) => {
        await window.electron.storage.deleteProfile(id);
        setProfiles(profiles.filter((p) => p.id !== id));
        if (selectedProfile?.id === id) {
            setSelectedProfile(null);
        }
    };
    const handleConnect = async () => {
        if (!selectedProfile)
            return;
        setConnectionStatus({
            ...connectionStatus,
            isConnecting: true,
            error: null,
        });
        const success = await window.electron.connection.connect(selectedProfile);
        if (!success) {
            setConnectionStatus({
                isConnected: false,
                isConnecting: false,
                isReconnecting: false,
                error: "Falha ao conectar",
            });
        }
    };
    const handleDisconnect = async () => {
        await window.electron.connection.disconnect();
        setConnectionStatus({
            isConnected: false,
            isConnecting: false,
            isReconnecting: false,
            error: null,
        });
        const history = await window.electron.storage.getConnectionHistory();
        setConnectionHistory(history.slice(-20).reverse());
    };
    const handleSaveSettings = async (newSettings) => {
        const updated = await window.electron.storage.saveSettings(newSettings);
        setSettings(updated);
    };
    const handleLoadInstances = async (type) => {
        if (!selectedProfile)
            return;
        setLoadingInstances(true);
        try {
            const result = type === "ec2"
                ? await window.electron.cli.listEC2Instances(selectedProfile)
                : await window.electron.cli.listSSMInstances(selectedProfile);
            setInstances(result.instances || []);
        }
        catch (error) {
            console.error("Erro ao carregar instâncias:", error);
        }
        finally {
            setLoadingInstances(false);
        }
    };
    const handleRunCommand = async () => {
        if (!selectedProfile?.instanceId || !customCommand)
            return;
        const result = await window.electron.cli.runCommand(selectedProfile.instanceId, customCommand, selectedProfile);
        setCommandOutput(result.success
            ? "Comando executado com sucesso"
            : "Erro ao executar comando");
    };
    const handleTestCredentials = async (profile) => {
        const isValid = await window.electron.cli.validateCredentials(profile);
        return isValid;
    };
    const renderProfilesTab = () => ((0, jsx_runtime_1.jsxs)("div", { style: styles.tabContent, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Credenciais AWS" }), (0, jsx_runtime_1.jsx)("textarea", { value: credentials, onChange: (e) => setCredentials(e.target.value), placeholder: "Cole suas credenciais aqui ([profile]...", style: { ...styles.textarea, height: "100px" } }), (0, jsx_runtime_1.jsx)("button", { style: styles.button, onClick: handleParseCredentials, children: "Importar Credenciais" })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Novo Perfil" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleAddProfile, style: styles.form, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Nome", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), style: styles.input, required: true }), (0, jsx_runtime_1.jsxs)("select", { value: formData.region, onChange: (e) => setFormData({ ...formData, region: e.target.value }), style: styles.input, children: [(0, jsx_runtime_1.jsx)("option", { value: "us-east-1", children: "US East (N. Virginia)" }), (0, jsx_runtime_1.jsx)("option", { value: "us-west-2", children: "US West (Oregon)" }), (0, jsx_runtime_1.jsx)("option", { value: "eu-west-1", children: "EU (Ireland)" }), (0, jsx_runtime_1.jsx)("option", { value: "ap-southeast-1", children: "Asia Pacific (Singapore)" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Instance ID", value: formData.instanceId, onChange: (e) => setFormData({ ...formData, instanceId: e.target.value }), style: styles.input }), (0, jsx_runtime_1.jsx)("input", { type: "number", placeholder: "Porta Local", value: formData.localPort, onChange: (e) => setFormData({ ...formData, localPort: e.target.value }), style: styles.input }), (0, jsx_runtime_1.jsx)("input", { type: "number", placeholder: "Porta Remota", value: formData.remotePort, onChange: (e) => setFormData({ ...formData, remotePort: e.target.value }), style: styles.input }), (0, jsx_runtime_1.jsx)("button", { type: "submit", style: styles.button, children: "Adicionar Perfil" })] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsxs)("h3", { children: ["Perfis Salvos (", profiles.length, ")"] }), (0, jsx_runtime_1.jsx)("div", { style: styles.profileList, children: profiles.map((profile) => ((0, jsx_runtime_1.jsxs)("div", { style: {
                                ...styles.profileItem,
                                ...(selectedProfile?.id === profile.id
                                    ? styles.profileSelected
                                    : {}),
                            }, onClick: () => setSelectedProfile(profile), children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: profile.name }), (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsxs)("small", { children: [profile.region, " | ", profile.instanceId || "Sem instância"] }), profile.sessionToken && profile.expiration && ((0, jsx_runtime_1.jsx)("span", { style: styles.tokenBadge, children: "Token" }))] }), (0, jsx_runtime_1.jsx)("button", { style: styles.deleteBtn, onClick: (e) => {
                                        e.stopPropagation();
                                        handleDeleteProfile(profile.id);
                                    }, children: "\u00D7" })] }, profile.id))) })] }), selectedProfile && ((0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Conex\u00E3o" }), (0, jsx_runtime_1.jsxs)("p", { children: ["Perfil: ", (0, jsx_runtime_1.jsx)("strong", { children: selectedProfile.name })] }), (0, jsx_runtime_1.jsxs)("p", { children: ["Inst\u00E2ncia: ", selectedProfile.instanceId || "Não definida"] }), (0, jsx_runtime_1.jsxs)("p", { children: ["Porta: localhost:", selectedProfile.localPort, " \u2192", " ", selectedProfile.instanceId || "?", ":", selectedProfile.remotePort] }), connectionStatus.error && ((0, jsx_runtime_1.jsx)("div", { style: styles.error, children: connectionStatus.error })), (0, jsx_runtime_1.jsx)("button", { style: {
                            ...styles.button,
                            backgroundColor: connectionStatus.isConnected
                                ? "#dc3545"
                                : "#28a745",
                        }, onClick: connectionStatus.isConnected ? handleDisconnect : handleConnect, disabled: connectionStatus.isConnecting, children: connectionStatus.isConnecting
                            ? "Conectando..."
                            : connectionStatus.isReconnecting
                                ? "Reconectando..."
                                : connectionStatus.isConnected
                                    ? "Desconectar"
                                    : "Conectar" })] }))] }));
    const renderInstancesTab = () => ((0, jsx_runtime_1.jsx)("div", { style: styles.tabContent, children: (0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Inst\u00E2ncias AWS" }), selectedProfile ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.buttonGroup, children: [(0, jsx_runtime_1.jsx)("button", { style: styles.button, onClick: () => handleLoadInstances("ec2"), disabled: loadingInstances, children: loadingInstances ? "Carregando..." : "Listar EC2" }), (0, jsx_runtime_1.jsx)("button", { style: styles.button, onClick: () => handleLoadInstances("ssm"), disabled: loadingInstances, children: "Listar SSM" })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.instanceList, children: [instances.map((inst) => ((0, jsx_runtime_1.jsxs)("div", { style: styles.instanceItem, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: inst.InstanceId }), inst.Name && (0, jsx_runtime_1.jsxs)("span", { children: [" - ", inst.Name] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.instanceDetails, children: [inst.InstanceType && (0, jsx_runtime_1.jsx)("span", { children: inst.InstanceType }), inst.State?.Name && (0, jsx_runtime_1.jsx)("span", { children: inst.State.Name })] })] }, inst.InstanceId))), instances.length === 0 && !loadingInstances && ((0, jsx_runtime_1.jsx)("p", { children: "Nenhuma inst\u00E2ncia encontrada" }))] }), selectedProfile.instanceId && ((0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h4", { children: "Executar Comando" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Comando shell", value: customCommand, onChange: (e) => setCustomCommand(e.target.value), style: { ...styles.input, width: "100%" } }), (0, jsx_runtime_1.jsx)("button", { style: styles.button, onClick: handleRunCommand, children: "Executar" }), commandOutput && (0, jsx_runtime_1.jsx)("p", { children: commandOutput })] }))] })) : ((0, jsx_runtime_1.jsx)("p", { children: "Selecione um perfil para listar inst\u00E2ncias" }))] }) }));
    const renderHistoryTab = () => ((0, jsx_runtime_1.jsx)("div", { style: styles.tabContent, children: (0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Hist\u00F3rico de Conex\u00F5es" }), (0, jsx_runtime_1.jsxs)("div", { style: styles.historyList, children: [connectionHistory.map((conn) => ((0, jsx_runtime_1.jsxs)("div", { style: styles.historyItem, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: conn.profileName }), (0, jsx_runtime_1.jsx)("span", { style: {
                                                ...styles.statusBadge,
                                                backgroundColor: conn.status === "disconnected"
                                                    ? "#28a745"
                                                    : conn.status === "failed"
                                                        ? "#dc3545"
                                                        : "#ffc107",
                                            }, children: conn.status })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.historyDetails, children: [(0, jsx_runtime_1.jsx)("span", { children: new Date(conn.connectedAt).toLocaleString() }), conn.duration && ((0, jsx_runtime_1.jsxs)("span", { children: [Math.floor(conn.duration / 60), "min"] }))] })] }, conn.id))), connectionHistory.length === 0 && ((0, jsx_runtime_1.jsx)("p", { children: "Nenhuma conex\u00E3o no hist\u00F3rico" }))] })] }) }));
    const renderSettingsTab = () => ((0, jsx_runtime_1.jsxs)("div", { style: styles.tabContent, children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Configura\u00E7\u00F5es" }), (0, jsx_runtime_1.jsxs)("label", { style: styles.label, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.minimizeToTray, onChange: (e) => handleSaveSettings({ minimizeToTray: e.target.checked }) }), "Minimizar para bandeja do sistema"] }), (0, jsx_runtime_1.jsxs)("label", { style: styles.label, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.showNotifications, onChange: (e) => handleSaveSettings({ showNotifications: e.target.checked }) }), "Mostrar notifica\u00E7\u00F5es"] }), (0, jsx_runtime_1.jsxs)("label", { style: styles.label, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: settings.autoReconnect, onChange: (e) => handleSaveSettings({ autoReconnect: e.target.checked }) }), "Reconex\u00E3o autom\u00E1tica"] }), (0, jsx_runtime_1.jsxs)("label", { style: styles.label, children: [(0, jsx_runtime_1.jsx)("input", { type: "number", value: settings.tokenWarningMinutes, onChange: (e) => handleSaveSettings({
                                    tokenWarningMinutes: parseInt(e.target.value),
                                }), style: { width: "60px", marginLeft: "10px" } }), "Minutos para aviso de expira\u00E7\u00E3o"] })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "Depend\u00EAncias" }), dependencies && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { style: styles.dependencyItem, children: [(0, jsx_runtime_1.jsx)("span", { children: "AWS CLI:" }), (0, jsx_runtime_1.jsx)("span", { style: {
                                            color: dependencies.awsCLI.installed ? "green" : "red",
                                        }, children: dependencies.awsCLI.installed
                                            ? `✓ ${dependencies.awsCLI.version}`
                                            : "✗ Não instalado" })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.dependencyItem, children: [(0, jsx_runtime_1.jsx)("span", { children: "AWS SDK:" }), (0, jsx_runtime_1.jsx)("span", { style: {
                                            color: dependencies.awsSDK.installed ? "green" : "red",
                                        }, children: dependencies.awsSDK.installed
                                            ? `✓ ${dependencies.awsSDK.version}`
                                            : "✗ Não instalado" })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.dependencyItem, children: [(0, jsx_runtime_1.jsx)("span", { children: "Node.js:" }), (0, jsx_runtime_1.jsx)("span", { children: dependencies.nodeVersion })] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.dependencyItem, children: [(0, jsx_runtime_1.jsx)("span", { children: "Plataforma:" }), (0, jsx_runtime_1.jsx)("span", { children: dependencies.platform })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { style: styles.section, children: [(0, jsx_runtime_1.jsx)("h3", { children: "A\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("button", { style: styles.button, onClick: () => window.electron.window.hide(), children: "Minimizar para Bandeja" })] })] }));
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.container, children: [(0, jsx_runtime_1.jsxs)("header", { style: styles.header, children: [(0, jsx_runtime_1.jsx)("h1", { style: styles.title, children: "AWS Tunnel Manager" }), (0, jsx_runtime_1.jsxs)("div", { style: styles.status, children: [(0, jsx_runtime_1.jsx)("span", { style: {
                                    ...styles.statusDot,
                                    backgroundColor: connectionStatus.isConnected
                                        ? "#28a745"
                                        : "#6c757d",
                                } }), connectionStatus.isConnected ? "Conectado" : "Desconectado"] })] }), (0, jsx_runtime_1.jsxs)("nav", { style: styles.nav, children: [(0, jsx_runtime_1.jsx)("button", { style: {
                            ...styles.navButton,
                            ...(activeTab === "profiles" ? styles.navActive : {}),
                        }, onClick: () => setActiveTab("profiles"), children: "Perfis" }), (0, jsx_runtime_1.jsx)("button", { style: {
                            ...styles.navButton,
                            ...(activeTab === "instances" ? styles.navActive : {}),
                        }, onClick: () => setActiveTab("instances"), children: "Inst\u00E2ncias" }), (0, jsx_runtime_1.jsx)("button", { style: {
                            ...styles.navButton,
                            ...(activeTab === "history" ? styles.navActive : {}),
                        }, onClick: () => setActiveTab("history"), children: "Hist\u00F3rico" }), (0, jsx_runtime_1.jsx)("button", { style: {
                            ...styles.navButton,
                            ...(activeTab === "settings" ? styles.navActive : {}),
                        }, onClick: () => setActiveTab("settings"), children: "Configura\u00E7\u00F5es" })] }), (0, jsx_runtime_1.jsxs)("main", { style: styles.main, children: [activeTab === "profiles" && renderProfilesTab(), activeTab === "instances" && renderInstancesTab(), activeTab === "history" && renderHistoryTab(), activeTab === "settings" && renderSettingsTab()] })] }));
};
exports.AppView = AppView;
const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f5f5",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 20px",
        backgroundColor: "#2c3e50",
        color: "white",
    },
    title: {
        margin: 0,
        fontSize: "20px",
    },
    status: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
    },
    statusDot: {
        width: "10px",
        height: "10px",
        borderRadius: "50%",
    },
    nav: {
        display: "flex",
        backgroundColor: "#34495e",
        padding: "0 10px",
    },
    navButton: {
        padding: "12px 20px",
        border: "none",
        backgroundColor: "transparent",
        color: "#bdc3c7",
        cursor: "pointer",
        fontSize: "14px",
        borderBottom: "2px solid transparent",
    },
    navActive: {
        color: "white",
        borderBottomColor: "#3498db",
    },
    main: {
        flex: 1,
        overflow: "auto",
        padding: "20px",
    },
    tabContent: {
        maxWidth: "900px",
        margin: "0 auto",
    },
    section: {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    form: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
    },
    input: {
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
    },
    textarea: {
        width: "100%",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
        fontFamily: "monospace",
        resize: "vertical",
    },
    button: {
        padding: "10px 20px",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
    },
    buttonGroup: {
        display: "flex",
        gap: "10px",
        marginBottom: "15px",
    },
    profileList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    profileItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        cursor: "pointer",
        border: "2px solid transparent",
    },
    profileSelected: {
        borderColor: "#3498db",
        backgroundColor: "#e8f4fc",
    },
    deleteBtn: {
        backgroundColor: "transparent",
        border: "none",
        color: "#e74c3c",
        fontSize: "20px",
        cursor: "pointer",
        padding: "0 10px",
    },
    tokenBadge: {
        marginLeft: "8px",
        padding: "2px 6px",
        backgroundColor: "#ffc107",
        borderRadius: "4px",
        fontSize: "11px",
    },
    error: {
        padding: "10px",
        backgroundColor: "#f8d7da",
        color: "#721c24",
        borderRadius: "4px",
        marginBottom: "10px",
    },
    instanceList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    instanceItem: {
        padding: "10px",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
    },
    instanceDetails: {
        display: "flex",
        gap: "15px",
        fontSize: "12px",
        color: "#666",
        marginTop: "5px",
    },
    historyList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    historyItem: {
        padding: "12px",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
    },
    historyDetails: {
        display: "flex",
        gap: "15px",
        fontSize: "12px",
        color: "#666",
        marginTop: "5px",
    },
    statusBadge: {
        marginLeft: "10px",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        color: "white",
    },
    label: {
        display: "flex",
        alignItems: "center",
        marginBottom: "12px",
        fontSize: "14px",
        cursor: "pointer",
    },
    dependencyItem: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #eee",
    },
};
exports.default = exports.AppView;
