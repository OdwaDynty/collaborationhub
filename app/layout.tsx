import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

/**
 * Self-hosted fonts, NOT next/font/google. Changed after a real build
 * failure: next/font/google needs live internet access to Google's
 * font servers at BUILD time, every single build. On a restrictive
 * network (like the work Wi-Fi that once blocked npm installs on this
 * exact project), that fetch can fail outright — a real risk for
 * deploying to Zibuke's own server, which may sit behind its own
 * firewall. Self-hosting the actual font files in the repo removes
 * that external dependency completely.
 *
 * Inter uses its "18pt" optical-size variant specifically — Google's
 * Inter variable font ships three static sizes (18pt/24pt/28pt) tuned
 * for different text sizes; 18pt is the one meant for compact UI and
 * body text, which is the only way Inter is used anywhere in this app
 * (Space Grotesk handles every heading).
 */
const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/space-grotesk-medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk-semibold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-space-grotesk",
});

const inter = localFont({
  src: [
    { path: "./fonts/inter-regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/inter-medium.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-inter",
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