"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionMonitor = exports.ConnectionMonitor = void 0;
const events_1 = require("events");
const electron_1 = require("electron");
const Connection_1 = require("../models/Connection");
const profileStorage_1 = require("../storage/profileStorage");
class ConnectionMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.autoReconnect = true;
        this.currentProfile = null;
        this.process = null;
        this.mainWindow = null;
        this.state = {
            isConnected: false,
            isConnecting: false,
            isReconnecting: false,
            currentConnection: null,
            error: null,
        };
    }
    static getInstance() {
        if (!ConnectionMonitor.instance) {
            ConnectionMonitor.instance = new ConnectionMonitor();
        }
        return ConnectionMonitor.instance;
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    setAutoReconnect(enabled) {
        this.autoReconnect = enabled;
    }
    setMaxReconnectAttempts(max) {
        this.maxReconnectAttempts = max;
    }
    getState() {
        return { ...this.state };
    }
    async connect(profile, startSSMTunnel) {
        if (this.state.isConnecting || this.state.isConnected) {
            await this.disconnect();
        }
        this.updateState({
            isConnecting: true,
            error: null,
        });
        try {
            const connection = (0, Connection_1.createConnection)(profile.id, profile.name, profile.region, profile.instanceId, profile.localPort, profile.remotePort);
            this.currentProfile = profile;
            const success = await startSSMTunnel(profile);
            if (success) {
                this.reconnectAttempts = 0;
                this.updateState({
                    isConnected: true,
                    isConnecting: false,
                    currentConnection: connection,
                });
                profileStorage_1.profileStorage.addConnection(connection);
                this.emit("connected", { profile, connection });
                this.showNotification("Conectado", `Conectado ao perfil ${profile.name}`);
                this.sendToRenderer("connection:status", this.state);
                return true;
            }
            else {
                const failedConnection = (0, Connection_1.endConnection)(connection, "failed", "Falha ao iniciar túnel");
                profileStorage_1.profileStorage.addConnection(failedConnection);
                this.updateState({
                    isConnecting: false,
                    error: "Falha ao conectar",
                    currentConnection: failedConnection,
                });
                this.emit("connectionFailed", { profile, error: "Falha ao conectar" });
                this.sendToRenderer("connection:status", this.state);
                return false;
            }
        }
        catch (error) {
            const errorMessage = error.message || "Erro desconhecido";
            this.updateState({
                isConnecting: false,
                error: errorMessage,
            });
            this.emit("connectionError", { profile, error: errorMessage });
            this.sendToRenderer("connection:status", this.state);
            return false;
        }
    }
    async disconnect() {
        if (!this.state.isConnected && !this.state.isConnecting) {
            return;
        }
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        const connection = this.state.currentConnection;
        if (connection) {
            const endedConnection = (0, Connection_1.endConnection)(connection, "disconnected");
            profileStorage_1.profileStorage.updateConnection(connection.id, endedConnection);
        }
        this.updateState({
            isConnected: false,
            isConnecting: false,
            isReconnecting: false,
            currentConnection: null,
            error: null,
        });
        if (this.currentProfile) {
            const profile = this.currentProfile;
            this.currentProfile = null;
            this.emit("disconnected", { profile });
            this.showNotification("Desconectado", `Desconectado do perfil ${profile.name}`);
        }
        this.sendToRenderer("connection:status", this.state);
    }
    async reconnect(startSSMTunnel) {
        if (!this.currentProfile) {
            return false;
        }
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.updateState({
                error: "Máximo de tentativas de reconexão atingido",
                isReconnecting: false,
            });
            return false;
        }
        this.reconnectAttempts++;
        this.updateState({
            isReconnecting: true,
            error: `Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        });
        this.sendToRenderer("connection:status", this.state);
        this.showNotification("Reconectando", `Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));
        const success = await this.connect(this.currentProfile, startSSMTunnel);
        this.updateState({ isReconnecting: false });
        return success;
    }
    setProcess(process) {
        this.process = process;
        if (process) {
            process.on("close", (code) => {
                if (this.state.isConnected && this.autoReconnect && this.currentProfile) {
                    this.handleConnectionLost(code);
                }
                else {
                    this.disconnect();
                }
            });
            process.on("error", (error) => {
                this.updateState({ error: error.message });
                this.emit("processError", { error: error.message });
            });
        }
    }
    async handleConnectionLost(code) {
        this.updateState({
            isConnected: false,
            error: "Conexão perdida",
        });
        this.emit("connectionLost", { code });
        if (this.autoReconnect && this.currentProfile) {
            await this.reconnect(async (profile) => {
                return true;
            });
        }
        else {
            await this.disconnect();
        }
    }
    updateState(partial) {
        this.state = { ...this.state, ...partial };
    }
    sendToRenderer(channel, data) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
    showNotification(title, body) {
        const settings = profileStorage_1.profileStorage.getSettings();
        if (settings.showNotifications && electron_1.Notification.isSupported()) {
            new electron_1.Notification({ title, body }).show();
        }
    }
    getCurrentProfile() {
        return this.currentProfile;
    }
    getReconnectAttempts() {
        return this.reconnectAttempts;
    }
}
exports.ConnectionMonitor = ConnectionMonitor;
exports.connectionMonitor = ConnectionMonitor.getInstance();
