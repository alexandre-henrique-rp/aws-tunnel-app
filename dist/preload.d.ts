export interface ElectronAPI {
    app: {
        ready: () => Promise<{
            version: string;
            platform: string;
            arch: string;
        }>;
    };
    dependencies: {
        check: () => Promise<any>;
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
        getProfiles: () => Promise<any[]>;
        saveProfile: (profile: any) => Promise<any>;
        updateProfile: (id: string, data: any) => Promise<any>;
        deleteProfile: (id: string) => Promise<boolean>;
        getSettings: () => Promise<any>;
        saveSettings: (settings: any) => Promise<any>;
        getConnectionHistory: (profileId?: string) => Promise<any[]>;
    };
    aws: {
        parseCredentials: (text: string) => Promise<any[]>;
        testConnection: (profile: any) => Promise<boolean>;
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
        connect: (profile: any) => Promise<boolean>;
        disconnect: () => Promise<{
            success: boolean;
        }>;
        getStatus: () => Promise<any>;
        autoReconnect: (enabled: boolean) => Promise<{
            success: boolean;
        }>;
    };
    token: {
        getStatus: (profile: any) => Promise<any>;
        setWarningThreshold: (minutes: number) => Promise<{
            success: boolean;
        }>;
    };
    cli: {
        listEC2Instances: (profile: any) => Promise<any>;
        listSSMInstances: (profile: any) => Promise<any>;
        getInstanceStatus: (instanceId: string, profile: any) => Promise<any>;
        getCallerIdentity: (profile?: any) => Promise<any>;
        validateCredentials: (profile: any) => Promise<boolean>;
        runCommand: (instanceId: string, command: string, profile: any) => Promise<any>;
        listProfiles: () => Promise<string[]>;
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
    off: (channel: string, callback: (...args: any[]) => void) => void;
}
