import './globals.css';

export const metadata = {
  title: "Tortoise & Hare — Reset (Improved)",
  description: "Lean, fast chat + goals app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
