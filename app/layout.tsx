import type { Metadata } from "next";
import { Caveat, Special_Elite, Work_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const sans = Work_Sans({ subsets: ["latin"], variable: "--font-sans" });
// Typewriter for field labels, handwriting for accent entries only.
const type = Special_Elite({ weight: "400", subsets: ["latin"], variable: "--font-type" });
const hand = Caveat({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-hand" });
// Hand-painted sign lettering and a retro script for neon and signatures.
const sign = localFont({ src: "./fonts/MachineHeavy.otf", variable: "--font-sign", display: "swap" });
const script = localFont({ src: "./fonts/TropicalSunlight.otf", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: "ShadedOasis",
  description: "Used to replace Dot cards, for networking events and conferences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.className} ${sans.variable} ${type.variable} ${hand.variable} ${sign.variable} ${script.variable}`}>
        {children}
      </body>
    </html>
  );
}
