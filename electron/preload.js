const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  silentPrint: (imageUrl) => ipcRenderer.invoke("silent-print", imageUrl),
});
