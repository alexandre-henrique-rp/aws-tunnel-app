import React, { useEffect, useState } from "react";

interface Profile {
  id: string;
  name: string;
  region: string;
  instanceId: string;
  localPort: number;
  remotePort: number;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  expiration?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AppSettings {
  autoConnect: boolean;
  minimizeToTray: boolean;
  showNotifications: boolean;
  tokenWarningMinutes: number;
  autoReconnect: boolean;
}

interface Connection {
  id: string;
  profileId: string;
  profileName: string;
  region: string;
  instanceId: string;
  localPort: number;
  remotePort: number;
  connectedAt: string;
  disconnectedAt?: string;
  status: "connected" | "disconnected" | "failed";
  duration?: number;
}

interface DependencyStatus {
  name: string;
  installed: boolean;
  version?: string;
  error?: string;
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
}

type TabType = "profiles" | "instances" | "history" | "settings";

declare global {
  interface Window {
    electron: {
      app: {
        ready: () => Promise<{
          version: string;
          platform: string;
          arch: string;
        }>;
      };
      dependencies: {
        check: () => Promise<{
          awsCLI: DependencyStatus;
          awsSDK: DependencyStatus;
          nodeVersion: string;
          platform: string;
        }>;
        installCLI: () => Promise<{ success: boolean; message: string }>;
        installSDK: () => Promise<{ success: boolean; message: string }>;
      };
      storage: {
        getProfiles: () => Promise<Profile[]>;
        saveProfile: (profile: Profile) => Promise<Profile>;
        deleteProfile: (id: string) => Promise<boolean>;
        getSettings: () => Promise<AppSettings>;
        saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
        getConnectionHistory: (profileId?: string) => Promise<Connection[]>;
      };
      aws: {
        parseCredentials: (text: string) => Promise<Profile[]>;
        testConnection: (profile: Profile) => Promise<boolean>;
        saveCredentials: (
          credentials: any,
          profileName?: string,
        ) => Promise<boolean>;
        testSimpleConnection: (profileName?: string) => Promise<boolean>;
        startMonitoring: (
          profileName?: string,
          interval?: number,
        ) => Promise<boolean>;
        stopMonitoring: () => Promise<boolean>;
        getStatus: () => Promise<{
          isOnline: boolean;
          lastCheck: Date;
          error?: string;
        }>;
        listProfiles: () => Promise<string[]>;
        parseAndSaveCredentialsText: (
          credentialsText: string,
        ) => Promise<{ success: boolean; profiles: string[]; message: string }>;
        importFromExistingCredentials: () => Promise<{
          success: boolean;
          profiles: string[];
          message: string;
        }>;
        clearCredentials: () => Promise<boolean>;
      };
      connection: {
        connect: (profile: Profile) => Promise<boolean>;
        disconnect: () => Promise<{ success: boolean }>;
        getStatus: () => Promise<ConnectionState>;
        autoReconnect: (enabled: boolean) => Promise<{ success: boolean }>;
      };
      token: {
        getStatus: (profile: Profile) => Promise<{
          expiresIn?: number;
          isExpired: boolean;
          isExpiringSoon: boolean;
          expiresAt?: string;
        }>;
        setWarningThreshold: (minutes: number) => Promise<{ success: boolean }>;
      };
      cli: {
        listEC2Instances: (
          profile: Profile,
        ) => Promise<{ success: boolean; instances?: any[] }>;
        listSSMInstances: (
          profile: Profile,
        ) => Promise<{ success: boolean; instances?: any[] }>;
        getCallerIdentity: (
          profile?: Profile,
        ) => Promise<{ success: boolean; identity?: any }>;
        validateCredentials: (profile: Profile) => Promise<boolean>;
        runCommand: (
          instanceId: string,
          command: string,
          profile: Profile,
        ) => Promise<{ success: boolean }>;
      };
      notification: {
        show: (title: string, body: string) => Promise<{ success: boolean }>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        hide: () => Promise<void>;
      };
      on: (channel: string, callback: (...args: any[]) => void) => void;
      send: (channel: string, ...args: any[]) => void;
    };
  }
}

export const AppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("profiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [credentials, setCredentials] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    error: null,
  });
  const [settings, setSettings] = useState<AppSettings>({
    autoConnect: false,
    minimizeToTray: true,
    showNotifications: true,
    tokenWarningMinutes: 30,
    autoReconnect: true,
  });
  const [connectionHistory, setConnectionHistory] = useState<Connection[]>([]);
  const [dependencies, setDependencies] = useState<{
    awsCLI: DependencyStatus;
    awsSDK: DependencyStatus;
    nodeVersion: string;
    platform: string;
  } | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    region: "us-east-1",
    instanceId: "",
    localPort: "5432",
    remotePort: "5432",
  });
  const [customCommand, setCustomCommand] = useState("");
  const [commandOutput, setCommandOutput] = useState("");

  useEffect(() => {
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
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const setupListeners = () => {
    window.electron.on("connection:status", (status: ConnectionState) => {
      setConnectionStatus(status);
    });

    window.electron.on("token:warning", (event: any) => {
      window.electron.notification.show(
        "Token Expirando",
        `Token expira em ${event.minutesRemaining} minutos`,
      );
    });

    window.electron.on("token:expired", () => {
      window.electron.notification.show(
        "Token Expirado",
        "Sua sessão foi encerrada devido à expiração do token",
      );
    });
  };

  const handleParseCredentials = async () => {
    if (!credentials.trim()) return;

    const parsed = await window.electron.aws.parseCredentials(credentials);
    const newProfiles: Profile[] = parsed.map((p: any) => ({
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

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const profile: Profile = {
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

  const handleDeleteProfile = async (id: string) => {
    await window.electron.storage.deleteProfile(id);
    setProfiles(profiles.filter((p) => p.id !== id));
    if (selectedProfile?.id === id) {
      setSelectedProfile(null);
    }
  };

  const handleConnect = async () => {
    if (!selectedProfile) return;

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

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await window.electron.storage.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleLoadInstances = async (type: "ec2" | "ssm") => {
    if (!selectedProfile) return;

    setLoadingInstances(true);
    try {
      const result =
        type === "ec2"
          ? await window.electron.cli.listEC2Instances(selectedProfile)
          : await window.electron.cli.listSSMInstances(selectedProfile);

      setInstances(result.instances || []);
    } catch (error) {
      console.error("Erro ao carregar instâncias:", error);
    } finally {
      setLoadingInstances(false);
    }
  };

  const handleRunCommand = async () => {
    if (!selectedProfile?.instanceId || !customCommand) return;

    const result = await window.electron.cli.runCommand(
      selectedProfile.instanceId,
      customCommand,
      selectedProfile,
    );

    setCommandOutput(
      result.success
        ? "Comando executado com sucesso"
        : "Erro ao executar comando",
    );
  };

  const handleTestCredentials = async (profile: Profile) => {
    const isValid = await window.electron.cli.validateCredentials(profile);
    return isValid;
  };

  const renderProfilesTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.section}>
        <h3>Credenciais AWS</h3>
        <textarea
          value={credentials}
          onChange={(e) => setCredentials(e.target.value)}
          placeholder="Cole suas credenciais aqui ([profile]..."
          style={{ ...styles.textarea, height: "100px" }}
        />
        <button style={styles.button} onClick={handleParseCredentials}>
          Importar Credenciais
        </button>
      </div>

      <div style={styles.section}>
        <h3>Novo Perfil</h3>
        <form onSubmit={handleAddProfile} style={styles.form}>
          <input
            type="text"
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            required
          />
          <select
            value={formData.region}
            onChange={(e) =>
              setFormData({ ...formData, region: e.target.value })
            }
            style={styles.input}
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          </select>
          <input
            type="text"
            placeholder="Instance ID"
            value={formData.instanceId}
            onChange={(e) =>
              setFormData({ ...formData, instanceId: e.target.value })
            }
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Porta Local"
            value={formData.localPort}
            onChange={(e) =>
              setFormData({ ...formData, localPort: e.target.value })
            }
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Porta Remota"
            value={formData.remotePort}
            onChange={(e) =>
              setFormData({ ...formData, remotePort: e.target.value })
            }
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Adicionar Perfil
          </button>
        </form>
      </div>

      <div style={styles.section}>
        <h3>Perfis Salvos ({profiles.length})</h3>
        <div style={styles.profileList}>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              style={{
                ...styles.profileItem,
                ...(selectedProfile?.id === profile.id
                  ? styles.profileSelected
                  : {}),
              }}
              onClick={() => setSelectedProfile(profile)}
            >
              <div>
                <strong>{profile.name}</strong>
                <br />
                <small>
                  {profile.region} | {profile.instanceId || "Sem instância"}
                </small>
                {profile.sessionToken && profile.expiration && (
                  <span style={styles.tokenBadge}>Token</span>
                )}
              </div>
              <button
                style={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProfile(profile.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedProfile && (
        <div style={styles.section}>
          <h3>Conexão</h3>
          <p>
            Perfil: <strong>{selectedProfile.name}</strong>
          </p>
          <p>Instância: {selectedProfile.instanceId || "Não definida"}</p>
          <p>
            Porta: localhost:{selectedProfile.localPort} →{" "}
            {selectedProfile.instanceId || "?"}:{selectedProfile.remotePort}
          </p>

          {connectionStatus.error && (
            <div style={styles.error}>{connectionStatus.error}</div>
          )}

          <button
            style={{
              ...styles.button,
              backgroundColor: connectionStatus.isConnected
                ? "#dc3545"
                : "#28a745",
            }}
            onClick={
              connectionStatus.isConnected ? handleDisconnect : handleConnect
            }
            disabled={connectionStatus.isConnecting}
          >
            {connectionStatus.isConnecting
              ? "Conectando..."
              : connectionStatus.isReconnecting
                ? "Reconectando..."
                : connectionStatus.isConnected
                  ? "Desconectar"
                  : "Conectar"}
          </button>
        </div>
      )}
    </div>
  );

  const renderInstancesTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.section}>
        <h3>Instâncias AWS</h3>
        {selectedProfile ? (
          <>
            <div style={styles.buttonGroup}>
              <button
                style={styles.button}
                onClick={() => handleLoadInstances("ec2")}
                disabled={loadingInstances}
              >
                {loadingInstances ? "Carregando..." : "Listar EC2"}
              </button>
              <button
                style={styles.button}
                onClick={() => handleLoadInstances("ssm")}
                disabled={loadingInstances}
              >
                Listar SSM
              </button>
            </div>

            <div style={styles.instanceList}>
              {instances.map((inst) => (
                <div key={inst.InstanceId} style={styles.instanceItem}>
                  <div>
                    <strong>{inst.InstanceId}</strong>
                    {inst.Name && <span> - {inst.Name}</span>}
                  </div>
                  <div style={styles.instanceDetails}>
                    {inst.InstanceType && <span>{inst.InstanceType}</span>}
                    {inst.State?.Name && <span>{inst.State.Name}</span>}
                  </div>
                </div>
              ))}
              {instances.length === 0 && !loadingInstances && (
                <p>Nenhuma instância encontrada</p>
              )}
            </div>

            {selectedProfile.instanceId && (
              <div style={styles.section}>
                <h4>Executar Comando</h4>
                <input
                  type="text"
                  placeholder="Comando shell"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  style={{ ...styles.input, width: "100%" }}
                />
                <button style={styles.button} onClick={handleRunCommand}>
                  Executar
                </button>
                {commandOutput && <p>{commandOutput}</p>}
              </div>
            )}
          </>
        ) : (
          <p>Selecione um perfil para listar instâncias</p>
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.section}>
        <h3>Histórico de Conexões</h3>
        <div style={styles.historyList}>
          {connectionHistory.map((conn) => (
            <div key={conn.id} style={styles.historyItem}>
              <div>
                <strong>{conn.profileName}</strong>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      conn.status === "disconnected"
                        ? "#28a745"
                        : conn.status === "failed"
                          ? "#dc3545"
                          : "#ffc107",
                  }}
                >
                  {conn.status}
                </span>
              </div>
              <div style={styles.historyDetails}>
                <span>{new Date(conn.connectedAt).toLocaleString()}</span>
                {conn.duration && (
                  <span>{Math.floor(conn.duration / 60)}min</span>
                )}
              </div>
            </div>
          ))}
          {connectionHistory.length === 0 && (
            <p>Nenhuma conexão no histórico</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.section}>
        <h3>Configurações</h3>

        <label style={styles.label}>
          <input
            type="checkbox"
            checked={settings.minimizeToTray}
            onChange={(e) =>
              handleSaveSettings({ minimizeToTray: e.target.checked })
            }
          />
          Minimizar para bandeja do sistema
        </label>

        <label style={styles.label}>
          <input
            type="checkbox"
            checked={settings.showNotifications}
            onChange={(e) =>
              handleSaveSettings({ showNotifications: e.target.checked })
            }
          />
          Mostrar notificações
        </label>

        <label style={styles.label}>
          <input
            type="checkbox"
            checked={settings.autoReconnect}
            onChange={(e) =>
              handleSaveSettings({ autoReconnect: e.target.checked })
            }
          />
          Reconexão automática
        </label>

        <label style={styles.label}>
          <input
            type="number"
            value={settings.tokenWarningMinutes}
            onChange={(e) =>
              handleSaveSettings({
                tokenWarningMinutes: parseInt(e.target.value),
              })
            }
            style={{ width: "60px", marginLeft: "10px" }}
          />
          Minutos para aviso de expiração
        </label>
      </div>

      <div style={styles.section}>
        <h3>Dependências</h3>
        {dependencies && (
          <>
            <div style={styles.dependencyItem}>
              <span>AWS CLI:</span>
              <span
                style={{
                  color: dependencies.awsCLI.installed ? "green" : "red",
                }}
              >
                {dependencies.awsCLI.installed
                  ? `✓ ${dependencies.awsCLI.version}`
                  : "✗ Não instalado"}
              </span>
            </div>
            <div style={styles.dependencyItem}>
              <span>AWS SDK:</span>
              <span
                style={{
                  color: dependencies.awsSDK.installed ? "green" : "red",
                }}
              >
                {dependencies.awsSDK.installed
                  ? `✓ ${dependencies.awsSDK.version}`
                  : "✗ Não instalado"}
              </span>
            </div>
            <div style={styles.dependencyItem}>
              <span>Node.js:</span>
              <span>{dependencies.nodeVersion}</span>
            </div>
            <div style={styles.dependencyItem}>
              <span>Plataforma:</span>
              <span>{dependencies.platform}</span>
            </div>
          </>
        )}
      </div>

      <div style={styles.section}>
        <h3>Ações</h3>
        <button
          style={styles.button}
          onClick={() => window.electron.window.hide()}
        >
          Minimizar para Bandeja
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>AWS Tunnel Manager</h1>
        <div style={styles.status}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: connectionStatus.isConnected
                ? "#28a745"
                : "#6c757d",
            }}
          />
          {connectionStatus.isConnected ? "Conectado" : "Desconectado"}
        </div>
      </header>

      <nav style={styles.nav}>
        <button
          style={{
            ...styles.navButton,
            ...(activeTab === "profiles" ? styles.navActive : {}),
          }}
          onClick={() => setActiveTab("profiles")}
        >
          Perfis
        </button>
        <button
          style={{
            ...styles.navButton,
            ...(activeTab === "instances" ? styles.navActive : {}),
          }}
          onClick={() => setActiveTab("instances")}
        >
          Instâncias
        </button>
        <button
          style={{
            ...styles.navButton,
            ...(activeTab === "history" ? styles.navActive : {}),
          }}
          onClick={() => setActiveTab("history")}
        >
          Histórico
        </button>
        <button
          style={{
            ...styles.navButton,
            ...(activeTab === "settings" ? styles.navActive : {}),
          }}
          onClick={() => setActiveTab("settings")}
        >
          Configurações
        </button>
      </nav>

      <main style={styles.main}>
        {activeTab === "profiles" && renderProfilesTab()}
        {activeTab === "instances" && renderInstancesTab()}
        {activeTab === "history" && renderHistoryTab()}
        {activeTab === "settings" && renderSettingsTab()}
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
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

export default AppView;
