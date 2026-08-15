import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Morph - Animated profiles for X",
    template: "%s | Morph",
  },
  description:
    "Morph is a browser extension that brings animated profile pictures, banners, and expressive profile customization to X.",

  keywords: [
    "Morph",
    "X",
    "Twitter",
    "Chrome Extension",
    "Animated Profile Picture",
    "Animated Banner",
    "Browser Extension",
    "Profile Customization",
    "GIF Profile",
  ],

  authors: [{ name: "Vansh" }],
  creator: "Vansh",
  applicationName: "Morph",

  metadataBase: new URL("https://morph.vxnsh.dev"),

  openGraph: {
    title: "Morph",
    description:
      "Bring your X profile to life with animated profile pictures, banners, and more.",
    url: "https://morph.vxnsh.dev",
    siteName: "Morph",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Morph",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Morph",
    description:
      "Bring your X profile to life with animated profile pictures, banners, and more.",
    images: ["/og.png"],
  },

  icons: {
    icon: [
      {
        url: "/favicon-light.ico",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.ico",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", instrument.variable, ibm.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
