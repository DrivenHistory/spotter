import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GroupsProvider } from "@/lib/groups-context";

export const metadata: Metadata = {
  title: "Spotter",
  description: "Spot & identify cars with AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B0B0E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider><GroupsProvider>{children}</GroupsProvider></AuthProvider>
      </body>
    </html>
  );
}
