import { Connection } from "../models/Connection";
import { Profile } from "../models/Profile";
export interface StoredData {
    profiles: Profile[];
    connections: Connection[];
    settings: AppSettings;
}
export interface AppSettings {
    autoConnect: boolean;
    minimizeToTray: boolean;
    showNotifications: boolean;
    tokenWarningMinutes: number;
    autoReconnect: boolean;
    theme: "light" | "dark" | "system";
}
export declare class ProfileStorage {
    private static instance;
    private storagePath;
    private profilesFile;
    private connectionsFile;
    private settingsFile;
    private constructor();
    static getInstance(): ProfileStorage;
    private ensureStorageDirectory;
    initialize(): Promise<void>;
    saveProfile(profile: Profile): Profile;
    updateProfile(id: string, data: Partial<Profile>): Profile | null;
    deleteProfile(id: string): boolean;
    getProfiles(): Profile[];
    getProfileById(id: string): Profile | null;
    getProfileByName(name: string): Profile | null;
    private saveProfiles;
    addConnection(connection: Connection): void;
    updateConnection(id: string, data: Partial<Connection>): void;
    getConnections(limit?: number): Connection[];
    getConnectionHistory(profileId?: string): Connection[];
    private saveConnections;
    getSettings(): AppSettings;
    saveSettings(settings: Partial<AppSettings>): AppSettings;
    exportData(): string;
    importData(jsonString: string): boolean;
    clearAllData(): void;
}
export declare const profileStorage: ProfileStorage;
