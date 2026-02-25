import React, { useEffect, useState } from "react";

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
}

/**
 * @name SimpleAWSView
 * @description Interface simples para gerenciar credenciais AWS e monitorar status online
 */
export const SimpleAWSView: React.FC = () => {
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
  const [credentialsText, setCredentialsText] = useState(""); // Para colar texto completo
  const [showAdvanced, setShowAdvanced] = useState(false); // Alternar entre modos

  // Carregar status inicial e perfis disponíveis
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Carregar perfis existentes
      const profiles = await window.electron.aws.listProfiles();
      if (profiles.length > 0 && !profiles.includes("default")) {
        setProfileName(profiles[0]);
      }

      // Carregar status atual
      const currentStatus = await window.electron.aws.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    }
  };

  // Atualizar status periodicamente se estiver monitorando
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(async () => {
        const currentStatus = await window.electron.aws.getStatus();
        setStatus(currentStatus);
      }, 5000); // Atualizar a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  // Carregar credenciais do perfil ao entrar no modo rápido
  useEffect(() => {
    if (showAdvanced) {
      loadCredentialsFromProfile();
    }
  }, [showAdvanced]);

  const loadCredentialsFromProfile = async () => {
    try {
      const profiles = await (window.electron as any).aws.listProfiles();
      if (profiles.length > 0) {
        const currentProfile = profileName || profiles[0];
        setProfileName(currentProfile);
        
        // Tentar carregar credenciais do storage usando a API existente
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
          // Se não encontrar no storage, tentar carregar do arquivo AWS
          await (window.electron as any).aws.importFromExistingCredentials();
          const updatedProfiles = await (window.electron as any).aws.listProfiles();
          if (updatedProfiles.includes(currentProfile)) {
            const updatedStored = await (window.electron as any).storage.getProfiles();
            const updatedProfile = updatedStored.find((p: any) => p.name === currentProfile);
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

  /**
   * @name handleImportFromText
   * @description Importa credenciais de texto colado
   */
  const handleImportFromText = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (!credentialsText.trim()) {
        setMessage("❌ Cole o texto das credenciais primeiro");
        return;
      }

      const result =
        await window.electron.aws.parseAndSaveCredentialsText(credentialsText);

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setCredentialsText(""); // Limpar campo

        // Atualizar lista de perfis
        const profiles = await window.electron.aws.listProfiles();
        if (profiles.length > 0) {
          setProfileName(profiles[0]);
        }

        // Testar conexão automaticamente
        await handleTestConnection();
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao importar texto:", error);
      setMessage("❌ Erro ao importar credenciais do texto");
    } finally {
      setLoading(false);
    }
  };

  /**
   * @name handleImportFromExisting
   * @description Importa credenciais do arquivo ~/.aws/credentials existente
   */
  const handleImportFromExisting = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await window.electron.aws.importFromExistingCredentials();

      if (result.success) {
        setMessage(`✅ ${result.message}`);

        // Atualizar lista de perfis
        const profiles = await window.electron.aws.listProfiles();
        if (profiles.length > 0) {
          setProfileName(profiles[0]);
        }

        // Testar conexão automaticamente
        await handleTestConnection();
      } else {
        setMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Erro ao importar existente:", error);
      setMessage("❌ Erro ao importar credenciais existentes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * @name handleClearCredentials
   * @description Limpa completamente os arquivos ~/.aws/credentials e ~/.aws/config
   */
  const handleClearCredentials = async () => {
    setLoading(true);
    setMessage("");

    try {
      const success = await window.electron.aws.clearCredentials();

      if (success) {
        setMessage(
          "✅ Arquivos ~/.aws/credentials e ~/.aws/config limpos com sucesso",
        );
        setCredentials({
          accessKeyId: "",
          secretAccessKey: "",
          sessionToken: "",
          region: "us-east-1",
        });
        setProfileName("default");
        setCredentialsText("");

        // Atualizar status
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          error: "Nenhuma credencial configurada",
        });
      } else {
        setMessage("❌ Erro ao limpar arquivos de credenciais");
      }
    } catch (error) {
      console.error("Erro ao limpar credenciais:", error);
      setMessage("❌ Erro ao limpar credenciais");
    } finally {
      setLoading(false);
    }
  };

  /**
   * @name handleSaveCredentials
   * @description Salva as credenciais AWS no arquivo .aws/config
   */
  const handleSaveCredentials = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Validar campos obrigatórios
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        setMessage("❌ Access Key ID e Secret Access Key são obrigatórios");
        return;
      }

      const success = await window.electron.aws.saveCredentials(
        credentials,
        profileName,
      );

      if (success) {
        setMessage(
          `✅ Credenciais salvas com sucesso para o perfil "${profileName}" (arquivos limpos)`,
        );

        // Testar conexão automaticamente
        await handleTestConnection();
      } else {
        setMessage("❌ Erro ao salvar credenciais");
      }
    } catch (error) {
      console.error("Erro ao salvar credenciais:", error);
      setMessage("❌ Erro ao salvar credenciais");
    } finally {
      setLoading(false);
    }
  };

  /**
   * @name handleTestConnection
   * @description Testa se as credenciais estão funcionando
   */
  const handleTestConnection = async () => {
    setLoading(true);
    setMessage("🔄 Testando conexão...");

    try {
      const isOnline =
        await window.electron.aws.testSimpleConnection(profileName);

      if (isOnline) {
        setMessage("✅ Conexão bem-sucedida! Você está online.");
        setStatus({
          isOnline: true,
          lastCheck: new Date(),
        });
      } else {
        setMessage("❌ Falha na conexão. Verifique suas credenciais.");
        setStatus({
          isOnline: false,
          lastCheck: new Date(),
          error: "Falha na autenticação",
        });
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);

      // Tratamento específico para diferentes tipos de erro
      let errorMessage = "❌ Erro ao testar conexão";
      let errorDetails = "Falha na autenticação";

      if (error instanceof Error) {
        if (error.message.includes("Token de sessão expirado")) {
          errorMessage = "⏰ Token de sessão expirado!";
          errorDetails = "Obtenha novas credenciais AWS temporárias";
        } else if (error.message.includes("Access Key ID inválido")) {
          errorMessage = "🔑 Access Key ID inválido!";
          errorDetails = "Verifique a chave de acesso";
        } else if (error.message.includes("Secret Access Key inválido")) {
          errorMessage = "🔒 Secret Access Key inválido!";
          errorDetails = "Verifique a chave secreta";
        } else if (error.message.includes("Nenhuma credencial encontrada")) {
          errorMessage = "📂 Nenhuma credencial encontrada!";
          errorDetails = "Configure as credenciais para este perfil";
        } else {
          errorMessage = `❌ ${error.message}`;
          errorDetails = "Verifique suas credenciais AWS";
        }
      }

      setMessage(errorMessage);
      setStatus({
        isOnline: false,
        lastCheck: new Date(),
        error: errorDetails,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * @name handleToggleMonitoring
   * @description Inicia ou para o monitoramento do status
   */
  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      await window.electron.aws.stopMonitoring();
      setIsMonitoring(false);
      setMessage("⏹️ Monitoramento parado");
    } else {
      await window.electron.aws.startMonitoring(profileName, 30); // 30 segundos
      setIsMonitoring(true);
      setMessage("▶️ Monitoramento iniciado (verifica a cada 30s)");
    }
  };

  /**
   * @name formatLastCheck
   * @description Formata a data da última verificação
   */
  const formatLastCheck = (date: Date): string => {
    return new Date(date).toLocaleTimeString("pt-BR");
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1>🔐 AWS Config Manager</h1>
        <p style={{ color: "#666" }}>
          Gerencie suas credenciais AWS e monitore o status de conexão
        </p>

        {/* Botões de alternância */}
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: "8px 16px",
              backgroundColor: showAdvanced ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            {showAdvanced ? "📝 Modo Manual" : "📋 Modo Rápido"}
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div
        style={{
          backgroundColor: status.isOnline ? "#d4edda" : "#f8d7da",
          border: `1px solid ${status.isOnline ? "#c3e6cb" : "#f5c6cb"}`,
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: "0",
                color: status.isOnline ? "#155724" : "#721c24",
              }}
            >
              {status.isOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
              Última verificação: {formatLastCheck(status.lastCheck)}
            </p>
            {status.error && (
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "12px",
                  color: "#721c24",
                }}
              >
                Erro: {status.error}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleTestConnection}
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              🔄 Testar
            </button>
            <button
              onClick={handleToggleMonitoring}
              style={{
                padding: "8px 16px",
                backgroundColor: isMonitoring ? "#dc3545" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isMonitoring ? "⏹️ Parar" : "▶️ Monitorar"}
            </button>
          </div>
        </div>
      </div>

      {/* Importação Rápida */}
      {showAdvanced && (
        <div
          style={{
            backgroundColor: "#e7f3ff",
            border: "1px solid #b3d9ff",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#0066cc" }}>
            📋 Importação Rápida
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <button
              onClick={handleImportFromExisting}
              disabled={loading}
              style={{
                padding: "10px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                marginRight: "10px",
                marginBottom: "10px",
              }}
            >
              📂 Importar do ~/.aws/credentials
            </button>

            <button
              onClick={handleClearCredentials}
              disabled={loading}
              style={{
                padding: "10px 16px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "10px",
              }}
            >
              🗑️ Limpar ~/.aws/credentials
            </button>

            <div style={{ marginTop: "10px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Ou cole o conteúdo do arquivo:
              </label>
              <textarea
                value={credentialsText}
                onChange={(e) => setCredentialsText(e.target.value)}
                placeholder="[584532893736_AdministratorAccess]
aws_access_key_id=ASIAYQGHAEAUP67LJIP3
aws_secret_access_key=hryRrE3q228beXiJG/2Vwh1fohkmcmPdTDNXBu5E
aws_session_token=IQoJb3JpZ2luX2VjEPX..."
                rows={6}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  resize: "vertical",
                }}
              />
              <button
                onClick={handleImportFromText}
                disabled={loading || !credentialsText.trim()}
                style={{
                  marginTop: "10px",
                  padding: "10px 16px",
                  backgroundColor:
                    loading || !credentialsText.trim() ? "#6c757d" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    loading || !credentialsText.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                📥 Importar do Texto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Form */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #dee2e6",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>🔑 Credenciais AWS</h3>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Nome do Perfil:
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="default"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Access Key ID: *
          </label>
          <input
            type="text"
            value={credentials.accessKeyId}
            onChange={(e) =>
              setCredentials({ ...credentials, accessKeyId: e.target.value })
            }
            placeholder="AKIAIOSFODNN7EXAMPLE"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Secret Access Key: *
          </label>
          <input
            type="password"
            value={credentials.secretAccessKey}
            onChange={(e) =>
              setCredentials({
                ...credentials,
                secretAccessKey: e.target.value,
              })
            }
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Session Token (opcional):
          </label>
          <textarea
            value={credentials.sessionToken}
            onChange={(e) =>
              setCredentials({ ...credentials, sessionToken: e.target.value })
            }
            placeholder="Token de sessão temporária"
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Região:
          </label>
          <select
            value={credentials.region}
            onChange={(e) =>
              setCredentials({ ...credentials, region: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          >
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-2">us-west-2</option>
            <option value="eu-west-1">eu-west-1</option>
            <option value="sa-east-1">sa-east-1</option>
          </select>
        </div>

        <button
          onClick={handleSaveCredentials}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "💾 Salvando..." : "💾 Salvar Credenciais"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
            border: `1px solid ${message.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`,
            borderRadius: "4px",
            padding: "10px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          backgroundColor: "#e9ecef",
          border: "1px solid #ced4da",
          borderRadius: "8px",
          padding: "15px",
          fontSize: "14px",
          color: "#495057",
        }}
      >
        <h4 style={{ marginTop: 0 }}>📋 Como usar:</h4>
        <ol style={{ margin: 0, paddingLeft: "20px" }}>
          <li>Use "📋 Modo Rápido" para colar credenciais completas</li>
          <li>Ou preencha os campos manualmente no "📝 Modo Manual"</li>
          <li>
            Os arquivos ~/.aws/credentials e ~/.aws/config são SEMPRE limpos
            antes de salvar
          </li>
          <li>Use "🗑️ Limpar" para apagar todas as credenciais existentes</li>
          <li>Use "Testar" para verificar se está online</li>
          <li>Ative "Monitorar" para verificação automática do status</li>
        </ol>
      </div>
    </div>
  );
};
