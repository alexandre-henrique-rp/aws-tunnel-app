import * as crypto from "crypto";
import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { Connection } from "../models/Connection";
import { Profile } from "../models/Profile";
import { secureStorage } from "./secureStorage";

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

const DEFAULT_SETTINGS: AppSettings = {
  autoConnect: false,
  minimizeToTray: true,
  showNotifications: true,
  tokenWarningMinutes: 30,
  autoReconnect: true,
  theme: "system",
};

export class ProfileStorage {
  private static instance: ProfileStorage;
  private storagePath: string;
  private profilesFile = "profiles";
  private connectionsFile = "connections";
  private settingsFile = "settings";

  private constructor() {
    this.storagePath = path.join(app.getPath("userData"), "data");
    this.ensureStorageDirectory();
  }

  static getInstance(): ProfileStorage {
    if (!ProfileStorage.instance) {
      ProfileStorage.instance = new ProfileStorage();
    }
    return ProfileStorage.instance;
  }

  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    try {
      // Inicializa o SecureStorage sem senha (gera chave aleatória)
      const initialized = await secureStorage.initialize();
      if (!initialized) {
        throw new Error("Falha ao inicializar SecureStorage");
      }
    } catch (error) {
      console.error("Erro ao inicializar ProfileStorage:", error);
      throw error;
    }
  }

  saveProfile(profile: Profile): Profile {
    const profiles = this.getProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);

    if (existingIndex >= 0) {
      profiles[existingIndex] = { ...profile, updatedAt: new Date() };
    } else {
      profiles.push({
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    this.saveProfiles(profiles);
    return profile;
  }

  updateProfile(id: string, data: Partial<Profile>): Profile | null {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);

    if (index < 0) return null;

    profiles[index] = { ...profiles[index], ...data, updatedAt: new Date() };
    this.saveProfiles(profiles);
    return profiles[index];
  }

  deleteProfile(id: string): boolean {
    const profiles = this.getProfiles();
    const filtered = profiles.filter((p) => p.id !== id);

    if (filtered.length === profiles.length) return false;

    this.saveProfiles(filtered);
    return true;
  }

  getProfiles(): Profile[] {
    const profiles = secureStorage.loadEncryptedFile<Profile[]>(
      this.profilesFile,
    );
    return profiles || [];
  }

  getProfileById(id: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  }

  getProfileByName(name: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.name === name) || null;
  }

  private saveProfiles(profiles: Profile[]): void {
    secureStorage.saveEncryptedFile(this.profilesFile, profiles);
  }

  addConnection(connection: Connection): void {
    const connections = this.getConnections();
    connections.push({ ...connection, id: crypto.randomUUID() });
    this.saveConnections(connections);
  }

  updateConnection(id: string, data: Partial<Connection>): void {
    const connections = this.getConnections();
    const index = connections.findIndex((c) => c.id === id);

    if (index >= 0) {
      connections[index] = { ...connections[index], ...data };
      this.saveConnections(connections);
    }
  }

  getConnections(limit?: number): Connection[] {
    const connections =
      secureStorage.loadEncryptedFile<Connection[]>(this.connectionsFile) || [];

    if (limit) {
      return connections.slice(-limit);
    }
    return connections;
  }

  getConnectionHistory(profileId?: string): Connection[] {
    const connections = this.getConnections();
    if (profileId) {
      return connections.filter((c) => c.profileId === profileId);
    }
    return connections;
  }

  private saveConnections(connections: Connection[]): void {
    const maxConnections = 100;
    const trimmed = connections.slice(-maxConnections);
    secureStorage.saveEncryptedFile(this.connectionsFile, trimmed);
  }

  getSettings(): AppSettings {
    const settings = secureStorage.loadEncryptedFile<AppSettings>(
      this.settingsFile,
    );
    return { ...DEFAULT_SETTINGS, ...settings };
  }

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    secureStorage.saveEncryptedFile(this.settingsFile, updated);
    return updated;
  }

  exportData(): string {
    const data: StoredData = {
      profiles: this.getProfiles(),
      connections: this.getConnections(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as StoredData;

      if (data.profiles) {
        this.saveProfiles(data.profiles);
      }
      if (data.connections) {
        this.saveConnections(data.connections);
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      return true;
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      return false;
    }
  }

  clearAllData(): void {
    secureStorage.deleteEncryptedFile(this.profilesFile);
    secureStorage.deleteEncryptedFile(this.connectionsFile);
    secureStorage.deleteEncryptedFile(this.settingsFile);
  }
}

export const profileStorage = ProfileStorage.getInstance();
