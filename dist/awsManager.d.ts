import { Profile } from "./models/Profile";
export declare class AWSManager {
    /**
     * @name parseCredentials
     * @description Analisa texto de credenciais AWS e extrai perfis
     *
     * @param {string} text - Texto contendo as credenciais AWS no formato .aws/credentials
     *
     * @returns {Profile[]} Array de perfis extraídos do texto
     *
     * @throws {Error} Quando o texto de entrada é inválido
     *
     * @example
     * // Exemplo de uso
     * const profiles = AWSManager.parseCredentials(credentialText);
     *
     * Fluxo de execução:
     * 1. Valida o parâmetro de entrada
     * 2. Processa linha por linha identificando perfis
     * 3. Extrai chaves de acesso e token de sessão
     * 4. Tenta analisar data de expiração do token JWT
     * 5. Retorna array de perfis completos
     */
    static parseCredentials(text: string): Profile[];
    /**
     * @name testConnection
     * @description Testa a conexão com AWS usando as credenciais do perfil
     *
     * @param {Profile} profile - Perfil AWS com credenciais para teste
     *
     * @returns {boolean} True se conexão for bem-sucedida, False caso contrário
     *
     * @example
     * // Exemplo de uso
     * const success = await AWSManager.testConnection(profile);
     *
     * Fluxo de execução:
     * 1. Valida se as credenciais essenciais estão presentes
     * 2. Cria objeto de credenciais AWS
     * 3. Tenta listar buckets S3 para testar acesso
     * 4. Retorna resultado baseado no sucesso da operação
     */
    static testConnection(profile: Profile): Promise<boolean>;
}
