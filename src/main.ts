import { app, BrowserWindow, screen, globalShortcut } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.whenReady().then(() => {
  // ... your createWindow() call happens here

  // Prevent common escape shortcuts
  globalShortcut.register('Alt+Tab', () => {
    // Do nothing (swallow the event)
  });

  // Windows/Linux: Alt+F4 closes the app
  globalShortcut.register('Alt+F4', () => {
    // Optionally: do nothing or show a custom admin prompt
  });

  // Windows: Win+L locks the screen
  globalShortcut.register('CommandOrControl+L', () => {
    // Do nothing
  });

  // You may also want to block F11 if that toggles fullscreen on your system
  globalShortcut.register('F11', () => { });

  // Clean up shortcuts when the app closes
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
});

const createWindow = () => {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    show: false,
    kiosk: true,
    // Remove the native window frame/title bar completely
    frame: false,
    // Ensure window is always on top (less effective on some OS, but helpful)
    alwaysOnTop: true,
    // Disable resizing to prevent unexpected behavior when exiting fullscreen
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app first
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Maximize and show the window after loading
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Open the DevTools in a separate window
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
