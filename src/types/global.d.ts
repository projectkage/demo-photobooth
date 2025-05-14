export {};

declare global {
  interface Window {
    electronAPI: {
      //   closeWindow: () => void;
      //   minimizeWindow: () => void;
      //   reloadWindow: () => void;
      silentPrint: (imageUrl) => void;
    };
  }
}
