import { ChildProcess, spawn } from "child_process";
import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "path";
import { AWSManager } from "./awsManager";
import { Profile } from "./models/Profile";
import {
  awsConfigService,
  AWSCredentials,
  OnlineStatus,
} from "./services/awsConfigService";
import { cliExecutor } from "./services/cliExecutor";
import {
  connectionMonitor,
  ConnectionState,
} from "./services/connectionMonitor";
import {
  tokenMonitor,
  TokenStatus,
  TokenWarningEvent,
} from "./services/tokenMonitor";
import { AppSettings, profileStorage } from "./storage/profileStorage";
import { createTray, updateTrayStatus } from "./trayManager";
import {
  dependencyChecker,
  FullDependencyReport,
} from "./utils/dependencyChecker";

let mainWindow: BrowserWindow | null;
let isQuitting = false;
let ssmProcess: ChildProcess | null = null;
let isInitialized = false;

const createWindow = () => {
  // Ícone para a janela - funciona em dev e produção
  const iconPath = path.join(app.getAppPath(), "public/assets/touch-icon-iphone-114-smile.png");
  
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    title: "AWS Tunnel Manager",
    icon: iconPath,
  });

  // Usar app.getAppPath() para funcionar em dev e produção
  const appPath = app.getAppPath();
  const indexPath = path.join(appPath, "public/index.html");
  mainWindow.loadFile(indexPath);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    // mainWindow?.webContents.openDevTools();
  });

  mainWindow.on("close", (event) => {
    const settings = profileStorage.getSettings();
    if (!isQuitting && settings.minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  connectionMonitor.setMainWindow(mainWindow);
  createTray(mainWindow);

  setupTokenMonitorListeners();
  setupConnectionMonitorListeners();

  return mainWindow;
};

const setupTokenMonitorListeners = () => {
  tokenMonitor.on("tokenWarning", (event: TokenWarningEvent) => {
    const message = `Token expira em ${event.minutesRemaining} minutos`;
    updateTrayStatus(`Aviso: ${message}`);

    if (Notification.isSupported()) {
      new Notification({
        title: "AWS Tunnel - Aviso de Token",
        body: message,
      }).show();
    }

    mainWindow?.webContents.send("token:warning", event);
  });

  tokenMonitor.on(
    "tokenExpired",
    (event: { profileId: string; profileName: string }) => {
      updateTrayStatus("Token expirado");
      mainWindow?.webContents.send("token:expired", event);
      connectionMonitor.disconnect();
    },
  );
};

const setupConnectionMonitorListeners = () => {
  connectionMonitor.on("connected", () => {
    updateTrayStatus("Conectado");
  });

  connectionMonitor.on("disconnected", () => {
    updateTrayStatus("Desconectado");
  });

  connectionMonitor.on("connectionLost", () => {
    updateTrayStatus("Conexão perdida");
  });
};

const startSSMTunnel = async (profile: Profile): Promise<boolean> => {
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
    if (profile.name) env.AWS_PROFILE = profile.name;
    if (profile.region) env.AWS_DEFAULT_REGION = profile.region;

    ssmProcess = spawn("aws", args, { env });

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

app.on("ready", async () => {
  try {
    await profileStorage.initialize();
    isInitialized = true;
    const deps = await dependencyChecker.verifyAndPrompt();
    console.log("Dependências verificadas:", deps);
  } catch (error) {
    console.error("Erro na inicialização:", error);
    // Mesmo com erro, permitir que o aplicativo continue
    isInitialized = true;
  }

  createWindow();
});

app.on("before-quit", () => {
  isQuitting = true;
  tokenMonitor.stopMonitoring();
  connectionMonitor.disconnect();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

ipcMain.handle("app:ready", async () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle(
  "dependencies:check",
  async (): Promise<FullDependencyReport> => {
    return await dependencyChecker.getFullReport();
  },
);

ipcMain.handle("dependencies:installCLI", async () => {
  return await dependencyChecker.installAWSCLI();
});

ipcMain.handle("dependencies:installSDK", async () => {
  return await dependencyChecker.installAWSSDK();
});

const waitForInit = async () => {
  while (!isInitialized) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

ipcMain.handle("storage:getProfiles", async (): Promise<Profile[]> => {
  await waitForInit();
  return profileStorage.getProfiles();
});

ipcMain.handle(
  "storage:saveProfile",
  async (_, profile: Profile): Promise<Profile> => {
    await waitForInit();
    return profileStorage.saveProfile(profile);
  },
);

ipcMain.handle(
  "storage:updateProfile",
  async (_, id: string, data: Partial<Profile>): Promise<Profile | null> => {
    await waitForInit();
    return profileStorage.updateProfile(id, data);
  },
);

ipcMain.handle(
  "storage:deleteProfile",
  async (_, id: string): Promise<boolean> => {
    await waitForInit();
    return profileStorage.deleteProfile(id);
  },
);

ipcMain.handle("storage:getSettings", async (): Promise<AppSettings> => {
  await waitForInit();
  return profileStorage.getSettings();
});

ipcMain.handle(
  "storage:saveSettings",
  async (_, settings: Partial<AppSettings>): Promise<AppSettings> => {
    await waitForInit();
    return profileStorage.saveSettings(settings);
  },
);

ipcMain.handle(
  "storage:getConnectionHistory",
  async (_, profileId?: string) => {
    await waitForInit();
    return profileStorage.getConnectionHistory(profileId);
  },
);

ipcMain.handle("aws:parse-credentials", async (_, text: string) => {
  return AWSManager.parseCredentials(text);
});

ipcMain.handle("aws:test-connection", async (_, profile: Profile) => {
  return await AWSManager.testConnection(profile);
});

ipcMain.handle("connection:connect", async (_, profile: Profile) => {
  const success = await connectionMonitor.connect(profile, startSSMTunnel);

  if (success && profile.expiration) {
    tokenMonitor.startMonitoring(profile);
  }

  return success;
});

ipcMain.handle("connection:disconnect", async () => {
  tokenMonitor.stopMonitoring();
  if (ssmProcess) {
    ssmProcess.kill();
    ssmProcess = null;
  }
  await connectionMonitor.disconnect();
  return { success: true };
});

ipcMain.handle("connection:getStatus", async (): Promise<ConnectionState> => {
  return connectionMonitor.getState();
});

ipcMain.handle("connection:autoReconnect", async (_, enabled: boolean) => {
  connectionMonitor.setAutoReconnect(enabled);
  return { success: true };
});

ipcMain.handle(
  "token:getStatus",
  async (_, profile: Profile): Promise<TokenStatus> => {
    return tokenMonitor.getTokenStatus(profile);
  },
);

ipcMain.handle("token:setWarningThreshold", async (_, minutes: number) => {
  tokenMonitor.setWarningThreshold(minutes);
  return { success: true };
});

ipcMain.handle("cli:listEC2Instances", async (_, profile: Profile) => {
  return await cliExecutor.listEC2Instances(profile);
});

ipcMain.handle("cli:listSSMInstances", async (_, profile: Profile) => {
  return await cliExecutor.listSSMInstances(profile);
});

ipcMain.handle(
  "cli:getInstanceStatus",
  async (_, instanceId: string, profile: Profile) => {
    return await cliExecutor.getInstanceStatus(instanceId, profile);
  },
);

ipcMain.handle("cli:getCallerIdentity", async (_, profile?: Profile) => {
  return await cliExecutor.getCallerIdentity(profile);
});

ipcMain.handle("cli:validateCredentials", async (_, profile: Profile) => {
  return await cliExecutor.validateCredentials(profile);
});

ipcMain.handle(
  "cli:runCommand",
  async (_, instanceId: string, command: string, profile: Profile) => {
    return await cliExecutor.runCommandOnInstance(instanceId, command, profile);
  },
);

ipcMain.handle("cli:listProfiles", async () => {
  return await cliExecutor.listProfiles();
});

ipcMain.on("update-tray-status", (_, status: string) => {
  updateTrayStatus(status);
});

ipcMain.handle("notification:show", async (_, title: string, body: string) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
    return { success: true };
  }
  return { success: false, error: "Notificações não suportadas" };
});

ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("window:hide", () => {
  mainWindow?.hide();
});

// Handlers para o AWS Config Service
ipcMain.handle(
  "aws:saveCredentials",
  async (_, credentials: AWSCredentials, profileName?: string) => {
    return await awsConfigService.saveCredentials(credentials, profileName);
  },
);

ipcMain.handle("aws:testConnection", async (_, profileName?: string) => {
  return await awsConfigService.testConnection(profileName);
});

ipcMain.handle(
  "aws:startMonitoring",
  async (_, profileName?: string, interval?: number) => {
    awsConfigService.startMonitoring(profileName, interval);
    return true;
  },
);

ipcMain.handle("aws:stopMonitoring", async () => {
  awsConfigService.stopMonitoring();
  return true;
});

ipcMain.handle("aws:getStatus", async (): Promise<OnlineStatus> => {
  return awsConfigService.getStatus();
});

ipcMain.handle("aws:listProfiles", async (): Promise<string[]> => {
  return await awsConfigService.listProfiles();
});

ipcMain.handle(
  "aws:parseAndSaveCredentialsText",
  async (_, credentialsText: string) => {
    return await awsConfigService.parseAndSaveCredentialsText(credentialsText);
  },
);

ipcMain.handle("aws:importFromExistingCredentials", async () => {
  return await awsConfigService.importFromExistingCredentials();
});

ipcMain.handle("aws:clearCredentials", async () => {
  return await awsConfigService.clearCredentialsFile();
});
