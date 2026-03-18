import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.drivenhistory.spotter",
  appName: "Spotter",
  webDir: "out",
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 500,
      backgroundColor: "#0B0B0E",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  server: {
    // For development, point to local Next.js dev server:
    // url: "http://localhost:3000",
    // For production, use the static export in webDir
  },
};

export default config;
