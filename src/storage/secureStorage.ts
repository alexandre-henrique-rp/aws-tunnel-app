import * as crypto from "crypto";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export interface EncryptedData {
  iv: string;
  encrypted: string;
  authTag: string;
  salt: string;
}

export class SecureStorage {
  private static instance: SecureStorage;
  private masterKey: Buffer | null = null;
  private storagePath: string;

  private constructor() {
    this.storagePath = path.join(app.getPath("userData"), "secure-storage");
    this.ensureStorageDirectory();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  private getMasterKeyFilePath(): string {
    return path.join(this.storagePath, ".masterkey");
  }

  async initialize(masterPassword?: string): Promise<boolean> {
    const keyFilePath = this.getMasterKeyFilePath();

    if (fs.existsSync(keyFilePath)) {
      if (!masterPassword) {
        // Se existe arquivo mas não há senha, tentar usar a chave armazenada diretamente
        try {
          const storedKey = fs.readFileSync(keyFilePath);
          this.masterKey = storedKey;
          return true;
        } catch (error) {
          console.error("Erro ao ler chave armazenada:", error);
          return false;
        }
      }
      const storedKey = fs.readFileSync(keyFilePath);
      this.masterKey = storedKey;
      return true;
    }

    if (masterPassword) {
      this.masterKey = await this.deriveKey(masterPassword);
      fs.writeFileSync(keyFilePath, this.masterKey);
      return true;
    }

    const randomKey = crypto.randomBytes(KEY_LENGTH);
    this.masterKey = randomKey;
    fs.writeFileSync(keyFilePath, randomKey);
    return true;
  }

  private async deriveKey(password: string, salt?: Buffer): Promise<Buffer> {
    const useSalt = salt || crypto.randomBytes(SALT_LENGTH);
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        useSalt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        "sha512",
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        },
      );
    });
  }

  generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("hex");
  }

  encrypt(data: string, customKey?: string): EncryptedData {
    if (!this.masterKey && !customKey) {
      throw new Error("SecureStorage não inicializado");
    }

    const key = customKey ? Buffer.from(customKey, "hex") : this.masterKey!;
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      encrypted,
      authTag: authTag.toString("hex"),
      salt: salt.toString("hex"),
    };
  }

  decrypt(encryptedData: EncryptedData, customKey?: string): string {
    if (!this.masterKey && !customKey) {
      throw new Error("SecureStorage não inicializado");
    }

    const key = customKey ? Buffer.from(customKey, "hex") : this.masterKey!;
    const iv = Buffer.from(encryptedData.iv, "hex");
    const authTag = Buffer.from(encryptedData.authTag, "hex");
    const salt = Buffer.from(encryptedData.salt, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  encryptObject<T>(data: T): EncryptedData {
    const jsonString = JSON.stringify(data);
    return this.encrypt(jsonString);
  }

  decryptObject<T>(encryptedData: EncryptedData): T {
    const jsonString = this.decrypt(encryptedData);
    return JSON.parse(jsonString);
  }

  saveEncryptedFile(filename: string, data: any): string {
    const encrypted = this.encryptObject(data);
    const filePath = path.join(this.storagePath, `${filename}.enc`);
    fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2));
    return filePath;
  }

  loadEncryptedFile<T>(filename: string): T | null {
    const filePath = path.join(this.storagePath, `${filename}.enc`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    const encrypted = JSON.parse(fileContent) as EncryptedData;
    return this.decryptObject<T>(encrypted);
  }

  deleteEncryptedFile(filename: string): boolean {
    const filePath = path.join(this.storagePath, `${filename}.enc`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  isInitialized(): boolean {
    return this.masterKey !== null;
  }

  clearMasterKey(): void {
    this.masterKey = null;
  }
}

export const secureStorage = SecureStorage.getInstance();
