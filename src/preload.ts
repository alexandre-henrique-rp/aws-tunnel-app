import { contextBridge, ipcRenderer } from "electron";

export interface ElectronAPI {
  app: {
    ready: () => Promise<{ version: string; platform: string; arch: string }>;
  };
  dependencies: {
    check: () => Promise<any>;
    installCLI: () => Promise<{ success: boolean; message: string }>;
    installSDK: () => Promise<{ success: boolean; message: string }>;
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
    saveCredentials: (
      credentials: any,
      profileName?: string,
    ) => Promise<boolean>;
    testSimpleConnection: (profileName?: string) => Promise<boolean>;
    startMonitoring: (
      profileName?: string,
      interval?: number,
    ) => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    getStatus: () => Promise<{
      isOnline: boolean;
      lastCheck: Date;
      error?: string;
    }>;
    listProfiles: () => Promise<string[]>;
    parseAndSaveCredentialsText: (
      credentialsText: string,
    ) => Promise<{ success: boolean; profiles: string[]; message: string }>;
    importFromExistingCredentials: () => Promise<{
      success: boolean;
      profiles: string[];
      message: string;
    }>;
    clearCredentials: () => Promise<boolean>;
  };
  connection: {
    connect: (profile: any) => Promise<boolean>;
    disconnect: () => Promise<{ success: boolean }>;
    getStatus: () => Promise<any>;
    autoReconnect: (enabled: boolean) => Promise<{ success: boolean }>;
  };
  token: {
    getStatus: (profile: any) => Promise<any>;
    setWarningThreshold: (minutes: number) => Promise<{ success: boolean }>;
  };
  cli: {
    listEC2Instances: (profile: any) => Promise<any>;
    listSSMInstances: (profile: any) => Promise<any>;
    getInstanceStatus: (instanceId: string, profile: any) => Promise<any>;
    getCallerIdentity: (profile?: any) => Promise<any>;
    validateCredentials: (profile: any) => Promise<boolean>;
    runCommand: (
      instanceId: string,
      command: string,
      profile: any,
    ) => Promise<any>;
    listProfiles: () => Promise<string[]>;
  };
  notification: {
    show: (title: string, body: string) => Promise<{ success: boolean }>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    hide: () => Promise<void>;
  };
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  send: (channel: string, ...args: any[]) => void;
}

const api: ElectronAPI = {
  app: {
    ready: () => ipcRenderer.invoke("app:ready"),
  },
  dependencies: {
    check: () => ipcRenderer.invoke("dependencies:check"),
    installCLI: () => ipcRenderer.invoke("dependencies:installCLI"),
    installSDK: () => ipcRenderer.invoke("dependencies:installSDK"),
  },
  storage: {
    getProfiles: () => ipcRenderer.invoke("storage:getProfiles"),
    saveProfile: (profile) =>
      ipcRenderer.invoke("storage:saveProfile", profile),
    updateProfile: (id, data) =>
      ipcRenderer.invoke("storage:updateProfile", id, data),
    deleteProfile: (id) => ipcRenderer.invoke("storage:deleteProfile", id),
    getSettings: () => ipcRenderer.invoke("storage:getSettings"),
    saveSettings: (settings) =>
      ipcRenderer.invoke("storage:saveSettings", settings),
    getConnectionHistory: (profileId) =>
      ipcRenderer.invoke("storage:getConnectionHistory", profileId),
  },
  aws: {
    parseCredentials: (text) =>
      ipcRenderer.invoke("aws:parse-credentials", text),
    testConnection: (profile) =>
      ipcRenderer.invoke("aws:test-connection", profile),
    saveCredentials: (credentials, profileName) =>
      ipcRenderer.invoke("aws:saveCredentials", credentials, profileName),
    testSimpleConnection: (profileName) =>
      ipcRenderer.invoke("aws:testConnection", profileName),
    startMonitoring: (profileName, interval) =>
      ipcRenderer.invoke("aws:startMonitoring", profileName, interval),
    stopMonitoring: () => ipcRenderer.invoke("aws:stopMonitoring"),
    getStatus: () => ipcRenderer.invoke("aws:getStatus"),
    listProfiles: () => ipcRenderer.invoke("aws:listProfiles"),
    parseAndSaveCredentialsText: (credentialsText) =>
      ipcRenderer.invoke("aws:parseAndSaveCredentialsText", credentialsText),
    importFromExistingCredentials: () =>
      ipcRenderer.invoke("aws:importFromExistingCredentials"),
    clearCredentials: () => ipcRenderer.invoke("aws:clearCredentials"),
  },
  connection: {
    connect: (profile) => ipcRenderer.invoke("connection:connect", profile),
    disconnect: () => ipcRenderer.invoke("connection:disconnect"),
    getStatus: () => ipcRenderer.invoke("connection:getStatus"),
    autoReconnect: (enabled) =>
      ipcRenderer.invoke("connection:autoReconnect", enabled),
  },
  token: {
    getStatus: (profile) => ipcRenderer.invoke("token:getStatus", profile),
    setWarningThreshold: (minutes) =>
      ipcRenderer.invoke("token:setWarningThreshold", minutes),
  },
  cli: {
    listEC2Instances: (profile) =>
      ipcRenderer.invoke("cli:listEC2Instances", profile),
    listSSMInstances: (profile) =>
      ipcRenderer.invoke("cli:listSSMInstances", profile),
    getInstanceStatus: (instanceId, profile) =>
      ipcRenderer.invoke("cli:getInstanceStatus", instanceId, profile),
    getCallerIdentity: (profile) =>
      ipcRenderer.invoke("cli:getCallerIdentity", profile),
    validateCredentials: (profile) =>
      ipcRenderer.invoke("cli:validateCredentials", profile),
    runCommand: (instanceId, command, profile) =>
      ipcRenderer.invoke("cli:runCommand", instanceId, command, profile),
    listProfiles: () => ipcRenderer.invoke("cli:listProfiles"),
  },
  notification: {
    show: (title, body) => ipcRenderer.invoke("notification:show", title, body),
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    hide: () => ipcRenderer.invoke("window:hide"),
  },
  on: (channel, callback) => {
    const validChannels = [
      "connection:status",
      "token:warning",
      "token:expired",
      "connection:connected",
      "connection:disconnected",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
  send: (channel, ...args) => {
    const validChannels = ["update-tray-status"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
};

contextBridge.exposeInMainWorld("electron", api);
