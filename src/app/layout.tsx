import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ব্যবসা ব্যবস্থাপনা সিস্টেম",
  description: "আপনার ব্যবসা পরিচালনার সহজ সমাধান",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}