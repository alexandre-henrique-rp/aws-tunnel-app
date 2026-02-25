import * as AWS from "aws-sdk";
import { Profile } from "./models/Profile";

export class AWSManager {
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
  static parseCredentials(text: string): Profile[] {
    // Validação inicial dos parâmetros
    // Motivo: Garantir que temos texto válido para processar
    if (!text || typeof text !== "string") {
      throw new Error("Texto de credenciais inválido ou vazio");
    }

    const profiles: Profile[] = [];
    const lines = text.split("\n");
    let currentProfile: Profile | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        currentProfile = {
          name: trimmed.substring(1, trimmed.length - 1),
          accessKeyId: "",
          secretAccessKey: "",
          sessionToken: "",
        } as Profile;
        profiles.push(currentProfile);
      } else if (currentProfile && trimmed.startsWith("aws_access_key_id=")) {
        currentProfile.accessKeyId = trimmed.split("=")[1];
      } else if (
        currentProfile &&
        trimmed.startsWith("aws_secret_access_key=")
      ) {
        currentProfile.secretAccessKey = trimmed.split("=")[1];
      } else if (currentProfile && trimmed.startsWith("aws_session_token=")) {
        currentProfile.sessionToken = trimmed.split("=")[1];
        // Extrair data de expiração do token JWT
        if (currentProfile.sessionToken) {
          try {
            const tokenParts = currentProfile.sessionToken.split(".");
            // Validação robusta: verificar se temos pelo menos 2 partes e a segunda não está vazia
            if (
              tokenParts.length >= 2 &&
              tokenParts[1] &&
              tokenParts[1].trim() !== ""
            ) {
              const payload = Buffer.from(tokenParts[1], "base64").toString();
              const decoded = JSON.parse(payload);
              if (decoded.exp) {
                currentProfile.expiration = new Date(decoded.exp * 1000);
              }
            }
          } catch (error) {
            console.error("Erro ao analisar token JWT:", error);
            // Continuar sem data de expiração - não falhar completamente
          }
        }
      }
    }
    return profiles;
  }

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
  static async testConnection(profile: Profile): Promise<boolean> {
    // Validação inicial das credenciais
    // Motivo: Não tentar conexão sem credenciais básicas
    if (!profile.accessKeyId || !profile.secretAccessKey) {
      console.warn("Credenciais incompletas para teste de conexão");
      return false;
    }

    try {
      const credentials = new AWS.Credentials({
        accessKeyId: profile.accessKeyId,
        secretAccessKey: profile.secretAccessKey,
        sessionToken: profile.sessionToken || "",
      });

      const s3 = new AWS.S3({ credentials });

      // Teste simples: listar buckets
      // Decisão: Usar S3 pois é um serviço básico e universalmente disponível
      const data = await s3.listBuckets().promise();
      return !!(data.Buckets && data.Buckets.length > 0);
    } catch (error) {
      console.error("Erro de conexão AWS:", error);
      // Retornar false em vez de propagar erro para melhor UX
      return false;
    }
  }
}
