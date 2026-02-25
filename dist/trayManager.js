"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showTrayNotification = exports.destroyTray = exports.updateTrayStatus = exports.createTray = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let tray = null;
let mainWindow = null;
let currentStatus = "Desconectado";
let isConnected = false;
const createTray = (window) => {
    mainWindow = window;
    const icon = createTrayIcon();
    tray = new electron_1.Tray(icon);
    tray.setToolTip("AWS Tunnel Manager");
    updateContextMenu();
    tray.on("click", () => {
        toggleWindow();
    });
    tray.on("double-click", () => {
        showWindow();
    });
    return tray;
};
exports.createTray = createTray;
const createTrayIcon = () => {
    const iconPath = path_1.default.join(__dirname, "../public/assets/touch-icon-iphone-114-smile.png");
    const image = electron_1.nativeImage.createFromPath(iconPath);
    // Redimensionar para o tamanho adequado do tray (16x16)
    return image.resize({ width: 16, height: 16 });
};
const updateTrayStatus = (status) => {
    currentStatus = status;
    isConnected = status === "Conectado" || status.includes("Conectado");
    if (tray) {
        tray.setToolTip(`AWS Tunnel: ${status}`);
        updateContextMenu();
    }
};
exports.updateTrayStatus = updateTrayStatus;
const updateContextMenu = () => {
    if (!tray)
        return;
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "AWS Tunnel Manager",
            enabled: false,
        },
        { type: "separator" },
        {
            label: `Status: ${currentStatus}`,
            enabled: false,
        },
        { type: "separator" },
        {
            label: "Mostrar Janela",
            click: () => showWindow(),
        },
        {
            label: "Minimizar para Bandeja",
            click: () => hideWindow(),
        },
        { type: "separator" },
        {
            label: "Conectar",
            enabled: !isConnected,
            click: () => {
                mainWindow?.webContents.send("tray:connect");
                showWindow();
            },
        },
        {
            label: "Desconectar",
            enabled: isConnected,
            click: () => {
                mainWindow?.webContents.send("tray:disconnect");
            },
        },
        { type: "separator" },
        {
            label: "Preferências",
            click: () => {
                showWindow();
                mainWindow?.webContents.send("tray:openSettings");
            },
        },
        { type: "separator" },
        {
            label: "Sair",
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
};
const showWindow = () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
};
const hideWindow = () => {
    mainWindow?.hide();
};
const toggleWindow = () => {
    if (mainWindow?.isVisible()) {
        hideWindow();
    }
    else {
        showWindow();
    }
};
const destroyTray = () => {
    if (tray) {
        tray.destroy();
        tray = null;
    }
};
exports.destroyTray = destroyTray;
const showTrayNotification = (title, body) => {
    if (tray) {
        tray.displayBalloon({
            title,
            content: body,
            iconType: "info",
        });
    }
};
exports.showTrayNotification = showTrayNotification;
