import { EventEmitter } from "events";
import { BrowserWindow, Notification } from "electron";
import { Connection, createConnection, endConnection } from "../models/Connection";
import { Profile } from "../models/Profile";
import { profileStorage } from "../storage/profileStorage";

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  currentConnection: Connection | null;
  error: string | null;
}

export interface ConnectionEvent {
  profile: Profile;
  connection: Connection;
}

export class ConnectionMonitor extends EventEmitter {
  private static instance: ConnectionMonitor;
  private state: ConnectionState;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private autoReconnect = true;
  private currentProfile: Profile | null = null;
  private process: any = null;
  private mainWindow: BrowserWindow | null = null;

  private constructor() {
    super();
    this.state = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      currentConnection: null,
      error: null,
    };
  }

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
  }

  setMaxReconnectAttempts(max: number): void {
    this.maxReconnectAttempts = max;
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  async connect(profile: Profile, startSSMTunnel: (profile: Profile) => Promise<boolean>): Promise<boolean> {
    if (this.state.isConnecting || this.state.isConnected) {
      await this.disconnect();
    }

    this.updateState({
      isConnecting: true,
      error: null,
    });

    try {
      const connection = createConnection(
        profile.id,
        profile.name,
        profile.region,
        profile.instanceId,
        profile.localPort,
        profile.remotePort
      );

      this.currentProfile = profile;
      const success = await startSSMTunnel(profile);

      if (success) {
        this.reconnectAttempts = 0;
        this.updateState({
          isConnected: true,
          isConnecting: false,
          currentConnection: connection,
        });

        profileStorage.addConnection(connection);
        this.emit("connected", { profile, connection });
        this.showNotification("Conectado", `Conectado ao perfil ${profile.name}`);
        this.sendToRenderer("connection:status", this.state);
        return true;
      } else {
        const failedConnection = endConnection(connection, "failed", "Falha ao iniciar túnel");
        profileStorage.addConnection(failedConnection);
        
        this.updateState({
          isConnecting: false,
          error: "Falha ao conectar",
          currentConnection: failedConnection,
        });

        this.emit("connectionFailed", { profile, error: "Falha ao conectar" });
        this.sendToRenderer("connection:status", this.state);
        return false;
      }
    } catch (error: any) {
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

  async disconnect(): Promise<void> {
    if (!this.state.isConnected && !this.state.isConnecting) {
      return;
    }

    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    const connection = this.state.currentConnection;
    if (connection) {
      const endedConnection = endConnection(connection, "disconnected");
      profileStorage.updateConnection(connection.id, endedConnection);
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

  async reconnect(startSSMTunnel: (profile: Profile) => Promise<boolean>): Promise<boolean> {
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
    this.showNotification(
      "Reconectando",
      `Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));

    const success = await this.connect(this.currentProfile, startSSMTunnel);
    this.updateState({ isReconnecting: false });
    
    return success;
  }

  setProcess(process: any): void {
    this.process = process;
    
    if (process) {
      process.on("close", (code: number) => {
        if (this.state.isConnected && this.autoReconnect && this.currentProfile) {
          this.handleConnectionLost(code);
        } else {
          this.disconnect();
        }
      });

      process.on("error", (error: Error) => {
        this.updateState({ error: error.message });
        this.emit("processError", { error: error.message });
      });
    }
  }

  private async handleConnectionLost(code: number | null): Promise<void> {
    this.updateState({
      isConnected: false,
      error: "Conexão perdida",
    });

    this.emit("connectionLost", { code });

    if (this.autoReconnect && this.currentProfile) {
      await this.reconnect(async (profile) => {
        return true;
      });
    } else {
      await this.disconnect();
    }
  }

  private updateState(partial: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...partial };
  }

  private sendToRenderer(channel: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private showNotification(title: string, body: string): void {
    const settings = profileStorage.getSettings();
    if (settings.showNotifications && Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  }

  getCurrentProfile(): Profile | null {
    return this.currentProfile;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

export const connectionMonitor = ConnectionMonitor.getInstance();
