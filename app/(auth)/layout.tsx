import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
