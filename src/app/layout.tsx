import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NJ Safety Driver",
  description:
    "Road safety management platform for drivers, agents, and administrators.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
