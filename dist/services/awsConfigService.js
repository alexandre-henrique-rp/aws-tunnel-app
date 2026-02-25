"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.awsConfigService = exports.AWSConfigService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * @name AWSConfigService
 * @description Serviço simples para gerenciar credenciais AWS e monitorar status online
 */
class AWSConfigService {
    constructor() {
        this.monitoringInterval = null;
        this.currentStatus = {
            isOnline: false,
            lastCheck: new Date(),
        };
        this.awsDir = path.join(os.homedir(), ".aws");
        this.credentialsPath = path.join(this.awsDir, "credentials");
        this.configPath = path.join(this.awsDir, "config");
        this.ensureAWSDirectory();
    }
    static getInstance() {
        if (!AWSConfigService.instance) {
            AWSConfigService.instance = new AWSConfigService();
        }
        return AWSConfigService.instance;
    }
    /**
     * @name ensureAWSDirectory
     * @description Garante que o diretório .aws exista
     */
    ensureAWSDirectory() {
        if (!fs.existsSync(this.awsDir)) {
            fs.mkdirSync(this.awsDir, { recursive: true });
        }
    }
    /**
     * @name executeCommand
     * @description Executa um comando no shell e retorna stdout/stderr
     *
     * @param {string} command - Comando a ser executado
     *
     * @returns {Promise<{stdout: string, stderr: string}>} Saída do comando
     */
    async executeCommand(command) {
        try {
            const result = await execAsync(command);
            return {
                stdout: result.stdout,
                stderr: result.stderr,
            };
        }
        catch (error) {
            return {
                stdout: error.stdout || "",
                stderr: error.stderr || error.message,
            };
        }
    }
    /**
     * @name clearCredentialsFile
     * @description Limpa completamente o arquivo ~/.aws/credentials
     *
     * @returns {Promise<boolean>} True se limpo com sucesso
     */
    async clearCredentialsFile() {
        try {
            // Se o arquivo existir, remover
            if (fs.existsSync(this.credentialsPath)) {
                fs.unlinkSync(this.credentialsPath);
                console.log("Arquivo ~/.aws/credentials removido");
            }
            // Também limpar o arquivo config para evitar perfis órfãos
            if (fs.existsSync(this.configPath)) {
                fs.unlinkSync(this.configPath);
                console.log("Arquivo ~/.aws/config removido");
            }
            return true;
        }
        catch (error) {
            console.error("Erro ao limpar arquivos de credenciais:", error);
            return false;
        }
    }
    /**
     * @name saveCredentials
     * @description Salva as credenciais nos arquivos .aws/credentials e .aws/config
     *
     * @param {AWSCredentials} credentials - Credenciais AWS
     * @param {string} profileName - Nome do perfil (default: 'default')
     * @param {boolean} clearBeforeSave - Se deve limpar arquivos antes de salvar (default: true)
     *
     * @returns {Promise<boolean>} True se salvo com sucesso
     *
     * @example
     * // Exemplo de uso
     * const success = await awsConfig.saveCredentials({
     *   accessKeyId: 'AKIA...',
     *   secretAccessKey: 'secret...',
     *   region: 'us-east-1'
     * }, 'meu-perfil', true);
     *
     * Fluxo de execução:
     * 1. Limpa arquivos existentes (se solicitado)
     * 2. Valida as credenciais
     * 3. Escreve no arquivo credentials
     * 4. Escreve no arquivo config
     * 5. Retorna sucesso
     */
    async saveCredentials(credentials, profileName = "default", clearBeforeSave = true) {
        try {
            // Limpar arquivos existentes se solicitado
            if (clearBeforeSave) {
                await this.clearCredentialsFile();
            }
            // Validar credenciais
            if (!credentials.accessKeyId || !credentials.secretAccessKey) {
                throw new Error("Access Key ID e Secret Access Key são obrigatórios");
            }
            // Salvar no arquivo credentials
            await this.writeCredentialsFile(credentials, profileName);
            // Salvar no arquivo config
            await this.writeConfigFile(credentials, profileName);
            console.log(`Credenciais salvas para o perfil: ${profileName}`);
            return true;
        }
        catch (error) {
            console.error("Erro ao salvar credenciais:", error);
            return false;
        }
    }
    /**
     * @name writeCredentialsFile
     * @description Escreve as credenciais no arquivo ~/.aws/credentials
     */
    async writeCredentialsFile(credentials, profileName) {
        let content = "";
        // Ler conteúdo existente
        if (fs.existsSync(this.credentialsPath)) {
            content = fs.readFileSync(this.credentialsPath, "utf8");
        }
        // Remover perfil existente se houver
        const profileRegex = new RegExp(`\\[${profileName}\\][\\s\\S]*?(?=\\[|$)`, "g");
        content = content.replace(profileRegex, "").trim();
        // Adicionar novo perfil
        const newProfile = `\n[${profileName}]\n`;
        const accessKeyLine = `aws_access_key_id = ${credentials.accessKeyId}\n`;
        const secretKeyLine = `aws_secret_access_key = ${credentials.secretAccessKey}\n`;
        let profileContent = newProfile + accessKeyLine + secretKeyLine;
        if (credentials.sessionToken) {
            profileContent += `aws_session_token = ${credentials.sessionToken}\n`;
        }
        // Escrever arquivo atualizado
        fs.writeFileSync(this.credentialsPath, content + profileContent);
    }
    /**
     * @name writeConfigFile
     * @description Escreve a configuração de região no arquivo ~/.aws/config
     */
    async writeConfigFile(credentials, profileName) {
        let content = "";
        // Ler conteúdo existente
        if (fs.existsSync(this.configPath)) {
            content = fs.readFileSync(this.configPath, "utf8");
        }
        // Remover perfil existente se houver
        const profileRegex = new RegExp(`\\[profile ${profileName}\\][\\s\\S]*?(?=\\[|$)`, "g");
        content = content.replace(profileRegex, "").trim();
        // Adicionar nova configuração
        if (credentials.region) {
            const newProfile = `\n[profile ${profileName}]\n`;
            const regionLine = `region = ${credentials.region}\n`;
            const profileContent = newProfile + regionLine;
            // Escrever arquivo atualizado
            fs.writeFileSync(this.configPath, content + profileContent);
        }
    }
    /**
     * @name testConnection
     * @description Testa se as credenciais estão funcionando usando AWS CLI
     *
     * @param {string} profileName - Nome do perfil para testar (default: 'default')
     *
     * @returns {Promise<boolean>} True se conexão bem-sucedida
     *
     * @example
     * // Exemplo de uso
     * const isOnline = await awsConfig.testConnection('meu-perfil');
     *
     * Fluxo de execução:
     * 1. Executa 'aws sts get-caller-identity' com o perfil especificado
     * 2. Verifica se o comando executou com sucesso
     * 3. Retorna true se sucesso, false se erro
     * 4. Identifica erros específicos como token expirado
     */
    async testConnection(profileName = "default") {
        try {
            const command = `aws sts get-caller-identity --profile "${profileName}"`;
            const { stdout, stderr } = await this.executeCommand(command);
            if (stderr) {
                // Verificar erros específicos
                if (stderr.includes("ExpiredToken")) {
                    console.error(" Token de sessão expirado. Obtenha novas credenciais.");
                    throw new Error("Token de sessão expirado. Obtenha novas credenciais AWS.");
                }
                else if (stderr.includes("InvalidClientTokenId")) {
                    console.error(" Access Key ID inválido.");
                    throw new Error("Access Key ID inválido.");
                }
                else if (stderr.includes("SignatureDoesNotMatch")) {
                    console.error(" Secret Access Key inválido.");
                    throw new Error("Secret Access Key inválido.");
                }
                else if (stderr.includes("NoCredentialProviders")) {
                    console.error(" Nenhuma credencial encontrada para este perfil.");
                    throw new Error("Nenhuma credencial encontrada para este perfil.");
                }
                else {
                    console.error(" Erro desconhecido:", stderr);
                    throw new Error(`Erro de autenticação: ${stderr.trim()}`);
                }
            }
            console.log(" Conexão testada com sucesso");
            return true;
        }
        catch (error) {
            console.error(" Falha no teste de conexão:", error);
            throw error; // Re-lançar para tratamento específico na UI
        }
    }
    /**
     * @name startMonitoring
     * @description Inicia monitoramento do status online
     *
     * @param {string} profileName - Nome do perfil para monitorar
     * @param {number} interval - Intervalo em segundos (default: 30)
     */
    startMonitoring(profileName = "default", interval = 30) {
        // Parar monitoramento anterior se existir
        this.stopMonitoring();
        console.log(`Iniciando monitoramento do perfil: ${profileName}`);
        // Testar imediatamente
        this.checkStatus(profileName);
        // Configurar monitoramento periódico
        this.monitoringInterval = setInterval(() => {
            this.checkStatus(profileName);
        }, interval * 1000);
    }
    /**
     * @name stopMonitoring
     * @description Para o monitoramento do status online
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log("Monitoramento parado");
        }
    }
    /**
     * @name checkStatus
     * @description Verifica o status atual da conexão
     */
    async checkStatus(profileName) {
        try {
            const isOnline = await this.testConnection(profileName);
            this.currentStatus = {
                isOnline,
                lastCheck: new Date(),
            };
            console.log(`Status atualizado: ${isOnline ? "ONLINE" : "OFFLINE"}`);
        }
        catch (error) {
            this.currentStatus = {
                isOnline: false,
                lastCheck: new Date(),
                error: error instanceof Error ? error.message : "Erro desconhecido",
            };
        }
    }
    /**
     * @name getStatus
     * @description Retorna o status atual da conexão
     *
     * @returns {OnlineStatus} Status atual
     */
    getStatus() {
        return { ...this.currentStatus };
    }
    /**
     * @name parseAndSaveCredentialsText
     * @description Parse de texto de credenciais no formato .aws/credentials e salva
     *
     * @param {string} credentialsText - Texto no formato do arquivo .aws/credentials
     *
     * @returns {Promise<{success: boolean, profiles: string[], message: string}>}
     *
     * @example
     * // Exemplo de uso
     * const result = await awsConfigService.parseAndSaveCredentialsText(`
     * [584532893736_AdministratorAccess]
     * aws_access_key_id=ASIAYQGHAEAUP67LJIP3
     * aws_secret_access_key=hryRrE3q228beXiJG/2Vwh1fohkmcmPdTDNXBu5E
     * aws_session_token=IQoJb3JpZ2luX2VjEPX...
     * `);
     */
    async parseAndSaveCredentialsText(credentialsText) {
        try {
            if (!credentialsText || typeof credentialsText !== "string") {
                return {
                    success: false,
                    profiles: [],
                    message: "Texto de credenciais inválido",
                };
            }
            // Limpar arquivos existentes antes de salvar
            await this.clearCredentialsFile();
            const lines = credentialsText.split("\n");
            const profiles = [];
            let currentProfile = null;
            let currentCredentials = {};
            for (const line of lines) {
                const trimmed = line.trim();
                // Identificar perfil
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                    // Salvar perfil anterior se existir
                    if (currentProfile &&
                        currentCredentials.accessKeyId &&
                        currentCredentials.secretAccessKey) {
                        await this.saveCredentials(currentCredentials, currentProfile, false); // Não limpar novamente
                        profiles.push(currentProfile);
                    }
                    // Iniciar novo perfil
                    currentProfile = trimmed.substring(1, trimmed.length - 1);
                    currentCredentials = {};
                }
                // Extrair credenciais
                else if (currentProfile) {
                    if (trimmed.startsWith("aws_access_key_id=")) {
                        currentCredentials.accessKeyId = trimmed.split("=")[1];
                    }
                    else if (trimmed.startsWith("aws_secret_access_key=")) {
                        currentCredentials.secretAccessKey = trimmed.split("=")[1];
                    }
                    else if (trimmed.startsWith("aws_session_token=")) {
                        currentCredentials.sessionToken = trimmed.split("=")[1];
                    }
                    else if (trimmed.startsWith("region=")) {
                        currentCredentials.region = trimmed.split("=")[1];
                    }
                }
            }
            // Salvar último perfil
            if (currentProfile &&
                currentCredentials.accessKeyId &&
                currentCredentials.secretAccessKey) {
                await this.saveCredentials(currentCredentials, currentProfile, false); // Não limpar novamente
                profiles.push(currentProfile);
            }
            if (profiles.length === 0) {
                return {
                    success: false,
                    profiles: [],
                    message: "Nenhum perfil válido encontrado no texto",
                };
            }
            return {
                success: true,
                profiles,
                message: `${profiles.length} perfil(is) importado(s) com sucesso (arquivos limpos): ${profiles.join(", ")}`,
            };
        }
        catch (error) {
            console.error("Erro ao parse e salvar credenciais:", error);
            return {
                success: false,
                profiles: [],
                message: `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            };
        }
    }
    /**
     * @name importFromExistingCredentials
     * @description Importa credenciais do arquivo ~/.aws/credentials existente
     *
     * @returns {Promise<{success: boolean, profiles: string[], message: string}>}
     */
    async importFromExistingCredentials() {
        try {
            if (!fs.existsSync(this.credentialsPath)) {
                return {
                    success: false,
                    profiles: [],
                    message: "Arquivo ~/.aws/credentials não encontrado",
                };
            }
            const content = fs.readFileSync(this.credentialsPath, "utf8");
            return await this.parseAndSaveCredentialsText(content);
        }
        catch (error) {
            console.error("Erro ao importar credenciais existentes:", error);
            return {
                success: false,
                profiles: [],
                message: `Erro ao ler arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
            };
        }
    }
    /**
     * @name listProfiles
     * @description Lista todos os perfis disponíveis
     *
     * @returns {Promise<string[]>} Array com nomes dos perfis
     */
    async listProfiles() {
        try {
            if (!fs.existsSync(this.credentialsPath)) {
                return [];
            }
            const content = fs.readFileSync(this.credentialsPath, "utf8");
            const profileMatches = content.matchAll(/^\[([^\]]+)\]/gm);
            return Array.from(profileMatches, (match) => match[1]);
        }
        catch (error) {
            console.error("Erro ao listar perfis:", error);
            return [];
        }
    }
}
exports.AWSConfigService = AWSConfigService;
exports.awsConfigService = AWSConfigService.getInstance();
