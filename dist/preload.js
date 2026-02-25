"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    app: {
        ready: () => electron_1.ipcRenderer.invoke("app:ready"),
    },
    dependencies: {
        check: () => electron_1.ipcRenderer.invoke("dependencies:check"),
        installCLI: () => electron_1.ipcRenderer.invoke("dependencies:installCLI"),
        installSDK: () => electron_1.ipcRenderer.invoke("dependencies:installSDK"),
    },
    storage: {
        getProfiles: () => electron_1.ipcRenderer.invoke("storage:getProfiles"),
        saveProfile: (profile) => electron_1.ipcRenderer.invoke("storage:saveProfile", profile),
        updateProfile: (id, data) => electron_1.ipcRenderer.invoke("storage:updateProfile", id, data),
        deleteProfile: (id) => electron_1.ipcRenderer.invoke("storage:deleteProfile", id),
        getSettings: () => electron_1.ipcRenderer.invoke("storage:getSettings"),
        saveSettings: (settings) => electron_1.ipcRenderer.invoke("storage:saveSettings", settings),
        getConnectionHistory: (profileId) => electron_1.ipcRenderer.invoke("storage:getConnectionHistory", profileId),
    },
    aws: {
        parseCredentials: (text) => electron_1.ipcRenderer.invoke("aws:parse-credentials", text),
        testConnection: (profile) => electron_1.ipcRenderer.invoke("aws:test-connection", profile),
        saveCredentials: (credentials, profileName) => electron_1.ipcRenderer.invoke("aws:saveCredentials", credentials, profileName),
        testSimpleConnection: (profileName) => electron_1.ipcRenderer.invoke("aws:testConnection", profileName),
        startMonitoring: (profileName, interval) => electron_1.ipcRenderer.invoke("aws:startMonitoring", profileName, interval),
        stopMonitoring: () => electron_1.ipcRenderer.invoke("aws:stopMonitoring"),
        getStatus: () => electron_1.ipcRenderer.invoke("aws:getStatus"),
        listProfiles: () => electron_1.ipcRenderer.invoke("aws:listProfiles"),
        parseAndSaveCredentialsText: (credentialsText) => electron_1.ipcRenderer.invoke("aws:parseAndSaveCredentialsText", credentialsText),
        importFromExistingCredentials: () => electron_1.ipcRenderer.invoke("aws:importFromExistingCredentials"),
        clearCredentials: () => electron_1.ipcRenderer.invoke("aws:clearCredentials"),
    },
    connection: {
        connect: (profile) => electron_1.ipcRenderer.invoke("connection:connect", profile),
        disconnect: () => electron_1.ipcRenderer.invoke("connection:disconnect"),
        getStatus: () => electron_1.ipcRenderer.invoke("connection:getStatus"),
        autoReconnect: (enabled) => electron_1.ipcRenderer.invoke("connection:autoReconnect", enabled),
    },
    token: {
        getStatus: (profile) => electron_1.ipcRenderer.invoke("token:getStatus", profile),
        setWarningThreshold: (minutes) => electron_1.ipcRenderer.invoke("token:setWarningThreshold", minutes),
    },
    cli: {
        listEC2Instances: (profile) => electron_1.ipcRenderer.invoke("cli:listEC2Instances", profile),
        listSSMInstances: (profile) => electron_1.ipcRenderer.invoke("cli:listSSMInstances", profile),
        getInstanceStatus: (instanceId, profile) => electron_1.ipcRenderer.invoke("cli:getInstanceStatus", instanceId, profile),
        getCallerIdentity: (profile) => electron_1.ipcRenderer.invoke("cli:getCallerIdentity", profile),
        validateCredentials: (profile) => electron_1.ipcRenderer.invoke("cli:validateCredentials", profile),
        runCommand: (instanceId, command, profile) => electron_1.ipcRenderer.invoke("cli:runCommand", instanceId, command, profile),
        listProfiles: () => electron_1.ipcRenderer.invoke("cli:listProfiles"),
    },
    notification: {
        show: (title, body) => electron_1.ipcRenderer.invoke("notification:show", title, body),
    },
    window: {
        minimize: () => electron_1.ipcRenderer.invoke("window:minimize"),
        maximize: () => electron_1.ipcRenderer.invoke("window:maximize"),
        close: () => electron_1.ipcRenderer.invoke("window:close"),
        hide: () => electron_1.ipcRenderer.invoke("window:hide"),
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
            electron_1.ipcRenderer.on(channel, (_, ...args) => callback(...args));
        }
    },
    off: (channel, callback) => {
        electron_1.ipcRenderer.removeListener(channel, callback);
    },
};
electron_1.contextBridge.exposeInMainWorld("electron", api);
