import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New, Outfit } from "next/font/google";
import "./globals.css";
import { TweaksProvider } from "@/components/providers/TweaksProvider";
import { TweaksPanel } from "@/components/tweaks/TweaksPanel";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});
const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
});
const outfit = Outfit({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manabi LMS — 学習プラットフォーム",
  description: "企業研修向けの動画学習プラットフォーム(ポートフォリオ用デモ)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${zenKaku.variable} ${outfit.variable}`}>
        <TweaksProvider>
          {children}
          <TweaksPanel />
        </TweaksProvider>
      </body>
    </html>
  );
}
