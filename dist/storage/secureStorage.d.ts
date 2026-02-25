export interface EncryptedData {
    iv: string;
    encrypted: string;
    authTag: string;
    salt: string;
}
export declare class SecureStorage {
    private static instance;
    private masterKey;
    private storagePath;
    private constructor();
    static getInstance(): SecureStorage;
    private ensureStorageDirectory;
    private getMasterKeyFilePath;
    initialize(masterPassword?: string): Promise<boolean>;
    private deriveKey;
    generateKey(): string;
    encrypt(data: string, customKey?: string): EncryptedData;
    decrypt(encryptedData: EncryptedData, customKey?: string): string;
    encryptObject<T>(data: T): EncryptedData;
    decryptObject<T>(encryptedData: EncryptedData): T;
    saveEncryptedFile(filename: string, data: any): string;
    loadEncryptedFile<T>(filename: string): T | null;
    deleteEncryptedFile(filename: string): boolean;
    isInitialized(): boolean;
    clearMasterKey(): void;
}
export declare const secureStorage: SecureStorage;
