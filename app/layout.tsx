import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wovengold PDI Submission",
  description: "Submit and manage PDI submissions for Wovengold",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#673ab7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        {children}
        <Script id="viewport-fix" strategy="afterInteractive">
          {`
            // Fix for mobile 100vh issue
            const appHeight = () => {
              const doc = document.documentElement;
              doc.style.setProperty('--app-height', \`\${window.innerHeight}px\`);
            };
            window.addEventListener('resize', appHeight);
            window.addEventListener('orientationchange', appHeight);
            document.addEventListener('DOMContentLoaded', appHeight);
            appHeight();
            
            // Scroll to top on page load to ensure proper header display
            window.scrollTo(0, 0);
          `}
        </Script>
      </body>
    </html>
  );
}
