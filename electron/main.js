import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl =
    process.env.VITE_DEV_SERVER_URL ||
    `file://${path.join(__dirname, "../dist/index.html")}`;

  win.loadURL(startUrl);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools({ mode: "undocked" });
  }
}

app.whenReady().then(createWindow);

// Handle lifecycle
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("silent-print", async (event, imageUrl, orientation) => {
  const printWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true, // Biar simple aja untuk window print
    },
  });

  let printed = false;

  // Dengarkan message dari printWin
  printWin.webContents.on("ipc-message", (event, channel) => {
    if (channel === "ready-to-print") {
      if (printed) return;
      printed = true;

      const printOptions = {
        silent: false,
        printBackground: true,
        pageSize: {
          width: 157000,
          height: 178000,
        },
        margins: { top: 0, left: 0, right: 0, bottom: 0 },
      };

      printWin.webContents.print(printOptions, (success, errorType) => {
        if (!success) {
          console.error("Print gagal:", errorType);
        } else {
          console.log("Print sukses!");
        }
        printWin.close();
      });
    }
  });

  const rotateStyle =
    orientation === "portrait" ? "transform: rotate(90deg);" : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Silent Print</title>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        img {
          max-width: 100%;
          max-height: 100%;
          margin-top: -100px;
          
        }
      </style>
    </head>
    <body>
      <img id="print-image" src="${imageUrl}" />
      <script>
        const img = document.getElementById('print-image');
        img.onload = () => {
          require('electron').ipcRenderer.send('ready-to-print');
        };
      </script>
    </body>
    </html>
  `;

  const encodedHtml = `data:text/html;charset=utf-8,${encodeURIComponent(
    htmlContent
  )}`;

  await printWin.loadURL(encodedHtml);
});
