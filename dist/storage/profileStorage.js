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
exports.profileStorage = exports.ProfileStorage = void 0;
const crypto = __importStar(require("crypto"));
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const secureStorage_1 = require("./secureStorage");
const DEFAULT_SETTINGS = {
    autoConnect: false,
    minimizeToTray: true,
    showNotifications: true,
    tokenWarningMinutes: 30,
    autoReconnect: true,
    theme: "system",
};
class ProfileStorage {
    constructor() {
        this.profilesFile = "profiles";
        this.connectionsFile = "connections";
        this.settingsFile = "settings";
        this.storagePath = path.join(electron_1.app.getPath("userData"), "data");
        this.ensureStorageDirectory();
    }
    static getInstance() {
        if (!ProfileStorage.instance) {
            ProfileStorage.instance = new ProfileStorage();
        }
        return ProfileStorage.instance;
    }
    ensureStorageDirectory() {
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }
    async initialize() {
        try {
            // Inicializa o SecureStorage sem senha (gera chave aleatória)
            const initialized = await secureStorage_1.secureStorage.initialize();
            if (!initialized) {
                throw new Error("Falha ao inicializar SecureStorage");
            }
        }
        catch (error) {
            console.error("Erro ao inicializar ProfileStorage:", error);
            throw error;
        }
    }
    saveProfile(profile) {
        const profiles = this.getProfiles();
        const existingIndex = profiles.findIndex((p) => p.id === profile.id);
        if (existingIndex >= 0) {
            profiles[existingIndex] = { ...profile, updatedAt: new Date() };
        }
        else {
            profiles.push({
                ...profile,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        this.saveProfiles(profiles);
        return profile;
    }
    updateProfile(id, data) {
        const profiles = this.getProfiles();
        const index = profiles.findIndex((p) => p.id === id);
        if (index < 0)
            return null;
        profiles[index] = { ...profiles[index], ...data, updatedAt: new Date() };
        this.saveProfiles(profiles);
        return profiles[index];
    }
    deleteProfile(id) {
        const profiles = this.getProfiles();
        const filtered = profiles.filter((p) => p.id !== id);
        if (filtered.length === profiles.length)
            return false;
        this.saveProfiles(filtered);
        return true;
    }
    getProfiles() {
        const profiles = secureStorage_1.secureStorage.loadEncryptedFile(this.profilesFile);
        return profiles || [];
    }
    getProfileById(id) {
        const profiles = this.getProfiles();
        return profiles.find((p) => p.id === id) || null;
    }
    getProfileByName(name) {
        const profiles = this.getProfiles();
        return profiles.find((p) => p.name === name) || null;
    }
    saveProfiles(profiles) {
        secureStorage_1.secureStorage.saveEncryptedFile(this.profilesFile, profiles);
    }
    addConnection(connection) {
        const connections = this.getConnections();
        connections.push({ ...connection, id: crypto.randomUUID() });
        this.saveConnections(connections);
    }
    updateConnection(id, data) {
        const connections = this.getConnections();
        const index = connections.findIndex((c) => c.id === id);
        if (index >= 0) {
            connections[index] = { ...connections[index], ...data };
            this.saveConnections(connections);
        }
    }
    getConnections(limit) {
        const connections = secureStorage_1.secureStorage.loadEncryptedFile(this.connectionsFile) || [];
        if (limit) {
            return connections.slice(-limit);
        }
        return connections;
    }
    getConnectionHistory(profileId) {
        const connections = this.getConnections();
        if (profileId) {
            return connections.filter((c) => c.profileId === profileId);
        }
        return connections;
    }
    saveConnections(connections) {
        const maxConnections = 100;
        const trimmed = connections.slice(-maxConnections);
        secureStorage_1.secureStorage.saveEncryptedFile(this.connectionsFile, trimmed);
    }
    getSettings() {
        const settings = secureStorage_1.secureStorage.loadEncryptedFile(this.settingsFile);
        return { ...DEFAULT_SETTINGS, ...settings };
    }
    saveSettings(settings) {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        secureStorage_1.secureStorage.saveEncryptedFile(this.settingsFile, updated);
        return updated;
    }
    exportData() {
        const data = {
            profiles: this.getProfiles(),
            connections: this.getConnections(),
            settings: this.getSettings(),
        };
        return JSON.stringify(data, null, 2);
    }
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
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
        }
        catch (error) {
            console.error("Erro ao importar dados:", error);
            return false;
        }
    }
    clearAllData() {
        secureStorage_1.secureStorage.deleteEncryptedFile(this.profilesFile);
        secureStorage_1.secureStorage.deleteEncryptedFile(this.connectionsFile);
        secureStorage_1.secureStorage.deleteEncryptedFile(this.settingsFile);
    }
}
exports.ProfileStorage = ProfileStorage;
exports.profileStorage = ProfileStorage.getInstance();
