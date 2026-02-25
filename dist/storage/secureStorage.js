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
exports.secureStorage = exports.SecureStorage = void 0;
const crypto = __importStar(require("crypto"));
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
class SecureStorage {
    constructor() {
        this.masterKey = null;
        this.storagePath = path.join(electron_1.app.getPath("userData"), "secure-storage");
        this.ensureStorageDirectory();
    }
    static getInstance() {
        if (!SecureStorage.instance) {
            SecureStorage.instance = new SecureStorage();
        }
        return SecureStorage.instance;
    }
    ensureStorageDirectory() {
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }
    getMasterKeyFilePath() {
        return path.join(this.storagePath, ".masterkey");
    }
    async initialize(masterPassword) {
        const keyFilePath = this.getMasterKeyFilePath();
        if (fs.existsSync(keyFilePath)) {
            if (!masterPassword) {
                // Se existe arquivo mas não há senha, tentar usar a chave armazenada diretamente
                try {
                    const storedKey = fs.readFileSync(keyFilePath);
                    this.masterKey = storedKey;
                    return true;
                }
                catch (error) {
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
    async deriveKey(password, salt) {
        const useSalt = salt || crypto.randomBytes(SALT_LENGTH);
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, useSalt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512", (err, derivedKey) => {
                if (err)
                    reject(err);
                else
                    resolve(derivedKey);
            });
        });
    }
    generateKey() {
        return crypto.randomBytes(KEY_LENGTH).toString("hex");
    }
    encrypt(data, customKey) {
        if (!this.masterKey && !customKey) {
            throw new Error("SecureStorage não inicializado");
        }
        const key = customKey ? Buffer.from(customKey, "hex") : this.masterKey;
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
    decrypt(encryptedData, customKey) {
        if (!this.masterKey && !customKey) {
            throw new Error("SecureStorage não inicializado");
        }
        const key = customKey ? Buffer.from(customKey, "hex") : this.masterKey;
        const iv = Buffer.from(encryptedData.iv, "hex");
        const authTag = Buffer.from(encryptedData.authTag, "hex");
        const salt = Buffer.from(encryptedData.salt, "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    encryptObject(data) {
        const jsonString = JSON.stringify(data);
        return this.encrypt(jsonString);
    }
    decryptObject(encryptedData) {
        const jsonString = this.decrypt(encryptedData);
        return JSON.parse(jsonString);
    }
    saveEncryptedFile(filename, data) {
        const encrypted = this.encryptObject(data);
        const filePath = path.join(this.storagePath, `${filename}.enc`);
        fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2));
        return filePath;
    }
    loadEncryptedFile(filename) {
        const filePath = path.join(this.storagePath, `${filename}.enc`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const fileContent = fs.readFileSync(filePath, "utf8");
        const encrypted = JSON.parse(fileContent);
        return this.decryptObject(encrypted);
    }
    deleteEncryptedFile(filename) {
        const filePath = path.join(this.storagePath, `${filename}.enc`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    isInitialized() {
        return this.masterKey !== null;
    }
    clearMasterKey() {
        this.masterKey = null;
    }
}
exports.SecureStorage = SecureStorage;
exports.secureStorage = SecureStorage.getInstance();
