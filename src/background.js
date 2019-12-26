'use strict';

import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import path from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';

let win;
protocol.registerStandardSchemes(['app'], { secure: true });

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  } else {
    win.show();
  }
});

ipcMain.on('openDevTool', () => {
  BrowserWindow.getFocusedWindow().webContents.openDevTools();
});

ipcMain.on('restartWin', () => {
  app.relaunch();
  app.quit();
});

ipcMain.on('window.min', () => {
  BrowserWindow.getFocusedWindow().minimize();
});

ipcMain.on('window.max', () => {
  let mainWindow = BrowserWindow.getFocusedWindow();
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window.close', () => {
  BrowserWindow.getFocusedWindow().hide();
});

app.on('ready', async () => {
  createWindow();
});

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

function createWindow() {
  win = new BrowserWindow({
    show: false,
    useContentSize: true,
    width: 965,
    height: 650,
    frame: false,
    icon: path.join(__static, 'icons/icon.png'),
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
  } else {
    createProtocol('app');
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    win = null;
  });

  win.once('ready-to-show', () => {
    win.show();
  });
}
