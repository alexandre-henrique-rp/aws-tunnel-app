import { Tray, Menu, nativeImage, BrowserWindow, app, nativeImage as Electron } from "electron";
import path from "path";

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let currentStatus = "Desconectado";
let isConnected = false;

export const createTray = (window: BrowserWindow): Tray => {
  mainWindow = window;

  const icon = createTrayIcon();
  tray = new Tray(icon);

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

const createTrayIcon = (): Electron.NativeImage => {
  const iconPath = path.join(__dirname, "../public/assets/touch-icon-iphone-114-smile.png");
  const image = nativeImage.createFromPath(iconPath);
  // Redimensionar para o tamanho adequado do tray (16x16)
  return image.resize({ width: 16, height: 16 });
};

export const updateTrayStatus = (status: string): void => {
  currentStatus = status;
  isConnected = status === "Conectado" || status.includes("Conectado");

  if (tray) {
    tray.setToolTip(`AWS Tunnel: ${status}`);
    updateContextMenu();
  }
};

const updateContextMenu = (): void => {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
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
    ...(isConnected
      ? [
          {
            label: "Desconectar",
            click: () => {
              mainWindow?.webContents.send("tray:disconnect");
            },
          },
        ]
      : [
          {
            label: "Conectar",
            click: () => {
              mainWindow?.webContents.send("tray:connect");
              showWindow();
            },
          },
        ]),
    { type: "separator" },
    {
      label: "Painel",
      click: () => showWindow(),
    },
    { type: "separator" },
    {
      label: "Sair",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
};

const showWindow = (): void => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
};

const hideWindow = (): void => {
  mainWindow?.hide();
};

const toggleWindow = (): void => {
  if (mainWindow?.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
};

export const destroyTray = (): void => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
};

export const showTrayNotification = (title: string, body: string): void => {
  if (tray) {
    tray.displayBalloon({
      title,
      content: body,
      iconType: "info",
    });
  }
};
