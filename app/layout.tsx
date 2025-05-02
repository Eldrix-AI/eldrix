import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eldrix.app – Smart Support for Seniors",
  description:
    "Eldrix.app provides instant, patient tech help for seniors—no jargon, no long waits. Stay confident and connected with our friendly AI-powered and human-backed support.",
  openGraph: {
    title: "Eldrix.app – Smart Support for Seniors",
    description:
      "Experience hassle-free, always-available tech assistance tailored for older adults. Join Eldrix.app today.",
    url: "https://eldrix.app",
    siteName: "Eldrix.app",
    images: [
      {
        url: "https://eldrix.app/logos/banner.png",
        width: 1200,
        height: 630,
        alt: "Eldrix.app – Smart Support for Seniors",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eldrix.app – Smart Support for Seniors",
    description:
      "Instant, patient tech help for seniors. No jargon, no waiting—just friendly support.",
    images: ["https://eldrix.app/logos/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/logos/icon.png"
          style={{ borderRadius: "50%" }}
        />
      </head>
      <body className={``}>
        {children}
      </body>
    </html>
  );
}
