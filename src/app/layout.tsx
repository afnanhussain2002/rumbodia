import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Bricolage_Grotesque, Figtree, Gaegu, Poppins } from "next/font/google";
import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const sans = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
});

/** Handwritten face for speech bubbles and stickers ("GOOD JOB!"). */
const hand = Gaegu({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-gaegu",
  display: "swap",
});

/** Only for the "rumbodia" wordmark. latin-ext carries the dotless i the logo's triangle dot sits on. */
const logoFont = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: "Rumbodia", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8EE" },
    { media: "(prefers-color-scheme: dark)", color: "#161614" },
  ],
};

/** Runs before paint so a forced theme never flashes. */
const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${hand.variable} ${logoFont.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-[100dvh] antialiased">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/app"
          signUpFallbackRedirectUrl="/app"
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="dfid_ATdS6i35gPQBF79FMveoS"
          data-domain="rumbodia.site"
          strategy="afterInteractive"
        />
        <GoogleAnalytics gaId="GTM-MZ6PFHP6" />
      </body>
    </html>
  );
}
