export interface AWSCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    region?: string;
}
export interface OnlineStatus {
    isOnline: boolean;
    lastCheck: Date;
    error?: string;
}
/**
 * @name AWSConfigService
 * @description Serviço simples para gerenciar credenciais AWS e monitorar status online
 */
export declare class AWSConfigService {
    private static instance;
    private readonly awsDir;
    private readonly credentialsPath;
    private readonly configPath;
    private monitoringInterval;
    private currentStatus;
    private constructor();
    static getInstance(): AWSConfigService;
    /**
     * @name ensureAWSDirectory
     * @description Garante que o diretório .aws exista
     */
    private ensureAWSDirectory;
    /**
     * @name executeCommand
     * @description Executa um comando no shell e retorna stdout/stderr
     *
     * @param {string} command - Comando a ser executado
     *
     * @returns {Promise<{stdout: string, stderr: string}>} Saída do comando
     */
    private executeCommand;
    /**
     * @name clearCredentialsFile
     * @description Limpa completamente o arquivo ~/.aws/credentials
     *
     * @returns {Promise<boolean>} True se limpo com sucesso
     */
    clearCredentialsFile(): Promise<boolean>;
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
    saveCredentials(credentials: AWSCredentials, profileName?: string, clearBeforeSave?: boolean): Promise<boolean>;
    /**
     * @name writeCredentialsFile
     * @description Escreve as credenciais no arquivo ~/.aws/credentials
     */
    private writeCredentialsFile;
    /**
     * @name writeConfigFile
     * @description Escreve a configuração de região no arquivo ~/.aws/config
     */
    private writeConfigFile;
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
    testConnection(profileName?: string): Promise<boolean>;
    /**
     * @name startMonitoring
     * @description Inicia monitoramento do status online
     *
     * @param {string} profileName - Nome do perfil para monitorar
     * @param {number} interval - Intervalo em segundos (default: 30)
     */
    startMonitoring(profileName?: string, interval?: number): void;
    /**
     * @name stopMonitoring
     * @description Para o monitoramento do status online
     */
    stopMonitoring(): void;
    /**
     * @name checkStatus
     * @description Verifica o status atual da conexão
     */
    private checkStatus;
    /**
     * @name getStatus
     * @description Retorna o status atual da conexão
     *
     * @returns {OnlineStatus} Status atual
     */
    getStatus(): OnlineStatus;
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
    parseAndSaveCredentialsText(credentialsText: string): Promise<{
        success: boolean;
        profiles: string[];
        message: string;
    }>;
    /**
     * @name importFromExistingCredentials
     * @description Importa credenciais do arquivo ~/.aws/credentials existente
     *
     * @returns {Promise<{success: boolean, profiles: string[], message: string}>}
     */
    importFromExistingCredentials(): Promise<{
        success: boolean;
        profiles: string[];
        message: string;
    }>;
    /**
     * @name listProfiles
     * @description Lista todos os perfis disponíveis
     *
     * @returns {Promise<string[]>} Array com nomes dos perfis
     */
    listProfiles(): Promise<string[]>;
}
export declare const awsConfigService: AWSConfigService;
