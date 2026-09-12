import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scorecast XI",
  description: "Score prediction pool",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
