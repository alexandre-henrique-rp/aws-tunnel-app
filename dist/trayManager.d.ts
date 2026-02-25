import { Tray, BrowserWindow } from "electron";
export declare const createTray: (window: BrowserWindow) => Tray;
export declare const updateTrayStatus: (status: string) => void;
export declare const destroyTray: () => void;
export declare const showTrayNotification: (title: string, body: string) => void;
