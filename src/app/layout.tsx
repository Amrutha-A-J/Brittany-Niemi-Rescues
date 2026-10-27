import type { Metadata, Viewport } from "next";
import { Inter, Mrs_Saint_Delafield, Newsreader } from "next/font/google";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { themeScript } from "@/components/site/ThemeToggle";
import { isDemo } from "@/lib/demo/config";
import { noIndex } from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const script = Mrs_Saint_Delafield({ variable: "--font-script", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Cat rescue & adoption in ${site.city}, ${site.regionCode}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_CA",
  },
  twitter: { card: "summary_large_image" },
  robots: noIndex ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script may set data-theme before React hydrates.
    <html
      lang="en-CA"
      className={`${inter.variable} ${newsreader.variable} ${script.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {isDemo && <DemoBanner />}
        {children}
      </body>
    </html>
  );
}
