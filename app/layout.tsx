import "./globals.css";
import type { Metadata } from "next";
import ClientPrivacyHost from "@/components/ClientPrivacyHost";

export const metadata: Metadata = {
  title: "Tortoise & Hare — Reset (Improved)",
  description: "Lean, fast chat + goals app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Mount client-only host that manages the modal */}
        <ClientPrivacyHost>{children}</ClientPrivacyHost>
      </body>
    </html>
  );
}
