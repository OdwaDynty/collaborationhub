import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Zibuke Africa | Internal Collaboration Hub",
  description: "Internal collaboration hub for Zibuke Africa employees.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border-hairline !bg-white !text-ink",
              title: "!font-heading !font-semibold",
            },
          }}
        />
      </body>
    </html>
  );
}