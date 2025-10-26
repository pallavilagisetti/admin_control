import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BackendProvider } from "../contexts/BackendContext";
import { BackendErrorBoundary } from "../contexts/BackendContext";
import { AuthProvider } from "../contexts/AuthContext";
import ClientLayout from "../components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Upstar Admin Panel",
  description: "Admin panel for Upstar platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackendProvider>
          <AuthProvider>
            <BackendErrorBoundary>
              <ClientLayout>
                {children}
              </ClientLayout>
            </BackendErrorBoundary>
          </AuthProvider>
        </BackendProvider>
      </body>
    </html>
  );
}