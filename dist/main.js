"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const awsManager_1 = require("./awsManager");
const awsConfigService_1 = require("./services/awsConfigService");
const cliExecutor_1 = require("./services/cliExecutor");
const connectionMonitor_1 = require("./services/connectionMonitor");
const tokenMonitor_1 = require("./services/tokenMonitor");
const profileStorage_1 = require("./storage/profileStorage");
const trayManager_1 = require("./trayManager");
const dependencyChecker_1 = require("./utils/dependencyChecker");
let mainWindow;
let isQuitting = false;
let ssmProcess = null;
let isInitialized = false;
const createWindow = () => {
    // Ícone para a janela - funciona em dev e produção
    const iconPath = path_1.default.join(electron_1.app.getAppPath(), "public/assets/touch-icon-iphone-114-smile.png");
    mainWindow = new electron_1.BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
        title: "AWS Tunnel Manager",
        icon: iconPath,
        autoHideMenuBar: true,
    });
    // Usar app.getAppPath() para funcionar em dev e produção
    const appPath = electron_1.app.getAppPath();
    const indexPath = path_1.default.join(appPath, "public/index.html");
    mainWindow.loadFile(indexPath);
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
        // mainWindow?.webContents.openDevTools();
    });
    mainWindow.on("close", (event) => {
        const settings = profileStorage_1.profileStorage.getSettings();
        if (!isQuitting && settings.minimizeToTray) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    connectionMonitor_1.connectionMonitor.setMainWindow(mainWindow);
    (0, trayManager_1.createTray)(mainWindow);
    setupTokenMonitorListeners();
    setupConnectionMonitorListeners();
    return mainWindow;
};
const setupTokenMonitorListeners = () => {
    tokenMonitor_1.tokenMonitor.on("tokenWarning", (event) => {
        const message = `Token expira em ${event.minutesRemaining} minutos`;
        (0, trayManager_1.updateTrayStatus)(`Aviso: ${message}`);
        if (electron_1.Notification.isSupported()) {
            new electron_1.Notification({
                title: "AWS Tunnel - Aviso de Token",
                body: message,
            }).show();
        }
        mainWindow?.webContents.send("token:warning", event);
    });
    tokenMonitor_1.tokenMonitor.on("tokenExpired", (event) => {
        (0, trayManager_1.updateTrayStatus)("Token expirado");
        mainWindow?.webContents.send("token:expired", event);
        connectionMonitor_1.connectionMonitor.disconnect();
    });
};
const setupConnectionMonitorListeners = () => {
    connectionMonitor_1.connectionMonitor.on("connected", () => {
        (0, trayManager_1.updateTrayStatus)("Conectado");
    });
    connectionMonitor_1.connectionMonitor.on("disconnected", () => {
        (0, trayManager_1.updateTrayStatus)("Desconectado");
    });
    connectionMonitor_1.connectionMonitor.on("connectionLost", () => {
        (0, trayManager_1.updateTrayStatus)("Conexão perdida");
    });
};
const startSSMTunnel = async (profile) => {
    return new Promise((resolve) => {
        const args = [
            "ssm",
            "start-session",
            "--target",
            profile.instanceId,
            "--document-name",
            "AWS-StartPortForwardingSession",
            "--parameters",
            JSON.stringify({
                localPortNumber: [profile.localPort.toString()],
                portNumber: [profile.remotePort.toString()],
            }),
        ];
        const env = { ...process.env };
        if (profile.name)
            env.AWS_PROFILE = profile.name;
        if (profile.region)
            env.AWS_DEFAULT_REGION = profile.region;
        ssmProcess = (0, child_process_1.spawn)("aws", args, { env });
        let output = "";
        ssmProcess.stdout?.on("data", (data) => {
            output += data.toString();
        });
        ssmProcess.stderr?.on("data", (data) => {
            output += data.toString();
        });
        ssmProcess.on("error", (error) => {
            console.error("Erro ao iniciar túnel:", error);
            resolve(false);
        });
        ssmProcess.on("close", (code) => {
            console.log(`SSM Session closed with code ${code}`);
            ssmProcess = null;
        });
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
};
electron_1.app.on("ready", async () => {
    try {
        await profileStorage_1.profileStorage.initialize();
        isInitialized = true;
        const deps = await dependencyChecker_1.dependencyChecker.verifyAndPrompt();
        console.log("Dependências verificadas:", deps);
    }
    catch (error) {
        console.error("Erro na inicialização:", error);
        // Mesmo com erro, permitir que o aplicativo continue
        isInitialized = true;
    }
    createWindow();
});
electron_1.app.on("before-quit", () => {
    isQuitting = true;
    tokenMonitor_1.tokenMonitor.stopMonitoring();
    connectionMonitor_1.connectionMonitor.disconnect();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
    else {
        mainWindow.show();
    }
});
electron_1.ipcMain.handle("app:ready", async () => {
    return {
        version: electron_1.app.getVersion(),
        platform: process.platform,
        arch: process.arch,
    };
});
electron_1.ipcMain.handle("dependencies:check", async () => {
    return await dependencyChecker_1.dependencyChecker.getFullReport();
});
electron_1.ipcMain.handle("dependencies:installCLI", async () => {
    return await dependencyChecker_1.dependencyChecker.installAWSCLI();
});
electron_1.ipcMain.handle("dependencies:installSDK", async () => {
    return await dependencyChecker_1.dependencyChecker.installAWSSDK();
});
const waitForInit = async () => {
    while (!isInitialized) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
};
electron_1.ipcMain.handle("storage:getProfiles", async () => {
    await waitForInit();
    return profileStorage_1.profileStorage.getProfiles();
});
electron_1.ipcMain.handle("storage:saveProfile", async (_, profile) => {
    await waitForInit();
    return profileStorage_1.profileStorage.saveProfile(profile);
});
electron_1.ipcMain.handle("storage:updateProfile", async (_, id, data) => {
    await waitForInit();
    return profileStorage_1.profileStorage.updateProfile(id, data);
});
electron_1.ipcMain.handle("storage:deleteProfile", async (_, id) => {
    await waitForInit();
    return profileStorage_1.profileStorage.deleteProfile(id);
});
electron_1.ipcMain.handle("storage:getSettings", async () => {
    await waitForInit();
    return profileStorage_1.profileStorage.getSettings();
});
electron_1.ipcMain.handle("storage:saveSettings", async (_, settings) => {
    await waitForInit();
    return profileStorage_1.profileStorage.saveSettings(settings);
});
electron_1.ipcMain.handle("storage:getConnectionHistory", async (_, profileId) => {
    await waitForInit();
    return profileStorage_1.profileStorage.getConnectionHistory(profileId);
});
electron_1.ipcMain.handle("aws:parse-credentials", async (_, text) => {
    return awsManager_1.AWSManager.parseCredentials(text);
});
electron_1.ipcMain.handle("aws:test-connection", async (_, profile) => {
    return await awsManager_1.AWSManager.testConnection(profile);
});
electron_1.ipcMain.handle("connection:connect", async (_, profile) => {
    const success = await connectionMonitor_1.connectionMonitor.connect(profile, startSSMTunnel);
    if (success && profile.expiration) {
        tokenMonitor_1.tokenMonitor.startMonitoring(profile);
    }
    return success;
});
electron_1.ipcMain.handle("connection:disconnect", async () => {
    tokenMonitor_1.tokenMonitor.stopMonitoring();
    if (ssmProcess) {
        ssmProcess.kill();
        ssmProcess = null;
    }
    await connectionMonitor_1.connectionMonitor.disconnect();
    return { success: true };
});
electron_1.ipcMain.handle("connection:getStatus", async () => {
    return connectionMonitor_1.connectionMonitor.getState();
});
electron_1.ipcMain.handle("connection:autoReconnect", async (_, enabled) => {
    connectionMonitor_1.connectionMonitor.setAutoReconnect(enabled);
    return { success: true };
});
electron_1.ipcMain.handle("token:getStatus", async (_, profile) => {
    return tokenMonitor_1.tokenMonitor.getTokenStatus(profile);
});
electron_1.ipcMain.handle("token:setWarningThreshold", async (_, minutes) => {
    tokenMonitor_1.tokenMonitor.setWarningThreshold(minutes);
    return { success: true };
});
electron_1.ipcMain.handle("cli:listEC2Instances", async (_, profile) => {
    return await cliExecutor_1.cliExecutor.listEC2Instances(profile);
});
electron_1.ipcMain.handle("cli:listSSMInstances", async (_, profile) => {
    return await cliExecutor_1.cliExecutor.listSSMInstances(profile);
});
electron_1.ipcMain.handle("cli:getInstanceStatus", async (_, instanceId, profile) => {
    return await cliExecutor_1.cliExecutor.getInstanceStatus(instanceId, profile);
});
electron_1.ipcMain.handle("cli:getCallerIdentity", async (_, profile) => {
    return await cliExecutor_1.cliExecutor.getCallerIdentity(profile);
});
electron_1.ipcMain.handle("cli:validateCredentials", async (_, profile) => {
    return await cliExecutor_1.cliExecutor.validateCredentials(profile);
});
electron_1.ipcMain.handle("cli:runCommand", async (_, instanceId, command, profile) => {
    return await cliExecutor_1.cliExecutor.runCommandOnInstance(instanceId, command, profile);
});
electron_1.ipcMain.handle("cli:listProfiles", async () => {
    return await cliExecutor_1.cliExecutor.listProfiles();
});
electron_1.ipcMain.on("update-tray-status", (_, status) => {
    (0, trayManager_1.updateTrayStatus)(status);
});
electron_1.ipcMain.handle("notification:show", async (_, title, body) => {
    if (electron_1.Notification.isSupported()) {
        new electron_1.Notification({ title, body }).show();
        return { success: true };
    }
    return { success: false, error: "Notificações não suportadas" };
});
electron_1.ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
});
electron_1.ipcMain.handle("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_1.ipcMain.handle("window:close", () => {
    mainWindow?.close();
});
electron_1.ipcMain.handle("window:hide", () => {
    mainWindow?.hide();
});
// Handlers para o AWS Config Service
electron_1.ipcMain.handle("aws:saveCredentials", async (_, credentials, profileName) => {
    return await awsConfigService_1.awsConfigService.saveCredentials(credentials, profileName);
});
electron_1.ipcMain.handle("aws:testConnection", async (_, profileName) => {
    return await awsConfigService_1.awsConfigService.testConnection(profileName);
});
electron_1.ipcMain.handle("aws:startMonitoring", async (_, profileName, interval) => {
    awsConfigService_1.awsConfigService.startMonitoring(profileName, interval);
    return true;
});
electron_1.ipcMain.handle("aws:stopMonitoring", async () => {
    awsConfigService_1.awsConfigService.stopMonitoring();
    return true;
});
electron_1.ipcMain.handle("aws:getStatus", async () => {
    return awsConfigService_1.awsConfigService.getStatus();
});
electron_1.ipcMain.handle("aws:listProfiles", async () => {
    return await awsConfigService_1.awsConfigService.listProfiles();
});
electron_1.ipcMain.handle("aws:parseAndSaveCredentialsText", async (_, credentialsText) => {
    return await awsConfigService_1.awsConfigService.parseAndSaveCredentialsText(credentialsText);
});
electron_1.ipcMain.handle("aws:importFromExistingCredentials", async () => {
    return await awsConfigService_1.awsConfigService.importFromExistingCredentials();
});
electron_1.ipcMain.handle("aws:clearCredentials", async () => {
    return await awsConfigService_1.awsConfigService.clearCredentialsFile();
});
