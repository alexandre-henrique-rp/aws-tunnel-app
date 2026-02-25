import React from "react";
interface Profile {
    id: string;
    name: string;
    region: string;
    instanceId: string;
    localPort: number;
    remotePort: number;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    expiration?: string;
    createdAt?: string;
    updatedAt?: string;
}
interface AppSettings {
    autoConnect: boolean;
    minimizeToTray: boolean;
    showNotifications: boolean;
    tokenWarningMinutes: number;
    autoReconnect: boolean;
}
interface Connection {
    id: string;
    profileId: string;
    profileName: string;
    region: string;
    instanceId: string;
    localPort: number;
    remotePort: number;
    connectedAt: string;
    disconnectedAt?: string;
    status: "connected" | "disconnected" | "failed";
    duration?: number;
}
interface DependencyStatus {
    name: string;
    installed: boolean;
    version?: string;
    error?: string;
}
interface ConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    error: string | null;
}
declare global {
    interface Window {
        electron: {
            app: {
                ready: () => Promise<{
                    version: string;
                    platform: string;
                    arch: string;
                }>;
            };
            dependencies: {
                check: () => Promise<{
                    awsCLI: DependencyStatus;
                    awsSDK: DependencyStatus;
                    nodeVersion: string;
                    platform: string;
                }>;
                installCLI: () => Promise<{
                    success: boolean;
                    message: string;
                }>;
                installSDK: () => Promise<{
                    success: boolean;
                    message: string;
                }>;
            };
            storage: {
                getProfiles: () => Promise<Profile[]>;
                saveProfile: (profile: Profile) => Promise<Profile>;
                deleteProfile: (id: string) => Promise<boolean>;
                getSettings: () => Promise<AppSettings>;
                saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
                getConnectionHistory: (profileId?: string) => Promise<Connection[]>;
            };
            aws: {
                parseCredentials: (text: string) => Promise<Profile[]>;
                testConnection: (profile: Profile) => Promise<boolean>;
                saveCredentials: (credentials: any, profileName?: string) => Promise<boolean>;
                testSimpleConnection: (profileName?: string) => Promise<boolean>;
                startMonitoring: (profileName?: string, interval?: number) => Promise<boolean>;
                stopMonitoring: () => Promise<boolean>;
                getStatus: () => Promise<{
                    isOnline: boolean;
                    lastCheck: Date;
                    error?: string;
                }>;
                listProfiles: () => Promise<string[]>;
                parseAndSaveCredentialsText: (credentialsText: string) => Promise<{
                    success: boolean;
                    profiles: string[];
                    message: string;
                }>;
                importFromExistingCredentials: () => Promise<{
                    success: boolean;
                    profiles: string[];
                    message: string;
                }>;
                clearCredentials: () => Promise<boolean>;
            };
            connection: {
                connect: (profile: Profile) => Promise<boolean>;
                disconnect: () => Promise<{
                    success: boolean;
                }>;
                getStatus: () => Promise<ConnectionState>;
                autoReconnect: (enabled: boolean) => Promise<{
                    success: boolean;
                }>;
            };
            token: {
                getStatus: (profile: Profile) => Promise<{
                    expiresIn?: number;
                    isExpired: boolean;
                    isExpiringSoon: boolean;
                    expiresAt?: string;
                }>;
                setWarningThreshold: (minutes: number) => Promise<{
                    success: boolean;
                }>;
            };
            cli: {
                listEC2Instances: (profile: Profile) => Promise<{
                    success: boolean;
                    instances?: any[];
                }>;
                listSSMInstances: (profile: Profile) => Promise<{
                    success: boolean;
                    instances?: any[];
                }>;
                getCallerIdentity: (profile?: Profile) => Promise<{
                    success: boolean;
                    identity?: any;
                }>;
                validateCredentials: (profile: Profile) => Promise<boolean>;
                runCommand: (instanceId: string, command: string, profile: Profile) => Promise<{
                    success: boolean;
                }>;
            };
            notification: {
                show: (title: string, body: string) => Promise<{
                    success: boolean;
                }>;
            };
            window: {
                minimize: () => Promise<void>;
                maximize: () => Promise<void>;
                close: () => Promise<void>;
                hide: () => Promise<void>;
            };
            on: (channel: string, callback: (...args: any[]) => void) => void;
        };
    }
}
export declare const AppView: React.FC;
export default AppView;
