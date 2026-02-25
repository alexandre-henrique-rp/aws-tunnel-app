import { EventEmitter } from "events";
import { BrowserWindow } from "electron";
import { Connection } from "../models/Connection";
import { Profile } from "../models/Profile";
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
export declare class ConnectionMonitor extends EventEmitter {
    private static instance;
    private state;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    private autoReconnect;
    private currentProfile;
    private process;
    private mainWindow;
    private constructor();
    static getInstance(): ConnectionMonitor;
    setMainWindow(window: BrowserWindow): void;
    setAutoReconnect(enabled: boolean): void;
    setMaxReconnectAttempts(max: number): void;
    getState(): ConnectionState;
    connect(profile: Profile, startSSMTunnel: (profile: Profile) => Promise<boolean>): Promise<boolean>;
    disconnect(): Promise<void>;
    reconnect(startSSMTunnel: (profile: Profile) => Promise<boolean>): Promise<boolean>;
    setProcess(process: any): void;
    private handleConnectionLost;
    private updateState;
    private sendToRenderer;
    private showNotification;
    getCurrentProfile(): Profile | null;
    getReconnectAttempts(): number;
}
export declare const connectionMonitor: ConnectionMonitor;
